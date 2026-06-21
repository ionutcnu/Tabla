"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "#calculator", label: "Calculator" },
  { href: "#produse", label: "Produse" },
  { href: "#comanda", label: "Comanda" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-14">
        <a className="flex min-w-0 items-center gap-3" href="#top" aria-label="TablaFix acasa" onClick={() => setOpen(false)}>
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-teal-900 text-sm font-bold text-white">
            TF
          </span>
          <span className="min-w-0">
            <strong className="block text-base leading-tight">TablaFix</strong>
            <span className="block truncate text-sm text-muted-foreground">Comenzi tabla pentru acoperisuri</span>
          </span>
        </a>

        <nav className="hidden gap-5 text-sm text-muted-foreground md:flex" aria-label="Navigatie principala">
          {navItems.map((item) => (
            <a className="hover:text-foreground" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Inchide meniul" : "Deschide meniul"}
          className="grid size-11 place-items-center rounded-md border bg-white text-foreground md:hidden"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t bg-white px-5 py-3 md:hidden" id="mobile-menu" aria-label="Navigatie mobila">
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
