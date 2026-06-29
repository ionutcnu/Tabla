import { accessories, auxiliarySheetTables, moduleSheetOptions, sheetProduct, sheetSeries } from "@/lib/offer-data";

export type QuoteStatus = "Noua" | "Contactat" | "Ofertata" | "Acceptata" | "Respinsa";
export type SeriesKey = keyof typeof sheetSeries;

export type CatalogAccessory = {
  description?: string;
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

export type QuoteRequest = {
  accessoryQuantities: Record<string, number>;
  auxiliarySheetQuantities: Record<string, Record<string, number>>;
  createdAt: string;
  customer: CustomerInfo;
  id: string;
  labor: number;
  moduleQuantities: Record<string, number>;
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
  sheetRows: Array<{ area: number; length: number; quantity: number; value: number }>;
  systemAfterDiscount: number;
  systemRows: Array<{
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

export const defaultProductCatalog: ProductCatalog = {
  accessories,
  sheetProduct,
};

export function calculateQuoteTotals(request: QuoteRequest, catalog: ProductCatalog = defaultProductCatalog): QuoteTotals {
  const selectedSeries = sheetSeries[request.seriesKey];
  const sheetQuantities = request.sheetQuantities || {};
  const accessoryQuantities = request.accessoryQuantities || {};
  const auxiliarySheetQuantities = request.auxiliarySheetQuantities || {};
  const moduleQuantities = request.moduleQuantities || {};
  const sheetRows = selectedSeries.lengths.map((length) => {
    const quantity = sheetQuantities[String(length)] || 0;
    const area = length * selectedSeries.usableWidth * quantity;
    const value = area * catalog.sheetProduct.priceWithVat;

    return { area, length, quantity, value };
  });
  const tileArea = sheetRows.reduce((sum, row) => sum + row.area, 0);
  const tileValue = sheetRows.reduce((sum, row) => sum + row.value, 0);
  const systemRows = catalog.accessories.map((accessory) => {
    const quantity = accessoryQuantities[accessory.name] || 0;
    const value = quantity * accessory.priceWithVat;

    return {
      name: accessory.name,
      priceWithoutVat: accessory.priceWithoutVat,
      priceWithVat: accessory.priceWithVat,
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
    id: `NM-${Date.now().toString().slice(-6)}`,
    labor: 0,
    moduleQuantities: {},
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

  const raw = window.localStorage.getItem(quoteStorageKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as QuoteRequest[];
  } catch {
    return [];
  }
}

export function saveStoredQuoteRequests(requests: QuoteRequest[]) {
  window.localStorage.setItem(quoteStorageKey, JSON.stringify(requests));
}

export function getStoredProductCatalog(): ProductCatalog {
  if (typeof window === "undefined") {
    return defaultProductCatalog;
  }

  const raw = window.localStorage.getItem(productCatalogStorageKey);
  if (!raw) {
    return defaultProductCatalog;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProductCatalog>;

    return {
      accessories: Array.isArray(parsed.accessories) ? parsed.accessories : defaultProductCatalog.accessories,
      sheetProduct: parsed.sheetProduct || defaultProductCatalog.sheetProduct,
    };
  } catch {
    return defaultProductCatalog;
  }
}

export function saveStoredProductCatalog(catalog: ProductCatalog) {
  window.localStorage.setItem(productCatalogStorageKey, JSON.stringify(catalog));
}
