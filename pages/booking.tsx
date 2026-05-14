import dynamic from "next/dynamic";
import Head from "next/head";

const BookingClient = dynamic(() => import("../components/BookingClientTest"), {
  ssr: false,
});

export default function BookingPage() {
  return (
    <>
      <Head>
        <title>Schedule Service | Plank Termite & Pest Control</title>
      </Head>

      <BookingClient />
    </>
  );
}