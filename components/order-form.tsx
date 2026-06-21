"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function OrderForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="grid gap-7 px-5 py-14 md:px-14 lg:grid-cols-[0.7fr_1.3fr]" id="comanda">
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-primary">Cerere oferta</p>
        <h2 className="text-3xl font-bold tracking-normal md:text-5xl">Primeste oferta pentru materialele necesare</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Trimite masuratorile si datele de contact, iar echipa de vanzari revine cu oferta finala dupa
          verificarea necesarului si a stocului.
        </p>
      </div>

      <form
        className="grid gap-5 rounded-lg border bg-card p-5 shadow-soft md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nume client" placeholder="Ex: Popescu Andrei" />
          <TextField label="Telefon" placeholder="07xx xxx xxx" type="tel" />
          <TextField label="Email" placeholder="client@email.ro" type="email" />
          <TextField label="Localitate" placeholder="Oras / comuna" />
        </div>

        <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
          Observatii
          <textarea
            className="min-h-28 resize-y rounded-md border bg-white px-3 py-3 text-foreground"
            placeholder="Culoare dorita, accesorii, data estimata pentru montaj"
          />
        </label>

        <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm">
          <label className="flex items-center gap-3">
            <input defaultChecked name="payment" type="radio" />
            <span>Vreau sa fiu contactat pentru oferta finala</span>
          </label>
          <label className="flex items-center gap-3">
            <input name="payment" type="radio" />
            <span>Vreau plata online dupa confirmarea stocului</span>
          </label>
        </div>

        <Button className="w-full md:w-fit" type="submit">
          <Mail className="mr-2 size-4" />
          Trimite cererea
        </Button>

        {submitted ? (
          <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
            <CheckCircle2 className="mt-0.5 size-5 text-primary" />
            <span>Cererea a fost inregistrata. Un consultant va reveni cu oferta finala.</span>
          </div>
        ) : null}
      </form>
    </section>
  );
}

function TextField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input className="min-h-11 rounded-md border bg-white px-3 text-foreground" placeholder={placeholder} type={type} />
    </label>
  );
}
