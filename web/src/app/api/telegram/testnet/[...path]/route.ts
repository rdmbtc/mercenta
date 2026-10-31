import { proxyBackend } from '@/lib/backend-proxy';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };

async function handle(req: Request, context: Context) {
  const { path } = await context.params;
  const route = path.join('/');
  const id = '[a-zA-Z0-9_-]{1,200}';
  const read = new RegExp(`^(summary|orders|orders/${id}/delivery|catalog-checkout/quotes/${id})$`);
  const write = new RegExp(`^(deposits|deposits/${id}/verify|catalog-checkout/quote|catalog-checkout/confirm)$`);
  if (!(req.method === 'GET' ? read : write).test(route)) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  return proxyBackend(req, 'account/' + route);
}

export { handle as GET, handle as POST };
