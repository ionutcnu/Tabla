import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock3, FileSpreadsheet, Mail, PackageCheck, Percent, Phone, Truck } from "lucide-react";

import { EstimateCalculator } from "@/components/estimate-calculator";
import { FadeInSection, MotionProvider, StaggerDiv, StaggerItemArticle } from "@/components/motion-primitives";
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
      <MotionProvider>
        <SiteHeader />
      </MotionProvider>
      <main id="main-content">
        <MotionProvider>
        <section className="relative grid min-h-[560px] scroll-mt-24 items-center overflow-hidden px-5 py-16 text-white md:px-14" id="top">
          <Image
            priority
            fill
            alt="Acoperis metalic si structura industriala"
            className="object-cover"
            sizes="100vw"
            src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/92 via-slate-950/78 to-slate-950/62 md:bg-gradient-to-r md:from-slate-950/90 md:via-slate-950/68 md:to-slate-950/30" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase text-teal-200">{company.tagline}</p>
              <h1 className="text-balance text-4xl font-bold leading-none tracking-normal md:text-7xl">
                Cerere de ofertă pentru țiglă metalică și accesorii.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                Alege profilul potrivit, completează materialele necesare și primești confirmare pentru disponibilitate,
                transport și preț final.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button asChild>
                  <a href="#calculator">
                    Solicită ofertă
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <a className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline" href="#oferta">
                  Vezi cum funcționează
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-white/85">
                {["Răspuns rapid", "Ofertă verificată", "Livrare națională"].map((item) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur" key={item}>
                    <CheckCircle2 className="size-4 text-teal-200" />
                    {item}
                  </span>
                ))}
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

        <FadeInSection className="bg-secondary px-5 py-14 md:px-14" id="oferta">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase text-primary">Cum funcționează</p>
            <h2 className="text-balance text-3xl font-bold tracking-normal md:text-5xl">Pregătim oferta în 3 pași</h2>
            <p className="mt-3 max-w-4xl text-muted-foreground">
              Formularul este construit pentru a transforma rapid necesarul de materiale într-o cerere clară pentru distribuitor.
              Completezi cantitățile cunoscute, iar oferta este verificată înainte de confirmarea finală.
            </p>
          </div>
          <StaggerDiv className="relative grid gap-4 md:grid-cols-3 md:before:absolute md:before:left-[16.66%] md:before:right-[16.66%] md:before:top-8 md:before:h-px md:before:bg-border">
            {offerSteps.map((step, index) => (
              <StaggerItemArticle className="relative rounded-lg border bg-card p-5 shadow-soft" key={step.title}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-md bg-teal-50 text-primary ring-8 ring-secondary">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-2xl font-bold text-primary/15">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              </StaggerItemArticle>
            ))}
          </StaggerDiv>
        </FadeInSection>
        </MotionProvider>

        <EstimateCalculator />

      </main>

      <footer className="border-t bg-white px-5 py-6 md:px-14">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <strong className="block text-sm text-foreground">{company.name}</strong>
            <span className="mt-1 block max-w-2xl break-words text-sm leading-6 text-muted-foreground">{company.address}</span>
          </div>
          <div className="grid min-w-0 gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:flex lg:items-center lg:gap-5">
            <ContactItem icon={<Phone className="size-4" />} label={company.phone} />
            <ContactItem icon={<Mail className="size-4" />} label={company.email} />
            <a className="inline-flex min-h-10 w-fit items-center rounded-md border bg-white px-4 font-semibold text-primary transition-colors hover:bg-teal-50 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2 lg:col-span-1" href="/admin">
              Admin demo
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function ContactItem({ className, icon, label }: { className?: string; icon: React.ReactNode; label: string }) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className || ""}`}>
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="min-w-0 break-words leading-6">{label}</span>
    </span>
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
