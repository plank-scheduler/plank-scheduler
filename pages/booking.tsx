import dynamic from "next/dynamic";
import Head from "next/head";

const BookingClient = dynamic(() => import("../components/ServiceBooking"), {
  ssr: false,
  loading: () => <p style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>Loading service requests… If this page does not load, call <a href="tel:5733683333">573-368-3333</a>.</p>,
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
