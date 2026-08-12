const KEY='kelasku_admin_pin_v1'
const encode=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('')
const digest=async(pin:string,salt:string)=>encode(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${pin}`)))
const stored=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null') as unknown;return typeof x==='object'&&x!==null&&typeof (x as {salt?:unknown}).salt==='string'&&typeof (x as {hash?:unknown}).hash==='string'?x as {salt:string;hash:string}:null}catch{return null}}
export async function verifyAdminPin(pin:string){const record=stored();if(!record)return pin==='1234';return (await digest(pin,record.salt))===record.hash}
export async function setAdminPin(pin:string){if(!/^\d{4,12}$/.test(pin))throw new Error('PIN harus terdiri dari 4–12 digit.');const salt=crypto.randomUUID();localStorage.setItem(KEY,JSON.stringify({salt,hash:await digest(pin,salt)}))}
