import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TablaFix - Comenzi tabla acoperis",
  description: "Calculator si cereri de oferta pentru tabla de acoperis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
