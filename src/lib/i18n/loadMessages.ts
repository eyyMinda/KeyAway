import type { ProgramFlow } from "@/src/types/program";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import type { DictObject } from "@/src/contexts/i18n";

type Locale = "en";
type Namespace = "common" | "program" | "adminKeyReports";

const FLOW_MAP: Record<ProgramFlow, "cdkey" | "linkBasedCdkey" | "account" | "linkBasedAccount"> = {
  cd_key: "cdkey",
  link_based_cdkey: "linkBasedCdkey",
  account: "account",
  link_based_account: "linkBasedAccount"
};

export async function loadMessages({
  locale = "en",
  namespaces,
  programFlow
}: {
  locale?: Locale;
  namespaces: Namespace[];
  programFlow?: ProgramFlow;
}) {
  const messages: DictObject = {};

  if (namespaces.includes("common") || namespaces.includes("program")) {
    const programDict = (await import("@/src/locales/program/en.json")).default;
    if (namespaces.includes("common")) messages.common = programDict.common;
    if (namespaces.includes("program")) {
      const flow = FLOW_MAP[normalizeProgramFlow(programFlow)];
      messages.program = programDict[flow];
    }
  }

  if (namespaces.includes("adminKeyReports")) {
    const admin = (await import("@/src/locales/admin/key-reports/en.json")).default;
    messages.adminKeyReports = admin;
  }

  return { locale, messages };
}
