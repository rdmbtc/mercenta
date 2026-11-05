import { NextResponse } from 'next/server';
import { getStoreOrders, getStoreTelemetry } from '@/lib/telegram-admin';
import { requireTelegramAdminWallet } from '@/lib/telegram-admin-auth';

export const dynamic = 'force-dynamic';

function serializeBigInt(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, nested) => typeof nested === 'bigint' ? nested.toString() : nested));
}

export async function GET(req: Request) {
  const auth = requireTelegramAdminWallet(req);
  if (auth.status !== 200) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'SIGN_IN_REQUIRED' : 'ADMIN_ACCESS_REQUIRED' },
      { status: auth.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const url = new URL(req.url);
    const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
    const parsedOffset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(50, parsedLimit)) : 20;
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    const orders = getStoreOrders(limit, offset);
    const telemetry = getStoreTelemetry();

    return NextResponse.json(serializeBigInt({
      success: true,
      telemetry,
      orders,
      pagination: {
        limit,
        offset,
        total: telemetry.totalOrders,
      },
    }), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LOAD_ADMIN_ORDERS' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
