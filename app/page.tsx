import Image from "next/image";
import { ArrowRight, Clock3, FileSpreadsheet, PackageCheck, Percent, Truck } from "lucide-react";

import { EstimateCalculator } from "@/components/estimate-calculator";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/offer-data";

const offerSteps = [
  {
    title: "Alegi profilul potrivit",
    description:
      "Începi prin alegerea modelului de țiglă metalică. Fiecare profil are o lățime utilă diferită, iar calculatorul aplică automat formula corectă.",
    icon: FileSpreadsheet,
  },
  {
    title: "Completezi necesarul",
    description:
      "Introduci numărul de foi pentru lungimile de care ai nevoie, apoi adaugi accesoriile, sistemul pluvial și consumabilele pentru lucrare.",
    icon: PackageCheck,
  },
  {
    title: "Primești oferta finală",
    description:
      "Cererea ajunge la distribuitor pentru verificarea disponibilității, a transportului, a discountului și a costului de montaj, dacă este cazul.",
    icon: Percent,
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="relative grid min-h-[560px] scroll-mt-24 items-center overflow-hidden px-5 py-16 text-white md:px-14" id="top">
          <Image
            priority
            fill
            alt="Acoperis metalic si structura industriala"
            className="object-cover"
            sizes="100vw"
            src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/68 to-slate-950/30" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="relative mb-6 h-24 w-32 overflow-hidden rounded-lg border border-white/20 bg-white shadow-soft">
                <Image alt="Nicoroof Modern logo" className="object-contain p-2" fill sizes="128px" src="/nicoroof-logo.png" />
              </div>
              <p className="mb-3 text-xs font-bold uppercase text-teal-200">{company.tagline}</p>
              <h1 className="text-balance text-4xl font-bold leading-none tracking-normal md:text-7xl">
                Cerere de ofertă pentru țiglă metalică și accesorii.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                Alege profilul potrivit, completează materialele necesare și primești confirmare pentru disponibilitate,
                transport și preț final.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="#calculator">
                    Solicită ofertă
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#oferta">Vezi cum funcționează</a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 text-foreground shadow-soft">
              <span className="mb-5 inline-flex rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900">
                Răspuns în aceeași zi
              </span>
              <div className="grid gap-4">
                <HeroMetric icon={<PackageCheck className="size-5" />} label="Profile țiglă" value="5 modele" />
                <HeroMetric icon={<Clock3 className="size-5" />} label="Contact" value={company.phone} />
                <HeroMetric icon={<Truck className="size-5" />} label="Livrare" value="În toată țara" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary px-5 py-14 md:px-14" id="oferta">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase text-primary">Cum funcționează</p>
            <h2 className="text-balance text-3xl font-bold tracking-normal md:text-5xl">Pregătim oferta în 3 pași</h2>
            <p className="mt-3 max-w-4xl text-muted-foreground">
              Formularul este construit pentru a transforma rapid necesarul de materiale într-o cerere clară pentru distribuitor.
              Completezi cantitățile cunoscute, iar oferta este verificată înainte de confirmarea finală.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {offerSteps.map((step) => (
              <article className="rounded-lg border bg-card p-6 shadow-soft" key={step.title}>
                <span className="mb-5 grid size-12 place-items-center rounded-md bg-teal-50 text-primary">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="leading-7 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <EstimateCalculator />

      </main>

      <footer className="flex flex-col justify-between gap-3 border-t px-5 py-6 text-sm text-muted-foreground md:flex-row md:px-14">
        <span>{company.name}</span>
        <span>
          {company.phone} | {company.email}{" "}
          <a className="font-semibold text-primary" href="/admin">
            Admin demo
          </a>
        </span>
      </footer>
    </>
  );
}

function HeroMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-md bg-teal-50 text-primary">{icon}</span>
      <span>
        <span className="block text-sm text-muted-foreground">{label}</span>
        <strong className="block">{value}</strong>
      </span>
    </div>
  );
}
