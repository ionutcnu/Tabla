"use client";

import { Calculator, Layers3, Ruler, Warehouse, Wrench } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  calculateEstimate,
  sheetDefaults,
  type CalculatorValues,
  type RoofType,
  type SheetType,
} from "@/lib/calculator";

const initialValues: CalculatorValues = {
  sheetType: "tigla",
  roofType: "doua-pante",
  roofLength: 8.4,
  slopeRun: 5.6,
  roofPitch: 6,
  sheetLength: 6.25,
  usableWidth: sheetDefaults.tigla.usableWidth,
  waste: 10,
  ridgeLength: 8.4,
  valleyLength: 0,
  eaveLength: 16.8,
};

function toNumber(value: string) {
  return Number.parseFloat(value) || 0;
}

export function EstimateCalculator() {
  const [values, setValues] = useState(initialValues);
  const estimate = useMemo(() => calculateEstimate(values), [values]);

  function updateValue<Key extends keyof CalculatorValues>(key: Key, value: CalculatorValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateSheetType(sheetType: SheetType) {
    setValues((current) => ({
      ...current,
      sheetType,
      usableWidth: sheetDefaults[sheetType].usableWidth,
    }));
  }

  return (
    <section className="px-5 py-14 md:px-14" id="calculator">
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase text-primary">Calculator rapid</p>
        <h2 className="text-3xl font-bold tracking-normal md:text-5xl">Necesar tabla dupa masuratori</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <MobileEstimateSummary estimate={estimate} sheetLength={values.sheetLength} />

        <form className="grid gap-6 rounded-lg border bg-card p-5 shadow-soft md:p-6">
          <div>
            <p className="mb-3 text-sm font-bold text-foreground">Acoperis</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                Tip acoperis
                <select
                  className="min-h-11 rounded-md border bg-white px-3 text-foreground"
                  value={values.roofType}
                  onChange={(event) => updateValue("roofType", event.target.value as RoofType)}
                >
                  <option value="doua-pante">Doua pante</option>
                  <option value="patru-pante">Patru pante</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
                Tip tabla
                <select
                  className="min-h-11 rounded-md border bg-white px-3 text-foreground"
                  value={values.sheetType}
                  onChange={(event) => updateSheetType(event.target.value as SheetType)}
                >
                  {Object.entries(sheetDefaults).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField
                label="Lungime acoperis (m)"
                value={values.roofLength}
                onChange={(value) => updateValue("roofLength", value)}
              />
              <NumberField
                label="Adancime panta pe plan (m)"
                value={values.slopeRun}
                onChange={(value) => updateValue("slopeRun", value)}
              />
              <NumberField
                label="Inclinatie acoperis (/12)"
                max={24}
                step={1}
                value={values.roofPitch}
                onChange={(value) => updateValue("roofPitch", value)}
              />
              <NumberField
                label="Pierdere material (%)"
                max={30}
                step={1}
                value={values.waste}
                onChange={(value) => updateValue("waste", value)}
              />
            </div>
          </div>

          <details className="rounded-lg border bg-slate-50 p-4 md:hidden">
            <summary className="cursor-pointer list-none text-sm font-bold text-foreground md:cursor-default">
              Foi si accesorii
              <span className="ml-2 text-xs font-semibold text-muted-foreground">apasă pentru detalii</span>
            </summary>
            <AccessoryFields values={values} updateValue={updateValue} className="mt-4 grid gap-4" />
          </details>

          <div className="hidden md:block">
            <p className="mb-3 text-sm font-bold text-foreground">Foi si accesorii</p>
            <AccessoryFields values={values} updateValue={updateValue} className="grid gap-4 md:grid-cols-2" />
          </div>
        </form>

        <aside className="hidden rounded-lg border bg-card p-6 shadow-soft xl:block" aria-live="polite">
          <p className="mb-2 text-xs font-bold uppercase text-primary">Necesar calculat</p>
          <strong className="block text-5xl font-bold leading-none text-teal-900">{estimate.sheetCount} foi</strong>
          <span className="mt-3 block text-sm text-muted-foreground">
            Suprafata acoperis: {estimate.roofArea.toFixed(1)} mp | Cu pierdere: {estimate.adjustedArea.toFixed(1)} mp
          </span>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <ResultLine icon={<Ruler className="size-4" />} text={`Lungime panta calculata: ${estimate.slopeLength.toFixed(2)} m`} />
            <ResultLine icon={<Layers3 className="size-4" />} text={`Folie anticondens: ${estimate.underlaymentRolls} role`} />
            <ResultLine icon={<Wrench className="size-4" />} text={`Suruburi estimate: ${estimate.screwCount} buc`} />
            <ResultLine icon={<Warehouse className="size-4" />} text={`Coama: ${estimate.ridgeMeters.toFixed(1)} m | Dolie: ${estimate.valleyMeters.toFixed(1)} m`} />
            <ResultLine icon={<Calculator className="size-4" />} text={`Profile finisaj: ${estimate.trimPieces} buc la 2 m`} />
          </div>

          <div className="mt-6 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
            <strong className="mb-1 block text-foreground">Rezumat pentru oferta</strong>
            <span>
              {estimate.sheetCount} foi x {values.sheetLength.toFixed(2)} m, {estimate.linearSheetMeters.toFixed(1)} ml
              total tabla.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AccessoryFields({
  className,
  values,
  updateValue,
}: {
  className: string;
  values: CalculatorValues;
  updateValue: <Key extends keyof CalculatorValues>(key: Key, value: CalculatorValues[Key]) => void;
}) {
  return (
    <div className={className}>
      <NumberField
        label="Lungime foaie (m)"
        value={values.sheetLength}
        onChange={(value) => updateValue("sheetLength", value)}
      />
      <NumberField
        label="Latime utila foaie (m)"
        value={values.usableWidth}
        onChange={(value) => updateValue("usableWidth", value)}
      />
      <NumberField label="Coama (m)" value={values.ridgeLength} onChange={(value) => updateValue("ridgeLength", value)} />
      <NumberField label="Dolie (m)" value={values.valleyLength} onChange={(value) => updateValue("valleyLength", value)} />
      <NumberField
        label="Streasina / pazie (m)"
        value={values.eaveLength}
        onChange={(value) => updateValue("eaveLength", value)}
      />
    </div>
  );
}

function MobileEstimateSummary({
  estimate,
  sheetLength,
}: {
  estimate: ReturnType<typeof calculateEstimate>;
  sheetLength: number;
}) {
  return (
    <aside className="rounded-lg border bg-card p-5 shadow-soft xl:hidden" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-primary">Necesar calculat</p>
          <strong className="block text-4xl font-bold leading-none text-teal-900">{estimate.sheetCount} foi</strong>
        </div>
        <span className="rounded-md bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900">
          {estimate.adjustedArea.toFixed(1)} mp
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
        <CompactMetric label="Suruburi" value={`${estimate.screwCount} buc`} />
        <CompactMetric label="Folie" value={`${estimate.underlaymentRolls} role`} />
        <CompactMetric label="Profile" value={`${estimate.trimPieces} buc`} />
        <CompactMetric label="Tabla" value={`${(estimate.sheetCount * sheetLength).toFixed(1)} ml`} />
      </div>
    </aside>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="block text-foreground">{value}</strong>
    </div>
  );
}

function NumberField({
  label,
  max,
  step = 0.1,
  value,
  onChange,
}: {
  label: string;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="min-h-11 rounded-md border bg-white px-3 text-foreground"
        max={max}
        min={0}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    </label>
  );
}

function ResultLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
