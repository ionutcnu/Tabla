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

const accessoryCategories = ["Toate", "Accesorii acoperiÈ™", "Sistem pluvial", "Consumabile"] as const;

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
    "tigla metalica nordic 0,5 mm": "ÈšiglÄƒ metalicÄƒ Nordic 0,5 mm",
    "tabla plana": "TablÄƒ planÄƒ",
    "dolie 2ml": "Dolie 2 ml",
    "fereastra mansarda": "FereastrÄƒ mansardÄƒ",
    "Laterala margine 2ml": "LateralÄƒ margine 2 ml",
    "laterala mare 21 cm": "LateralÄƒ mare 21 cm",
    "sort strasina": "È˜orÈ› streaÈ™inÄƒ",
    "sort interior": "È˜orÈ› interior",
    "parazapada 2 ml": "ParazÄƒpadÄƒ 2 ml",
    Calcan: "Calcan",
    "Fixare sub tabla": "Fixare sub tablÄƒ",
    "Coama 2ml": "CoamÄƒ 2 ml",
    "Parazapada cupa": "ParazÄƒpadÄƒ cupÄƒ",
    "Suruburi autofiletante 4.8*35": "È˜uruburi autofiletante 4,8 x 35",
    "Folie anticondens 120 gr mp": "Folie anticondens 120 g/mp",
    "Jgheab de scurgere 125": "Jgheab de scurgere 125",
    "Burlan de scurgere 090": "Burlan de scurgere 090",
    "Carlig jgheab 125/210mm": "CÃ¢rlig jgheab 125/210 mm",
    "colier burlan": "Colier burlan",
    "Capac jgheab 125": "Capac jgheab 125",
    "Element imbinare jgheab 125": "Element Ã®mbinare jgheab 125",
    "Racord jgheab/burlan 125/090": "Racord jgheab/burlan 125/090",
    "Ramificatie burlan 90 y": "RamificaÈ›ie burlan 90 Y",
    "Cot de 60 de grade 090": "Cot de 60 de grade 090",
    "Coltar exterior 90 grade 125": "ColÈ›ar exterior 90 grade 125",
    "Coltar interior 90 grade 125": "ColÈ›ar interior 90 grade 125",
    "lambriu  18 mm": "Lambriu 18 mm",
    silicon: "Silicon",
    PRELUNGITOR: "Prelungitor",
    "capac coama": "Capac coamÄƒ",
    "captator dolie": "Captator dolie",
    Stacheti: "È˜tacheÈ›i",
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

  return "Accesorii acoperiÈ™";
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
      setFormError("Alege cel puÈ›in un produs sau completeazÄƒ o cantitate Ã®nainte de trimitere.");
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
    <section className="bg-white px-5 py-14 md:px-14" id="calculator">
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase text-primary">Cerere ofertÄƒ</p>
        <h2 className="text-balance text-3xl font-bold tracking-normal md:text-5xl">ConfigureazÄƒ necesarul pentru acoperiÈ™</h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Alege profilul de È›iglÄƒ, completeazÄƒ foile È™i adaugÄƒ accesoriile. Cererea ajunge la distribuitor pentru verificare È™i confirmare.
        </p>
      </div>

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
        onSubmit={(event) => {
          event.preventDefault();
          submitRequest();
        }}
      >
        <div className="grid gap-6">
          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                <Home className="size-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold">1. Alege profilul de È›iglÄƒ</h3>
                <p className="mt-1 text-sm text-muted-foreground">Formula de calcul se schimbÄƒ automat Ã®n funcÈ›ie de profilul ales.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(sheetSeries).map(([key, series]) => {
                const selected = request.seriesKey === key;

                return (
                  <button
                    className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selected ? "border-primary bg-teal-50" : "bg-white hover:bg-slate-50"
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
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary">{series.usableWidth} m</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{series.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-bold">2. CompleteazÄƒ foile</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    LÄƒÈ›ime utilÄƒ: {selectedSeries.usableWidth} m. Introdu numÄƒrul de bucÄƒÈ›i pentru fiecare lungime necesarÄƒ.
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-teal-900">{totals.tileArea.toFixed(2)} mp</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {totals.sheetRows.map((row) => (
                <label className="rounded-lg border bg-slate-50 p-3 text-sm font-semibold text-muted-foreground" key={row.length}>
                  <span className="flex items-center justify-between gap-3">
                    <span>Foaie de È›iglÄƒ {formatLength(row.length)} m</span>
                    <span className="text-xs text-foreground">{row.area.toFixed(2)} mp</span>
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

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                  <PackageCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-bold">3. AdaugÄƒ accesoriile</h3>
                  <p className="mt-1 text-sm text-muted-foreground">CautÄƒ produsul sau filtreazÄƒ lista pe categorie.</p>
                </div>
              </div>
              <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring lg:w-80">
                <Search className="size-4" />
                <input
                  autoComplete="off"
                  className="w-full bg-transparent outline-none"
                  name="search-accessories"
                  placeholder="CautÄƒ produs..."
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

            <div className="grid gap-3 md:grid-cols-2">
              {filteredAccessoryRows.map((row) => (
                <label className="rounded-lg border bg-white p-4 text-sm" key={row.name}>
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <strong className="block break-words text-foreground">{formatProductName(row.name)}</strong>
                      <span className="mt-1 block text-muted-foreground">
                        {getAccessoryCategory(row.name)} - {money(row.priceWithVat)} lei / {row.unit}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-primary">{row.unit}</span>
                  </span>
                  <span className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
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

          <section className="rounded-lg border bg-card p-4 shadow-soft md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-primary">
                <ClipboardList className="size-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold">4. Date pentru rÄƒspuns</h3>
                <p className="mt-1 text-sm text-muted-foreground">Te contactÄƒm pentru disponibilitate, transport È™i oferta finalÄƒ.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField autoComplete="name" label="Nume client" name="customer-name" value={request.customer.name} onChange={(value) => updateCustomer("name", value)} />
              <TextField autoComplete="tel" inputMode="tel" label="Telefon" name="customer-phone" type="tel" value={request.customer.phone} onChange={(value) => updateCustomer("phone", value)} />
              <TextField autoComplete="email" label="Email" name="customer-email" required={false} spellCheck={false} type="email" value={request.customer.email} onChange={(value) => updateCustomer("email", value)} />
              <TextField autoComplete="street-address" label="Adresa lucrÄƒrii" name="customer-address" value={request.customer.address} onChange={(value) => updateCustomer("address", value)} />
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-lg border bg-slate-50 p-4 text-sm font-semibold text-foreground">
              <input
                checked={request.customer.wantsInstallation}
                className="size-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="wants-installation"
                type="checkbox"
                onChange={(event) => updateCustomer("wantsInstallation", event.target.checked)}
              />
              Vreau ofertÄƒ È™i pentru montaj
            </label>

            <label className="mt-4 grid gap-2 text-sm font-semibold text-muted-foreground">
              ObservaÈ›ii
              <textarea
                className="min-h-24 resize-y rounded-md border bg-white px-3 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="notes"
                placeholder="Ex.: culoare doritÄƒ, detalii despre acoperiÈ™, termen estimat..."
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
              <p className="mb-1 text-xs font-bold uppercase text-primary">Cerere curentÄƒ</p>
              <h3 className="text-xl font-bold">Rezumat materiale</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <SummaryMetric icon={<FileSpreadsheet className="size-4" />} label="ÈšiglÄƒ selectatÄƒ" value={`${totals.tileArea.toFixed(2)} mp`} />
            <SummaryMetric icon={<CheckCircle2 className="size-4" />} label="Montaj" value={request.customer.wantsInstallation ? "Da" : "Nu"} />
          </div>

          {selectedAccessoryRows.length > 0 ? (
            <div className="mt-5 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">Accesorii adÄƒugate</strong>
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
            <span className="block text-sm font-semibold text-teal-950">Total estimativ pentru materiale</span>
            <strong className="mt-1 block text-2xl text-teal-950">{money(totals.tileValue + totals.systemValue)} lei</strong>
          </div>

          <p className="mt-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
            Distribuitorul confirmÄƒ disponibilitatea, transportul È™i preÈ›ul final.
          </p>

          <Button className="mt-5 w-full" type="submit">
            Trimite cererea
          </Button>
        </aside>
      </form>

      {submittedId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-5 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quote-success-title">
          <div className="w-full max-w-xl rounded-lg border bg-white p-6 text-center shadow-soft md:p-8">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal-50 text-primary">
              <CheckCircle2 className="size-7" />
            </span>
            <h3 className="mt-5 text-2xl font-bold tracking-normal text-foreground md:text-3xl" id="quote-success-title">
              Cererea dvs. a fost trimisÄƒ
            </h3>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Revenim Ã®n cel mai scurt timp cu oferta.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">NumÄƒr cerere: {submittedId}</p>
            <Button className="mt-6 min-w-36" type="button" onClick={() => setSubmittedId(null)}>
              ÃŽnchide
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
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
