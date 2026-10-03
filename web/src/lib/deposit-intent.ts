const ADDRESS=/^0x[a-fA-F0-9]{40}$/;
export function depositEligibility(wallet:string|null,receiver:string|null,amount:string,readOnly=false):{code:string|null;amount?:string}{
 if(readOnly)return {code:'MEMORY_PRESSURE_READ_ONLY'};
 if(!wallet||!ADDRESS.test(wallet))return {code:'WALLET_AUTH_REQUIRED'};
 if(!receiver)return {code:'DEPOSIT_RECEIVER_NOT_CONFIGURED'};
 if(!ADDRESS.test(receiver)||/^0x0{40}$/i.test(receiver))return {code:'DEPOSIT_RECEIVER_INVALID'};
 if(wallet.toLowerCase()===receiver.toLowerCase())return {code:'DEPOSIT_SELF_TRANSFER'};
 const canonical=amount.trim();
 if(canonical.length>30||!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(canonical))return {code:'DEPOSIT_AMOUNT_INVALID'};
 const [whole,fraction='']=canonical.split('.'),units=BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));
 if(units<=0n||units>1000000000000n)return {code:'DEPOSIT_AMOUNT_INVALID'};
 return {code:null,amount:canonical};
}
