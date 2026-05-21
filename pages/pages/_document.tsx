import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="application-name"
          content="Plank Pest"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="Plank Pest"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="theme-color"
          content="#1f7a34"
        />

        <meta
          name="description"
          content="Plank Pest Control Online Scheduler"
        />

        <link
          rel="manifest"
          href="/manifest.json"
        />

        <link
          rel="apple-touch-icon"
          href="/icons/icon-192.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/icon-192.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/icons/icon-512.png"
        />

        <link
          rel="shortcut icon"
          href="/icons/icon-192.png"
        />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}