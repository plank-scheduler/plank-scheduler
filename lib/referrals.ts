import {randomUUID,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {pool} from './db';
import {referrers,referrerByCode} from './referrer-profiles';
import {centralMonth,reportingMonth,monthWindow,monthlyAward,normalizedPhone,referralTrackingStart} from './referral-policy';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cookieName='plank_customer_referral',hash=(s:string)=>createHash('sha256').update(s).digest('hex');
type DB={query:(sql:string,args?:any[])=>Promise<{rows:any[];rowCount?:number|null}>};
const ready=new WeakMap<object,Promise<void>>();
export function initializeReferrals(db:DB=pool){let promise=ready.get(db);if(!promise){promise=(async()=>{
 await db.query(`CREATE TABLE IF NOT EXISTS app_referrals(id TEXT PRIMARY KEY,referrer_id INTEGER NOT NULL,handoff TEXT NOT NULL UNIQUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),customer_name TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',phone_key TEXT UNIQUE,duplicate_of TEXT,installed_at TIMESTAMPTZ,evidence TEXT,qualified_at TIMESTAMPTZ,excluded BOOLEAN NOT NULL DEFAULT FALSE,review_note TEXT NOT NULL DEFAULT '')`);
 await db.query(`CREATE TABLE IF NOT EXISTS app_referral_sessions(token_hash TEXT PRIMARY KEY,referral_id TEXT NOT NULL REFERENCES app_referrals(id),expires_at TIMESTAMPTZ NOT NULL)`);
 await db.query('ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS referral_id TEXT');
 await db.query('ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS referred_by_id INTEGER');
 })();ready.set(db,promise);promise.catch(()=>ready.delete(db));}return promise;}
async function cookieReferral(header:string|undefined,db:DB){const token=header?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!/^[a-zA-Z0-9_-]{43}$/.test(token))return null;return (await db.query('SELECT r.* FROM app_referrals r JOIN app_referral_sessions s ON s.referral_id=r.id WHERE s.token_hash=$1 AND s.expires_at>NOW()',[hash(token)])).rows[0]??null;}
function setCookie(res:ServerResponse,token:string){const value=`${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,old=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',[...(Array.isArray(old)?old:old?[String(old)]:[]),value]);}
export function referralView(row:any){const tech=referrers.find(t=>t.id===row.referrer_id);return tech?{referrerId:tech.id,referrerName:tech.name,handoff:row.handoff,identitySaved:!!(row.phone_key||row.duplicate_of),installRecorded:!!row.installed_at,duplicate:!!row.duplicate_of}:null;}
export async function referralArrival(req:IncomingMessage,res:ServerResponse,code:unknown,handoff:unknown,db:DB=pool){
 const known=referrerByCode(code),hasHandoff=typeof handoff==='string'&&uuid.test(handoff);if(!known&&!hasHandoff&&!req.headers.cookie?.includes(cookieName+'='))return null;
 await initializeReferrals(db);let row=await cookieReferral(req.headers.cookie,db);if(row)return referralView(row);
 if(hasHandoff)row=(await db.query('SELECT * FROM app_referrals WHERE handoff=$1',[handoff])).rows[0];
 if(!row&&known){row=(await db.query('INSERT INTO app_referrals(id,referrer_id,handoff) VALUES($1,$2,$3) RETURNING *',[randomUUID(),known.id,randomUUID()])).rows[0];}
 if(!row)return null;const token=randomBytes(32).toString('base64url');await db.query('INSERT INTO app_referral_sessions(token_hash,referral_id,expires_at) VALUES($1,$2,$3)',[hash(token),row.id,new Date(Date.now()+31536000000).toISOString()]);setCookie(res,token);return referralView(row);
}
export async function currentReferral(req:IncomingMessage,db:DB=pool){await initializeReferrals(db);return cookieReferral(req.headers.cookie,db);}
async function qualify(db:DB,id:string){await db.query("UPDATE app_referrals SET qualified_at=COALESCE(qualified_at,NOW()) WHERE id=$1 AND phone_key IS NOT NULL AND installed_at IS NOT NULL AND duplicate_of IS NULL AND excluded=FALSE",[id]);return (await db.query('SELECT * FROM app_referrals WHERE id=$1',[id])).rows[0];}
export async function identifyReferral(row:any,nameInput:unknown,phoneInput:unknown,consent:unknown,db:DB=pool){
 if(consent!==true||typeof nameInput!=='string'||!nameInput.trim()||nameInput.trim().length>120)throw new Error('Enter your name and allow saving your referral details.');const phone=normalizedPhone(phoneInput),key=hash(phone),name=nameInput.trim();
 if(row.phone_key&&row.phone_key!==key)throw new Error('This referral is already registered to another number. Ask the technician to help start a separate referral.');
 let original=(await db.query('SELECT * FROM app_referrals WHERE phone_key=$1',[key])).rows[0];
 if(!original){try{await db.query('UPDATE app_referrals SET customer_name=$1,phone=$2,phone_key=$3 WHERE id=$4 AND phone_key IS NULL',[name,phone,key,row.id]);}catch(error){original=(await db.query('SELECT * FROM app_referrals WHERE phone_key=$1',[key])).rows[0];if(!original)throw error;}}
 if(original&&original.id!==row.id){await db.query('UPDATE app_referrals SET customer_name=$1,phone=$2,duplicate_of=$3 WHERE id=$4 AND phone_key IS NULL',[name,phone,original.id,row.id]);if(row.installed_at)await recordInstall(original,'standalone_launch',db);return (await db.query('SELECT * FROM app_referrals WHERE id=$1',[row.id])).rows[0];}
 return qualify(db,row.id);
}
export async function recordInstall(row:any,signal:unknown,db:DB=pool){
 if(!['browser_install','standalone_launch'].includes(String(signal)))throw new Error('An app installation or installed-app launch is required.');
 const id=row.duplicate_of??row.id;await db.query('UPDATE app_referrals SET installed_at=COALESCE(installed_at,NOW()),evidence=COALESCE(evidence,$1) WHERE id=$2',[signal,id]);await qualify(db,id);return (await db.query('SELECT * FROM app_referrals WHERE id=$1',[row.id])).rows[0];
}
export async function captureRequestReferral(req:IncomingMessage,appointmentId:number,customer:{name:string;phone:string},db:DB=pool){
 await initializeReferrals(db);let row=await cookieReferral(req.headers.cookie,db);if(row)row=await identifyReferral(row,customer.name,customer.phone,true,db);else{try{row=(await db.query('SELECT * FROM app_referrals WHERE phone_key=$1',[hash(normalizedPhone(customer.phone))])).rows[0];}catch{return false;}}
 if(!row)return false;const originalId=row.duplicate_of??row.id,original=(await db.query('SELECT * FROM app_referrals WHERE id=$1',[originalId])).rows[0];if(!original)return false;
 await db.query('UPDATE appointments SET referral_id=$1,referred_by_id=$2 WHERE id=$3',[original.id,original.referrer_id,appointmentId]);return true;
}
export function reportAuthorized(authorization:unknown,key=process.env.REFERRAL_REPORT_KEY){if(!key||typeof authorization!=='string'||!authorization.startsWith('Bearer '))return false;const actual=hash(authorization.slice(7)),expected=hash(key);return timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));}
export async function referralReport(month:string,selected:number|null,page=0,db:DB=pool,now=new Date()){
 await initializeReferrals(db);const window=monthWindow(month);if(month<'2026-10'||month>reportingMonth(now))throw new Error('Choose a tracked month through the current month.');if(selected!==null&&!referrers.some(t=>t.id===selected))throw new Error('Unknown technician.');if(!Number.isSafeInteger(page)||page<0||page>100000)throw new Error('Invalid referral page.');
 const totals=(await db.query('SELECT referrer_id,COUNT(*) AS count FROM app_referrals WHERE qualified_at >= $1 AND qualified_at < $2 AND qualified_at <= $3 AND excluded=FALSE AND duplicate_of IS NULL GROUP BY referrer_id',[window.start,window.end,now.toISOString()])).rows;
 const leaders=referrers.map(t=>({id:t.id,name:t.name,count:Number(totals.find(r=>r.referrer_id===t.id)?.count??0)})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
 const rows=(await db.query(`SELECT id,referrer_id,customer_name,phone,created_at,installed_at,qualified_at,evidence,duplicate_of,excluded,review_note FROM app_referrals WHERE COALESCE(qualified_at,installed_at,created_at)>=$1 AND COALESCE(qualified_at,installed_at,created_at)<$2${selected===null?'':' AND referrer_id=$3'} ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ${page*50}`,[window.start,window.end,...(selected===null?[]:[selected])])).rows;
 const people=rows.slice(0,50);const requests=people.length?(await db.query(`SELECT id,referral_id,created_at,service,status FROM appointments WHERE referral_id=ANY($1::text[]) ORDER BY created_at DESC`,[people.map(r=>r.id)])).rows:[];
 return {month,asOf:now.toISOString(),closed:now>=new Date(window.end),trackingSince:referralTrackingStart,window,leaders,award:monthlyAward(leaders),people:people.map(p=>({...p,referrerName:referrers.find(t=>t.id===p.referrer_id)?.name??'Unknown',requests:requests.filter(r=>r.referral_id===p.id)})),nextPage:rows.length>50?page+1:null,rule:'$50 to the most unique registered installed-app users in the reporting period ending 6 AM Central on the last calendar day, minimum 5; no purchase required. Same normalized phone counts once across devices. Browser signals are provisional until owner award review. Scans, page views and install-button clicks do not count.'};
}
export async function referralById(id:string,db:DB=pool){if(!uuid.test(id))throw new Error('Invalid referral.');await initializeReferrals(db);const row=(await db.query('SELECT id,referrer_id,customer_name,phone,created_at,qualified_at,excluded FROM app_referrals WHERE id=$1',[id])).rows[0];if(!row)throw new Error('Referral unavailable.');return row;}
export async function reviewReferral(id:string,excluded:boolean,note:string,db:DB=pool){if(!uuid.test(id)||typeof excluded!=='boolean'||typeof note!=='string'||!note.trim()||note.length>1000)throw new Error('Enter a review reason.');await initializeReferrals(db);await db.query('UPDATE app_referrals SET excluded=$1,review_note=$2 WHERE id=$3',[excluded,note.trim(),id]);return {saved:true};}
