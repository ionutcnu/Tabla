"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Mail,
  PackagePlus,
  Paperclip,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { company, sheetSeries } from "@/lib/offer-data";
import { formatFileSize, getQuoteAttachmentFile } from "@/lib/quote-attachments";
import {
  calculateQuoteTotals,
  createCatalogAccessoryId,
  createEmptyQuoteRequest,
  defaultProductCatalog,
  getStoredProductCatalog,
  getStoredQuoteRequests,
  saveStoredProductCatalog,
  saveStoredQuoteRequests,
  type CatalogAccessory,
  type ProductCatalog,
  type QuoteAttachment,
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

function buildOfferPrintHtml(request: QuoteRequest, totals: QuoteTotals, catalog: ProductCatalog) {
  const profile = sheetSeries[request.seriesKey];
  const logoUrl = publicAssetUrl("nicoroof-logo.png");
  const activeSheets = totals.sheetRows.filter((row) => row.quantity > 0);
  const activeAccessories = totals.systemRows.filter((row) => row.quantity > 0);
  const issuedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const rows = [
    ...activeSheets.map((row) => ({
      name: `${catalog.sheetProduct.name} ${profile.name} - foaie ${row.length} m (${row.quantity} buc)`,
      priceWithVat: row.priceWithVat,
      priceWithoutVat: row.priceWithoutVat,
      quantity: row.area,
      unit: catalog.sheetProduct.unit,
      value: row.value,
    })),
    ...activeAccessories.map((row) => ({
      name: row.name,
      priceWithVat: row.priceWithVat,
      priceWithoutVat: row.priceWithoutVat,
      quantity: row.quantity,
      unit: row.unit,
      value: row.value,
    })),
  ];

  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <title>Oferta ${escapeHtml(request.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #e5e7eb; color: #172026; font-family: Arial, sans-serif; margin: 0; }
    .toolbar { background: #0f172a; color: white; display: flex; gap: 10px; justify-content: center; padding: 14px; position: sticky; top: 0; z-index: 10; }
    .toolbar button { background: #0f766e; border: 0; border-radius: 6px; color: white; cursor: pointer; font-weight: 700; min-height: 42px; padding: 0 16px; }
    .page { background: white; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22); margin: 28px auto; max-width: 960px; min-height: 1120px; padding: 42px; }
    .header { align-items: start; border-bottom: 3px solid #0f766e; display: grid; gap: 24px; grid-template-columns: 1fr auto; padding-bottom: 24px; }
    .brand { align-items: center; display: flex; gap: 16px; }
    .brand img { background: white; border: 1px solid #dbe4ea; border-radius: 8px; height: 76px; object-fit: contain; object-position: center; padding: 7px; width: 76px; }
    h1 { font-size: 32px; letter-spacing: 0; margin: 0; }
    h2 { font-size: 17px; margin: 0 0 10px; }
    .muted { color: #64748b; }
    .meta { border: 1px solid #dbe4ea; border-radius: 8px; min-width: 240px; padding: 14px; }
    .meta-row, .total-row { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; }
    .grid { display: grid; gap: 18px; grid-template-columns: 1fr 1fr; margin-top: 28px; }
    .box { border: 1px solid #dbe4ea; border-radius: 8px; padding: 16px; }
    table { border-collapse: collapse; margin-top: 28px; width: 100%; }
    th, td { border-bottom: 1px solid #e2e8f0; font-size: 13px; padding: 11px 9px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; }
    .right { text-align: right; }
    .summary { display: grid; gap: 8px; margin: 24px 0 0 auto; max-width: 390px; }
    .summary .total-row { border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
    .summary .final { background: #0f766e; border-radius: 8px; color: white; font-size: 20px; font-weight: 800; margin-top: 4px; padding: 14px; }
    .notes { background: #f8fafc; border: 1px solid #dbe4ea; border-radius: 8px; margin-top: 28px; padding: 16px; }
    .footer { align-items: end; border-top: 1px solid #dbe4ea; display: grid; gap: 24px; grid-template-columns: 1fr 1fr; margin-top: 42px; padding-top: 18px; }
    .signature { border-top: 1px solid #172026; padding-top: 8px; text-align: center; }
    @page { margin: 14mm; size: A4; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .page { box-shadow: none; margin: 0; max-width: none; min-height: auto; padding: 0; }
    }
    @media (max-width: 760px) {
      .page { margin: 0; min-height: 0; padding: 22px; }
      .header, .grid, .footer { grid-template-columns: 1fr; }
      .meta { min-width: 0; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Printeaza / Export PDF</button>
  </div>
  <main class="page">
    <section class="header">
      <div class="brand">
        <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(company.name)}" />
        <div>
          <h1>Oferta comerciala</h1>
          <div class="muted">${escapeHtml(company.name)} | ${escapeHtml(company.phone)} | ${escapeHtml(company.email)}</div>
          <div class="muted">${escapeHtml(company.address)}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-row"><span>Oferta</span><strong>${escapeHtml(request.id)}</strong></div>
        <div class="meta-row"><span>Data</span><strong>${issuedAt}</strong></div>
        <div class="meta-row"><span>Status</span><strong>${escapeHtml(request.status)}</strong></div>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <h2>Furnizor</h2>
        <strong>${escapeHtml(company.name)}</strong><br />
        CUI: ${escapeHtml(company.fiscalCode)}<br />
        ${escapeHtml(company.address)}<br />
        ${escapeHtml(company.phone)}<br />
        ${escapeHtml(company.email)}
      </div>
      <div class="box">
        <h2>Client</h2>
        <strong>${escapeHtml(request.customer.name || "-")}</strong><br />
        Telefon: ${escapeHtml(request.customer.phone || "-")}<br />
        Email: ${escapeHtml(request.customer.email || "-")}<br />
        Adresa lucrare: ${escapeHtml(request.customer.address || "-")}<br />
        Montaj: ${request.customer.wantsInstallation ? "Da" : "Nu"}
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Produs / serviciu</th>
          <th class="right">Cantitate</th>
          <th>UM</th>
          <th class="right">Pret fara TVA</th>
          <th class="right">Pret cu TVA</th>
          <th class="right">Valoare</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (row, index) => `<tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(row.name)}</strong></td>
            <td class="right">${money(row.quantity)}</td>
            <td>${escapeHtml(row.unit)}</td>
            <td class="right">${money(row.priceWithoutVat)} lei</td>
            <td class="right">${money(row.priceWithVat)} lei</td>
            <td class="right"><strong>${money(row.value)} lei</strong></td>
          </tr>`,
                )
                .join("")
            : `<tr><td colspan="7">Nu exista produse in oferta.</td></tr>`
        }
      </tbody>
    </table>

    <section class="summary">
      <div class="total-row"><span>Tigla metalica</span><strong>${money(totals.tileValue)} lei</strong></div>
      <div class="total-row"><span>Discount tigla</span><strong>${request.tileDiscount}%</strong></div>
      <div class="total-row"><span>Accesorii si sistem pluvial</span><strong>${money(totals.systemValue)} lei</strong></div>
      <div class="total-row"><span>Discount sistem</span><strong>${request.systemDiscount}%</strong></div>
      <div class="total-row"><span>Manopera</span><strong>${money(request.labor)} lei</strong></div>
      <div class="total-row final"><span>Total oferta</span><strong>${money(totals.totalWithLabor)} lei</strong></div>
    </section>

    <section class="notes">
      <h2>Conditii oferta</h2>
      <p class="muted">Oferta este estimativa si se confirma in functie de disponibilitate, culoare, transport si masuratorile finale. Preturile sunt exprimate in lei si includ TVA.</p>
      <p><strong>Observatii client:</strong> ${escapeHtml(request.customer.notes || "Fara observatii.")}</p>
    </section>

    <section class="footer">
      <div class="muted">Pentru confirmare sau detalii: ${escapeHtml(company.phone)} | ${escapeHtml(company.email)}</div>
      <div class="signature">Semnatura / stampila</div>
    </section>
  </main>
</body>
</html>`;
}

function printOfferSheet(request: QuoteRequest, totals: QuoteTotals, catalog: ProductCatalog) {
  openGeneratedHtmlTab(buildOfferPrintHtml(request, totals, catalog));
}

function openEmailTemplateTab(request: QuoteRequest, subject: string, body: string, totals: QuoteTotals, catalog: ProductCatalog) {
  const profile = sheetSeries[request.seriesKey];
  const logoUrl = publicAssetUrl("nicoroof-logo.png");
  const activeSheets = totals.sheetRows.filter((row) => row.quantity > 0);
  const activeAccessories = totals.systemRows.filter((row) => row.quantity > 0);
  const issuedAt = new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const rows = [
    ...activeSheets.map((row) => ({
      name: `${catalog.sheetProduct.name} ${profile.name} - foaie ${row.length} m`,
      priceWithVat: row.priceWithVat,
      quantity: row.area,
      unit: catalog.sheetProduct.unit,
      value: row.value,
    })),
    ...activeAccessories.map((row) => ({
      name: row.name,
      priceWithVat: row.priceWithVat,
      quantity: row.quantity,
      unit: row.unit,
      value: row.value,
    })),
  ];
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
    body { background: #dfe7ee; color: #172026; font-family: Arial, sans-serif; margin: 0; }
    main { margin: 0 auto; max-width: 1200px; padding: 22px; }
    .topbar { align-items: center; background: #0f766e; border-radius: 8px; color: white; display: flex; justify-content: space-between; gap: 18px; margin: 0 auto 18px; max-width: 1150px; padding: 16px 20px; }
    .topbar h1 { font-size: 24px; margin: 0; }
    .topbar p { margin: 5px 0 0; opacity: 0.88; }
    .layout { align-items: start; display: grid; gap: 18px; grid-template-columns: minmax(0, 794px) 350px; justify-content: center; }
    .offer-card, .composer { background: white; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 16px 45px rgba(15, 23, 42, 0.12); }
    .offer-card { min-height: 1040px; padding: 30px; width: 100%; }
    .composer { padding: 18px; position: sticky; top: 18px; }
    .offer-header { align-items: start; border-bottom: 3px solid #0f766e; display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr) 210px; padding-bottom: 18px; }
    .brand { align-items: center; display: flex; gap: 12px; min-width: 0; }
    .brand img { background: white; border: 1px solid #dbe4ea; border-radius: 8px; height: 64px; object-fit: contain; object-position: center; padding: 6px; width: 64px; }
    h2 { font-size: 24px; margin: 0; }
    h3 { font-size: 16px; margin: 0 0 10px; }
    .muted { color: #64748b; }
    .meta { border: 1px solid #dbe4ea; border-radius: 8px; padding: 10px 12px; }
    .meta-row, .summary-row { display: flex; justify-content: space-between; gap: 14px; padding: 4px 0; }
    .grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; margin-top: 18px; }
    .box { border: 1px solid #dbe4ea; border-radius: 8px; font-size: 13px; line-height: 1.45; padding: 13px; }
    table { border-collapse: collapse; margin-top: 18px; table-layout: fixed; width: 100%; }
    th, td { border-bottom: 1px solid #e2e8f0; font-size: 12px; line-height: 1.35; padding: 8px 7px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; }
    .right { text-align: right; }
    .summary { background: #f8fafc; border: 1px solid #dbe4ea; border-radius: 8px; display: grid; gap: 0; margin: 20px 0 0 auto; max-width: 350px; padding: 10px 14px; }
    .summary-row { border-bottom: 1px solid #e2e8f0; padding: 7px 0; }
    .summary-row.final { background: #0f766e; border: 0; border-radius: 7px; color: white; font-size: 18px; font-weight: 800; margin-top: 8px; padding: 12px; }
    .notes { background: #f8fafc; border: 1px solid #dbe4ea; border-radius: 8px; font-size: 13px; line-height: 1.45; margin-top: 18px; padding: 13px; }
    label { color: #475569; display: grid; font-size: 13px; font-weight: 700; gap: 8px; margin-bottom: 14px; }
    input, textarea { border: 1px solid #cbd5e1; border-radius: 6px; color: #111827; font: inherit; padding: 12px; width: 100%; }
    textarea { min-height: 300px; resize: vertical; white-space: pre-wrap; }
    .actions { display: grid; gap: 10px; margin-top: 14px; }
    button { align-items: center; background: #0f766e; border: 0; border-radius: 6px; color: white; cursor: pointer; display: inline-flex; font-weight: 700; justify-content: center; min-height: 44px; padding: 0 16px; text-decoration: none; width: 100%; }
    button.secondary { background: #334155; }
    button.light { background: white; border: 1px solid #cbd5e1; color: #172026; }
    .hint { color: #64748b; font-size: 13px; line-height: 1.45; margin-top: 12px; }
    @page { margin: 14mm; size: A4; }
    @media print {
      body { background: white; }
      main { max-width: none; padding: 0; }
      .topbar, .composer { display: none; }
      .layout { display: block; }
      .offer-card { border: 0; box-shadow: none; min-height: auto; padding: 0; width: auto; }
      .offer-header { grid-template-columns: minmax(0, 1fr) 190px; }
      .brand img { height: 56px; width: 56px; }
      h2 { font-size: 22px; }
      h3 { font-size: 14px; }
      .box, .notes { font-size: 11.5px; }
      th, td { font-size: 10.5px; padding: 5px 6px; }
      .summary { max-width: 320px; }
      .summary-row.final { font-size: 16px; }
    }
    @media (max-width: 980px) {
      main { padding: 14px; }
      .layout, .offer-header, .grid { grid-template-columns: 1fr; }
      .composer { position: static; }
      .meta { min-width: 0; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <div>
        <h1>Raspuns oferta ${escapeHtml(request.id)}</h1>
        <p>Verifica oferta, exporta PDF-ul si trimite mesajul catre client.</p>
      </div>
      <strong>${money(totals.totalWithLabor)} lei</strong>
    </div>

    <div class="layout">
      <section class="offer-card">
        <div class="offer-header">
          <div class="brand">
            <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(company.name)}" />
            <div>
              <h2>Oferta comerciala</h2>
              <div class="muted">${escapeHtml(company.name)} | ${escapeHtml(company.phone)} | ${escapeHtml(company.email)}</div>
              <div class="muted">${escapeHtml(company.address)}</div>
            </div>
          </div>
          <div class="meta">
            <div class="meta-row"><span>Oferta</span><strong>${escapeHtml(request.id)}</strong></div>
            <div class="meta-row"><span>Data</span><strong>${issuedAt}</strong></div>
            <div class="meta-row"><span>Profil</span><strong>${escapeHtml(profile.name)}</strong></div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h3>Furnizor</h3>
            <strong>${escapeHtml(company.name)}</strong><br />
            CUI: ${escapeHtml(company.fiscalCode)}<br />
            ${escapeHtml(company.address)}<br />
            ${escapeHtml(company.phone)}<br />
            ${escapeHtml(company.email)}
          </div>
          <div class="box">
            <h3>Client</h3>
            <strong>${escapeHtml(request.customer.name || "-")}</strong><br />
            Telefon: ${escapeHtml(request.customer.phone || "-")}<br />
            Email: ${escapeHtml(request.customer.email || "-")}<br />
            Adresa lucrare: ${escapeHtml(request.customer.address || "-")}<br />
            Montaj: ${request.customer.wantsInstallation ? "Da" : "Nu"}
          </div>
        </div>

        <table>
          <colgroup>
            <col style="width: 38px;" />
            <col />
            <col style="width: 86px;" />
            <col style="width: 54px;" />
            <col style="width: 92px;" />
            <col style="width: 104px;" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Produs / serviciu</th>
              <th class="right">Cantitate</th>
              <th>UM</th>
              <th class="right">Pret cu TVA</th>
              <th class="right">Valoare</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length > 0
                ? rows
                    .map(
                      (row, index) => `<tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(row.name)}</strong></td>
                <td class="right">${money(row.quantity)}</td>
                <td>${escapeHtml(row.unit)}</td>
                <td class="right">${money(row.priceWithVat)} lei</td>
                <td class="right"><strong>${money(row.value)} lei</strong></td>
              </tr>`,
                    )
                    .join("")
                : `<tr><td colspan="6">Nu exista produse in oferta.</td></tr>`
            }
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Tigla metalica</span><strong>${money(totals.tileAfterDiscount)} lei</strong></div>
          <div class="summary-row"><span>Accesorii si sistem pluvial</span><strong>${money(totals.systemAfterDiscount)} lei</strong></div>
          <div class="summary-row"><span>Manopera</span><strong>${money(request.labor)} lei</strong></div>
          <div class="summary-row final"><span>Total oferta</span><strong>${money(totals.totalWithLabor)} lei</strong></div>
        </div>

        <div class="notes">
          <h3>Conditii oferta</h3>
          <p class="muted">Oferta se confirma in functie de disponibilitate, culoare, transport si masuratorile finale. Preturile sunt exprimate in lei si includ TVA.</p>
        </div>
      </section>

      <aside class="composer">
        <label>Catre
          <input id="to" type="email" value="${escapedTo}" />
        </label>
        <label>Subiect
          <input id="subject" value="${escapedSubject}" />
        </label>
        <label>Mesaj email
          <textarea id="body">${escapedBody}</textarea>
        </label>
        <div class="actions">
          <button class="secondary" type="button" onclick="copyMessage()">Copiaza mesaj</button>
          <button class="light" type="button" onclick="window.print()">Export PDF oferta</button>
          <button type="button" onclick="reply()">Deschide email</button>
        </div>
        <p class="hint">Pentru moment trimiterea se face prin clientul de email. PDF-ul exportat se ataseaza manual.</p>
      </aside>
    </div>
  </main>
  <script>
    async function copyMessage() {
      const body = document.getElementById('body').value;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(body);
      }
    }

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

function publicAssetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    return normalizedPath;
  }

  return `${window.location.origin}${normalizedPath}`;
}

async function openQuoteAttachment(attachment: QuoteAttachment, download = false) {
  try {
    const file = await getQuoteAttachmentFile(attachment.id);

    if (!file) {
      window.alert("Fisierul nu mai este disponibil in browser.");
      return;
    }

    const url = URL.createObjectURL(file);

    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Nu am putut deschide fisierul.");
  }
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("offers");
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [productCatalog, setProductCatalog] = useState<ProductCatalog>(defaultProductCatalog);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      const saveResult = saveStoredQuoteRequests(next);
      setSaveError(saveResult.ok ? null : saveResult.error);
      return next;
    });
  }

  function updateCatalog(updater: (catalog: ProductCatalog) => ProductCatalog) {
    setProductCatalog((current) => {
      const next = updater(current);
      const saveResult = saveStoredProductCatalog(next);
      setSaveError(saveResult.ok ? null : saveResult.error);
      return next;
    });
  }

  function migrateAccessoryNameKey(accessoryId: string | undefined, oldName: string) {
    const stableKey = accessoryId || oldName;

    setRequests((current) => {
      let changed = false;
      const next = current.map((request) => {
        const oldQuantity = request.accessoryQuantities[oldName];
        const oldPriceOverride = request.priceOverrides?.accessoryPrices?.[oldName];

        if (oldQuantity === undefined && oldPriceOverride === undefined) {
          return request;
        }

        changed = true;
        const accessoryQuantities = { ...request.accessoryQuantities };
        if (oldQuantity !== undefined && accessoryQuantities[stableKey] === undefined) {
          accessoryQuantities[stableKey] = oldQuantity;
        }
        if (stableKey !== oldName) {
          delete accessoryQuantities[oldName];
        }

        const accessoryPrices = { ...(request.priceOverrides?.accessoryPrices || {}) };
        if (oldPriceOverride !== undefined && accessoryPrices[stableKey] === undefined) {
          accessoryPrices[stableKey] = oldPriceOverride;
        }
        if (stableKey !== oldName) {
          delete accessoryPrices[oldName];
        }

        return {
          ...request,
          accessoryQuantities,
          priceOverrides: {
            ...(request.priceOverrides || {}),
            accessoryPrices,
          },
        };
      });

      if (changed) {
        const saveResult = saveStoredQuoteRequests(next);
        setSaveError(saveResult.ok ? null : saveResult.error);
      }

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
            {selectedRequest?.customer.email && selectedTotals ? (
              <Button
                type="button"
                onClick={() => {
                  openEmailTemplateTab(selectedRequest, generatedEmail.subject, generatedEmail.body, selectedTotals, productCatalog);
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

        {saveError ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-900 md:px-8" role="alert">
            {saveError}
          </div>
        ) : null}

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

        {activeSection === "products" ? <ProductsView productCatalog={productCatalog} updateCatalog={updateCatalog} onAccessoryRename={migrateAccessoryNameKey} /> : null}
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

      {filteredRequests.length === 0 ? (
        <div className="m-4 rounded-lg border border-dashed bg-slate-50 p-6 text-center">
          <ListChecks className="mx-auto size-8 text-primary" />
          <strong className="mt-3 block text-lg text-foreground">{query ? "Nu exista cereri pentru cautarea curenta." : "Nu există cereri încă."}</strong>
          <p className="mt-1 text-sm text-muted-foreground">{query ? "Sterge cautarea sau verifica termenul introdus." : "Cererile trimise din calculator vor aparea aici."}</p>
        </div>
      ) : (
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
                <span className="flex shrink-0 flex-wrap justify-end gap-2">
                  {request.attachments.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs font-bold text-primary">
                      <Paperclip className="size-3.5" />
                      {request.attachments.length} fisiere
                    </span>
                  ) : null}
                  <span className="w-fit rounded-full border bg-white px-2.5 py-1 text-xs font-bold">{request.status}</span>
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                <Metric label="Foi" value={`${totals.tileArea.toFixed(2)} mp`} />
                <Metric label="Accesorii" value={formatArticleCount(activeRows(totals.systemRows))} />
                <Metric label="Montaj" value={request.customer.wantsInstallation ? "Da" : "Nu"} />
                <Metric label="Total" value={`${money(totals.totalWithLabor)} lei`} />
              </div>
            </button>
          );
          })}
        </div>
      )}
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
  const [sheetLengthToAdd, setSheetLengthToAdd] = useState("");
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetVisibleCount, setSheetVisibleCount] = useState(20);
  const [sheetPickerOpen, setSheetPickerOpen] = useState(false);
  const [accessoryNameToAdd, setAccessoryNameToAdd] = useState("");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [accessoryVisibleCount, setAccessoryVisibleCount] = useState(20);
  const [accessoryPickerOpen, setAccessoryPickerOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ attachment: QuoteAttachment; url: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewAttachment) {
        URL.revokeObjectURL(previewAttachment.url);
      }
    };
  }, [previewAttachment]);

  useEffect(() => {
    if (!open) {
      setPreviewAttachment(null);
    }
  }, [open]);

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
  const availableSheetRows = selectedTotals.sheetRows.filter((row) => row.quantity === 0);
  const filteredAvailableSheetRows = availableSheetRows.filter((row) => `Foaie ${row.length} m`.toLowerCase().includes(sheetSearch.toLowerCase()));
  const visibleAvailableSheetRows = filteredAvailableSheetRows.slice(0, sheetVisibleCount);
  const selectedSheetLengthToAdd = sheetLengthToAdd || String(filteredAvailableSheetRows[0]?.length || "");
  const activeAccessoryRows = selectedTotals.systemRows.filter((row) => row.quantity > 0);
  const availableAccessoryRows = selectedTotals.systemRows.filter((row) => row.quantity === 0);
  const filteredAvailableAccessoryRows = availableAccessoryRows.filter((row) => row.name.toLowerCase().includes(accessorySearch.toLowerCase()));
  const visibleAvailableAccessoryRows = filteredAvailableAccessoryRows.slice(0, accessoryVisibleCount);
  const selectedAccessoryNameToAdd = accessoryNameToAdd || filteredAvailableAccessoryRows[0]?.id || "";

  function openReplyTab() {
    openEmailTemplateTab(selectedRequest, emailSubject, emailBody, selectedTotals, productCatalog);
    updateRequest(selectedRequest.id, (request) => ({ ...request, status: "Ofertata" }));
  }

  function updateCustomer<Key extends keyof QuoteRequest["customer"]>(key: Key, value: QuoteRequest["customer"][Key]) {
    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      customer: {
        ...request.customer,
        [key]: value,
      },
    }));
  }

  function updateSheetQuantity(length: number, quantity: number) {
    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      sheetQuantities: {
        ...request.sheetQuantities,
        [String(length)]: quantity,
      },
    }));
  }

  function addSheetRow() {
    const length = Number.parseFloat(selectedSheetLengthToAdd);

    if (!Number.isFinite(length)) {
      return;
    }

    updateSheetQuantity(length, 1);
    setSheetLengthToAdd("");
    setSheetSearch("");
    setSheetVisibleCount(20);
    setSheetPickerOpen(false);
  }

  function updateSheetPrice(field: "sheetPriceWithoutVat" | "sheetPriceWithVat", value: number) {
    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      priceOverrides: {
        accessoryPrices: request.priceOverrides?.accessoryPrices || {},
        ...request.priceOverrides,
        [field]: value,
      },
    }));
  }

  function updateAccessoryQuantity(id: string, quantity: number) {
    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      accessoryQuantities: {
        ...request.accessoryQuantities,
        [id]: quantity,
      },
    }));
  }

  function addAccessoryRow() {
    if (!selectedAccessoryNameToAdd) {
      return;
    }

    updateAccessoryQuantity(selectedAccessoryNameToAdd, 1);
    setAccessoryNameToAdd("");
    setAccessorySearch("");
    setAccessoryVisibleCount(20);
    setAccessoryPickerOpen(false);
  }

  function updateAccessoryPrice(id: string, field: "priceWithoutVat" | "priceWithVat", value: number) {
    updateRequest(selectedRequest.id, (request) => ({
      ...request,
      priceOverrides: {
        ...request.priceOverrides,
        accessoryPrices: {
          ...(request.priceOverrides?.accessoryPrices || {}),
          [id]: {
            ...(request.priceOverrides?.accessoryPrices?.[id] || {}),
            [field]: value,
          },
        },
      },
    }));
  }

  async function openAttachmentPreview(attachment: QuoteAttachment) {
    if (!attachment.type.startsWith("image/")) {
      await openQuoteAttachment(attachment);
      return;
    }

    try {
      const file = await getQuoteAttachmentFile(attachment.id);

      if (!file) {
        window.alert("Fisierul nu mai este disponibil in browser.");
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewAttachment((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }

        return { attachment, url };
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Nu am putut deschide fisierul.");
    }
  }

  function closeAttachmentPreview() {
    setPreviewAttachment((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });
  }

  return (
    <>
    <div className="fixed inset-0 z-50 grid bg-slate-950/60 p-0 sm:p-3 md:p-6" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white shadow-soft sm:rounded-lg">
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase text-primary">Detalii comanda</p>
            <h2 className="break-words text-xl font-bold sm:text-2xl" id="order-modal-title">
              {selectedRequest.id} - {selectedRequest.customer.name || "Client fara nume"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formattedCreatedAt} | {profile.name} | {selectedTotals.totalWithLabor ? `${money(selectedTotals.totalWithLabor)} lei` : "fara valoare"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:justify-end">
            <Button
              className="min-h-10 border-slate-300 px-3 text-foreground hover:bg-slate-50"
              type="button"
              variant="outline"
              onClick={() => printWarehouseSheet(selectedRequest, selectedTotals, productCatalog)}
            >
              <FileSpreadsheet className="mr-2 size-4" />
              Fisa depozit
            </Button>
            <Button
              className="min-h-10 border-slate-300 px-3 text-foreground hover:bg-slate-50"
              type="button"
              variant="outline"
              onClick={() => printOfferSheet(selectedRequest, selectedTotals, productCatalog)}
            >
              <FileText className="mr-2 size-4" />
              Oferta PDF
            </Button>
            <Button type="button" onClick={openReplyTab}>
              <Send className="mr-2 size-4" />
              Raspunde oferta
            </Button>
            <button
              aria-label="Inchide detaliile comenzii"
              className="grid min-h-10 place-items-center rounded-md border bg-white text-foreground hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-11"
              type="button"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-24 sm:p-5 sm:pb-10">
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="grid gap-5 xl:sticky xl:top-0 xl:self-start">
              <section className="rounded-lg border bg-slate-50 p-4">
                <h3 className="mb-4 font-bold">Date client</h3>
                <div className="grid gap-4">
                  <TextField label="Client" value={selectedRequest.customer.name} onChange={(value) => updateCustomer("name", value)} />
                  <TextField label="Telefon" value={selectedRequest.customer.phone} onChange={(value) => updateCustomer("phone", value)} />
                  <TextField label="Email" value={selectedRequest.customer.email} onChange={(value) => updateCustomer("email", value)} />
                  <TextField label="Adresa lucrare" value={selectedRequest.customer.address} onChange={(value) => updateCustomer("address", value)} />
                  <label className="flex items-center gap-3 rounded-md border bg-white p-3 text-sm font-semibold text-foreground">
                    <input
                      checked={selectedRequest.customer.wantsInstallation}
                      className="size-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      type="checkbox"
                      onChange={(event) => updateCustomer("wantsInstallation", event.target.checked)}
                    />
                    Vreau oferta si pentru montaj
                  </label>
                  <div className="grid gap-2 text-sm font-semibold text-muted-foreground">
                    Observatii client
                    <p className="min-h-24 whitespace-pre-wrap break-words rounded-md border bg-white px-3 py-3 font-normal text-foreground">
                      {selectedRequest.customer.notes || "Fara observatii."}
                    </p>
                  </div>
                  <InfoLine icon={<CheckCircle2 className="size-4" />} label="Data cerere" value={formattedCreatedAt} />
                </div>
              </section>

              {selectedRequest.attachments.length > 0 ? (
                <section className="rounded-lg border bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold">Atasamente client</h3>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-primary">{selectedRequest.attachments.length}</span>
                  </div>
                  <ul className="grid gap-2">
                    {selectedRequest.attachments.map((attachment) => (
                      <li className="rounded-md border bg-slate-50 p-3" key={attachment.id}>
                        <div className="flex items-start gap-2">
                          <Paperclip className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <strong className="block truncate text-sm text-foreground">{attachment.name}</strong>
                            <span className="block text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border bg-white px-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="button"
                            onClick={() => void openAttachmentPreview(attachment)}
                          >
                            <ExternalLink className="size-3.5" />
                            Deschide
                          </button>
                          <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border bg-white px-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            type="button"
                            onClick={() => void openQuoteAttachment(attachment, true)}
                          >
                            <Download className="size-3.5" />
                            Descarca
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

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

            </aside>

            <section className="grid min-w-0 gap-5">
              <div className="rounded-lg border bg-white p-4">
                <h3 className="font-bold">Profil si foi tigla</h3>
                <p className="mt-1 text-sm text-muted-foreground">{profile.name}</p>
                <div className="mt-4 rounded-md border bg-slate-50 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <label className="grid gap-2 text-sm font-semibold text-muted-foreground md:w-72">
                      Profil tigla
                      <select
                        aria-label="Profil tigla pentru rand nou"
                        className="min-h-10 rounded-md border bg-white px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        name="quote-series-add-row"
                        value={selectedRequest.seriesKey}
                        onChange={(event) => {
                          setSheetLengthToAdd("");
                          setSheetSearch("");
                          setSheetVisibleCount(20);
                          setSheetPickerOpen(false);
                          updateRequest(selectedRequest.id, (request) => ({
                            ...request,
                            seriesKey: event.target.value as SeriesKey,
                            sheetQuantities: {},
                          }));
                        }}
                      >
                        {Object.entries(sheetSeries).map(([key, series]) => (
                          <option key={key} value={key}>
                            {series.name} - {series.usableWidth} m
                          </option>
                        ))}
                      </select>
                    </label>
                    <fieldset
                      className="relative m-0 grid min-w-0 flex-1 gap-2 border-0 p-0 text-sm font-semibold text-muted-foreground"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setSheetPickerOpen(false);
                        }
                      }}
                    >
                      <label htmlFor="modal-sheet-search">Adauga foaie tigla</label>
                      <div className="flex min-h-10 items-center gap-2 rounded-md border bg-white px-3 text-foreground focus-within:ring-2 focus-within:ring-ring">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <input
                          className="w-full bg-transparent outline-none"
                          disabled={availableSheetRows.length === 0}
                          id="modal-sheet-search"
                          placeholder={availableSheetRows.length === 0 ? "Toate foile sunt adaugate" : "Cauta foaie..."}
                          type="search"
                          value={sheetSearch}
                          onChange={(event) => {
                            setSheetSearch(event.target.value);
                            setSheetLengthToAdd("");
                            setSheetVisibleCount(20);
                            setSheetPickerOpen(true);
                          }}
                          onFocus={() => setSheetPickerOpen(true)}
                        />
                      </div>
                      {sheetPickerOpen && availableSheetRows.length > 0 ? (
                        <div
                          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-md border bg-white py-1 shadow-soft"
                          onScroll={(event) => {
                            const target = event.currentTarget;

                            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                              setSheetVisibleCount((current) => Math.min(current + 20, filteredAvailableSheetRows.length));
                            }
                          }}
                        >
                          {visibleAvailableSheetRows.length > 0 ? (
                            visibleAvailableSheetRows.map((row) => (
                              <button
                                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  selectedSheetLengthToAdd === String(row.length) ? "bg-teal-50 text-primary" : "text-foreground"
                                }`}
                                key={row.length}
                                type="button"
                                onClick={() => {
                                  setSheetLengthToAdd(String(row.length));
                                  setSheetSearch(`Foaie ${row.length} m`);
                                  setSheetPickerOpen(false);
                                }}
                              >
                                <span className="block font-semibold">Foaie {row.length} m</span>
                                <span className="text-xs text-muted-foreground">
                                  {(row.length * profile.usableWidth).toFixed(2)} mp / buc
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-sm text-muted-foreground">Nu exista rezultate.</div>
                          )}
                        </div>
                      ) : null}
                    </fieldset>
                    <Button disabled={!selectedSheetLengthToAdd} type="button" onClick={addSheetRow}>
                      <Plus className="mr-2 size-4" />
                      Adauga rand
                    </Button>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[220px]" />
                      <col className="w-[120px]" />
                      <col className="w-[120px]" />
                      <col className="w-[150px]" />
                      <col className="w-[150px]" />
                      <col className="w-[140px]" />
                      <col className="w-[80px]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Dimensiune</th>
                        <th className="px-3 py-2 text-right">Nr buc</th>
                        <th className="px-3 py-2 text-right">Mp</th>
                        <th className="px-3 py-2 text-right">Pret fara TVA</th>
                        <th className="px-3 py-2 text-right">Pret cu TVA</th>
                        <th className="px-3 py-2 text-right">Valoare</th>
                        <th className="px-3 py-2 text-right">
                          <span className="sr-only">Sterge</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSheetRows.length === 0 ? (
                        <tr className="border-t">
                          <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={7}>
                            Nu sunt foi de tigla in oferta. Adauga un rand nou.
                          </td>
                        </tr>
                      ) : null}
                      {activeSheetRows.map((row) => (
                        <tr className="border-t" key={row.length}>
                          <td className="px-3 py-2 font-semibold">Foaie {row.length} m</td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="numeric"
                              min={0}
                              type="number"
                              value={row.quantity || ""}
                              onChange={(event) => updateSheetQuantity(row.length, parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">{row.area.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              type="number"
                              value={row.priceWithoutVat || ""}
                              onChange={(event) => updateSheetPrice("sheetPriceWithoutVat", parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              type="number"
                              value={row.priceWithVat || ""}
                              onChange={(event) => updateSheetPrice("sheetPriceWithVat", parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{money(row.value)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              aria-label={`Sterge foaie ${row.length} m`}
                              className="ml-auto grid size-10 place-items-center rounded-md border bg-white text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              type="button"
                              onClick={() => updateSheetQuantity(row.length, 0)}
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

              <div className="rounded-lg border bg-white p-4">
                <h3 className="font-bold">Accesorii si sistem pluvial</h3>
                <p className="mt-1 text-sm text-muted-foreground">Editeaza doar accesoriile adaugate in cerere.</p>
                <div className="mt-4 rounded-md border bg-slate-50 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <fieldset
                      className="relative m-0 grid min-w-0 flex-1 gap-2 border-0 p-0 text-sm font-semibold text-muted-foreground"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setAccessoryPickerOpen(false);
                        }
                      }}
                    >
                      <label htmlFor="modal-accessory-search">Adauga accesoriu</label>
                      <div className="flex min-h-10 items-center gap-2 rounded-md border bg-white px-3 text-foreground focus-within:ring-2 focus-within:ring-ring">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <input
                          className="w-full bg-transparent outline-none"
                          disabled={availableAccessoryRows.length === 0}
                          id="modal-accessory-search"
                          placeholder={availableAccessoryRows.length === 0 ? "Toate accesoriile sunt adaugate" : "Cauta accesoriu..."}
                          type="search"
                          value={accessorySearch}
                          onChange={(event) => {
                            setAccessorySearch(event.target.value);
                            setAccessoryNameToAdd("");
                            setAccessoryVisibleCount(20);
                            setAccessoryPickerOpen(true);
                          }}
                          onFocus={() => setAccessoryPickerOpen(true)}
                        />
                      </div>
                      {accessoryPickerOpen && availableAccessoryRows.length > 0 ? (
                        <div
                          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-md border bg-white py-1 shadow-soft"
                          onScroll={(event) => {
                            const target = event.currentTarget;

                            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                              setAccessoryVisibleCount((current) => Math.min(current + 20, filteredAvailableAccessoryRows.length));
                            }
                          }}
                        >
                          {visibleAvailableAccessoryRows.length > 0 ? (
                            visibleAvailableAccessoryRows.map((row) => (
                              <button
                                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  selectedAccessoryNameToAdd === row.id ? "bg-teal-50 text-primary" : "text-foreground"
                                }`}
                                key={row.id}
                                type="button"
                                onClick={() => {
                                  setAccessoryNameToAdd(row.id);
                                  setAccessorySearch(row.name);
                                  setAccessoryPickerOpen(false);
                                }}
                              >
                                <span className="block font-semibold">{row.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {money(row.priceWithVat)} lei / {row.unit}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-sm text-muted-foreground">Nu exista rezultate.</div>
                          )}
                        </div>
                      ) : null}
                    </fieldset>
                    <Button disabled={!selectedAccessoryNameToAdd} type="button" onClick={addAccessoryRow}>
                      <Plus className="mr-2 size-4" />
                      Adauga accesoriu
                    </Button>
                  </div>
                </div>
                <div className="mt-4 max-h-[560px] overflow-auto rounded-md border">
                  <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[52px]" />
                      <col className="w-[330px]" />
                      <col className="w-[150px]" />
                      <col className="w-[150px]" />
                      <col className="w-[140px]" />
                      <col className="w-[80px]" />
                      <col className="w-[140px]" />
                      <col className="w-[80px]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Produs</th>
                        <th className="px-3 py-2 text-right">Pret fara TVA</th>
                        <th className="px-3 py-2 text-right">Pret cu TVA</th>
                        <th className="px-3 py-2 text-right">Cantitate</th>
                        <th className="px-3 py-2">UM</th>
                        <th className="px-3 py-2 text-right">Valoare</th>
                        <th className="px-3 py-2 text-right">
                          <span className="sr-only">Sterge</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAccessoryRows.length === 0 ? (
                        <tr className="border-t">
                          <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={8}>
                            Nu sunt accesorii in oferta. Adauga un accesoriu nou.
                          </td>
                        </tr>
                      ) : null}
                      {activeAccessoryRows.map((row, index) => (
                        <tr className="border-t" key={row.id}>
                          <td className="px-3 py-2 align-middle">{index + 1}</td>
                          <td className="break-words px-3 py-2 align-middle font-semibold">{row.name}</td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              type="number"
                              value={row.priceWithoutVat || ""}
                              onChange={(event) => updateAccessoryPrice(row.id, "priceWithoutVat", parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              type="number"
                              value={row.priceWithVat || ""}
                              onChange={(event) => updateAccessoryPrice(row.id, "priceWithVat", parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="min-h-10 w-full rounded-md border bg-white px-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              inputMode="decimal"
                              min={0}
                              type="number"
                              value={row.quantity || ""}
                              onChange={(event) => updateAccessoryQuantity(row.id, parseNumber(event.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2 align-middle">{row.unit}</td>
                          <td className="px-3 py-2 text-right align-middle font-semibold">{money(row.value)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              aria-label={`Sterge ${row.name}`}
                              className="ml-auto grid size-10 place-items-center rounded-md border bg-white text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              type="button"
                              onClick={() => updateAccessoryQuantity(row.id, 0)}
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

              <div className="pb-4">
                <TotalsTable selectedRequest={selectedRequest} selectedTotals={selectedTotals} />
              </div>
            </section>
          </div>
          <div className="sticky bottom-4 z-30 mt-5 flex justify-end">
            <div className="w-full max-w-md rounded-lg border bg-white/95 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-muted-foreground">Materiale</span>
                  <strong>{money(selectedTotals.totalWithoutLabor)} lei</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-muted-foreground">Manopera</span>
                  <strong>{money(selectedRequest.labor)} lei</strong>
                </div>
                <div className="flex items-center justify-between gap-4 border-t pt-2">
                  <span className="font-bold">Total final</span>
                  <strong className="text-xl text-primary">{money(selectedTotals.totalWithLabor)} lei</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {previewAttachment ? (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label={`Previzualizare ${previewAttachment.attachment.name}`}>
        <button className="absolute inset-0 cursor-default" type="button" aria-label="Inchide previzualizarea" onClick={closeAttachmentPreview} />
        <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <strong className="block truncate text-sm">{previewAttachment.attachment.name}</strong>
              <span className="text-xs text-muted-foreground">{formatFileSize(previewAttachment.attachment.size)}</span>
            </div>
            <button
              className="grid size-10 shrink-0 place-items-center rounded-md border bg-white text-foreground hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
              aria-label="Inchide"
              onClick={closeAttachmentPreview}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid min-h-0 place-items-center overflow-auto bg-slate-100 p-3">
            <Image
              className="h-auto max-h-[70vh] w-auto max-w-full object-contain"
              alt={previewAttachment.attachment.name}
              height={900}
              src={previewAttachment.url}
              unoptimized
              width={1200}
            />
          </div>
          <div className="flex justify-end gap-2 border-t px-4 py-3">
            <Button className="min-h-10" type="button" variant="outline" onClick={() => void openQuoteAttachment(previewAttachment.attachment, true)}>
              <Download className="mr-2 size-4" />
              Descarca
            </Button>
          </div>
        </div>
      </div>
    ) : null}
    </>
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

  function updateAccessoryQuantity(id: string, quantity: number) {
    setExcelRequest((current) => ({
      ...current,
      accessoryQuantities: {
        ...current.accessoryQuantities,
        [id]: quantity,
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
                      <tr className="border-t" key={row.id}>
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
                            onChange={(event) => updateAccessoryQuantity(row.id, parseNumber(event.target.value))}
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
  onAccessoryRename,
}: {
  productCatalog: ProductCatalog;
  updateCatalog: (updater: (catalog: ProductCatalog) => ProductCatalog) => void;
  onAccessoryRename: (accessoryId: string | undefined, oldName: string) => void;
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
    const currentAccessory = productCatalog.accessories[index];
    if (field === "name" && currentAccessory) {
      onAccessoryRename(currentAccessory.id, currentAccessory.name);
    }

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
          id: createCatalogAccessoryId(),
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
                  <tr className="border-t" key={accessory.id || `${accessory.name}-${index}`}>
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

function formatArticleCount(count: number) {
  return `${count} ${count === 1 ? "articol" : "articole"}`;
}

function _ExcelSheetsPanel({ productCatalog, selectedTotals }: { productCatalog: ProductCatalog; selectedTotals: QuoteTotals }) {
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
                <tr className="border-t" key={row.id}>
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
        value={value || ""}
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
        value={value || ""}
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
