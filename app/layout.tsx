import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Nicoroof Modern - Acoperisuri metalice",
  description: "Acoperisuri metalice si accesorii in Calinesti, Arges. Calculator si cereri de oferta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>
        <a
          className="sr-only z-50 rounded-md bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-soft focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          href="#main-content"
        >
          Sari la continut
        </a>
        {children}
      </body>
    </html>
  );
}
