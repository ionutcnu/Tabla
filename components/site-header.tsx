"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AnimatePresence, m } from "@/components/motion-primitives";
import { company } from "@/lib/offer-data";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#oferta", label: "Cum functioneaza" },
  { href: "#calculator", label: "Cerere oferta" },
  { href: "/admin", label: "Admin demo" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function updateScrolled() {
      setScrolled(window.scrollY > 12);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b bg-white/90 backdrop-blur-xl transition-all duration-300",
        scrolled ? "border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)]" : "border-white/40 shadow-none",
      )}
    >
      <div className={cn("flex items-center justify-between gap-4 px-5 transition-all duration-300 md:px-14", scrolled ? "py-2.5" : "py-3.5")}>
        <m.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
          <Link className="flex min-w-0 items-center gap-3" href="/" aria-label="Nicoroof Modern acasa" onClick={() => setOpen(false)}>
            <span className="relative h-11 w-28 shrink-0 overflow-hidden rounded-sm bg-white md:h-12 md:w-32">
              <Image alt="Nicoroof Modern logo" className="object-contain" fill sizes="128px" src="/nicoroof-logo.png" />
            </span>
            <span className="hidden min-w-0 sm:block">
              <strong className="block text-sm leading-tight text-foreground md:text-base">{company.name}</strong>
              <span className="block max-w-[260px] truncate text-xs text-muted-foreground md:text-sm">{company.tagline}</span>
            </span>
          </Link>
        </m.div>

        <nav className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex" aria-label="Navigatie principala">
          {navItems.map((item) => (
            <a
              className={cn(
                "rounded-full px-3.5 py-2 transition-colors hover:bg-secondary hover:text-foreground",
                item.href === "#calculator" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                item.href === "/admin" && "text-muted-foreground/80",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <m.button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Inchide meniul" : "Deschide meniul"}
          className="grid size-11 place-items-center rounded-md border bg-white text-foreground shadow-sm md:hidden"
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </m.button>
      </div>

      <AnimatePresence>
        {open ? (
          <m.nav
            animate={{ opacity: 1, y: 0 }}
            aria-label="Navigatie mobila"
            className="grid gap-1 border-t bg-white/95 px-5 py-3 shadow-[0_18px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
            exit={{ opacity: 0, y: -8 }}
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
          >
            {navItems.map((item) => (
              <a
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground",
                  item.href === "#calculator" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                )}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </m.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
