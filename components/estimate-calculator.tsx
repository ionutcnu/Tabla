"use client";

import Image from "next/image";
import { CheckCircle2, ClipboardList, ExternalLink, FileSpreadsheet, Home, Minus, PackageCheck, Pencil, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { sheetSeries } from "@/lib/offer-data";
import {
  calculateQuoteTotals,
  createEmptyQuoteRequest,
  generateQuoteRequestId,
  getStoredProductCatalog,
  getStoredQuoteRequests,
  saveStoredQuoteRequests,
  type QuoteRequest,
  type SeriesKey,
} from "@/lib/quote";

const accessoryCategories = ["Toate", "Accesorii generale", "Accesorii acoperiș", "Sistem pluvial", "Consumabile"] as const;
type AccessoryProductCategory = Exclude<(typeof accessoryCategories)[number], "Toate">;
type AccessoryImage = { alt: string; src: string };
type SubmittedSummary = {
  id: string;
  items: Array<{
    label: string;
    quantity: number;
    unit: string;
    value: number;
  }>;
  totalValue: number;
};

const accessoryImagesByName: Record<string, AccessoryImage> = {
  "tabla plana": { alt: "Tabla plana", src: "/products/bilka/accessories/tabla-plana.jpg" },
  "fereastra mansarda": { alt: "Fereastra mansarda", src: "/products/bilka/accessories/fereastra-mansarda.jpg" },
  "fixare sub tabla": { alt: "Fixare sub tabla", src: "/products/bilka/accessories/fixare-placi-zid.jpg" },
  "lambriu 18 mm": { alt: "Lambriu 18 mm", src: "/products/bilka/accessories/lambriu-t8.png" },
  "dolie 2ml": { alt: "Dolie Bilka", src: "/products/bilka/accessories/dolie.jpg" },
  "laterala margine 2ml": { alt: "Bordură fronton Bilka", src: "/products/bilka/accessories/bordura-fronton.jpg" },
  "laterala mare 21 cm": { alt: "Bordură fronton sub țiglă Bilka", src: "/products/bilka/accessories/bordura-fronton-sub-tigla.jpg" },
  "sort strasina": { alt: "Bordură streașină Bilka", src: "/products/bilka/accessories/bordura-streasina.jpg" },
  "sort interior": { alt: "Bordură la perete Bilka", src: "/products/bilka/accessories/bordura-perete.jpg" },
  "parazapada 2 ml": { alt: "Opritor zăpadă Bilka", src: "/products/bilka/accessories/opritor-zapada.jpg" },
  calcan: { alt: "Bordură la perete Bilka", src: "/products/bilka/accessories/bordura-perete.jpg" },
  "coama 2ml": { alt: "Coamă Bilka", src: "/products/bilka/accessories/roof-accessories.jpg" },
  "parazapada cupa": { alt: "Opritor zăpadă Omega Bilka", src: "/products/bilka/accessories/opritor-omega.jpg" },
  "suruburi autofiletante 4.8*35": { alt: "Holțșurub Bilka", src: "/products/bilka/accessories/holtsurub.jpg" },
  "folie anticondens 120 gr mp": { alt: "Folie anticondens Bilka", src: "/products/bilka/accessories/consumables.png" },
  "jgheab de scurgere 125": { alt: "Jgheab Bilka", src: "/products/bilka/accessories/jgheab.jpg" },
  "burlan de scurgere 090": { alt: "Burlan Bilka", src: "/products/bilka/accessories/burlan.jpg" },
  "carlig jgheab 125/210mm": { alt: "Cârlig jgheab Bilka", src: "/products/bilka/accessories/carlig-jgheab.jpg" },
  "colier burlan": { alt: "Colier burlan Bilka", src: "/products/bilka/accessories/colier-burlan.jpg" },
  "capac jgheab 125": { alt: "Capac jgheab Bilka", src: "/products/bilka/accessories/capac-jgheab.jpg" },
  "element imbinare jgheab 125": { alt: "Element îmbinare jgheab Bilka", src: "/products/bilka/accessories/element-imbinare-jgheab.jpg" },
  "racord jgheab/burlan 125/090": { alt: "Racord jgheab-burlan Bilka", src: "/products/bilka/accessories/racord-jgheab-burlan.jpg" },
  "ramificatie burlan 90 y": { alt: "Ramificație burlan Bilka", src: "/products/bilka/accessories/ramificatie-burlan.jpg" },
  "cot de 60 de grade 090": { alt: "Cot 60 grade Bilka", src: "/products/bilka/accessories/cot-60.jpg" },
  "coltar exterior 90 grade 125": { alt: "Colțar exterior Bilka", src: "/products/bilka/accessories/coltar-exterior.jpg" },
  "coltar interior 90 grade 125": { alt: "Colțar interior Bilka", src: "/products/bilka/accessories/coltar-interior.jpg" },
  prelungitor: { alt: "Prelungitor intermediar Bilka", src: "/products/bilka/accessories/prelungitor-intermediar.jpg" },
  "capac coama": { alt: "Capac coamă Bilka", src: "/products/bilka/accessories/capac-coama.jpg" },
  "captator dolie": { alt: "Colector fronton Bilka", src: "/products/bilka/accessories/colector-fronton.jpg" },
  silicon: { alt: "Silicon", src: "/products/bilka/accessories/silicon.jpg" },
  stacheti: { alt: "Stacheti", src: "/products/bilka/accessories/stacheti.jpg" },
  dibluri: { alt: "Dibluri", src: "/products/bilka/accessories/dibluri.jpg" },
  cuie: { alt: "Cuie", src: "/products/bilka/accessories/cuie.jpg" },
};

function toNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function money(value: number) {
  return value.toLocaleString("ro-RO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatLength(value: number) {
  return value.toLocaleString("ro-RO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function formatProductName(name: string) {
  const normalizedNames: Record<string, string> = {
    "tigla metalica nordic 0,5 mm": "Țiglă metalică Nordic 0,5 mm",
    "tabla plana": "Tablă plană",
    "dolie 2ml": "Dolie 2 ml",
    "fereastra mansarda": "Fereastră mansardă",
    "Laterala margine 2ml": "Laterală margine 2 ml",
    "laterala mare 21 cm": "Laterală mare 21 cm",
    "sort strasina": "Șorț streașină",
    "sort interior": "Șorț interior",
    "parazapada 2 ml": "Parazăpadă 2 ml",
    Calcan: "Calcan",
    "Fixare sub tabla": "Fixare sub tablă",
    "Coama 2ml": "Coamă 2 ml",
    "Parazapada cupa": "Parazăpadă cupă",
    "Suruburi autofiletante 4.8*35": "Șuruburi autofiletante 4,8 x 35",
    "Folie anticondens 120 gr mp": "Folie anticondens 120 g/mp",
    "Jgheab de scurgere 125": "Jgheab de scurgere 125",
    "Burlan de scurgere 090": "Burlan de scurgere 090",
    "Carlig jgheab 125/210mm": "Cârlig jgheab 125/210 mm",
    "colier burlan": "Colier burlan",
    "Capac jgheab 125": "Capac jgheab 125",
    "Element imbinare jgheab 125": "Element îmbinare jgheab 125",
    "Racord jgheab/burlan 125/090": "Racord jgheab/burlan 125/090",
    "Ramificatie burlan 90 y": "Ramificație burlan 90 Y",
    "Cot de 60 de grade 090": "Cot de 60 de grade 090",
    "Coltar exterior 90 grade 125": "Colțar exterior 90 grade 125",
    "Coltar interior 90 grade 125": "Colțar interior 90 grade 125",
    "lambriu  18 mm": "Lambriu 18 mm",
    silicon: "Silicon",
    PRELUNGITOR: "Prelungitor",
    "capac coama": "Capac coamă",
    "captator dolie": "Captator dolie",
    Stacheti: "Ștacheți",
    dibluri: "Dibluri",
    Cuie: "Cuie",
  };

  return normalizedNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeAccessoryLookup(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

const generalAccessoryNames = new Set(["tabla plana", "fereastra mansarda", "lambriu 18 mm", "stacheti"]);

function getAccessoryCategory(name: string): AccessoryProductCategory {
  const normalized = normalizeAccessoryLookup(name);

  if (generalAccessoryNames.has(normalized)) {
    return "Accesorii generale";
  }

  if (
    normalized.includes("jgheab") ||
    normalized.includes("burlan") ||
    normalized.includes("carlig") ||
    normalized.includes("colier") ||
    normalized.includes("racord") ||
    normalized.includes("ramificatie") ||
    normalized.includes("cot") ||
    normalized.includes("coltar") ||
    normalized.includes("prelungitor")
  ) {
    return "Sistem pluvial";
  }

  if (
    normalized.includes("surub") ||
    normalized.includes("folie") ||
    normalized.includes("silicon") ||
    normalized.includes("dibluri") ||
    normalized.includes("cuie")
  ) {
    return "Consumabile";
  }

  return "Accesorii acoperiș";
}

function getAccessoryImage(name: string) {
  const normalized = normalizeAccessoryLookup(name);

  return accessoryImagesByName[normalized] ?? null;
}

const dialogFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(dialogFocusableSelector)).filter((element) => {
    const isDisabled = element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true";

    return !isDisabled && element.tabIndex !== -1;
  });
}

function getDialogBackgroundElements(dialog: HTMLElement, inertRoot: HTMLElement | null) {
  const backgroundElements = new Set<HTMLElement>();

  if (inertRoot && !inertRoot.contains(dialog)) {
    backgroundElements.add(inertRoot);
  }

  let currentElement = dialog.parentElement;

  while (currentElement?.parentElement && currentElement.parentElement !== document.body) {
    for (const sibling of Array.from(currentElement.parentElement.children)) {
      if (sibling instanceof HTMLElement && sibling !== currentElement && !sibling.contains(dialog)) {
        backgroundElements.add(sibling);
      }
    }

    currentElement = currentElement.parentElement;
  }

  return Array.from(backgroundElements);
}

function useDialogBehavior(
  open: boolean,
  dialogRef: React.RefObject<HTMLDivElement | null>,
  closeDialog: () => void,
  inertRootRef: React.RefObject<HTMLElement | null>,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeDialogRef = useRef(closeDialog);

  useEffect(() => {
    closeDialogRef.current = closeDialog;
  }, [closeDialog]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    const inertRoot = inertRootRef.current;

    if (!dialog) {
      return;
    }

    const dialogElement = dialog;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const hiddenElementStates = getDialogBackgroundElements(dialogElement, inertRoot).map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: (element as HTMLElement & { inert: boolean }).inert,
    }));

    for (const { element } of hiddenElementStates) {
      element.setAttribute("aria-hidden", "true");
      (element as HTMLElement & { inert: boolean }).inert = true;
    }

    const focusTarget = getFocusableElements(dialogElement)[0] ?? dialogElement;
    focusTarget.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialogRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(dialogElement);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialogElement.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      for (const { ariaHidden, element, inert } of hiddenElementStates) {
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }

        (element as HTMLElement & { inert: boolean }).inert = inert;
      }

      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, [dialogRef, inertRootRef, open]);
}

