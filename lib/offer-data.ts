export const company = {
  name: "Nicoroof Modern",
  fiscalCode: "38744695",
  phone: "0771552789",
  email: "nicoroofmodern@yahoo.com",
  address: "Calinesti, jud. Arges, Str. Principala nr. 83A",
  tagline: "Acoperișuri metalice și accesorii",
};

export const sheetSeries = {
  clasic: {
    name: "Clasic",
    category: "Țiglă metalică",
    description: "Profil clasic pentru acoperișuri metalice, calculat cu lățime utilă de 1,20 m.",
    usableWidth: 1.2,
    lengths: [3.8, 3.65, 3.3, 2.95, 2.5, 2.25, 1.9, 1.55, 1.2, 1.4, 0.55],
  },
  hellenic: {
    name: "Hellenic",
    category: "Țiglă metalică",
    description: "Profil de țiglă metalică, calculat cu lățime utilă de 1,21 m.",
    usableWidth: 1.21,
    lengths: [4, 3.65, 3.3, 2.95, 2.6, 2.25, 1.9, 1.55, 1.2, 0.8, 0.55],
  },
  britanic: {
    name: "Britanic",
    category: "Țiglă metalică",
    description: "Profil de țiglă metalică, calculat cu aceeași formulă ca Hellenic și Dacic.",
    usableWidth: 1.21,
    lengths: [4, 3.65, 3.3, 2.95, 2.6, 2.25, 1.9, 1.55, 1.2, 0.8, 0.55],
  },
  dacic: {
    name: "Dacic",
    category: "Țiglă metalică",
    description: "Profil de țiglă metalică, calculat cu lățime utilă de 1,21 m.",
    usableWidth: 1.21,
    lengths: [4, 3.65, 3.3, 2.95, 2.6, 2.25, 1.9, 1.55, 1.2, 0.8, 0.55],
  },
  adriatic: {
    name: "Adriatic",
    category: "Țiglă metalică",
    description: "Profil de țiglă metalică, calculat cu lățime utilă de 1,215 m.",
    usableWidth: 1.215,
    lengths: [4, 3.65, 3.3, 2.95, 2.6, 2.25, 1.9, 1.55, 1.2, 0.8, 0.55],
  },
};

export const productCategories = [
  {
    name: "Țiglă metalică",
    description: "Alege profilul, apoi completează lungimile și numărul de foi.",
    items: Object.values(sheetSeries).map((series) => ({
      name: series.name,
      description: series.description,
      usableWidth: series.usableWidth,
    })),
  },
  {
    name: "Accesorii acoperiș",
    description: "Coame, dolii, șorțuri, parazăpezi, folie, șuruburi și elemente de finisaj.",
  },
  {
    name: "Sistem pluvial",
    description: "Jgheaburi, burlane, cârlige, coturi, racorduri și accesorii pentru scurgere.",
  },
] as const;

export const moduleSheetOptions = [
  { modules: 3, length: 1.2, label: "Tigle metalice - 1200 - 3 module" },
  { modules: 4, length: 1.55, label: "Tigle metalice - 1550 - 4 module" },
  { modules: 5, length: 1.9, label: "Tigle metalice - 1900 - 5 module" },
  { modules: 6, length: 2.25, label: "Tigle metalice - 2250 - 6 module" },
  { modules: 7, length: 2.6, label: "Tigle metalice - 2600 - 7 module" },
  { modules: 8, length: 2.95, label: "Tigle metalice - 2950 - 8 module" },
  { modules: 9, length: 3.3, label: "Tigle metalice - 3300 - 9 module" },
  { modules: 10, length: 3.65, label: "Tigle metalice - 3650 - 10 module" },
  { modules: 11, length: 4, label: "Tigle metalice - 4000 - 11 module" },
];

export const auxiliarySheetTables = [
  {
    key: "calculTablaA",
    name: "calcul tabla - tabel 1",
    usableWidth: 1.2,
    lengths: [4, 3.65, 2.75, 3, 2.6, 1.55, 1.9],
  },
  {
    key: "calculTablaB",
    name: "calcul tabla - tabel 2",
    usableWidth: 1.2,
    lengths: [4, 3.65, 2.9, 2.95, 2.6, 1.55, 2.25],
  },
] as const;

export const sheetProduct = {
  name: "Țiglă metalică Nordic 0,5 mm",
  unit: "mp",
  priceWithoutVat: 30.58,
  priceWithVat: 37,
};

