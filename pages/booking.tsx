import dynamic from "next/dynamic";
import Head from "next/head";
import type {GetServerSideProps} from 'next';
import {referralArrival} from '../lib/referrals';
import type {ReferralInfo} from '../components/ReferralCredit';

const BookingClient = dynamic(() => import("../components/ServiceBooking"), {
  ssr: false,
  loading: () => <p style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>Loading service requests… If this page does not load, call <a href="tel:5733683333">573-368-3333</a>.</p>,
});

export default function BookingPage({referral=null,referralWarning=false}:{referral:ReferralInfo|null;referralWarning:boolean}) {
  return (
    <>
      <Head>
        <title>Schedule Service | Plank Termite & Pest Control</title>
      </Head>

      <BookingClient referral={referral} referralWarning={referralWarning}/>
    </>
  );
}
export const getServerSideProps:GetServerSideProps=async context=>{context.res.setHeader('Cache-Control','private, no-store');try{return {props:{referral:await referralArrival(context.req,context.res,context.query.ref,context.query.handoff),referralWarning:false}};}catch{return {props:{referral:null,referralWarning:!!context.query.ref||!!context.query.handoff}};}};
