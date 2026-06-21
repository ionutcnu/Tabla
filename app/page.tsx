import Image from "next/image";
import { ArrowRight, Clock3, PackageCheck, Truck } from "lucide-react";

import { EstimateCalculator } from "@/components/estimate-calculator";
import { OrderForm } from "@/components/order-form";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const products = [
  {
    title: "Tabla cutata",
    description: "Varianta economica pentru hale, anexe si acoperisuri simple.",
    swatch: "bg-slate-700",
  },
  {
    title: "Tabla tip tigla",
    description: "Aspect clasic pentru locuinte, disponibila in mai multe culori.",
    swatch: "bg-red-700",
  },
  {
    title: "Accesorii",
    description: "Coame, dolii, sorturi, pazii, suruburi si elemente de prindere.",
    swatch: "bg-zinc-300",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="relative grid min-h-[560px] items-center overflow-hidden px-5 py-16 text-white md:px-14">
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
              <p className="mb-3 text-xs font-bold uppercase text-teal-200">Calculator acoperis metalic</p>
              <h1 className="text-4xl font-bold leading-none tracking-normal md:text-7xl">
                Introdu masuratorile si primesti necesarul pentru acoperisul tau.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                Completeaza dimensiunile acoperisului si datele de contact, iar echipa de vanzari verifica
                necesarul si revine cu oferta finala.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="#calculator">
                    Calculeaza necesar
                    <ArrowRight className="ml-2 size-4" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#comanda">Trimite cerere</a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 text-foreground shadow-soft">
              <span className="mb-5 inline-flex rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900">
                Raspuns in aceeasi zi
              </span>
              <div className="grid gap-4">
                <HeroMetric icon={<PackageCheck className="size-5" />} label="Latime utila foaie" value="1.10 m" />
                <HeroMetric icon={<Clock3 className="size-5" />} label="Pierdere calculata" value="10%" />
                <HeroMetric icon={<Truck className="size-5" />} label="Livrare" value="Asigurata de firma" />
              </div>
            </div>
          </div>
        </section>

        <EstimateCalculator />

        <section className="bg-secondary px-5 py-14 md:px-14" id="produse">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase text-primary">Produse</p>
            <h2 className="text-3xl font-bold tracking-normal md:text-5xl">Alege materialul principal</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {products.map((product) => (
              <article className="rounded-lg border bg-card p-6 shadow-soft" key={product.title}>
                <span className={`mb-5 block h-7 w-12 rounded border ${product.swatch}`} />
                <h3 className="mb-2 text-lg font-bold">{product.title}</h3>
                <p className="leading-7 text-muted-foreground">{product.description}</p>
              </article>
            ))}
          </div>
        </section>

        <OrderForm />
      </main>

      <footer className="flex flex-col justify-between gap-3 border-t px-5 py-6 text-sm text-muted-foreground md:flex-row md:px-14">
        <span>TablaFix</span>
        <span>
          Tabla pentru acoperisuri, accesorii si consultanta pentru necesarul corect.{" "}
          <a className="font-semibold text-primary" href="/admin">
            Admin
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