export const accessories = [
  { name: "tabla plana", unit: "buc", priceWithoutVat: 128.1, priceWithVat: 155 },
  { name: "dolie 2ml", unit: "buc", priceWithoutVat: 41.32, priceWithVat: 50 },
  { name: "fereastra mansarda", unit: "buc", priceWithoutVat: 1570.25, priceWithVat: 1900 },
  { name: "Laterala margine 2ml", unit: "buc", priceWithoutVat: 33.06, priceWithVat: 40 },
  { name: "laterala mare 21 cm", unit: "buc", priceWithoutVat: 37.19, priceWithVat: 45 },
  { name: "sort strasina", unit: "buc", priceWithoutVat: 20.66, priceWithVat: 25 },
  { name: "sort interior", unit: "buc", priceWithoutVat: 14.88, priceWithVat: 18 },
  { name: "parazapada 2 ml", unit: "buc", priceWithoutVat: 20.66, priceWithVat: 25 },
  { name: "Calcan", unit: "buc", priceWithoutVat: 28.93, priceWithVat: 35 },
  { name: "Fixare sub tabla", unit: "buc", priceWithoutVat: 28.93, priceWithVat: 35 },
  { name: "Coama 2ml", unit: "buc", priceWithoutVat: 41.32, priceWithVat: 50 },
  { name: "Parazapada cupa", unit: "buc", priceWithoutVat: 4.96, priceWithVat: 6 },
  { name: "Suruburi autofiletante 4.8*35", unit: "buc", priceWithoutVat: 41.32, priceWithVat: 50 },
  { name: "Folie anticondens 120 gr mp", unit: "mp", priceWithoutVat: 3.31, priceWithVat: 4 },
  { name: "Jgheab de scurgere 125", unit: "ml", priceWithoutVat: 16.53, priceWithVat: 20 },
  { name: "Burlan de scurgere 090", unit: "ml", priceWithoutVat: 18.6, priceWithVat: 22.5 },
  { name: "Carlig jgheab 125/210mm", unit: "buc", priceWithoutVat: 8.26, priceWithVat: 10 },
  { name: "colier burlan", unit: "buc", priceWithoutVat: 8.26, priceWithVat: 10 },
  { name: "Capac jgheab 125", unit: "buc", priceWithoutVat: 8.26, priceWithVat: 10 },
  { name: "Element imbinare jgheab 125", unit: "buc", priceWithoutVat: 12.4, priceWithVat: 15 },
  { name: "Racord jgheab/burlan 125/090", unit: "buc", priceWithoutVat: 20.66, priceWithVat: 25 },
  { name: "Ramificatie burlan 90 y", unit: "buc", priceWithoutVat: 74.38, priceWithVat: 90 },
  { name: "Cot de 60 de grade 090", unit: "buc", priceWithoutVat: 20.66, priceWithVat: 25 },
  { name: "Coltar exterior 90 grade 125", unit: "buc", priceWithoutVat: 53.72, priceWithVat: 65 },
  { name: "Coltar interior 90 grade 125", unit: "buc", priceWithoutVat: 53.72, priceWithVat: 65 },
  { name: "lambriu  18 mm", unit: "buc", priceWithoutVat: 41.32, priceWithVat: 50 },
  { name: "silicon", unit: "buc", priceWithoutVat: 28.93, priceWithVat: 35 },
  { name: "PRELUNGITOR", unit: "buc", priceWithoutVat: 18.18, priceWithVat: 22 },
  { name: "capac coama", unit: "buc", priceWithoutVat: 20.66, priceWithVat: 25 },
  { name: "captator dolie", unit: "buc", priceWithoutVat: 53.72, priceWithVat: 65 },
  { name: "Stacheti", unit: "buc", priceWithoutVat: 6.2, priceWithVat: 7.5 },
  { name: "dibluri", unit: "buc", priceWithoutVat: 1.65, priceWithVat: 2 },
  { name: "Cuie", unit: "kg", priceWithoutVat: 6.61, priceWithVat: 8 },
];

export const excelFormulas = {
  priceWithoutVat: "Pret unitar fara TVA = Pret unitar cu TVA / 1.21",
  itemValue: "Valoarea = Pret unitar cu TVA x cant",
  sheetAreaClasic: "total foaie = dimensiune foaie x 1.2 x nr buc",
  sheetAreaHellenicBritanicDacic: "Hellenic / Britanic / Dacic: total foaie = dimensiune foaie x 1.21 x nr buc",
  sheetAreaAdriatic: "total foaie = dimensiune foaie x 1.215 x nr buc",
  tileTotal: "TIGLA METALICA = total mp foi x 37",
  systemTotal: "REST SISTEM = suma valorilor accesorii",
  discountedTile: "TOTAL tigla = valoare tigla - valoare tigla x discount%",
  discountedSystem: "TOTAL sistem = valoare sistem - valoare sistem x discount%",
  totalWithoutLabor: "TOTAL FARA MANOPERA = tigla dupa discount + sistem dupa discount",
  totalWithLabor: "TOTAL CU MANOPERA = total fara manopera + manopera",
};
