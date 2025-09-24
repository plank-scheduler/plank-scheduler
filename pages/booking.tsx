import dynamic from "next/dynamic";
const BookingClient = dynamic(() => import("../components/BookingClient"), { ssr: false });

export default function BookingPage() {
  return <BookingClient />;
}