export function EstimateCalculator() {
  const [request, setRequest] = useState<QuoteRequest>(() => createEmptyQuoteRequest());
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedSummary | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [accessoryQuery, setAccessoryQuery] = useState("");
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<(typeof accessoryCategories)[number]>("Toate");
  const [accessoryEditorOpen, setAccessoryEditorOpen] = useState(false);
  const [productCatalog] = useState(() => getStoredProductCatalog());
  const firstSheetInputRef = useRef<HTMLInputElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const calculatorFormRef = useRef<HTMLFormElement | null>(null);
  const accessoryDialogRef = useRef<HTMLDivElement | null>(null);
  const successDialogRef = useRef<HTMLDivElement | null>(null);
  const totals = useMemo(() => calculateQuoteTotals(request, productCatalog), [productCatalog, request]);
  const selectedSeries = sheetSeries[request.seriesKey];
  const selectedAccessoryRows = totals.systemRows.filter((row) => row.quantity > 0);
  const selectedProductCount = activeCount(request.sheetQuantities || {}) + activeCount(request.accessoryQuantities || {});
  const selectedProductLabel = `${selectedProductCount} ${selectedProductCount === 1 ? "produs selectat" : "produse selectate"}`;
  const filteredAccessoryRows = totals.systemRows.filter((row) => {
    const category = getAccessoryCategory(row.name);
    const matchesCategory = activeAccessoryCategory === "Toate" || category === activeAccessoryCategory;
    const matchesQuery = row.name.toLowerCase().includes(accessoryQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  useEffect(() => {
    if (!accessoryEditorOpen && !submittedSummary) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [accessoryEditorOpen, submittedSummary]);

  useEffect(() => {
    if (accessoryEditorOpen && selectedAccessoryRows.length === 0) {
      setAccessoryEditorOpen(false);
    }
  }, [accessoryEditorOpen, selectedAccessoryRows.length]);

  useDialogBehavior(
    accessoryEditorOpen && selectedAccessoryRows.length > 0,
    accessoryDialogRef,
    () => setAccessoryEditorOpen(false),
    calculatorFormRef,
  );
  useDialogBehavior(Boolean(submittedSummary), successDialogRef, () => setSubmittedSummary(null), calculatorFormRef);

  function updateSheetQuantity(length: number, quantity: number) {
    setRequest((current) => ({
      ...current,
      sheetQuantities: { ...current.sheetQuantities, [String(length)]: quantity },
    }));
  }

  function updateAccessoryQuantity(id: string, quantity: number) {
    if (quantity <= 0 && selectedAccessoryRows.length === 1 && selectedAccessoryRows[0].id === id) {
      setAccessoryEditorOpen(false);
    }

    setRequest((current) => ({
      ...current,
      accessoryQuantities: { ...current.accessoryQuantities, [id]: quantity },
    }));
  }

  function updateCustomer<Key extends keyof QuoteRequest["customer"]>(key: Key, value: QuoteRequest["customer"][Key]) {
    setRequest((current) => ({
      ...current,
      customer: { ...current.customer, [key]: value },
    }));
  }

  function submitRequest() {
    if (selectedProductCount === 0) {
      setFormError("Alege cel puțin un produs sau completează o cantitate înainte de trimitere.");
      firstSheetInputRef.current?.focus();
      return;
    }

    const finalRequest = {
      ...request,
      createdAt: new Date().toISOString(),
      id: generateQuoteRequestId(),
      status: "Noua" as const,
    };
    const existing = getStoredQuoteRequests();
    const saveResult = saveStoredQuoteRequests([finalRequest, ...existing]);

    if (!saveResult.ok) {
      setFormError(saveResult.error);
      return;
    }

    setSubmittedSummary({
      id: finalRequest.id,
      items: [
        ...totals.sheetRows
          .filter((row) => row.quantity > 0)
          .map((row) => ({
            label: `Foaie de țiglă ${formatLength(row.length)} m`,
            quantity: row.quantity,
            unit: "buc",
            value: row.value,
          })),
        ...selectedAccessoryRows.map((row) => ({
          label: formatProductName(row.name),
          quantity: row.quantity,
          unit: row.unit,
          value: row.value,
        })),
      ],
      totalValue: totals.tileValue + totals.systemValue,
    });
    setFormError(null);
    setRequest(createEmptyQuoteRequest());
  }

  return (
    <section className="scroll-mt-24 bg-white px-5 pb-28 pt-10 md:px-14 xl:pb-10" id="calculator">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary">Cerere ofertă</p>
          <h2 className="text-balance text-3xl font-bold tracking-normal md:text-5xl">Configurează necesarul</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Completează cantitățile cunoscute, iar distribuitorul verifică disponibilitatea, transportul și prețul final.
          </p>
        </div>
      </div>

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
        ref={calculatorFormRef}
        onSubmit={(event) => {
          event.preventDefault();
          submitRequest();
        }}
      >
        <div className="grid gap-6">
          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                <Home className="size-4" />
              </span>
              <div>
                <h3 className="text-lg font-bold">1. Alege profilul de țiglă</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Formula de calcul se schimbă automat în funcție de profilul ales.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(sheetSeries).map(([key, series]) => {
                const selected = request.seriesKey === key;

                return (
                  <article
                    className={`flex min-h-44 flex-col rounded-lg border p-3 transition-all ${
                      selected ? "border-primary bg-teal-50 shadow-[inset_0_0_0_1px_hsl(var(--primary))]" : "bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    key={key}
                  >
                    <button
                      className="grid w-full flex-1 gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[7.75rem_minmax(0,1fr)]"
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setRequest((current) => ({
                          ...current,
                          seriesKey: key as SeriesKey,
                          sheetQuantities: {},
                        }))
                      }
                    >
                      <span className="relative block h-28 overflow-hidden sm:h-full sm:min-h-32">
                        <Image alt={series.imageAlt} className="object-contain" fill sizes="(min-width: 1280px) 124px, (min-width: 768px) 124px, 90vw" src={series.imageSrc} />
                      </span>
                      <span className="flex min-w-0 flex-col py-1">
                        <span className="flex items-start justify-between gap-3">
                          <strong className="text-lg">{series.name}</strong>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-slate-50 text-primary"}`}>
                            {series.usableWidth} m
                          </span>
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-muted-foreground">{series.description}</span>
                      </span>
                    </button>
                    <a
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:text-primary/80 hover:underline sm:ml-[8.5rem]"
                      href={series.bilkaUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Vezi detalii pe Bilka
                      <ExternalLink className="size-3.5" />
                    </a>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                  <FileSpreadsheet className="size-4" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">2. Completează foile</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Lățime utilă: {selectedSeries.usableWidth} m. Introdu numărul de bucăți pentru fiecare lungime necesară.
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-teal-900">{totals.tileArea.toFixed(2)} mp</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {totals.sheetRows.map((row) => (
                <label className="rounded-lg border bg-slate-50 p-3 text-sm font-semibold text-muted-foreground" key={row.length}>
                  <span className="flex items-center justify-between gap-3">
                    <span>Foaie de țiglă {formatLength(row.length)} m</span>
                    <span className={row.quantity > 0 ? "rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" : "text-xs text-foreground"}>
                      {row.quantity > 0 ? `${row.quantity} buc` : `${row.area.toFixed(2)} mp`}
                    </span>
                  </span>
                  <input
                    className="mt-2 min-h-10 w-full rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    inputMode="numeric"
                    min={0}
                    name={`foaie-${row.length}`}
                    ref={row.length === selectedSeries.lengths[0] ? firstSheetInputRef : undefined}
                    step={1}
                    type="number"
                    value={request.sheetQuantities[String(row.length)] || ""}
                    onChange={(event) => updateSheetQuantity(row.length, toNumber(event.target.value))}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-5">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                  <PackageCheck className="size-4" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">3. Adaugă accesoriile</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Caută produsul sau filtrează lista pe categorie.</p>
                </div>
              </div>
              <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring lg:w-80">
                <Search className="size-4" />
                <input
                  autoComplete="off"
                  className="w-full bg-transparent outline-none"
                  name="search-accessories"
                  placeholder="Caută produs..."
                  value={accessoryQuery}
                  onChange={(event) => setAccessoryQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {accessoryCategories.map((category) => (
                <button
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeAccessoryCategory === category ? "border-primary bg-teal-50 text-primary" : "bg-white text-muted-foreground hover:bg-slate-50"
                  }`}
                  key={category}
                  type="button"
                  onClick={() => setActiveAccessoryCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {filteredAccessoryRows.length > 0 ? (
              <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredAccessoryRows.map((row) => {
                  const category = getAccessoryCategory(row.name);
                  const accessoryImage = getAccessoryImage(row.name);

                  return (
                    <label className="rounded-lg border bg-white p-3 text-sm" key={row.name}>
                      <span className={`grid gap-3 ${accessoryImage ? "grid-cols-[5rem_minmax(0,1fr)]" : ""}`}>
                        {accessoryImage ? (
                          <span className="relative block h-20 overflow-hidden">
                            <Image alt={accessoryImage.alt} className="object-contain mix-blend-multiply" fill sizes="80px" src={accessoryImage.src} />
                          </span>
                        ) : null}
                        <span className="min-w-0">
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <strong className="block break-words text-foreground">{formatProductName(row.name)}</strong>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {category} - {money(row.priceWithVat)} lei / {row.unit}
                              </span>
                            </span>
                            <span className={row.quantity > 0 ? "shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground" : "shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-primary"}>
                              {row.quantity > 0 ? `${row.quantity} ${row.unit}` : row.unit}
                            </span>
                          </span>
                          <span className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode={row.unit === "mp" || row.unit === "ml" ? "decimal" : "numeric"}
                              min={0}
                              name={`accesoriu-${row.name}`}
                              step={row.unit === "mp" || row.unit === "ml" ? 0.1 : 1}
                              type="number"
                              value={request.accessoryQuantities[row.id] ?? request.accessoryQuantities[row.name] ?? ""}
                              onChange={(event) => updateAccessoryQuantity(row.id, toNumber(event.target.value))}
                            />
                            <strong className="justify-self-end whitespace-nowrap text-right">{money(row.value)} lei</strong>
                          </span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-slate-50 p-5 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-primary">
                    <Search className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-base text-foreground">Nu am găsit produsul.</strong>
                    <p className="mt-1 leading-6">Verifică denumirea sau contactează distribuitorul pentru confirmare.</p>
                    <button
                      className="mt-3 min-h-9 rounded-md border bg-white px-3 text-sm font-semibold text-primary transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      type="button"
                      onClick={() => {
                        setAccessoryQuery("");
                        setActiveAccessoryCategory("Toate");
                      }}
                    >
                      Arată toate accesoriile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                <ClipboardList className="size-4" />
              </span>
              <div>
                <h3 className="text-lg font-bold">4. Date pentru răspuns</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Te contactăm pentru disponibilitate, transport și oferta finală.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField autoComplete="name" label="Nume client" name="customer-name" value={request.customer.name} onChange={(value) => updateCustomer("name", value)} />
              <TextField autoComplete="tel" inputMode="tel" label="Telefon" name="customer-phone" type="tel" value={request.customer.phone} onChange={(value) => updateCustomer("phone", value)} />
              <TextField autoComplete="email" label="Email" name="customer-email" required={false} spellCheck={false} type="email" value={request.customer.email} onChange={(value) => updateCustomer("email", value)} />
              <TextField autoComplete="street-address" label="Adresa lucrării" name="customer-address" value={request.customer.address} onChange={(value) => updateCustomer("address", value)} />
            </div>

            <label className="mt-3 flex min-h-10 items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
              <input
                checked={request.customer.wantsInstallation}
                className="size-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="wants-installation"
                type="checkbox"
                onChange={(event) => updateCustomer("wantsInstallation", event.target.checked)}
              />
              Vreau ofertă și pentru montaj
            </label>

            <label className="mt-3 grid gap-1.5 text-sm font-semibold text-muted-foreground">
              Observații
              <textarea
                className="min-h-20 resize-y rounded-md border bg-white px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="notes"
                placeholder="Ex.: culoare dorită, detalii despre acoperiș, termen estimat..."
                value={request.customer.notes}
                onChange={(event) => updateCustomer("notes", event.target.value)}
              />
            </label>

            {formError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">
                {formError}
              </div>
            ) : null}

          </section>
        </div>

        <aside className="rounded-lg border bg-card p-5 shadow-soft xl:sticky xl:top-24 xl:self-start" ref={summaryRef} aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
              <ShoppingCart className="size-5" />
            </span>
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-primary">Cerere curentă</p>
              <h3 className="text-xl font-bold">Rezumat materiale</h3>
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                Actualizat automat
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <SummaryMetric icon={<PackageCheck className="size-4" />} label="Produse selectate" value={`${selectedProductCount}`} />
            <SummaryMetric icon={<FileSpreadsheet className="size-4" />} label="Țiglă selectată" value={`${totals.tileArea.toFixed(2)} mp`} />
            <SummaryMetric icon={<ShoppingCart className="size-4" />} label="Accesorii" value={`${selectedAccessoryRows.length}`} />
            <SummaryMetric icon={<CheckCircle2 className="size-4" />} label="Montaj" value={request.customer.wantsInstallation ? "Da" : "Nu"} />
          </div>

          {selectedAccessoryRows.length > 0 ? (
            <div className="mt-5 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex min-h-9 min-w-0 items-center gap-2 rounded-md text-left text-sm font-bold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={() => setAccessoryEditorOpen(true)}
                >
                  Accesorii adăugate
                  <Pencil className="size-3.5 shrink-0" />
                </button>
                <button
                  className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  type="button"
                  onClick={() => setAccessoryEditorOpen(true)}
                >
                  {selectedAccessoryRows.length} {selectedAccessoryRows.length === 1 ? "produs" : "produse"}
                </button>
              </div>
              <ol className="mt-3 grid max-h-72 gap-2 overflow-auto text-sm">
                {selectedAccessoryRows.map((row, index) => (
                  <li key={row.name}>
                    <button
                      className="grid w-full grid-cols-[1.5rem_1fr_auto] gap-2 rounded-md border bg-white p-3 text-left transition-colors hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      type="button"
                      onClick={() => setAccessoryEditorOpen(true)}
                    >
                      <span className="font-bold text-muted-foreground">{index + 1}.</span>
                      <span className="min-w-0">
                        <strong className="block break-words text-foreground">{formatProductName(row.name)}</strong>
                        <span className="text-muted-foreground">
                          {row.quantity} {row.unit} x {money(row.priceWithVat)} lei
                        </span>
                      </span>
                      <strong className="shrink-0 text-right">{money(row.value)} lei</strong>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-teal-950">
              <span>Total materiale</span>
              <span>{selectedProductLabel}</span>
            </div>
            <strong className="mt-2 block text-3xl leading-none text-teal-950">{money(totals.tileValue + totals.systemValue)} lei</strong>
            <span className="mt-2 block text-xs font-semibold text-teal-900/75">Estimare fără transport și confirmarea disponibilității.</span>
          </div>

          <p className="mt-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
            Distribuitorul confirmă disponibilitatea, transportul și prețul final.
          </p>

          <div className="sticky bottom-0 -mx-5 mt-5 border-t bg-card/95 px-5 pb-1 pt-4 backdrop-blur xl:static xl:mx-0 xl:border-t-0 xl:bg-transparent xl:p-0 xl:pt-5">
            <Button className="w-full" type="submit">
              Trimite cererea
            </Button>
          </div>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-4 py-3 shadow-soft backdrop-blur xl:hidden">
          <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-muted-foreground">Total materiale</span>
              <strong className="block truncate text-base leading-tight text-teal-950">{money(totals.tileValue + totals.systemValue)} lei</strong>
            </span>
            <button
              className="min-h-10 rounded-md border bg-white px-3 text-sm font-semibold text-primary transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
              onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Vezi rezumat
            </button>
            <Button className="min-h-10 px-3" type="submit">
              Trimite
            </Button>
          </div>
        </div>
      </form>

      {accessoryEditorOpen && selectedAccessoryRows.length > 0 ? (
        <div className="fixed inset-0 z-50 grid items-end bg-slate-950/70 px-0 pt-8 backdrop-blur-sm sm:items-center sm:px-5">
          <button className="absolute inset-0 cursor-default" type="button" tabIndex={-1} aria-label="Închide editorul de accesorii" onClick={() => setAccessoryEditorOpen(false)} />
          <div
            className="relative mx-auto flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border bg-white shadow-soft sm:max-h-[82vh] sm:rounded-lg"
            ref={accessoryDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessory-editor-title"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-primary">Accesorii selectate</p>
                <h3 className="text-xl font-bold tracking-normal text-foreground" id="accessory-editor-title">
                  Ajustează cantitățile
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedAccessoryRows.length} produse în cererea curentă</p>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-md border bg-white text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                aria-label="Închide"
                onClick={() => setAccessoryEditorOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-3 overflow-y-auto px-4 py-4 sm:px-5">
              {selectedAccessoryRows.map((row) => {
                const accessoryImage = getAccessoryImage(row.name);
                const step = row.unit === "mp" || row.unit === "ml" ? 0.1 : 1;

                return (
                  <div className={`grid gap-3 rounded-lg border bg-white p-3 ${accessoryImage ? "sm:grid-cols-[5rem_minmax(0,1fr)]" : ""}`} key={row.id}>
                    {accessoryImage ? (
                      <span className="relative block h-20 overflow-hidden">
                        <Image alt={accessoryImage.alt} className="object-contain mix-blend-multiply" fill sizes="80px" src={accessoryImage.src} />
                      </span>
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <strong className="block break-words text-sm text-foreground">{formatProductName(row.name)}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {money(row.priceWithVat)} lei / {row.unit}
                          </span>
                        </span>
                        <strong className="shrink-0 text-right text-sm">{money(row.value)} lei</strong>
                      </div>
                      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <button
                          className="grid size-10 place-items-center rounded-md border bg-white text-primary transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          type="button"
                          aria-label={`Scade cantitatea pentru ${formatProductName(row.name)}`}
                          onClick={() => updateAccessoryQuantity(row.id, Math.max(0, Number((row.quantity - step).toFixed(2))))}
                        >
                          <Minus className="size-4" />
                        </button>
                        <input
                          className="min-h-10 min-w-0 rounded-md border bg-white px-3 text-center font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          inputMode={row.unit === "mp" || row.unit === "ml" ? "decimal" : "numeric"}
                          min={0}
                          name={`editor-accesoriu-${row.name}`}
                          step={step}
                          type="number"
                          value={request.accessoryQuantities[row.id] ?? request.accessoryQuantities[row.name] ?? ""}
                          onChange={(event) => updateAccessoryQuantity(row.id, toNumber(event.target.value))}
                        />
                        <button
                          className="grid size-10 place-items-center rounded-md border bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          type="button"
                          aria-label={`Crește cantitatea pentru ${formatProductName(row.name)}`}
                          onClick={() => updateAccessoryQuantity(row.id, Number((row.quantity + step).toFixed(2)))}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        className="mt-2 text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        type="button"
                        onClick={() => updateAccessoryQuantity(row.id, 0)}
                      >
                        Elimină din cerere
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-teal-950">
                <span>Total accesorii</span>
                <strong>{money(totals.systemValue)} lei</strong>
              </div>
              <Button className="mt-3 w-full" type="button" onClick={() => setAccessoryEditorOpen(false)}>
                Gata
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {submittedSummary ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-5 py-8 backdrop-blur-sm">
          <div
            className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg border bg-white p-3 text-center shadow-soft md:p-4"
            ref={successDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-success-title"
            tabIndex={-1}
          >
            <span className="mx-auto grid size-9 place-items-center rounded-full bg-teal-50 text-primary">
              <CheckCircle2 className="size-4" />
            </span>
            <h3 className="mt-2 text-xl font-bold tracking-normal text-foreground md:text-2xl" id="quote-success-title">
              Cererea dvs. a fost trimisă
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Revenim în cel mai scurt timp cu oferta.</p>
            <div className="mt-2 grid min-h-0 gap-1.5 rounded-lg border bg-slate-50 p-2 text-left text-xs">
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Număr cerere</span>
                <strong className="text-primary">{submittedSummary.id}</strong>
              </span>
              <div className="min-h-0 overflow-auto border-t pt-1.5">
                <strong className="mb-1 block uppercase text-muted-foreground">Include</strong>
                <ol className="grid gap-1">
                  {submittedSummary.items.map((item) => (
                    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded bg-white px-2 py-1" key={`${item.label}-${item.unit}`}>
                      <span className="min-w-0 truncate text-foreground">
                        <strong>
                          {item.quantity} {item.unit}
                        </strong>{" "}
                        {item.label}
                      </span>
                      <strong className="whitespace-nowrap text-right">{money(item.value)} lei</strong>
                    </li>
                  ))}
                </ol>
              </div>
              <span className="flex items-center justify-between gap-3 border-t pt-1.5 text-sm">
                <span className="font-semibold text-foreground">Total estimat</span>
                <strong className="text-teal-950">{money(submittedSummary.totalValue)} lei</strong>
              </span>
            </div>
            <Button className="mt-3 min-h-10 min-w-36" type="button" onClick={() => setSubmittedSummary(null)}>
              Închide
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function activeCount(values: Record<string, number>) {
  return Object.values(values).filter((value) => value > 0).length;
}

function TextField({
  autoComplete,
  inputMode,
  label,
  name,
  onChange,
  required = true,
  spellCheck,
  type = "text",
  value,
}: {
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  name: string;
  onChange: (value: string) => void;
  required?: boolean;
  spellCheck?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-10 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        autoComplete={autoComplete}
        inputMode={inputMode}
        name={name}
        required={required}
        spellCheck={spellCheck}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SummaryMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-white p-3">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="shrink-0 text-primary">{icon}</span>
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <strong className="shrink-0">{value}</strong>
    </div>
  );
}
