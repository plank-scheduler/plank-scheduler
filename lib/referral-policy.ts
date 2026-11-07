export const referralTrackingStart='2026-10-28';
export function normalizedPhone(value:unknown){if(typeof value!=='string'||value.length>35)throw new Error('Enter a valid phone number.');const digits=value.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');if(!/^[2-9]\d{9}$/.test(digits))throw new Error('Enter a ten-digit phone number.');return digits;}
export function centralMonth(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit'}).formatToParts(now).filter(p=>p.type==='year'||p.type==='month').sort((a,b)=>a.type==='year'?-1:b.type==='year'?1:0).map(p=>p.value).join('-');}
// A period ends at 6 AM Central on its last calendar day. The rest of
// that day belongs to the next period. Use half-open ranges at every boundary.
export function monthWindow(month:unknown){
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Choose a valid month.');
 const [year,m]=month.split('-').map(Number);
 function cutoff(y:number,nextMonth:number){const day=new Date(Date.UTC(y,nextMonth-1,0));const guess=new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),12));const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',hourCycle:'h23'}).format(guess));return new Date(guess.getTime()+(6-hour)*3600000).toISOString();}
 return {start:cutoff(year,m),end:cutoff(year,m+1)};
}
export function reportingMonth(now=new Date()){const month=centralMonth(now);if(now<new Date(monthWindow(month).end))return month;const [y,m]=month.split('-').map(Number);return `${m===12?y+1:y}-${String(m===12?1:m+1).padStart(2,'0')}`;}
export function monthlyAward(leaders:{id:number;name:string;count:number}[]){const highest=Math.max(0,...leaders.map(t=>t.count)),top=leaders.filter(t=>t.count===highest&&highest>=5);return {minimum:5,awardCents:5000,highest,winner:top.length===1?top[0]:null,tied:top.length>1?top:[],status:highest<5?'no_qualifier':top.length>1?'tie':'winner',paymentStatus:'Owner review required; not paid or posted to earnings'};}
