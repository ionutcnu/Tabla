"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  ListChecks,
  Mail,
  PackagePlus,
  Phone,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { company, sheetSeries } from "@/lib/offer-data";
import {
  calculateQuoteTotals,
  createEmptyQuoteRequest,
  defaultProductCatalog,
  getStoredProductCatalog,
  getStoredQuoteRequests,
  saveStoredProductCatalog,
  saveStoredQuoteRequests,
  type CatalogAccessory,
  type ProductCatalog,
  type QuoteRequest,
  type QuoteStatus,
  type QuoteTotals,
  type SeriesKey,
} from "@/lib/quote";

const statuses: QuoteStatus[] = ["Noua", "Contactat", "Ofertata", "Acceptata", "Respinsa"];
const adminSections = [
  { id: "offers", label: "Oferte primite", icon: ListChecks },
  { id: "excel", label: "Excel calcul", icon: FileSpreadsheet },
  { id: "products", label: "Produse si preturi", icon: PackagePlus },
] as const;

type AdminSection = (typeof adminSections)[number]["id"];

function money(value: number) {
  return value.toLocaleString("ro-RO", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function buildEmailBody(request: QuoteRequest, totals: QuoteTotals, catalog: ProductCatalog) {
  const accessories = totals.systemRows.filter((row) => row.quantity > 0);

  return [
    `Buna ziua, ${request.customer.name || ""},`,
    "",
    `Va transmitem oferta pentru ${catalog.sheetProduct.name}.`,
    `Suprafata tigla metalica: ${totals.tileArea.toFixed(2)} mp`,
    `Valoare tigla: ${money(totals.tileAfterDiscount)} lei`,
    `Valoare accesorii: ${money(totals.systemAfterDiscount)} lei`,
    request.labor > 0 ? `Manopera: ${money(request.labor)} lei` : "",
    `Total oferta: ${money(totals.totalWithLabor)} lei`,
    "",
    accessories.length > 0 ? "Accesorii incluse:" : "",
    ...accessories.map((row, index) => `${index + 1}. ${row.name} - ${row.quantity} ${row.unit} x ${money(row.priceWithVat)} lei = ${money(row.value)} lei`),
    "",
    "Oferta finala se confirma in functie de disponibilitate, transport si culoarea aleasa.",
    "",
    `Pentru detalii ne puteti contacta la ${company.phone}.`,
    company.name,
  ].filter(Boolean).join("\n");
}

function buildWarehousePrintHtml(request: QuoteRequest, totals: QuoteTotals, catalog: ProductCatalog) {
  const activeSheets = totals.sheetRows.filter((row) => row.quantity > 0);
  const activeAccessories = totals.systemRows.filter((row) => row.quantity > 0);
  const rows = [
    ...activeSheets.map((row) => ({
      name: `${catalog.sheetProduct.name} - foaie ${row.length} m`,
      quantity: row.quantity,
      unit: "buc",
      value: row.value,
    })),
    ...activeAccessories.map((row) => ({
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      value: row.value,
    })),
  ];

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <title>Fisa depozit ${request.id}</title>
  <style>
    body { color: #111827; font-family: Arial, sans-serif; margin: 32px; }
    h1 { font-size: 24px; margin: 0 0 6px; }
    h2 { border-bottom: 1px solid #d1d5db; font-size: 16px; margin: 28px 0 12px; padding-bottom: 6px; }
    .muted { color: #4b5563; }
    .grid { display: grid; gap: 8px; grid-template-columns: 1fr 1fr; margin-top: 20px; }
    .box { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; }
    table { border-collapse: collapse; margin-top: 12px; width: 100%; }
    th, td { border: 1px solid #d1d5db; font-size: 13px; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    .right { text-align: right; }
    .total { font-size: 18px; font-weight: 700; margin-top: 16px; text-align: right; }
    .signatures { display: grid; gap: 40px; grid-template-columns: 1fr 1fr; margin-top: 48px; }
    .line { border-top: 1px solid #111827; padding-top: 8px; }
    @media print { button { display: none; } body { margin: 18mm; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Printeaza</button>
  <h1>Fisa pregatire comanda</h1>
  <div class="muted">${company.name} | ${company.phone} | ${company.email}</div>
  <div class="grid">
    <div class="box"><strong>Cerere</strong><br />${request.id}<br />Status: ${request.status}</div>
    <div class="box"><strong>Client</strong><br />${request.customer.name || "-"}<br />${request.customer.phone || "-"}<br />${request.customer.address || "-"}</div>
  </div>
  <h2>Produse pentru depozit</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Produs</th><th class="right">Cantitate</th><th>UM</th><th class="right">Valoare</th><th>Verificat</th></tr>
    </thead>
    <tbody>
      ${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${row.name}</td><td class="right">${row.quantity}</td><td>${row.unit}</td><td class="right">${money(row.value)} lei</td><td></td></tr>`).join("")}
    </tbody>
  </table>
  <div class="total">Total oferta: ${money(totals.totalWithLabor)} lei</div>
  <h2>Observatii</h2>
  <p>${request.customer.notes || "Fara observatii."}</p>
  <div class="signatures">
    <div class="line">Pregatit de</div>
    <div class="line">Verificat / Ridicat de</div>
  </div>
</body>
</html>`;
}

function printWarehouseSheet(request: QuoteRequest, totals: QuoteTotals, catalog: ProductCatalog) {
  openGeneratedHtmlTab(buildWarehousePrintHtml(request, totals, catalog));
}

function openEmailTemplateTab(request: QuoteRequest, subject: string, body: string) {
  const to = request.customer.email || "";
  const escapedTo = escapeHtml(to);
  const escapedSubject = escapeHtml(subject);
  const escapedBody = escapeHtml(body);

  openGeneratedHtmlTab(`<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <title>Raspuns oferta ${escapeHtml(request.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #eef2f7; color: #111827; font-family: Arial, sans-serif; margin: 0; }
    main { margin: 0 auto; max-width: 980px; padding: 28px; }
    header { background: #0f766e; border-radius: 8px 8px 0 0; color: white; padding: 18px 22px; }
    section { background: white; border: 1px solid #cbd5e1; border-top: 0; border-radius: 0 0 8px 8px; padding: 22px; }
    label { color: #475569; display: grid; font-size: 13px; font-weight: 700; gap: 8px; margin-bottom: 16px; }
    input, textarea { border: 1px solid #cbd5e1; border-radius: 6px; color: #111827; font: inherit; padding: 12px; width: 100%; }
    textarea { min-height: 420px; resize: vertical; white-space: pre-wrap; }
    .row { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; margin-top: 18px; }
    button, a.button { align-items: center; background: #0f766e; border: 0; border-radius: 6px; color: white; cursor: pointer; display: inline-flex; font-weight: 700; min-height: 44px; padding: 0 16px; text-decoration: none; }
    button.secondary { background: #334155; }
    .muted { color: #64748b; font-size: 13px; margin-top: 6px; }
    @media (max-width: 720px) { main { padding: 14px; } .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1 style="margin:0;font-size:24px;">Raspuns oferta ${escapeHtml(request.id)}</h1>
      <p style="margin:6px 0 0;">Template precompletat pentru ${escapeHtml(request.customer.name || "client")}</p>
    </header>
    <section>
      <div class="row">
        <label>Catre
          <input id="to" type="email" value="${escapedTo}" />
        </label>
        <label>Subiect
          <input id="subject" value="${escapedSubject}" />
        </label>
      </div>
      <label>Mesaj
        <textarea id="body">${escapedBody}</textarea>
      </label>
      <p class="muted">Editeaza mesajul aici, apoi deschide reply-ul in clientul de email. Trimiterea reala ramane in aplicatia de email.</p>
      <div class="actions">
        <button class="secondary" type="button" onclick="navigator.clipboard && navigator.clipboard.writeText(document.getElementById('body').value)">Copiaza mesaj</button>
        <button type="button" onclick="reply()">Deschide reply in email</button>
      </div>
    </section>
  </main>
  <script>
    function reply() {
      const to = document.getElementById('to').value;
      const subject = document.getElementById('subject').value;
      const body = document.getElementById('body').value;
      window.location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }
  </script>
</body>
</html>`);
}

function openGeneratedHtmlTab(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const generatedWindow = window.open(url, "_blank", "noopener,noreferrer");

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

  if (generatedWindow) {
    generatedWindow.focus();
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("offers");
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [productCatalog, setProductCatalog] = useState<ProductCatalog>(defaultProductCatalog);

  useEffect(() => {
    const stored = getStoredQuoteRequests();
    setRequests(stored);
    setSelectedId(stored[0]?.id || null);
    setProductCatalog(getStoredProductCatalog());
  }, []);

  const selectedRequest = requests.find((request) => request.id === selectedId) || requests[0] || null;
  const selectedTotals = useMemo(
    () => (selectedRequest ? calculateQuoteTotals(selectedRequest, productCatalog) : null),
    [productCatalog, selectedRequest],
  );
  const filteredRequests = requests.filter((request) => {
    const haystack = `${request.id} ${request.customer.name} ${request.customer.phone} ${request.customer.address}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const stats = useMemo(() => {
    const totalValue = requests.reduce((sum, request) => sum + calculateQuoteTotals(request, productCatalog).totalWithLabor, 0);

    return [
      { label: "Cereri noi", value: String(requests.filter((request) => request.status === "Noua").length), hint: "neprocesate" },
      { label: "Contactate", value: String(requests.filter((request) => request.status === "Contactat").length), hint: "in lucru" },
      { label: "Ofertate", value: String(requests.filter((request) => request.status === "Ofertata").length), hint: "trimise" },
      { label: "Valoare oferte", value: `${money(totalValue)} RON`, hint: "total curent" },
    ];
  }, [productCatalog, requests]);

  const generatedEmail = useMemo(() => {
    if (!selectedRequest || !selectedTotals) {
      return { body: "", subject: "" };
    }

    return {
      body: buildEmailBody(selectedRequest, selectedTotals, productCatalog),
      subject: `Oferta ${company.name} - ${selectedRequest.id}`,
    };
  }, [productCatalog, selectedRequest, selectedTotals]);

  function updateRequest(id: string, updater: (request: QuoteRequest) => QuoteRequest) {
    setRequests((current) => {
      const next = current.map((request) => (request.id === id ? updater(request) : request));
      saveStoredQuoteRequests(next);
      return next;
    });
  }

  function updateCatalog(updater: (catalog: ProductCatalog) => ProductCatalog) {
    setProductCatalog((current) => {
      const next = updater(current);
      saveStoredProductCatalog(next);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 md:grid md:grid-cols-[260px_minmax(0,1fr)]" id="main-content">
      <aside className="border-b bg-white px-5 py-4 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:p-5">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground" href="/">
          <ArrowLeft className="size-4" />
          Inapoi la site
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-normal">{company.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administrare oferte</p>
        </div>

        <nav className="flex gap-2 overflow-x-auto md:grid md:overflow-visible" aria-label="Navigatie admin">
          {adminSections.map((section) => (
            <button
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeSection === section.id ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
              }`}
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon className="size-4" />
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        <header className="border-b bg-white px-5 py-5 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-primary">
                {adminSections.find((section) => section.id === activeSection)?.label}
              </p>
              <h2 className="text-2xl font-bold tracking-normal md:text-4xl">Panou oferte Nicoroof Modern</h2>
              <p className="mt-1 text-sm text-muted-foreground">Cererile, calculele Excel si preturile sunt separate pe pagini.</p>
            </div>
            {selectedRequest?.customer.email ? (
              <Button
                type="button"
                onClick={() => {
                  openEmailTemplateTab(selectedRequest, generatedEmail.subject, generatedEmail.body);
                  updateRequest(selectedRequest.id, (request) => ({ ...request, status: "Ofertata" }));
                }}
              >
                <Send className="mr-2 size-4" />
                Trimite raspuns
              </Button>
            ) : selectedRequest ? (
              <Button disabled title="Clientul nu a completat emailul">
                <Mail className="mr-2 size-4" />
                Lipseste email
              </Button>
            ) : null}
          </div>
        </header>

        {activeSection === "offers" ? (
          <OffersView
            emailBody={generatedEmail.body}
            emailSubject={generatedEmail.subject}
            filteredRequests={filteredRequests}
            productCatalog={productCatalog}
            query={query}
            requests={requests}
            selectedRequest={selectedRequest}
            selectedTotals={selectedTotals}
            stats={stats}
            updateRequest={updateRequest}
            onQueryChange={setQuery}
            onSelectRequest={setSelectedId}
          />
        ) : null}

        {activeSection === "excel" ? (
          <ExcelView productCatalog={productCatalog} />
        ) : null}

        {activeSection === "products" ? <ProductsView productCatalog={productCatalog} updateCatalog={updateCatalog} /> : null}
      </section>
    </main>
  );
}

function OffersView({
  emailBody,
  emailSubject,
  filteredRequests,
  productCatalog,
  query,
  requests,
  selectedRequest,
  selectedTotals,
  stats,
  updateRequest,
  onQueryChange,
  onSelectRequest,
}: {
  emailBody: string;
  emailSubject: string;
  filteredRequests: QuoteRequest[];
  productCatalog: ProductCatalog;
  query: string;
  requests: QuoteRequest[];
  selectedRequest: QuoteRequest | null;
  selectedTotals: QuoteTotals | null;
  stats: Array<{ hint: string; label: string; value: string }>;
  updateRequest: (id: string, updater: (request: QuoteRequest) => QuoteRequest) => void;
  onQueryChange: (value: string) => void;
  onSelectRequest: (id: string) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="px-5 py-6 md:px-8">
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <article className="rounded-lg border bg-card p-5 shadow-soft" key={stat.label}>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <strong className="mt-2 block text-2xl md:text-3xl">{stat.value}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{stat.hint}</span>
          </article>
        ))}
      </section>

      {requests.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center shadow-soft">
          <h2 className="text-xl font-bold">Nu exista cereri inca</h2>
          <p className="mt-2 text-muted-foreground">Cererile noi vor aparea aici dupa trimiterea formularului.</p>
          <Button asChild className="mt-5">
            <Link href="/#calculator">Adauga prima cerere</Link>
          </Button>
        </div>
      ) : (
        <section className="grid gap-6">
          <RequestsList
            filteredRequests={filteredRequests}
            productCatalog={productCatalog}
            query={query}
            selectedRequest={selectedRequest}
            onQueryChange={onQueryChange}
            onSelectRequest={(id) => {
              onSelectRequest(id);
              setDetailOpen(true);
            }}
          />

          {selectedRequest && selectedTotals ? (
            <OrderDetailsModal
              emailBody={emailBody}
              emailSubject={emailSubject}
              open={detailOpen}
              productCatalog={productCatalog}
              selectedRequest={selectedRequest}
              selectedTotals={selectedTotals}
              updateRequest={updateRequest}
              onClose={() => setDetailOpen(false)}
            />
          ) : null}
        </section>
      )}
    </div>
  );
}

function RequestsList({
  filteredRequests,
  productCatalog,
  query,
  selectedRequest,
  onQueryChange,
  onSelectRequest,
}: {
  filteredRequests: QuoteRequest[];
  productCatalog: ProductCatalog;
  query: string;
  selectedRequest: QuoteRequest | null;
  onQueryChange: (value: string) => void;
  onSelectRequest: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Cereri primite</h2>
          <p className="text-sm text-muted-foreground">Client, montaj, status si valoare oferta.</p>
        </div>
        <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring md:w-72">
          <Search className="size-4" />
          <input
            className="w-full bg-transparent outline-none"
            autoComplete="off"
            name="search-requests"
            placeholder="Cauta client sau adresa"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 p-4">
        {filteredRequests.map((request) => {
          const totals = calculateQuoteTotals(request, productCatalog);
          return (
            <button
              className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                request.id === selectedRequest?.id ? "border-primary bg-teal-50" : "bg-white hover:bg-slate-50"
              }`}
              key={request.id}
              type="button"
              onClick={() => onSelectRequest(request.id)}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <strong className="block">{request.customer.name || "Client fara nume"}</strong>
                  <span className="text-sm text-muted-foreground">
                    {request.id} | {request.customer.address || "Adresa necompletata"}
                  </span>
                </div>
                <span className="w-fit rounded-full border bg-white px-2.5 py-1 text-xs font-bold">{request.status}</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                <Metric label="Foi" value={`${totals.tileArea.toFixed(2)} mp`} />
                <Metric label="Accesorii" value={`${activeRows(totals.systemRows)} pozitii`} />
                <Metric label="Montaj" value={request.customer.wantsInstallation ? "Da" : "Nu"} />
                <Metric label="Total" value={`${money(totals.totalWithLabor)} lei`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderDetailsModal({
  emailBody,
  emailSubject,
  open,
  productCatalog,
  selectedRequest,
  selectedTotals,
  updateRequest,
  onClose,
}: {
  emailBody: string;
  emailSubject: string;
  open: boolean;
  productCatalog: ProductCatalog;
  selectedRequest: QuoteRequest;
  selectedTotals: QuoteTotals;
  updateRequest: (id: string, updater: (request: QuoteRequest) => QuoteRequest) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const createdAt = new Date(selectedRequest.createdAt);
  const formattedCreatedAt = Number.isNaN(createdAt.getTime())
    ? "-"
    : createdAt.toLocaleString("ro-RO", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  const profile = sheetSeries[selectedRequest.seriesKey];
  const activeSheetRows = selectedTotals.sheetRows.filter((row) => row.quantity > 0);
  const activeAccessories = selectedTotals.systemRows.filter((row) => row.quantity > 0);
  const activeAuxiliaryRows = selectedTotals.auxiliarySheetTables.flatMap((table) =>
    table.rows.filter((row) => row.quantity > 0).map((row) => ({
      ...row,
      tableName: table.name,
    })),
  );
  const activeModuleRows = selectedTotals.moduleRows.filter((row) => row.quantity > 0);

  function openReplyTab() {
    openEmailTemplateTab(selectedRequest, emailSubject, emailBody);
    updateRequest(selectedRequest.id, (request) => ({ ...request, status: "Ofertata" }));
  }

  return (
    <div className="fixed inset-0 z-50 grid bg-slate-950/60 p-3 md:p-6" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
      <div className="min-h-0 overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-primary">Detalii comanda</p>
            <h2 className="text-2xl font-bold" id="order-modal-title">
              {selectedRequest.id} - {selectedRequest.customer.name || "Client fara nume"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formattedCreatedAt} | {profile.name} | {selectedTotals.totalWithLabor ? `${money(selectedTotals.totalWithLabor)} lei` : "fara valoare"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => printWarehouseSheet(selectedRequest, selectedTotals, productCatalog)}>
              <FileSpreadsheet className="mr-2 size-4" />
              Fisa depozit
            </Button>
            <Button type="button" onClick={openReplyTab}>
              <Send className="mr-2 size-4" />
              Raspunde oferta
            </Button>
            <button
              aria-label="Inchide detaliile comenzii"
              className="grid size-11 place-items-center rounded-md border bg-white text-foreground hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain p-5 pb-10">
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="grid gap-5 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-lg border bg-slate-50 p-4">
                <h3 className="mb-4 font-bold">Date client</h3>
                <div className="grid gap-4">
                  <InfoLine icon={<UserRound className="size-4" />} label="Client" value={selectedRequest.customer.name || "-"} />
                  <InfoLine icon={<Phone className="size-4" />} label="Telefon" value={selectedRequest.customer.phone || "-"} />
                  <InfoLine icon={<Mail className="size-4" />} label="Email" value={selectedRequest.customer.email || "-"} />
                  <InfoLine icon={<CheckCircle2 className="size-4" />} label="Montaj" value={selectedRequest.customer.wantsInstallation ? "Da" : "Nu"} />
                  <InfoLine icon={<CheckCircle2 className="size-4" />} label="Data cerere" value={formattedCreatedAt} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div>
                    <span className="block text-muted-foreground">Adresa lucrare</span>
                    <strong className="block break-words">{selectedRequest.customer.address || "-"}</strong>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Observatii client</span>
                    <strong className="block whitespace-pre-wrap break-words">{selectedRequest.customer.notes || "-"}</strong>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border bg-white p-4">
                <h3 className="mb-4 font-bold">Administrare oferta</h3>
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                    Status
                    <select
                      aria-label="Status cerere"
                      className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      name="quote-status-modal"
                      value={selectedRequest.status}
                      onChange={(event) => updateRequest(selectedRequest.id, (request) => ({ ...request, status: event.target.value as QuoteStatus }))}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberField
                    label="Discount tigla (%)"
                    max={100}
                    name="modal-tile-discount"
                    value={selectedRequest.tileDiscount}
                    onChange={(value) => updateRequest(selectedRequest.id, (request) => ({ ...request, tileDiscount: value }))}
                  />
                  <NumberField
                    label="Discount sistem (%)"
                    max={100}
                    name="modal-system-discount"
                    value={selectedRequest.systemDiscount}
                    onChange={(value) => updateRequest(selectedRequest.id, (request) => ({ ...request, systemDiscount: value }))}
                  />
                  <NumberField
                    label="Manopera"
                    name="modal-labor"
                    step={50}
                    value={selectedRequest.labor}
                    onChange={(value) => updateRequest(selectedRequest.id, (request) => ({ ...request, labor: value }))}
                  />
                </div>
              </section>

              <section className="rounded-lg border bg-white p-4">
                <h3 className="mb-3 font-bold">Totaluri</h3>
                <div className="grid gap-3 text-sm">
                  <Metric label="Tigla metalica" value={`${money(selectedTotals.tileValue)} lei`} />
                  <Metric label="Rest sistem" value={`${money(selectedTotals.systemValue)} lei`} />
                  <Metric label="Total fara manopera" value={`${money(selectedTotals.totalWithoutLabor)} lei`} />
                  <Metric label="Total cu manopera" value={`${money(selectedTotals.totalWithLabor)} lei`} />
                </div>
              </section>
            </aside>

            <section className="grid min-w-0 gap-5">
              <div className="rounded-lg border bg-white p-4">
                <h3 className="font-bold">Profil si foi tigla</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.name} | latime utila {profile.usableWidth} m | {productCatalog.sheetProduct.name}
                </p>
                {activeSheetRows.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Dimensiune</th>
                          <th className="px-3 py-2 text-right">Nr buc</th>
                          <th className="px-3 py-2 text-right">Mp</th>
                          <th className="px-3 py-2 text-right">Pret/mp</th>
                          <th className="px-3 py-2 text-right">Valoare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSheetRows.map((row) => (
                          <tr className="border-t" key={row.length}>
                            <td className="px-3 py-2 font-semibold">Foaie {row.length} m</td>
                            <td className="px-3 py-2 text-right">{row.quantity}</td>
                            <td className="px-3 py-2 text-right">{row.area.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">{money(productCatalog.sheetProduct.priceWithVat)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{money(row.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 rounded-md border bg-slate-50 p-4 text-sm text-muted-foreground">Nu sunt foi de tigla selectate.</p>
                )}
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h3 className="font-bold">Accesorii comandate</h3>
                {activeAccessories.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Produs</th>
                          <th className="px-3 py-2 text-right">Pret fara TVA</th>
                          <th className="px-3 py-2 text-right">Pret cu TVA</th>
                          <th className="px-3 py-2 text-right">Cantitate</th>
                          <th className="px-3 py-2">UM</th>
                          <th className="px-3 py-2 text-right">Valoare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAccessories.map((row, index) => (
                          <tr className="border-t" key={row.name}>
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2 font-semibold">{row.name}</td>
                            <td className="px-3 py-2 text-right">{money(row.priceWithoutVat)}</td>
                            <td className="px-3 py-2 text-right">{money(row.priceWithVat)}</td>
                            <td className="px-3 py-2 text-right">{row.quantity}</td>
                            <td className="px-3 py-2">{row.unit}</td>
                            <td className="px-3 py-2 text-right font-semibold">{money(row.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 rounded-md border bg-slate-50 p-4 text-sm text-muted-foreground">Nu sunt accesorii selectate.</p>
                )}
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h3 className="font-bold">Calcule auxiliare Excel</h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border bg-slate-50 p-3">
                    <h4 className="font-semibold">Calcul tabla</h4>
                    {activeAuxiliaryRows.length > 0 ? (
                      <div className="mt-3 grid gap-2 text-sm">
                        {activeAuxiliaryRows.map((row) => (
                          <div className="flex justify-between gap-3 rounded-md border bg-white p-2" key={`${row.tableName}-${row.length}`}>
                            <span className="min-w-0 break-words">
                              {row.tableName} | {row.length} m x {row.quantity} buc
                            </span>
                            <strong>{row.area.toFixed(2)} mp</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Fara pozitii completate.</p>
                    )}
                  </div>
                  <div className="rounded-md border bg-slate-50 p-3">
                    <h4 className="font-semibold">Foaie3</h4>
                    {activeModuleRows.length > 0 ? (
                      <div className="mt-3 grid gap-2 text-sm">
                        {activeModuleRows.map((row) => (
                          <div className="flex justify-between gap-3 rounded-md border bg-white p-2" key={row.label}>
                            <span className="min-w-0 break-words">
                              {row.label} x {row.quantity}
                            </span>
                            <strong>{row.area.toFixed(2)} mp</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Fara pozitii completate.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pb-4">
                <TotalsTable selectedRequest={selectedRequest} selectedTotals={selectedTotals} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExcelView({ productCatalog }: { productCatalog: ProductCatalog }) {
  const [excelRequest, setExcelRequest] = useState<QuoteRequest>(() => {
    const request = createEmptyQuoteRequest();

    return {
      ...request,
      customer: {
        ...request.customer,
        name: "Calcul intern",
      },
      id: "EXCEL-WEB",
    };
  });
  const [accessoryQuery, setAccessoryQuery] = useState("");
  const excelTotals = useMemo(() => calculateQuoteTotals(excelRequest, productCatalog), [excelRequest, productCatalog]);
  const filteredSystemRows = excelTotals.systemRows.filter((row) => row.name.toLowerCase().includes(accessoryQuery.toLowerCase()));

  function updateSheetQuantity(length: number, quantity: number) {
    setExcelRequest((current) => ({
      ...current,
      sheetQuantities: {
        ...current.sheetQuantities,
        [String(length)]: quantity,
      },
    }));
  }

  function updateAccessoryQuantity(name: string, quantity: number) {
    setExcelRequest((current) => ({
      ...current,
      accessoryQuantities: {
        ...current.accessoryQuantities,
        [name]: quantity,
      },
    }));
  }

  function updateAuxiliarySheetQuantity(tableKey: string, length: number, quantity: number) {
    setExcelRequest((current) => ({
      ...current,
      auxiliarySheetQuantities: {
        ...current.auxiliarySheetQuantities,
        [tableKey]: {
          ...(current.auxiliarySheetQuantities[tableKey] || {}),
          [String(length)]: quantity,
        },
      },
    }));
  }

  function updateModuleQuantity(length: number, quantity: number) {
    setExcelRequest((current) => ({
      ...current,
      moduleQuantities: {
        ...current.moduleQuantities,
        [String(length)]: quantity,
      },
    }));
  }

  function resetExcel() {
    const request = createEmptyQuoteRequest();
    setExcelRequest({
      ...request,
      customer: {
        ...request.customer,
        name: "Calcul intern",
      },
      id: "EXCEL-WEB",
    });
  }

  return (
    <div className="px-5 py-6 md:px-8">
      <section className="rounded-lg border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-primary">Excel calcul</p>
            <h2 className="text-2xl font-bold">Calculator Excel web</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Calculator independent pentru oferte rapide. Nu modifica si nu citeste cererile primite.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={resetExcel}>
            Reseteaza calculul
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Tigla metalica" value={`${money(excelTotals.tileAfterDiscount)} lei`} />
          <Metric label="Rest sistem" value={`${money(excelTotals.systemAfterDiscount)} lei`} />
          <Metric label="Total fara manopera" value={`${money(excelTotals.totalWithoutLabor)} lei`} />
          <Metric label="Total cu manopera" value={`${money(excelTotals.totalWithLabor)} lei`} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            <section className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-4 grid gap-4 md:grid-cols-4">
                <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                  Profil tigla
                  <select
                    className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={excelRequest.seriesKey}
                    onChange={(event) =>
                      setExcelRequest((current) => ({
                        ...current,
                        seriesKey: event.target.value as SeriesKey,
                        sheetQuantities: {},
                      }))
                    }
                  >
                    {Object.entries(sheetSeries).map(([key, series]) => (
                      <option key={key} value={key}>
                        {series.name} - {series.usableWidth} m
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField
                  label="Discount tigla (%)"
                  max={100}
                  name="excel-tile-discount"
                  value={excelRequest.tileDiscount}
                  onChange={(value) => setExcelRequest((current) => ({ ...current, tileDiscount: value }))}
                />
                <NumberField
                  label="Discount sistem (%)"
                  max={100}
                  name="excel-system-discount"
                  value={excelRequest.systemDiscount}
                  onChange={(value) => setExcelRequest((current) => ({ ...current, systemDiscount: value }))}
                />
                <NumberField
                  label="Manopera"
                  name="excel-labor"
                  step={50}
                  value={excelRequest.labor}
                  onChange={(value) => setExcelRequest((current) => ({ ...current, labor: value }))}
                />
              </div>

              <h3 className="font-bold">calcul materiale - tigla metalica</h3>
              <div className="mt-3 overflow-x-auto rounded-md border bg-white">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Dimensiune</th>
                      <th className="px-3 py-2 text-right">Nr buc</th>
                      <th className="px-3 py-2 text-right">Mp</th>
                      <th className="px-3 py-2 text-right">Pret/mp</th>
                      <th className="px-3 py-2 text-right">Valoare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelTotals.sheetRows.map((row) => (
                      <tr className="border-t" key={row.length}>
                        <td className="px-3 py-2 font-semibold">Foaie {row.length} m</td>
                        <td className="px-3 py-2">
                          <input
                            className="ml-auto min-h-10 w-24 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            inputMode="numeric"
                            min={0}
                            type="number"
                            value={row.quantity || ""}
                            onChange={(event) => updateSheetQuantity(row.length, parseNumber(event.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">{row.area.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{money(productCatalog.sheetProduct.priceWithVat)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{money(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-bold">calcul materiale - accesorii</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Completeaza cantitatile pentru orice produs din lista.</p>
                </div>
                <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring md:w-80">
                  <Search className="size-4" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="Cauta produs"
                    value={accessoryQuery}
                    onChange={(event) => setAccessoryQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="max-h-[560px] overflow-auto rounded-md border bg-white">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Element</th>
                      <th className="px-3 py-2 text-right">Pret fara TVA</th>
                      <th className="px-3 py-2 text-right">Pret cu TVA</th>
                      <th className="px-3 py-2">UM</th>
                      <th className="px-3 py-2 text-right">Cant</th>
                      <th className="px-3 py-2 text-right">Valoare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSystemRows.map((row) => (
                      <tr className="border-t" key={row.name}>
                        <td className="px-3 py-2 font-semibold">{row.name}</td>
                        <td className="px-3 py-2 text-right">{money(row.priceWithoutVat)}</td>
                        <td className="px-3 py-2 text-right">{money(row.priceWithVat)}</td>
                        <td className="px-3 py-2">{row.unit}</td>
                        <td className="px-3 py-2">
                          <input
                            className="ml-auto min-h-10 w-24 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            inputMode="decimal"
                            min={0}
                            type="number"
                            value={row.quantity || ""}
                            onChange={(event) => updateAccessoryQuantity(row.name, parseNumber(event.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{money(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              {excelTotals.auxiliarySheetTables.map((table) => (
                <div className="rounded-lg border bg-slate-50 p-4" key={table.key}>
                  <h3 className="font-bold">{table.name}</h3>
                  <div className="mt-3 overflow-hidden rounded-md border bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Dimensiune</th>
                          <th className="px-3 py-2 text-right">Nr buc</th>
                          <th className="px-3 py-2 text-right">Total foaie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row) => (
                          <tr className="border-t" key={`${table.key}-${row.length}`}>
                            <td className="px-3 py-2">{row.length} m</td>
                            <td className="px-3 py-2">
                              <input
                                className="ml-auto min-h-10 w-24 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                inputMode="numeric"
                                min={0}
                                type="number"
                                value={row.quantity || ""}
                                onChange={(event) => updateAuxiliarySheetQuantity(table.key, row.length, parseNumber(event.target.value))}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">{row.area.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-slate-100 font-bold">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">-</td>
                          <td className="px-3 py-2 text-right">{table.totalArea.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-lg border bg-slate-50 p-4">
              <h3 className="font-bold">Foaie3 - calcul tigla metalica</h3>
              <div className="mt-3 overflow-x-auto rounded-md border bg-white">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-100 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Model</th>
                      <th className="px-3 py-2 text-right">Cant</th>
                      <th className="px-3 py-2 text-right">Mp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelTotals.moduleRows.map((row) => (
                      <tr className="border-t" key={row.label}>
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2">
                          <input
                            className="ml-auto min-h-10 w-24 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            inputMode="numeric"
                            min={0}
                            type="number"
                            value={row.quantity || ""}
                            onChange={(event) => updateModuleQuantity(row.length, parseNumber(event.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{row.area.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-slate-100 font-bold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">-</td>
                      <td className="px-3 py-2 text-right">{excelTotals.moduleTotalArea.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="rounded-lg border bg-card p-5 shadow-soft xl:sticky xl:top-6 xl:self-start">
            <p className="mb-1 text-xs font-bold uppercase text-primary">Totaluri Excel</p>
            <h3 className="text-xl font-bold">Rezumat calcul</h3>
            <div className="mt-5 grid gap-3 text-sm">
              <Metric label="Suprafata tigla" value={`${excelTotals.tileArea.toFixed(2)} mp`} />
              <Metric label="Tigla dupa discount" value={`${money(excelTotals.tileAfterDiscount)} lei`} />
              <Metric label="Sistem dupa discount" value={`${money(excelTotals.systemAfterDiscount)} lei`} />
              <Metric label="Manopera" value={`${money(excelRequest.labor)} lei`} />
            </div>
            <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <span className="block text-sm font-semibold text-teal-950">Total cu manopera</span>
              <strong className="mt-1 block text-2xl text-teal-950">{money(excelTotals.totalWithLabor)} lei</strong>
            </div>
            <TotalsTable selectedRequest={excelRequest} selectedTotals={excelTotals} />
          </aside>
        </div>
      </section>
    </div>
  );
}

function ProductsView({
  productCatalog,
  updateCatalog,
}: {
  productCatalog: ProductCatalog;
  updateCatalog: (updater: (catalog: ProductCatalog) => ProductCatalog) => void;
}) {
  function updateSheet(field: keyof ProductCatalog["sheetProduct"], value: string | number) {
    updateCatalog((catalog) => ({
      ...catalog,
      sheetProduct: {
        ...catalog.sheetProduct,
        [field]: value,
      },
    }));
  }

  function updateAccessory(index: number, field: keyof CatalogAccessory, value: string | number) {
    updateCatalog((catalog) => ({
      ...catalog,
      accessories: catalog.accessories.map((accessory, currentIndex) =>
        currentIndex === index
          ? {
              ...accessory,
              [field]: value,
            }
          : accessory,
      ),
    }));
  }

  function addAccessory() {
    updateCatalog((catalog) => ({
      ...catalog,
      accessories: [
        ...catalog.accessories,
        {
          description: "",
          name: "Produs nou",
          priceWithoutVat: 0,
          priceWithVat: 0,
          unit: "buc",
        },
      ],
    }));
  }

  function removeAccessory(index: number) {
    updateCatalog((catalog) => ({
      ...catalog,
      accessories: catalog.accessories.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  return (
    <div className="px-5 py-6 md:px-8">
      <section className="rounded-lg border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-primary">Produse si preturi</p>
            <h2 className="text-2xl font-bold">Actualizare catalog</h2>
            <p className="mt-1 text-sm text-muted-foreground">Modificarile se salveaza in browser si sunt folosite la calculul ofertelor demo.</p>
          </div>
          <Button type="button" onClick={addAccessory}>
            <Plus className="mr-2 size-4" />
            Adauga produs
          </Button>
        </div>

        <div className="mt-6 rounded-lg border bg-slate-50 p-4">
          <h3 className="font-bold">Tigla metalica</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <TextField label="Denumire" value={productCatalog.sheetProduct.name} onChange={(value) => updateSheet("name", value)} />
            <TextField label="UM" value={productCatalog.sheetProduct.unit} onChange={(value) => updateSheet("unit", value)} />
            <NumberEdit label="Pret fara TVA" value={productCatalog.sheetProduct.priceWithoutVat} onChange={(value) => updateSheet("priceWithoutVat", value)} />
            <NumberEdit label="Pret cu TVA" value={productCatalog.sheetProduct.priceWithVat} onChange={(value) => updateSheet("priceWithVat", value)} />
            <TextField label="Descriere" value={productCatalog.sheetProduct.description || ""} onChange={(value) => updateSheet("description", value)} />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
            <h3 className="font-bold">Accesorii si sistem pluvial</h3>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Save className="size-4" />
              Salvare automata
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Produs</th>
                  <th className="px-3 py-3">Descriere</th>
                  <th className="px-3 py-3">UM</th>
                  <th className="px-3 py-3 text-right">Fara TVA</th>
                  <th className="px-3 py-3 text-right">Cu TVA</th>
                  <th className="px-3 py-3 text-right">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {productCatalog.accessories.map((accessory, index) => (
                  <tr className="border-t" key={`${accessory.name}-${index}`}>
                    <td className="px-3 py-3">
                      <input
                        className="min-h-10 w-full rounded-md border bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={accessory.name}
                        onChange={(event) => updateAccessory(index, "name", event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="min-h-10 w-full rounded-md border bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={accessory.description || ""}
                        onChange={(event) => updateAccessory(index, "description", event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="min-h-10 w-24 rounded-md border bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={accessory.unit}
                        onChange={(event) => updateAccessory(index, "unit", event.target.value)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="min-h-10 w-28 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        inputMode="decimal"
                        type="number"
                        value={accessory.priceWithoutVat}
                        onChange={(event) => updateAccessory(index, "priceWithoutVat", parseNumber(event.target.value))}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        className="min-h-10 w-28 rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        inputMode="decimal"
                        type="number"
                        value={accessory.priceWithVat}
                        onChange={(event) => updateAccessory(index, "priceWithVat", parseNumber(event.target.value))}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        aria-label={`Sterge ${accessory.name}`}
                        className="inline-grid size-10 place-items-center rounded-md border bg-white text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        type="button"
                        onClick={() => removeAccessory(index)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function activeRows(rows: Array<{ quantity: number }>) {
  return rows.filter((row) => row.quantity > 0).length;
}

function ExcelSheetsPanel({ productCatalog, selectedTotals }: { productCatalog: ProductCatalog; selectedTotals: QuoteTotals }) {
  return (
    <>
      <section className="rounded-lg border bg-slate-50 p-4">
        <h3 className="font-bold">calcul materiale</h3>
        <p className="mt-1 text-xs text-muted-foreground">Preturi si valori calculate dupa cantitatile cererii.</p>
        <div className="mt-3 max-h-[560px] overflow-auto rounded-md border bg-white">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Element</th>
                <th className="px-2 py-2 text-right">Fara TVA</th>
                <th className="px-2 py-2 text-right">Cu TVA</th>
                <th className="px-2 py-2">UM</th>
                <th className="px-2 py-2 text-right">Cant</th>
                <th className="px-2 py-2 text-right">Valoare</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t font-semibold">
                <td className="px-2 py-2">{productCatalog.sheetProduct.name}</td>
                <td className="px-2 py-2 text-right">{money(productCatalog.sheetProduct.priceWithoutVat)}</td>
                <td className="px-2 py-2 text-right">{money(productCatalog.sheetProduct.priceWithVat)}</td>
                <td className="px-2 py-2">{productCatalog.sheetProduct.unit}</td>
                <td className="px-2 py-2 text-right">{selectedTotals.tileArea.toFixed(2)}</td>
                <td className="px-2 py-2 text-right">{money(selectedTotals.tileValue)}</td>
              </tr>
              {selectedTotals.systemRows.map((row) => (
                <tr className="border-t" key={row.name}>
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-right">{money(row.priceWithoutVat)}</td>
                  <td className="px-2 py-2 text-right">{money(row.priceWithVat)}</td>
                  <td className="px-2 py-2">{row.unit}</td>
                  <td className="px-2 py-2 text-right">{row.quantity || "-"}</td>
                  <td className="px-2 py-2 text-right">{money(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-slate-50 p-4">
        <h3 className="font-bold">calcul tabla</h3>
        <div className="mt-3 grid gap-3">
          {selectedTotals.auxiliarySheetTables.map((table) => (
            <div className="overflow-hidden rounded-md border bg-white" key={table.key}>
              <div className="flex items-center justify-between gap-3 border-b bg-slate-100 px-3 py-2">
                <strong>{table.name}</strong>
                <span className="text-xs font-bold text-primary">{table.totalArea.toFixed(2)} mp</span>
              </div>
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Dimensiune</th>
                    <th className="px-2 py-2 text-right">Buc</th>
                    <th className="px-2 py-2 text-right">Total foaie</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr className="border-t" key={`${table.key}-${row.length}`}>
                      <td className="px-2 py-2">{row.length} m</td>
                      <td className="px-2 py-2 text-right">{row.quantity || "-"}</td>
                      <td className="px-2 py-2 text-right">{row.area.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-slate-50 p-4">
        <h3 className="font-bold">Foaie3 - calcul tigla metalica</h3>
        <div className="mt-3 overflow-hidden rounded-md border bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Model</th>
                <th className="px-2 py-2 text-right">Cant</th>
                <th className="px-2 py-2 text-right">Mp</th>
              </tr>
            </thead>
            <tbody>
              {selectedTotals.moduleRows.map((row) => (
                <tr className="border-t" key={row.label}>
                  <td className="px-2 py-2">{row.label}</td>
                  <td className="px-2 py-2 text-right">{row.quantity || "-"}</td>
                  <td className="px-2 py-2 text-right">{row.area.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t bg-slate-100 font-bold">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2 text-right">-</td>
                <td className="px-2 py-2 text-right">{selectedTotals.moduleTotalArea.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function TotalsTable({ selectedRequest, selectedTotals }: { selectedRequest: QuoteRequest; selectedTotals: QuoteTotals }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Materiale</th>
            <th className="px-3 py-2 text-right">Valoare</th>
            <th className="px-3 py-2 text-right">Discount</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-3 py-2 font-semibold">TIGLA METALICA</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.tileValue)}</td>
            <td className="px-3 py-2 text-right">{selectedRequest.tileDiscount}%</td>
            <td className="px-3 py-2 text-right font-semibold">{money(selectedTotals.tileAfterDiscount)}</td>
          </tr>
          <tr className="border-t">
            <td className="px-3 py-2 font-semibold">REST SISTEM</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.systemValue)}</td>
            <td className="px-3 py-2 text-right">{selectedRequest.systemDiscount}%</td>
            <td className="px-3 py-2 text-right font-semibold">{money(selectedTotals.systemAfterDiscount)}</td>
          </tr>
          <tr className="border-t">
            <td className="px-3 py-2 font-semibold">MANOPERA</td>
            <td className="px-3 py-2 text-right">{money(selectedRequest.labor)}</td>
            <td className="px-3 py-2 text-right">-</td>
            <td className="px-3 py-2 text-right font-semibold">{money(selectedRequest.labor)}</td>
          </tr>
          <tr className="border-t bg-slate-50 font-bold">
            <td className="px-3 py-2">TOTAL FARA MANOPERA</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.tileValue + selectedTotals.systemValue)}</td>
            <td className="px-3 py-2 text-right">-</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.totalWithoutLabor)}</td>
          </tr>
          <tr className="border-t bg-slate-50 font-bold">
            <td className="px-3 py-2">TOTAL CU MANOPERA</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.tileValue + selectedTotals.systemValue + selectedRequest.labor)}</td>
            <td className="px-3 py-2 text-right">-</td>
            <td className="px-3 py-2 text-right">{money(selectedTotals.totalWithLabor)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function NumberField({
  label,
  max,
  name,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max?: number;
  name: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        inputMode="decimal"
        max={max}
        min={0}
        name={name}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.min(max ?? Number.POSITIVE_INFINITY, parseNumber(event.target.value)))}
      />
    </label>
  );
}

function NumberEdit({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        inputMode="decimal"
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(parseNumber(event.target.value))}
      />
    </label>
  );
}

function TextField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-11 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="block text-foreground">{value}</strong>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>
        <span className="block text-muted-foreground">{label}</span>
        <strong className="block">{value}</strong>
      </span>
    </div>
  );
}
