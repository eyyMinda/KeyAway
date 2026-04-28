import type { ProgramFlow } from "@/src/types/program";
import programEn from "@/src/locales/program/en.json";

type LocaleRoot = typeof programEn;
type FlowLocaleKey = Exclude<keyof LocaleRoot, "common">;

function flowToLocaleKey(flow: ProgramFlow): FlowLocaleKey {
  if (flow === "cd_key") return "cdkey";
  if (flow === "link_based_cdkey") return "linkBasedCdkey";
  if (flow === "account") return "account";
  return "linkBasedAccount";
}

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{${key}}`
  );
}

/** Resolve a dotted path under the flow branch in `src/locales/program/en.json`, with cdkey fallback. */
export function programT(flow: ProgramFlow, path: string, vars: Record<string, string | number> = {}): string {
  const primary = programEn[flowToLocaleKey(flow)] as unknown;
  let raw = getByPath(primary, path);
  if (raw == null) {
    raw = getByPath(programEn.cdkey as unknown, path);
  }
  const text = raw ?? path;
  return interpolate(text, vars);
}

/** Shared copy under `common` in `en.json` (not flow-specific). */
export function programTCommon(path: string, vars: Record<string, string | number> = {}): string {
  const raw = getByPath(programEn.common as unknown, path) ?? path;
  return interpolate(typeof raw === "string" ? raw : String(raw), vars);
}

/** `activationInstructions.tips` array for a flow (cdkey fallback). */
export function programTips(flow: ProgramFlow, vars: Record<string, string | number>): string[] {
  const primary = programEn[flowToLocaleKey(flow)] as Record<string, unknown>;
  let tips = getByPath(primary, "activationInstructions.tips");
  if (!Array.isArray(tips)) {
    tips = getByPath(programEn.cdkey as unknown, "activationInstructions.tips");
  }
  const list = Array.isArray(tips) ? tips : [];
  return list.map(t => (typeof t === "string" ? interpolate(t, vars) : ""));
}
