export type Parameters = Record<string, number | string | boolean>;
export type Pose = Record<string, number>;
export interface Part {
  id: string;
  name: string;
  category: string;
  material: string;
  supplier?: string;
  product_code?: string;
  size: number[];
  position: number[];
  assembly?: string;
  geometry_fidelity?: string;
  quantity?: number;
  [key: string]: unknown;
}
export interface Check {
  id: string;
  status: "pass" | "fail" | "unknown";
  category: string;
  message: string;
  references?: string[];
  measured?: unknown;
  required?: unknown;
  unit?: string;
  method?: string;
}
export interface Evaluation {
  model: {
    revision: string;
    parameters: Parameters;
    parts: Part[];
    assumptions: { id: string; description: string; confirmed: boolean }[];
    doors: unknown;
    [key: string]: unknown;
  };
  report: {
    status: "valid" | "invalid" | "incomplete";
    revision: string;
    checks: Check[];
    summary: Record<string, number>;
    coverage: Record<string, unknown>;
    order_ready: boolean;
  };
  meshes: { id: string; positions: number[]; indices: number[] }[];
}
export async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? data);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`${response.status}: ${detail || "Request failed"}`);
  }
  return response.json() as Promise<T>;
}
export function signature(parameters: Parameters, pose: Pose): string {
  return JSON.stringify([
    Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)),
    Object.entries(pose).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
export function canExport(
  result: Evaluation | undefined,
  pending: boolean,
  current: string,
  evaluated: string,
): boolean {
  return (
    !!result &&
    !pending &&
    current === evaluated &&
    result.model.revision === result.report.revision
  );
}
export async function evaluate(parameters: Parameters, pose: Pose): Promise<Evaluation> {
  return readResponse(
    await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parameters, pose }),
    }),
  );
}
export async function download(
  format: string,
  parameters: Parameters,
  pose: Pose,
  revision: string,
): Promise<void> {
  const response = await fetch(`/api/export/${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parameters, pose, expected_revision: revision }),
  });
  if (!response.ok) await readResponse(response);
  const blob = await response.blob();
  if (!blob.size) throw new Error("The supplier file was empty. Please retry.");
  const filename =
    response.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1] ??
    `enclosure-${revision.slice(0, 8)}.${format === "pack" ? "zip" : format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
