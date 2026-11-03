/**
 * API Key Security, IP Allowlist and Scope Authorization Guard
 * Enforces permanent vs temporary boundaries, IPv4/IPv6 allowlist validation,
 * purchase limits, and deterministic scope enforcement.
 */

export const ALL_API_SCOPES = [
  'account:read',
  'orders:read',
  'orders:create',
  'catalog:read',
  'treasury:sweep',
] as const;

export type ApiScope = typeof ALL_API_SCOPES[number];

export interface ApiKeyConfig {
  name: string;
  type: 'permanent' | 'temporary';
  ipAllowlist?: string | null;
  expiresHours?: number | string | null;
  purchaseLimit?: string | null;
  scopes: string[];
}

/**
 * Validates an IPv4 or wildcard pattern (e.g. 192.168.1.1, 10.0.*.*, 192.168.0.0/24).
 */
export function isValidIpPattern(entry: string): boolean {
  const trimmed = entry.trim();
  if (!trimmed) return false;

  // Wildcard IPv4 (e.g. 192.168.*.* or 10.*.*.*)
  if (/^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/.test(trimmed)) {
    const parts = trimmed.split('.');
    return parts.every(part => {
      if (part === '*') return true;
      const num = Number(part);
      return Number.isInteger(num) && num >= 0 && num <= 255;
    });
  }

  // CIDR notation IPv4 (e.g. 192.168.1.0/24)
  if (/^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[12][0-9]|3[0-2])$/.test(trimmed)) {
    const [ip, mask] = trimmed.split('/');
    const parts = ip.split('.').map(Number);
    const validParts = parts.every(p => p >= 0 && p <= 255);
    const maskNum = Number(mask);
    return validParts && maskNum >= 0 && maskNum <= 32;
  }

  // Standard exact IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
    const parts = trimmed.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  }

  // IPv6 or IPv6 CIDR (e.g. 2a02:4780:27:1690::/64 or ::1)
  if (/^[a-fA-F0-9:]+(\/\d{1,3})?$/.test(trimmed) && trimmed.includes(':')) {
    const [ipPart, cidrPart] = trimmed.split('/');
    if (cidrPart && (Number(cidrPart) < 0 || Number(cidrPart) > 128)) return false;
    return ipPart.length >= 2;
  }

  return false;
}

/**
 * Validates and normalizes raw comma/newline-separated IP allowlist.
 */
export function validateIpAllowlist(rawInput?: string | null): {
  valid: boolean;
  normalized: string[];
  error?: string;
} {
  if (!rawInput || !rawInput.trim()) {
    return { valid: true, normalized: [] };
  }

  const entries = rawInput
    .split(/[\s,;\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const entry of entries) {
    if (!isValidIpPattern(entry)) {
      return {
        valid: false,
        normalized: [],
        error: `INVALID_IP_PATTERN: "${entry}" is not a valid IPv4, wildcard or CIDR`,
      };
    }
  }

  return { valid: true, normalized: Array.from(new Set(entries)) };
}

/**
 * Checks whether clientIp matches an allowlist rule.
 */
export function isIpAllowed(clientIp: string, allowlist: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true; // Empty allowlist permits all if temporary

  const cleanClient = clientIp.trim().toLowerCase();

  for (const rule of allowlist) {
    const cleanRule = rule.trim().toLowerCase();

    // Exact match (IPv4 or IPv6)
    if (cleanClient === cleanRule) return true;

    // Wildcard match (e.g. 192.168.*.*)
    if (cleanRule.includes('*')) {
      const ruleParts = cleanRule.split('.');
      const clientParts = cleanClient.split('.');
      if (ruleParts.length === 4 && clientParts.length === 4) {
        const matches = ruleParts.every((part, idx) => part === '*' || part === clientParts[idx]);
        if (matches) return true;
      }
    }

    // Simple CIDR match for /24 and /16
    if (cleanRule.endsWith('/24')) {
      const prefix = cleanRule.replace('/24', '').split('.').slice(0, 3).join('.');
      if (cleanClient.startsWith(prefix + '.')) return true;
    }
    if (cleanRule.endsWith('/16')) {
      const prefix = cleanRule.replace('/16', '').split('.').slice(0, 2).join('.');
      if (cleanClient.startsWith(prefix + '.')) return true;
    }
    if (cleanRule.endsWith('/8')) {
      const prefix = cleanRule.replace('/8', '').split('.')[0];
      if (cleanClient.startsWith(prefix + '.')) return true;
    }

    // IPv6 prefix match (e.g. 2a02:4780:27:1690::/64)
    if (cleanRule.includes('::/') && cleanClient.includes(':')) {
      const prefix = cleanRule.split('::/')[0];
      if (cleanClient.startsWith(prefix)) return true;
    }
  }

  return false;
}

/**
 * Validates complete API Key creation parameters.
 */
export function validateApiKeyConfig(config: ApiKeyConfig): { valid: boolean; error?: string } {
  if (!config.name || !config.name.trim() || config.name.length > 60) {
    return { valid: false, error: 'INVALID_NAME: Name must be between 1 and 60 characters.' };
  }

  if (config.type !== 'permanent' && config.type !== 'temporary') {
    return { valid: false, error: 'INVALID_TYPE: Type must be either permanent or temporary.' };
  }

  const ipResult = validateIpAllowlist(config.ipAllowlist);
  if (!ipResult.valid) {
    return { valid: false, error: ipResult.error };
  }

  if (config.type === 'permanent' && ipResult.normalized.length === 0) {
    return { valid: false, error: 'PERMANENT_REQUIRES_IP: Permanent keys require at least one IPv4/IPv6 allowlist rule.' };
  }

  if (config.type === 'temporary') {
    const hours = Number(config.expiresHours ?? 48);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 48) {
      return { valid: false, error: 'INVALID_EXPIRES_HOURS: Temporary keys must expire between 1 and 48 hours.' };
    }
  }

  if (config.purchaseLimit && config.purchaseLimit.trim() && config.purchaseLimit.trim() !== '0') {
    const cleanLimit = config.purchaseLimit.replace(/^\$/, '').trim();
    const parsed = Number(cleanLimit);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { valid: false, error: 'INVALID_PURCHASE_LIMIT: Purchase limit must be a positive number.' };
    }
  }

  if (!Array.isArray(config.scopes) || config.scopes.length === 0) {
    return { valid: false, error: 'SCOPES_REQUIRED: At least one API scope must be selected.' };
  }

  for (const s of config.scopes) {
    if (!ALL_API_SCOPES.includes(s as ApiScope)) {
      return { valid: false, error: `UNKNOWN_SCOPE: "${s}" is not a recognized Mercenta API scope.` };
    }
  }

  return { valid: true };
}

/**
 * Validates scope authorization.
 */
export function checkScopePermission(grantedScopes: string[], requiredScope: string): boolean {
  if (grantedScopes.includes('*') || grantedScopes.includes('admin')) return true;
  return grantedScopes.includes(requiredScope);
}

/**
 * Creates safe mask for display without disclosing API secret.
 */
export function formatApiKeyMask(secret: string): string {
  if (!secret || secret.length < 16) return 'mct_••••••••••••';
  return `${secret.slice(0, 9)}…${secret.slice(-4)}`;
}
