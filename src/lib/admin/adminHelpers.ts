/** @fileoverview Admin helper functions for building Sanity references and calculating program statistics */

export function buildImageReference(
  assetId: string | null | undefined
): { _type: "image"; asset: { _type: "reference"; _ref: string } } | null {
  if (!assetId || assetId === "") return null;
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

export function getWorkingKeysCount(cdKeys?: Array<{ status: string }>): number {
  return cdKeys?.filter(key => key.status === "active" || key.status === "new").length ?? 0;
}
