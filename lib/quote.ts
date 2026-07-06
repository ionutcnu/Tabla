import { accessories, auxiliarySheetTables, moduleSheetOptions, sheetProduct, sheetSeries } from "@/lib/offer-data";

export type QuoteStatus = "Noua" | "Contactat" | "Ofertata" | "Acceptata" | "Respinsa";
export type SeriesKey = keyof typeof sheetSeries;

export type CatalogAccessory = {
  description?: string;
  id?: string;
  name: string;
  priceWithoutVat: number;
  priceWithVat: number;
  unit: string;
};

export type CatalogSheetProduct = {
  description?: string;
  name: string;
  priceWithoutVat: number;
  priceWithVat: number;
  unit: string;
};

export type ProductCatalog = {
  accessories: CatalogAccessory[];
  sheetProduct: CatalogSheetProduct;
};

export type CustomerInfo = {
  address: string;
  email: string;
  name: string;
  phone: string;
  wantsInstallation: boolean;
  notes: string;
};

export type QuotePriceOverrides = {
  accessoryPrices: Record<
    string,
    {
      priceWithoutVat?: number;
      priceWithVat?: number;
    }
  >;
  sheetPriceWithoutVat?: number;
  sheetPriceWithVat?: number;
};

export type QuoteAttachment = {
  createdAt: string;
  id: string;
  name: string;
  size: number;
  type: string;
};

export type QuoteRequest = {
  accessoryQuantities: Record<string, number>;
  attachments: QuoteAttachment[];
  auxiliarySheetQuantities: Record<string, Record<string, number>>;
  createdAt: string;
  customer: CustomerInfo;
  id: string;
  labor: number;
  moduleQuantities: Record<string, number>;
  priceOverrides?: QuotePriceOverrides;
  seriesKey: SeriesKey;
  sheetQuantities: Record<string, number>;
  status: QuoteStatus;
  systemDiscount: number;
  tileDiscount: number;
};

export type QuoteTotals = {
  auxiliarySheetTables: Array<{
    key: string;
    name: string;
    rows: Array<{ area: number; length: number; quantity: number }>;
    totalArea: number;
    usableWidth: number;
  }>;
  moduleRows: Array<{ area: number; label: string; length: number; modules: number; quantity: number }>;
  moduleTotalArea: number;
  sheetRows: Array<{ area: number; length: number; priceWithoutVat: number; priceWithVat: number; quantity: number; value: number }>;
  systemAfterDiscount: number;
  systemRows: Array<{
    id: string;
    name: string;
    priceWithoutVat: number;
    priceWithVat: number;
    quantity: number;
    unit: string;
    value: number;
  }>;
  systemValue: number;
  tileAfterDiscount: number;
  tileArea: number;
  tileValue: number;
  totalWithLabor: number;
  totalWithoutLabor: number;
};

export const quoteStorageKey = "nicoroof.quoteRequests.v1";
export const productCatalogStorageKey = "nicoroof.productCatalog.v1";

const validQuoteStatuses = new Set<QuoteStatus>(["Noua", "Contactat", "Ofertata", "Acceptata", "Respinsa"]);
const validSeriesKeys = new Set<SeriesKey>(Object.keys(sheetSeries) as SeriesKey[]);

type SaveResult = { ok: true } | { error: string; ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeNonNegativeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function safeQuantityMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, quantity]) => [key, safeNonNegativeNumber(quantity)] as const)
      .filter(([, quantity]) => quantity > 0),
  );
}

function safeNestedQuantityMap(value: unknown): Record<string, Record<string, number>> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(Object.entries(value).map(([key, quantities]) => [key, safeQuantityMap(quantities)]));
}

function safeAttachments(value: unknown): QuoteAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((attachment) => ({
      createdAt: safeText(attachment.createdAt, new Date().toISOString()),
      id: safeText(attachment.id),
      name: safeText(attachment.name),
      size: safeNonNegativeNumber(attachment.size),
      type: safeText(attachment.type),
    }))
    .filter((attachment) => attachment.id && attachment.name && attachment.size > 0);
}

function stableAccessoryId(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `accessory-${slug || index + 1}`;
}

function getAccessoryId(accessory: CatalogAccessory, index: number) {
  return accessory.id || stableAccessoryId(accessory.name, index);
}

