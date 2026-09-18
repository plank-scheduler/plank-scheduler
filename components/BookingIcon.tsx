export default function BookingIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
    home: <><path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/></>,
    leaf: <><path d="M20 4C6 2 2 9 6 16s16 4 14-12ZM4 21 16 9"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>,
    layers: <><path d="m3 8 9-5 9 5-9 5ZM3 12l9 5 9-5M3 16l9 5 9-5"/></>,
    drop: <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13ZM8 15a4 4 0 0 0 4 4"/></>,
    spark: <><path d="m12 3 2 6 7 3-7 2-2 7-3-7-6-2 6-3ZM20 2v4m-2-2h4"/></>,
  };
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.shield}</svg>;
}
