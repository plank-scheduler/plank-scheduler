import type {NextApiRequest,NextApiResponse} from 'next';
import {reportAuthorized,referralReport,referralById,reviewReferral} from '../../lib/referrals';
import {reportingMonth} from '../../lib/referral-policy';
export default async function handler(req:NextApiRequest,res:NextApiResponse){res.setHeader('Cache-Control','private, no-store');if(!reportAuthorized(req.headers.authorization))return res.status(401).json({error:'Report access required.'});
 try{if(req.method==='POST'){if(req.body?.action!=='review')return res.status(400).json({error:'Unknown review action.'});return res.json(await reviewReferral(req.body.id,req.body.excluded,req.body.note));}
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});if(typeof req.query.id==='string')return res.json({person:await referralById(req.query.id)});
 const selected=req.query.technician===undefined||req.query.technician==='all'?null:Number(req.query.technician);return res.json(await referralReport(typeof req.query.month==='string'?req.query.month:reportingMonth(),selected,Number(req.query.page??0)));
 }catch{return res.status(503).json({error:'Referral records could not be verified. Do not interpret unavailable records as zero.'});}}
export const config={api:{bodyParser:{sizeLimit:'4kb'}}};
