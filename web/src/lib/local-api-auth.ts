import { timingSafeEqual } from "node:crypto";

const HEADER = "x-mercenta-api-key";
const MIN_KEY_LENGTH = 32;

export function localApiKey(): string | null {
  const key = process.env.MERCENTA_API_PROXY_KEY;
  return key && key.length >= MIN_KEY_LENGTH ? key : null;
}

export function hasLocalApiAccess(req: Request): boolean {
  const configured = localApiKey();
  const supplied = req.headers.get(HEADER);
  if (!configured || !supplied) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const LOCAL_API_KEY_HEADER = HEADER;
