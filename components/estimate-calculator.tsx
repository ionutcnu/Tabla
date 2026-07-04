"use client";

import { CheckCircle2, ClipboardList, FileSpreadsheet, Home, PackageCheck, Search, ShoppingCart } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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

const accessoryCategories = ["Toate", "Accesorii acoperiș", "Sistem pluvial", "Consumabile"] as const;

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

function getAccessoryCategory(name: string) {
  const normalized = name.toLowerCase();

  if (
    normalized.includes("jgheab") ||
    normalized.includes("burlan") ||
    normalized.includes("carlig") ||
    normalized.includes("colier") ||
    normalized.includes("racord") ||
    normalized.includes("ramificatie") ||
    normalized.includes("cot") ||
    normalized.includes("coltar")
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

export function EstimateCalculator() {
  const [request, setRequest] = useState<QuoteRequest>(() => createEmptyQuoteRequest());
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [accessoryQuery, setAccessoryQuery] = useState("");
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<(typeof accessoryCategories)[number]>("Toate");
  const [productCatalog] = useState(() => getStoredProductCatalog());
  const firstSheetInputRef = useRef<HTMLInputElement | null>(null);
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

  function updateSheetQuantity(length: number, quantity: number) {
    setRequest((current) => ({
      ...current,
      sheetQuantities: { ...current.sheetQuantities, [String(length)]: quantity },
    }));
  }

  function updateAccessoryQuantity(id: string, quantity: number) {
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

    setSubmittedId(finalRequest.id);
    setFormError(null);
    setRequest(createEmptyQuoteRequest());
  }

  return (
    <section className="scroll-mt-24 bg-white px-5 py-10 md:px-14" id="calculator">
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
                  <button
                    className={`rounded-lg border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selected ? "border-primary bg-teal-50 shadow-[inset_0_0_0_1px_hsl(var(--primary))]" : "bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    key={key}
                    type="button"
                    onClick={() =>
                      setRequest((current) => ({
                        ...current,
                        seriesKey: key as SeriesKey,
                        sheetQuantities: {},
                      }))
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-lg">{series.name}</strong>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-slate-50 text-primary"}`}>
                        {series.usableWidth} m
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{series.description}</p>
                  </button>
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

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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

            <div className="grid gap-2 md:grid-cols-2">
              {filteredAccessoryRows.map((row) => (
                <label className="rounded-lg border bg-white p-3 text-sm" key={row.name}>
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <strong className="block break-words text-foreground">{formatProductName(row.name)}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {getAccessoryCategory(row.name)} - {money(row.priceWithVat)} lei / {row.unit}
                      </span>
                    </span>
                    <span className={row.quantity > 0 ? "shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground" : "shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-primary"}>
                      {row.quantity > 0 ? `${row.quantity} ${row.unit}` : row.unit}
                    </span>
                  </span>
                  <span className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
                    <input
                      className="min-h-10 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      inputMode={row.unit === "mp" || row.unit === "ml" ? "decimal" : "numeric"}
                      min={0}
                      name={`accesoriu-${row.name}`}
                      step={row.unit === "mp" || row.unit === "ml" ? 0.1 : 1}
                      type="number"
                      value={request.accessoryQuantities[row.id] ?? request.accessoryQuantities[row.name] ?? ""}
                      onChange={(event) => updateAccessoryQuantity(row.id, toNumber(event.target.value))}
                    />
                    <strong className="text-right">{money(row.value)} lei</strong>
                  </span>
                </label>
              ))}
            </div>
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

        <aside className="rounded-lg border bg-card p-5 shadow-soft xl:sticky xl:top-24 xl:self-start" aria-live="polite">
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
                <strong className="text-sm">Accesorii adăugate</strong>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary">
                  {selectedAccessoryRows.length} {selectedAccessoryRows.length === 1 ? "produs" : "produse"}
                </span>
              </div>
              <ol className="mt-3 grid max-h-72 gap-2 overflow-auto text-sm">
                {selectedAccessoryRows.map((row, index) => (
                  <li className="grid grid-cols-[1.5rem_1fr_auto] gap-2 rounded-md border bg-white p-3" key={row.name}>
                    <span className="font-bold text-muted-foreground">{index + 1}.</span>
                    <span className="min-w-0">
                      <strong className="block break-words text-foreground">{formatProductName(row.name)}</strong>
                      <span className="text-muted-foreground">
                        {row.quantity} {row.unit} x {money(row.priceWithVat)} lei
                      </span>
                    </span>
                    <strong className="shrink-0 text-right">{money(row.value)} lei</strong>
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
      </form>

      {submittedId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-5 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quote-success-title">
          <div className="w-full max-w-xl rounded-lg border bg-white p-6 text-center shadow-soft md:p-8">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal-50 text-primary">
              <CheckCircle2 className="size-7" />
            </span>
            <h3 className="mt-5 text-2xl font-bold tracking-normal text-foreground md:text-3xl" id="quote-success-title">
              Cererea dvs. a fost trimisă
            </h3>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Revenim în cel mai scurt timp cu oferta.</p>
            <p className="mt-4 text-sm font-semibold text-primary">Număr cerere: {submittedId}</p>
            <Button className="mt-6 min-w-36" type="button" onClick={() => setSubmittedId(null)}>
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
