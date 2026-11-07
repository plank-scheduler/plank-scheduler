import type {NextApiRequest,NextApiResponse} from 'next';
import {currentReferral} from '../../lib/referrals';
import manifest from '../../public/manifest.json';
export default async function handler(req:NextApiRequest,res:NextApiResponse){res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/manifest+json');let start=manifest.start_url;
 if(req.headers.cookie?.includes('plank_customer_referral=')){try{const row=await currentReferral(req);if(row)start='/booking?handoff='+encodeURIComponent(row.handoff);}catch{/* Keep the app installable when optional attribution is unavailable. */}}
 return res.status(200).json({...manifest,id:'/booking',start_url:start});}
