import type { EnclosureModel } from "./enclosureV2";
import { getProfile } from "./profiles";
export type ManufacturingPart = {
  partId: string;
  quantity: number;
  material: string;
  profile?: string;
  cutLength?: number;
  cutSize?: { x: number; y: number; z: number };
  notes?: string[];
};
export type StockItem = {
  id: string;
  material: string;
  profile?: string;
  length: number;
  quantity: number;
  price?: number;
};
export type Cut = { stockId: string; partId: string; offset: number; length: number };
export type CutPlan = {
  stock: StockItem[];
  cuts: Cut[];
  kerf: number;
  waste: number;
  unassigned: string[];
};
export type ManufacturingReport = {
  parts: ManufacturingPart[];
  cutPlan: CutPlan;
  estimatedCost: number;
  notes: string[];
};
export type VendorCatalog = Readonly<
  Record<string, { pricePerLength?: number; currency?: string; label?: string }>
>;
const key = (part: ManufacturingPart) =>
  `${part.material}|${part.profile ?? ""}|${part.cutLength ?? ""}`;
export const buildCutPlan = (
  parts: readonly ManufacturingPart[],
  stockLengths: readonly number[] = [6000],
  kerf = 3,
): CutPlan => {
  const stock: StockItem[] = [];
  const cuts: Cut[] = [];
  const unassigned: string[] = [];
  const bars: Array<{ id: string; remaining: number }> = [];
  for (const part of parts.filter((item) => item.cutLength))
    for (let index = 0; index < part.quantity; index++) {
      const length = part.cutLength!;
      let bar = bars.find((candidate) => candidate.remaining >= length);
      if (!bar) {
        const stockLength = stockLengths.find((candidate) => candidate >= length);
        if (stockLength === undefined) {
          unassigned.push(part.partId);
          continue;
        }
        const id = `stock:${stock.length + 1}`;
        stock.push({
          id,
          material: part.material,
          profile: part.profile,
          length: stockLength,
          quantity: 1,
        });
        bar = { id, remaining: stockLength };
        bars.push(bar);
      }
      const offset = stock.find((item) => item.id === bar!.id)!.length - bar.remaining;
      cuts.push({ stockId: bar.id, partId: part.partId, offset, length });
      bar.remaining -= length + kerf;
    }
  return {
    stock,
    cuts,
    kerf,
    waste: bars.reduce((total, bar) => total + Math.max(0, bar.remaining), 0),
    unassigned,
  };
};
export const buildManufacturingReport = (
  model: EnclosureModel,
  vendors: VendorCatalog = {},
): ManufacturingReport => {
  const parts: ManufacturingPart[] = [];
  for (const member of model.members) {
    const profile = getProfile(member.profile);
    parts.push({
      partId: member.id,
      quantity: 1,
      material: "material:aluminium",
      profile: member.profile,
      cutLength: member.length,
      notes: [profile.label],
    });
  }
  const grouped = [...new Map(parts.map((part) => [key(part), part])).values()].map((part) => ({
    ...part,
    quantity: parts.filter((item) => key(item) === key(part)).length,
    notes: [
      ...new Set(
        parts.filter((item) => key(item) === key(part)).flatMap((item) => item.notes ?? []),
      ),
    ],
  }));
  const cutPlan = buildCutPlan(parts);
  const estimatedCost = parts.reduce(
    (total, part) =>
      total + (part.cutLength ?? 0) * (vendors[part.profile ?? ""]?.pricePerLength ?? 0),
    0,
  );
  return {
    parts: grouped,
    cutPlan,
    estimatedCost,
    notes: ["Estimate only; vendor pricing and hardware are optional catalog inputs."],
  };
};
export const manufacturingReportJson = (report: ManufacturingReport) =>
  JSON.stringify(report, null, 2);
export const manufacturingReportCsv = (report: ManufacturingReport) =>
  [
    "partId,quantity,material,profile,cutLength",
    ...report.parts.map((part) =>
      [part.partId, part.quantity, part.material, part.profile ?? "", part.cutLength ?? ""].join(
        ",",
      ),
    ),
  ].join("\n");
