import type {DB} from '../db.js';
export type Theme='dark'|'light'|'system';
export function initSettings(db:DB){db.exec("CREATE TABLE IF NOT EXISTS account_settings(actor TEXT PRIMARY KEY,theme TEXT NOT NULL CHECK(theme IN('dark','light','system')),updated_at INTEGER NOT NULL)")}
export function settings(db:DB,actor:string){const row=db.prepare('SELECT theme,updated_at FROM account_settings WHERE actor=?').get(actor) as {theme:Theme;updated_at:number}|undefined;return {theme:row?.theme??'dark',updatedAt:row?.updated_at??null,currency:'USDC',network:'Arc Testnet',chainId:5042002,timezone:'UTC',mode:'testnet'}}
export function saveSettings(db:DB,actor:string,theme:Theme){if(!['dark','light','system'].includes(theme))throw new Error('INVALID_THEME');db.prepare('INSERT INTO account_settings VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET theme=excluded.theme,updated_at=excluded.updated_at').run(actor,theme,Date.now());return settings(db,actor)}
