"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { company } from "@/lib/offer-data";

const navItems = [
  { href: "#oferta", label: "Cum funcționează" },
  { href: "#calculator", label: "Cerere ofertă" },
  { href: "/admin", label: "Admin demo" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-14">
        <a className="flex min-w-0 items-center gap-3" href="#top" aria-label="Nicoroof Modern acasă" onClick={() => setOpen(false)}>
          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border bg-white">
            <Image alt="Nicoroof Modern logo" className="object-contain p-1" fill sizes="64px" src="/nicoroof-logo.png" />
          </span>
          <span className="min-w-0">
            <strong className="block text-base leading-tight">{company.name}</strong>
            <span className="block truncate text-sm text-muted-foreground">{company.tagline}</span>
          </span>
        </a>

        <nav className="hidden gap-5 text-sm text-muted-foreground md:flex" aria-label="Navigație principală">
          {navItems.map((item) => (
            <a className="hover:text-foreground" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          className="grid size-11 place-items-center rounded-md border bg-white text-foreground md:hidden"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t bg-white px-5 py-3 md:hidden" id="mobile-menu" aria-label="Navigație mobilă">
          {navItems.map((item) => (
            <a
              className="rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
