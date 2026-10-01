import {proxyBackend} from '@/lib/backend-proxy';export const dynamic='force-dynamic';export async function POST(req:Request){return proxyBackend(req,'agent/chat')}
