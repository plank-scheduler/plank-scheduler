import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("Service worker registration failed:", err));
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="theme-color" content="#166534" />
        <meta name="application-name" content="Plank Scheduler" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Plank Scheduler" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/plank-logo.jpg" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}