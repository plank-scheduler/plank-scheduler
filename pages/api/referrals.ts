import type {NextApiRequest,NextApiResponse} from 'next';
import {currentReferral,identifyReferral,recordInstall,referralView} from '../../lib/referrals';
export default async function handler(req:NextApiRequest,res:NextApiResponse){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
 if(!req.headers['content-type']?.startsWith('application/json')||!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Open the Plank app directly before saving referral credit.'});
 try{const row=await currentReferral(req);if(!row)return res.status(401).json({error:'Open your technician’s QR link again to save referral credit.'});const body=req.body??{};let saved;if(body.action==='identify')saved=await identifyReferral(row,body.name,body.phone,body.consent);else if(body.action==='installed')saved=await recordInstall(row,body.signal);else return res.status(400).json({error:'Choose a valid referral action.'});return res.status(200).json({ok:true,referral:referralView(saved)});}catch(error){return res.status(400).json({error:error instanceof Error&&!/database|relation|connect|query|timeout/i.test(error.message)?error.message:'Referral credit could not be confirmed. Please retry; you can still use the scheduler.'});}
}
export const config={api:{bodyParser:{sizeLimit:'4kb'}}};
