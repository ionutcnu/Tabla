import { ArrowRight, CheckCircle2, FileSpreadsheet, Mail, PackageCheck, Percent, Phone } from "lucide-react";

import { EstimateCalculator } from "@/components/estimate-calculator";
import { FadeInSection, MotionProvider, StaggerDiv, StaggerItemArticle } from "@/components/motion-primitives";
import { RoofAssemblyVisual } from "@/components/roof-assembly-visual";
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
      <main className="w-full max-w-full" id="main-content">
        <MotionProvider>
        <section className="relative grid min-h-[calc(100svh-76px)] w-full max-w-full scroll-mt-24 items-center overflow-hidden bg-slate-950 px-5 py-10 text-slate-50 md:min-h-[560px] md:px-14 md:py-16" id="top">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(20,184,166,0.22),transparent_36%),linear-gradient(135deg,rgba(15,23,42,1),rgba(15,23,42,0.96)_44%,rgba(19,78,74,0.86))]" />

          <div className="relative z-10 grid w-full max-w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-center">
            <div className="min-w-0 max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase text-teal-200">Distribuitor autorizat Bilka</p>
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-normal md:text-7xl md:leading-none">
                Țiglă metalică Bilka, calculată rapid
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90 md:mt-5 md:text-lg md:leading-8">
                Suntem distribuitor Bilka pentru țiglă metalică, tablă și accesorii. Completezi necesarul pentru acoperiș, iar noi verificăm disponibilitatea, transportul și prețul final.
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
              <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold text-slate-100/90">
                {["Răspuns rapid", "Ofertă verificată", "Livrare națională"].map((item) => (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3 py-2 backdrop-blur" key={item}>
                    <CheckCircle2 className="size-4 text-teal-200" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <RoofAssemblyVisual />
          </div>
        </section>

        <FadeInSection className="overflow-hidden bg-secondary px-5 py-12 md:px-14 md:py-14" id="oferta">
          <div className="mb-7 min-w-0">
            <p className="mb-2 text-xs font-bold uppercase text-primary">Cum funcționează</p>
            <h2 className="text-balance text-2xl font-bold tracking-normal md:text-5xl">Pregătim oferta în 3 pași</h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground md:text-base">
              Formularul este construit pentru a transforma rapid necesarul de materiale într-o cerere clară pentru distribuitor.
              Completezi cantitățile cunoscute, iar oferta este verificată înainte de confirmarea finală.
            </p>
          </div>
          <StaggerDiv className="relative grid gap-4 md:grid-cols-3 md:before:absolute md:before:left-[16.66%] md:before:right-[16.66%] md:before:top-8 md:before:h-px md:before:bg-border">
            {offerSteps.map((step, index) => (
              <StaggerItemArticle className="relative min-w-0 rounded-lg border bg-card p-4 shadow-soft md:p-5" key={step.title}>
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

