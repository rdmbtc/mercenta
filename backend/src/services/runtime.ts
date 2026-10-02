import type {TemporaryConfig} from './temp-stores.js';import {temporaryDeadline} from './temp-stores.js';
export type ResourceConfig=TemporaryConfig&{MEMORY_SOFT_LIMIT_MB?:number;MAX_INFLIGHT_REQUESTS?:number};
export function memoryState(c:ResourceConfig,rss=process.memoryUsage().rss){const limit=c.MEMORY_SOFT_LIMIT_MB??768;return {rssMb:Math.ceil(rss/1048576),softLimitMb:limit,pressured:rss>=limit*1048576,primary:'persistent-sqlite-wal',writesUnderPressure:'rejected-before-execution',temporary:temporaryDeadline(c)};}
export function canMutate(method:string,pressured:boolean){return !pressured||method==='GET'||method==='HEAD';}
