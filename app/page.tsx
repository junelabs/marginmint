"use client";

import { useMemo, useState } from "react";

/*************************************
 * MarginMint — CPG Margin Calculator
 * Free & ad-supported • Next.js App Router (app/page.tsx)
 * Tailwind CSS required
 **************************************/

// ----------- UI helpers -----------
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-5">
      {title && <h3 className="text-lg font-semibold mb-3 tracking-tight">{title}</h3>}
      {children}
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

function NumberInput({
  id,
  value,
  onChange,
  min = 0,
  step = 0.01,
  prefix,
  suffix,
  placeholder,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  function clamp(v: number) {
    if (!Number.isFinite(v)) return 0;
    if (v < min) return min;
    return v;
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:ring-2 focus-within:ring-gray-800">
      {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-gray-900"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(clamp(parseFloat(e.target.value || "0")))}
        onBlur={(e) => onChange(clamp(parseFloat(e.target.value || "0")))}
      />
      {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
    </div>
  );
}

function Stat({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 ${emphasize ? "text-2xl font-semibold" : "text-lg font-medium"}`}>{value}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gray-900";
  const cls =
    variant === "primary"
      ? `${base} bg-gray-900 text-white hover:bg-black`
      : `${base} bg-white text-gray-900 hover:bg-gray-50 border border-gray-200`;
  if (href) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <button className={cls} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex align-middle ml-2" tabIndex={0} aria-label={text}>
      <span className="h-4 w-4 rounded-full border border-gray-300 text-gray-600 text-[10px] flex items-center justify-center select-none">
        i
      </span>
      <span className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 text-xs text-gray-900 bg-white border border-gray-200 shadow-lg rounded-lg p-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none">
        {text}
      </span>
    </span>
  );
}

// ----------- math helpers -----------
const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
const money = (n: number) => `$${fmt(n)}`;
const pct = (n: number) => `${fmt(n)}%`;

function marginPct(price: number, unitCostBeforeFees: number, feePct: number) {
  if (price <= 0) return 0;
  const fees = (feePct / 100) * price;
  const margin = (price - fees - unitCostBeforeFees) / price;
  return Math.max(0, margin * 100);
}

function msrpForTargetMargin(targetPct: number, unitCostBeforeFees: number, feePct: number) {
  const t = targetPct / 100;
  const f = feePct / 100;
  const denom = 1 - f - t;
  if (denom <= 0) return NaN;
  return unitCostBeforeFees / denom;
}

function csvDownload(filename: string, rows: Record<string, string | number>) {
  const headers = Object.keys(rows);
  const values = headers.map((k) => String(rows[k]));
  const csv = [headers.join(","), values.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ----------- page -----------
export default function Page() {
  // Inputs
  const [cogs, setCogs] = useState(2.2);
  const [packaging, setPackaging] = useState(0.35);
  const [shipFulfill, setShipFulfill] = useState(0.6);
  const [overhead, setOverhead] = useState(0.25);
  const [unitsPerCase, setUnitsPerCase] = useState(6);

  const [retailFeePct, setRetailFeePct] = useState(7);
  const [wholesaleFeePct, setWholesaleFeePct] = useState(3);

  const [msrp, setMsrp] = useState(11.99);
  const [wholesalePrice, setWholesalePrice] = useState(6.0);

  const [targetMargin, setTargetMargin] = useState(60);

  // Derived
  const unitCostBeforeFees = useMemo(
    () => cogs + packaging + shipFulfill + overhead,
    [cogs, packaging, shipFulfill, overhead]
  );

  const retailMargin = useMemo(
    () => marginPct(msrp, unitCostBeforeFees, retailFeePct),
    [msrp, unitCostBeforeFees, retailFeePct]
  );

  const wholesaleMargin = useMemo(
    () => marginPct(wholesalePrice, unitCostBeforeFees, wholesaleFeePct),
    [wholesalePrice, unitCostBeforeFees, wholesaleFeePct]
  );

  const retailUnitProfit = useMemo(
    () => msrp * (1 - retailFeePct / 100) - unitCostBeforeFees,
    [msrp, retailFeePct, unitCostBeforeFees]
  );

  const wholesaleUnitProfit = useMemo(
    () => wholesalePrice * (1 - wholesaleFeePct / 100) - unitCostBeforeFees,
    [wholesalePrice, wholesaleFeePct, unitCostBeforeFees]
  );

  const caseProfitRetail = useMemo(
    () => retailUnitProfit * unitsPerCase,
    [retailUnitProfit, unitsPerCase]
  );

  const caseProfitWholesale = useMemo(
    () => wholesaleUnitProfit * unitsPerCase,
    [wholesaleUnitProfit, unitsPerCase]
  );

  const msrpForTarget = useMemo(
    () => msrpForTargetMargin(targetMargin, unitCostBeforeFees, retailFeePct),
    [targetMargin, unitCostBeforeFees, retailFeePct]
  );

  // CSV rows (used by Export button)
  const rowsForCsv = {
    COGS_per_unit: cogs,
    Packaging_per_unit: packaging,
    Ship_Fulfill_per_unit: shipFulfill,
    Overhead_per_unit: overhead,
    Units_per_case: unitsPerCase,
    Retail_fee_pct: retailFeePct,
    Wholesale_fee_pct: wholesaleFeePct,
    MSRP: msrp,
    Wholesale_price: wholesalePrice,
    Unit_cost_before_fees: unitCostBeforeFees,
    Retail_margin_pct: +retailMargin.toFixed(2),
    Wholesale_margin_pct: +wholesaleMargin.toFixed(2),
    Retail_unit_profit: +retailUnitProfit.toFixed(2),
    Wholesale_unit_profit: +wholesaleUnitProfit.toFixed(2),
    Case_profit_retail: +caseProfitRetail.toFixed(2),
    Case_profit_wholesale: +caseProfitWholesale.toFixed(2),
    MSRP_needed_for_target_margin_pct: Number.isFinite(msrpForTarget) ? +msrpForTarget.toFixed(2) : "N/A",
    Target_margin_pct: targetMargin,
  } as const;

  function handleCsvExport() {
    csvDownload("marginmint_export.csv", rowsForCsv);
  }

  const MAILTO = `mailto:you@example.com?subject=${encodeURIComponent(
    "MarginMint suggestion"
  )}&body=${encodeURIComponent("Hi there,\n\nHere's my suggestion:\n\n- ")}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
<div className="mb-8 md:flex md:items-start md:justify-between">
  {/* Left: title + intro */}
  <div>
    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
      MarginMint — CPG Margin Calculator
    </h1>
    <p className="text-gray-600 mt-2">
      For indie CPG founders. Plug in your costs → instant unit economics, margins, and case profit.
    </p>
    <ul className="mt-3 text-gray-800 list-disc list-inside space-y-1">
      <li>Who it’s for: coffee, snacks, beverages, functional food</li>
      <li>What it does: retail & wholesale margins, case profit, MSRP needed for a target margin</li>
      <li><span className="font-semibold">Free</span> for now • Ad-supported</li>
    </ul>

    {/* Mobile: show below text */}
    <div className="mt-4 md:hidden">
      <Button variant="ghost" href={MAILTO}>
        Suggestions & Improvements
      </Button>
    </div>
  </div>

  {/* Desktop: align to the right edge of the content, not the viewport */}
  <div className="hidden md:block md:ml-6 md:shrink-0">
    <Button variant="ghost" href={MAILTO}>
      Suggestions & Improvements
    </Button>
  </div>
</div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left: Inputs */}
        <div className="md:col-span-2 space-y-5">
          {/* Costs per Unit */}
          <Card title="Costs per Unit">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Each input w/ tooltips */}
              <div>
                <Label htmlFor="cogs">
                  COGS (ingredients)
                  <InfoTooltip text="Raw ingredients per unit. Increases unit cost and lowers margins." />
                </Label>
                <NumberInput id="cogs" prefix="$" value={cogs} onChange={setCogs} />
              </div>
              <div>
                <Label htmlFor="packaging">
                  Packaging
                  <InfoTooltip text="Bags, bottles, labels, wrappers per unit. Raises unit cost and reduces margins." />
                </Label>
                <NumberInput id="packaging" prefix="$" value={packaging} onChange={setPackaging} />
              </div>
              <div>
                <Label htmlFor="shipFulfill">
                  Ship / Fulfillment
                  <InfoTooltip text="Pick/pack labor, packaging, postage subsidized per unit." />
                </Label>
                <NumberInput id="shipFulfill" prefix="$" value={shipFulfill} onChange={setShipFulfill} />
              </div>
              <div>
                <Label htmlFor="overhead">
                  Overhead (allocated)
                  <InfoTooltip text="Rent, utilities, labor, software per unit. Shows true margin impact." />
                </Label>
                <NumberInput id="overhead" prefix="$" value={overhead} onChange={setOverhead} />
              </div>
              <div>
                <Label htmlFor="unitsPerCase">
                  Units per Case
                  <InfoTooltip text="Sellable units per wholesale case. Changes case profit only." />
                </Label>
                <NumberInput id="unitsPerCase" value={unitsPerCase} onChange={setUnitsPerCase} step={1} />
              </div>
            </div>
          </Card>

          {/* Channel & Pricing */}
          <Card title="Channel & Pricing">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="msrp">
                  MSRP (Retail Price)
                  <InfoTooltip text="Sticker price. Drives retail margin & profit." />
                </Label>
                <NumberInput id="msrp" prefix="$" value={msrp} onChange={setMsrp} />
              </div>
              <div>
                <Label htmlFor="retailFeePct">
                  Retail Fees (%)
                  <InfoTooltip text="Marketplace + payment processing fees." />
                </Label>
                <NumberInput id="retailFeePct" suffix="%" value={retailFeePct} onChange={setRetailFeePct} step={0.25} />
              </div>
              <div>
                <Label htmlFor="wholesalePrice">
                  Wholesale Price
                  <InfoTooltip text="Your per-unit price to retailers/distributors." />
                </Label>
                <NumberInput id="wholesalePrice" prefix="$" value={wholesalePrice} onChange={setWholesalePrice} />
              </div>
              <div>
                <Label htmlFor="wholesaleFeePct">
                  Wholesale Fees (%)
                  <InfoTooltip text="Portal/processing fees on wholesale." />
                </Label>
                <NumberInput id="wholesaleFeePct" suffix="%" value={wholesaleFeePct} onChange={setWholesaleFeePct} step={0.25} />
              </div>
            </div>
          </Card>

          {/* Target Margin Slider */}
          <Card title="Target Margin → Required MSRP">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="target">Target Margin</Label>
                <input
                  id="target"
                  type="range"
                  min={30}
                  max={80}
                  step={1}
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="w-14 text-right text-sm font-medium">{pct(targetMargin)}</div>
              </div>
              <div className="text-sm text-gray-600">Required MSRP (accounts for retail fees):</div>
              <div className="text-2xl font-semibold">{Number.isFinite(msrpForTarget) ? money(msrpForTarget) : "—"}</div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Sponsored */}
          <Card title="Sponsored">
            <div className="space-y-3 text-sm text-gray-700">
              <p className="text-gray-600">
                This free tool stays free thanks to sponsors. Want to reach indie CPG founders?
              </p>
              <div className="flex items-center justify-between gap-3">
                <Button href="https://buy.stripe.com/7sY8wO6XGfWKcYU73s5AQ03" variant="primary">Sponsor this site</Button>
              </div>
            </div>
          </Card>

          {/* Live Stats */}
          <Card title="Live Stats">
            <div className="grid grid-cols-1 gap-4">
              <Stat label="Unit Cost (before fees)" value={money(unitCostBeforeFees)} emphasize />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Stat label="Retail Margin" value={pct(retailMargin)} />
                <Stat label="Wholesale Margin" value={pct(wholesaleMargin)} />
                <Stat label="Retail Unit Profit" value={money(retailUnitProfit)} />
                <Stat label="Wholesale Unit Profit" value={money(wholesaleUnitProfit)} />
                <Stat label="Case Profit (Retail)" value={money(caseProfitRetail)} />
                <Stat label="Case Profit (Wholesale)" value={money(caseProfitWholesale)} />
              </div>
            </div>
          </Card>

          {/* Export */}
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Export CSV</div>
                <div className="text-xs text-gray-500">Download your inputs + computed results instantly.</div>
              </div>
              <Button variant="ghost" onClick={handleCsvExport}>Export</Button>
            </div>
          </Card>
        </div>
      </div>

      <footer className="mt-10 text-center text-sm text-gray-500">
        <p>
          Built with ❤️ for CPG brands by{" "}
          <a className="underline" href="https://www.june.cx" target="_blank" rel="noreferrer">JUNE</a>. Free & ad-supported.
        </p>
      </footer>
    </main>
  );
}
