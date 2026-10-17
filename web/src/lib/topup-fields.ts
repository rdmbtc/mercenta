/**
 * Field configuration helper for direct top-up products.
 * Vouchers (gift cards, codes) do NOT require any account reference.
 * Only explicit direct_topup products or Telegram services require an account ID.
 */

export interface TopupFieldConfig {
  isTopup: boolean;
  isTelegram: boolean;
  label: string;
  placeholder: string;
  hint: string;
  error: string;
  buttonPrompt: string;
}

export function getTopupConfig(
  productName: string,
  productType?: string,
  ru = false
): TopupFieldConfig {
  const lower = (productName || '').toLowerCase();
  const isExplicitTopup = productType === 'direct_topup';
  const isTelegram = lower.includes('telegram');

  // If explicitly a voucher and not Telegram, it is never a topup
  if (productType === 'voucher' && !isTelegram && !isExplicitTopup) {
    return {
      isTopup: false,
      isTelegram: false,
      label: '',
      placeholder: '',
      hint: '',
      error: '',
      buttonPrompt: '',
    };
  }

  // Not a topup unless direct_topup or telegram
  if (!isExplicitTopup && !isTelegram) {
    return {
      isTopup: false,
      isTelegram: false,
      label: '',
      placeholder: '',
      hint: '',
      error: '',
      buttonPrompt: '',
    };
  }

  // 1. Telegram (Stars, Premium, TON)
  if (isTelegram) {
    return {
      isTopup: true,
      isTelegram: true,
      label: ru
        ? 'Telegram username (@username) для зачисления:'
        : 'Telegram username (@username) for delivery:',
      placeholder: '@username (e.g. @durov)',
      hint: ru
        ? 'Звёзды или подписка будут зачислены напрямую на указанный Telegram-аккаунт.'
        : 'Stars or subscription will be credited directly to this Telegram account.',
      error: ru
        ? 'Укажите Telegram @username получателя перед оплатой.'
        : 'Please enter Telegram @username before paying.',
      buttonPrompt: ru ? 'введите @username выше' : 'enter @username above',
    };
  }

  // 2. PUBG Mobile
  if (lower.includes('pubg')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'PUBG Mobile Player ID (числовой ID игрока):'
        : 'PUBG Mobile Player ID (Character ID):',
      placeholder: '5123456789',
      hint: ru
        ? 'UC будут начислены напрямую на указанный Character ID игрока.'
        : 'UC will be credited directly to your Player Character ID.',
      error: ru
        ? 'Укажите числовой Player ID в PUBG Mobile перед оплатой.'
        : 'Please enter your PUBG Mobile Player ID before paying.',
      buttonPrompt: ru ? 'введите Player ID выше' : 'enter Player ID above',
    };
  }

  // 3. Free Fire
  if (lower.includes('free fire') || lower.includes('freefire')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Free Fire Player ID (UID игрока):'
        : 'Free Fire Player ID (UID):',
      placeholder: '123456789',
      hint: ru
        ? 'Алмазы будут зачислены напрямую на указанный UID игрока.'
        : 'Diamonds will be credited directly to your Free Fire UID.',
      error: ru
        ? 'Укажите Free Fire Player ID перед оплатой.'
        : 'Please enter your Free Fire Player ID before paying.',
      buttonPrompt: ru ? 'введите UID выше' : 'enter UID above',
    };
  }

  // 4. Mobile Legends
  if (lower.includes('mobile legends') || lower.includes('mlbb')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Mobile Legends User ID (Zone ID):'
        : 'Mobile Legends User ID (Zone ID):',
      placeholder: '12345678 (1234)',
      hint: ru
        ? 'Алмазы будут зачислены напрямую на ваш аккаунт MLBB.'
        : 'Diamonds will be credited directly to your MLBB account.',
      error: ru
        ? 'Укажите Mobile Legends User ID перед оплатой.'
        : 'Please enter your Mobile Legends User ID before paying.',
      buttonPrompt: ru ? 'введите User ID выше' : 'enter User ID above',
    };
  }

  // 5. Mobile Telco (Airtime / Bundles)
  if (
    lower.includes('airtel') ||
    lower.includes('africell') ||
    lower.includes('telecom') ||
    lower.includes('vodafone') ||
    lower.includes('mtn') ||
    lower.includes('9mobile') ||
    lower.includes('orange')
  ) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Номер телефона для пополнения:'
        : 'Phone number for mobile top-up:',
      placeholder: '+1234567890',
      hint: ru
        ? 'Баланс или пакет будет зачислен напрямую на этот номер телефона.'
        : 'Airtime will be credited directly to this phone number.',
      error: ru
        ? 'Укажите номер телефона получателя перед оплатой.'
        : 'Please enter recipient phone number before paying.',
      buttonPrompt: ru ? 'введите номер выше' : 'enter phone number above',
    };
  }

  // 6. Generic Direct Topup
  return {
    isTopup: true,
    isTelegram: false,
    label: ru
      ? 'Player ID / ID аккаунта получателя:'
      : 'Recipient Player ID / Account ID:',
    placeholder: ru ? 'ID аккаунта или логин игрока' : 'Account ID or Player ID',
    hint: ru
      ? 'Пополнение будет зачислено напрямую на указанный аккаунт.'
      : 'Top-up will be credited directly to this account.',
    error: ru
      ? 'Укажите ID аккаунта или логин получателя перед оплатой.'
      : 'Please enter recipient Account ID before paying.',
    buttonPrompt: ru ? 'введите ID аккаунта выше' : 'enter Account ID above',
  };
}