export function createCatalogAccessoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `accessory-${crypto.randomUUID()}`;
  }

  return `accessory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateQuoteRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `NM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `NM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const defaultProductCatalog: ProductCatalog = {
  accessories: accessories.map((accessory, index) => ({
    ...accessory,
    id: stableAccessoryId(accessory.name, index),
  })),
  sheetProduct,
};

function normalizeAccessory(value: unknown, fallback: CatalogAccessory, index: number): CatalogAccessory | null {
  const source = isRecord(value) ? value : {};
  const name = safeText(source.name, fallback.name).trim();

  if (!name) {
    return null;
  }

  return {
    description: safeText(source.description, fallback.description),
    id: safeText(source.id, fallback.id || stableAccessoryId(name, index)) || stableAccessoryId(name, index),
    name,
    priceWithoutVat: safeNonNegativeNumber(source.priceWithoutVat, fallback.priceWithoutVat),
    priceWithVat: safeNonNegativeNumber(source.priceWithVat, fallback.priceWithVat),
    unit: safeText(source.unit, fallback.unit).trim() || fallback.unit,
  };
}

function normalizeProductCatalog(value: unknown): ProductCatalog {
  const parsed = isRecord(value) ? value : {};
  const parsedSheetProduct = isRecord(parsed.sheetProduct) ? parsed.sheetProduct : {};
  const accessoriesToNormalize = Array.isArray(parsed.accessories) ? parsed.accessories : defaultProductCatalog.accessories;

  return {
    accessories: accessoriesToNormalize
      .map((accessory, index) => normalizeAccessory(accessory, defaultProductCatalog.accessories[index] || defaultProductCatalog.accessories[0], index))
      .filter((accessory): accessory is CatalogAccessory => Boolean(accessory)),
    sheetProduct: {
      description: safeText(parsedSheetProduct.description, defaultProductCatalog.sheetProduct.description),
      name: safeText(parsedSheetProduct.name, defaultProductCatalog.sheetProduct.name).trim() || defaultProductCatalog.sheetProduct.name,
      priceWithoutVat: safeNonNegativeNumber(parsedSheetProduct.priceWithoutVat, defaultProductCatalog.sheetProduct.priceWithoutVat),
      priceWithVat: safeNonNegativeNumber(parsedSheetProduct.priceWithVat, defaultProductCatalog.sheetProduct.priceWithVat),
      unit: safeText(parsedSheetProduct.unit, defaultProductCatalog.sheetProduct.unit).trim() || defaultProductCatalog.sheetProduct.unit,
    },
  };
}

function safeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function normalizePriceOverrides(value: unknown): QuotePriceOverrides {
  const parsed = isRecord(value) ? value : {};
  const accessoryPrices = isRecord(parsed.accessoryPrices) ? parsed.accessoryPrices : {};

  return {
    accessoryPrices: Object.fromEntries(
      Object.entries(accessoryPrices)
        .filter(([, override]) => isRecord(override))
        .map(([key, override]) => {
          const priceOverride = override as Record<string, unknown>;

          return [
            key,
            {
              priceWithoutVat: safeOptionalNumber(priceOverride.priceWithoutVat),
              priceWithVat: safeOptionalNumber(priceOverride.priceWithVat),
            },
          ];
        }),
    ),
    sheetPriceWithoutVat: safeOptionalNumber(parsed.sheetPriceWithoutVat),
    sheetPriceWithVat: safeOptionalNumber(parsed.sheetPriceWithVat),
  };
}

function normalizeQuoteRequest(value: unknown): QuoteRequest | null {
  if (!isRecord(value)) {
    return null;
  }

  const customer = isRecord(value.customer) ? value.customer : {};
  const seriesKey = safeText(value.seriesKey);
  const status = safeText(value.status);

  return {
    accessoryQuantities: safeQuantityMap(value.accessoryQuantities),
    attachments: safeAttachments(value.attachments),
    auxiliarySheetQuantities: safeNestedQuantityMap(value.auxiliarySheetQuantities),
    createdAt: safeText(value.createdAt, new Date().toISOString()),
    customer: {
      address: safeText(customer.address),
      email: safeText(customer.email),
      name: safeText(customer.name),
      notes: safeText(customer.notes),
      phone: safeText(customer.phone),
      wantsInstallation: typeof customer.wantsInstallation === "boolean" ? customer.wantsInstallation : false,
    },
    id: safeText(value.id, generateQuoteRequestId()) || generateQuoteRequestId(),
    labor: safeNonNegativeNumber(value.labor),
    moduleQuantities: safeQuantityMap(value.moduleQuantities),
    priceOverrides: normalizePriceOverrides(value.priceOverrides),
    seriesKey: validSeriesKeys.has(seriesKey as SeriesKey) ? (seriesKey as SeriesKey) : "clasic",
    sheetQuantities: safeQuantityMap(value.sheetQuantities),
    status: validQuoteStatuses.has(status as QuoteStatus) ? (status as QuoteStatus) : "Noua",
    systemDiscount: safeNonNegativeNumber(value.systemDiscount),
    tileDiscount: safeNonNegativeNumber(value.tileDiscount),
  };
}

export function calculateQuoteTotals(request: QuoteRequest, catalog: ProductCatalog = defaultProductCatalog): QuoteTotals {
  const selectedSeries = sheetSeries[request.seriesKey];
  const sheetQuantities = request.sheetQuantities || {};
  const accessoryQuantities = request.accessoryQuantities || {};
  const auxiliarySheetQuantities = request.auxiliarySheetQuantities || {};
  const moduleQuantities = request.moduleQuantities || {};
  const priceOverrides = request.priceOverrides || { accessoryPrices: {} };
  const sheetPriceWithoutVat = priceOverrides.sheetPriceWithoutVat ?? catalog.sheetProduct.priceWithoutVat;
  const sheetPriceWithVat = priceOverrides.sheetPriceWithVat ?? catalog.sheetProduct.priceWithVat;
  const sheetRows = selectedSeries.lengths.map((length) => {
    const quantity = sheetQuantities[String(length)] || 0;
    const area = length * selectedSeries.usableWidth * quantity;
    const value = area * sheetPriceWithVat;

    return { area, length, priceWithoutVat: sheetPriceWithoutVat, priceWithVat: sheetPriceWithVat, quantity, value };
  });
  const tileArea = sheetRows.reduce((sum, row) => sum + row.area, 0);
  const tileValue = sheetRows.reduce((sum, row) => sum + row.value, 0);
  const systemRows = catalog.accessories.map((accessory, index) => {
    const id = getAccessoryId(accessory, index);
    const quantity = accessoryQuantities[id] ?? accessoryQuantities[accessory.name] ?? 0;
    const accessoryPriceOverride = priceOverrides.accessoryPrices?.[id] ?? priceOverrides.accessoryPrices?.[accessory.name] ?? {};
    const priceWithoutVat = accessoryPriceOverride.priceWithoutVat ?? accessory.priceWithoutVat;
    const priceWithVat = accessoryPriceOverride.priceWithVat ?? accessory.priceWithVat;
    const value = quantity * priceWithVat;

    return {
      id,
      name: accessory.name,
      priceWithoutVat,
      priceWithVat,
      quantity,
      unit: accessory.unit,
      value,
    };
  });
  const systemValue = systemRows.reduce((sum, row) => sum + row.value, 0);
  const tileAfterDiscount = tileValue - (tileValue * request.tileDiscount) / 100;
  const systemAfterDiscount = systemValue - (systemValue * request.systemDiscount) / 100;
  const totalWithoutLabor = tileAfterDiscount + systemAfterDiscount;
  const calculatedAuxiliarySheetTables = auxiliarySheetTables.map((table) => {
    const rows = table.lengths.map((length) => {
      const quantity = auxiliarySheetQuantities[table.key]?.[String(length)] || 0;
      const area = length * table.usableWidth * quantity;

      return { area, length, quantity };
    });

    return {
      key: table.key,
      name: table.name,
      rows,
      totalArea: rows.reduce((sum, row) => sum + row.area, 0),
      usableWidth: table.usableWidth,
    };
  });
  const moduleRows = moduleSheetOptions.map((option) => {
    const quantity = moduleQuantities[String(option.length)] || 0;
    const area = quantity * option.length * 1.2;

    return { ...option, area, quantity };
  });
  const moduleTotalArea = moduleRows.reduce((sum, row) => sum + row.area, 0);

  return {
    auxiliarySheetTables: calculatedAuxiliarySheetTables,
    moduleRows,
    moduleTotalArea,
    sheetRows,
    systemAfterDiscount,
    systemRows,
    systemValue,
    tileAfterDiscount,
    tileArea,
    tileValue,
    totalWithLabor: totalWithoutLabor + request.labor,
    totalWithoutLabor,
  };
}

export function createEmptyQuoteRequest(): QuoteRequest {
  return {
    accessoryQuantities: {},
    attachments: [],
    auxiliarySheetQuantities: {},
    createdAt: new Date().toISOString(),
    customer: {
      address: "",
      email: "",
      name: "",
      notes: "",
      phone: "",
      wantsInstallation: false,
    },
    id: generateQuoteRequestId(),
    labor: 0,
    moduleQuantities: {},
    priceOverrides: {
      accessoryPrices: {},
    },
    seriesKey: "clasic",
    sheetQuantities: {},
    status: "Noua",
    systemDiscount: 0,
    tileDiscount: 0,
  };
}

export function getStoredQuoteRequests(): QuoteRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(quoteStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((request) => normalizeQuoteRequest(request))
      .filter((request): request is QuoteRequest => Boolean(request));
  } catch {
    return [];
  }
}

export function saveStoredQuoteRequests(requests: QuoteRequest[]): SaveResult {
  if (typeof window === "undefined") {
    return { error: "Stocarea nu este disponibila in acest context.", ok: false };
  }

  try {
    window.localStorage.setItem(quoteStorageKey, JSON.stringify(requests));
    return { ok: true };
  } catch {
    return { error: "Nu am putut salva cererile in browser.", ok: false };
  }
}

export function getStoredProductCatalog(): ProductCatalog {
  if (typeof window === "undefined") {
    return defaultProductCatalog;
  }

  try {
    const raw = window.localStorage.getItem(productCatalogStorageKey);
    if (!raw) {
      return defaultProductCatalog;
    }

    return normalizeProductCatalog(JSON.parse(raw));
  } catch {
    return defaultProductCatalog;
  }
}

export function saveStoredProductCatalog(catalog: ProductCatalog): SaveResult {
  if (typeof window === "undefined") {
    return { error: "Stocarea nu este disponibila in acest context.", ok: false };
  }

  try {
    window.localStorage.setItem(productCatalogStorageKey, JSON.stringify(normalizeProductCatalog(catalog)));
    return { ok: true };
  } catch {
    return { error: "Nu am putut salva catalogul in browser.", ok: false };
  }
}
