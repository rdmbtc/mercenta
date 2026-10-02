export type AccountTheme='dark'|'light'|'system';
export function validTheme(value:unknown):value is AccountTheme{return value==='dark'||value==='light'||value==='system'}
export function resolveTheme(theme:AccountTheme,systemDark:boolean){return theme==='system'?(systemDark?'dark':'light'):theme}
