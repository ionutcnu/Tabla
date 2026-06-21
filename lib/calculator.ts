export type SheetType = "cutata" | "tigla" | "faltuita";
export type RoofType = "doua-pante" | "patru-pante";

export type CalculatorValues = {
  sheetType: SheetType;
  roofType: RoofType;
  roofLength: number;
  slopeRun: number;
  roofPitch: number;
  sheetLength: number;
  usableWidth: number;
  waste: number;
  ridgeLength: number;
  valleyLength: number;
  eaveLength: number;
};

export type Estimate = {
  adjustedArea: number;
  roofArea: number;
  slopeLength: number;
  sheetCount: number;
  screwCount: number;
  underlaymentRolls: number;
  ridgeMeters: number;
  valleyMeters: number;
  eaveMeters: number;
  trimPieces: number;
  linearSheetMeters: number;
};

export const sheetDefaults: Record<SheetType, { label: string; usableWidth: number; screwsPerSqm: number }> = {
  cutata: { label: "Tabla cutata 0.45 mm", usableWidth: 1.1, screwsPerSqm: 8 },
  tigla: { label: "Tabla tip tigla 0.50 mm", usableWidth: 1.08, screwsPerSqm: 9 },
  faltuita: { label: "Tabla faltuita 0.60 mm", usableWidth: 0.55, screwsPerSqm: 6 },
};

const roofFaces: Record<RoofType, number> = {
  "doua-pante": 2,
  "patru-pante": 4,
};

function pitchMultiplier(pitch: number) {
  return Math.sqrt(1 + (pitch / 12) ** 2);
}

export function calculateEstimate(values: CalculatorValues): Estimate {
  const faces = roofFaces[values.roofType];
  const multiplier = pitchMultiplier(values.roofPitch);
  const slopeLength = values.slopeRun * multiplier;
  const roofArea = values.roofLength * slopeLength * faces;
  const adjustedArea = roofArea * (1 + values.waste / 100);
  const sheetsPerFace = Math.ceil(values.roofLength / Math.max(values.usableWidth, 0.1));
  const sheetCount = sheetsPerFace * faces;
  const ridgeMeters =
    values.ridgeLength || (values.roofType === "doua-pante" ? values.roofLength : values.roofLength * 0.75);
  const valleyMeters = values.valleyLength;
  const eaveMeters = values.eaveLength || values.roofLength * faces;
  const trimPieces = Math.ceil((ridgeMeters + valleyMeters + eaveMeters) / 2);

  return {
    adjustedArea,
    roofArea,
    slopeLength,
    sheetCount,
    screwCount: Math.ceil(adjustedArea * sheetDefaults[values.sheetType].screwsPerSqm),
    underlaymentRolls: Math.ceil(adjustedArea / 75),
    ridgeMeters,
    valleyMeters,
    eaveMeters,
    trimPieces,
    linearSheetMeters: sheetCount * values.sheetLength,
  };
}
