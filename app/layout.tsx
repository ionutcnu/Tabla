import type { Metadata, Viewport } from "next";

import "./globals.css";

import { company } from "@/lib/offer-data";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: siteConfig.url,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  category: "constructii",
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: siteConfig.logoPath,
        width: 512,
        height: 512,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.logoPath],
  },
  icons: {
    icon: siteConfig.logoPath,
    shortcut: siteConfig.logoPath,
    apple: siteConfig.logoPath,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    name: company.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl(siteConfig.logoPath),
    telephone: company.phone,
    email: company.email,
    taxID: company.fiscalCode,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Str. Principala nr. 83A",
      addressLocality: "Calinesti",
      addressRegion: "Arges",
      addressCountry: "RO",
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Arges",
      },
      {
        "@type": "Country",
        name: "Romania",
      },
    ],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Tigla metalica Bilka",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Accesorii pentru acoperis",
        },
      },
    ],
  };

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
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </body>
    </html>
  );
}
