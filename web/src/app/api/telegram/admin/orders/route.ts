import { NextResponse } from 'next/server';
import { getStoreOrders, getStoreTelemetry } from '@/lib/telegram-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const orders = getStoreOrders(limit, offset);
    const telemetry = getStoreTelemetry();

    return NextResponse.json({
      success: true,
      telemetry,
      orders,
      pagination: {
        limit,
        offset,
        total: telemetry.totalOrders,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LOAD_ADMIN_ORDERS', message: (err as Error).message },
      { status: 500 }
    );
  }
}
