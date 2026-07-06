import { company } from "@/lib/offer-data";

const fallbackUrl = "https://nicoroofmodern.ro";

export const siteConfig = {
  url: new URL(process.env.NEXT_PUBLIC_SITE_URL || fallbackUrl),
  name: company.name,
  title: "Nicoroof Modern - tigla metalica Bilka si accesorii",
  description:
    "Distribuitor autorizat Bilka pentru tigla metalica, tabla si accesorii in Calinesti, Arges. Completeaza necesarul si solicita o oferta verificata.",
  keywords: [
    "tigla metalica Bilka",
    "acoperis metalic",
    "accesorii acoperis",
    "calculator tigla metalica",
    "oferta tigla metalica",
    "Nicoroof Modern",
    "Calinesti Arges",
  ],
  logoPath: "/nicoroof-logo.png",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
