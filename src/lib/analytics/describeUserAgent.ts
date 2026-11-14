/** @fileoverview Short "Chrome 137 · Windows" labels for user agent strings (client-safe). */

const BROWSERS: Array<[name: string, pattern: RegExp]> = [
  ["Edge", /Edg\/(\d+)/],
  ["Opera", /OPR\/(\d+)/],
  ["Firefox", /Firefox\/(\d+)/],
  ["Chrome", /Chrome\/(\d+)/],
  ["Safari", /Version\/(\d+).*Safari/]
];

const SYSTEMS: Array<[name: string, pattern: RegExp]> = [
  ["Android", /Android/],
  ["iOS", /iPhone|iPad/],
  ["Windows 7/8", /Windows NT 6\./],
  ["Windows", /Windows/],
  ["macOS", /Mac OS X/],
  ["Linux", /Linux/]
];

export function describeUserAgent(ua: string): string {
  const browser = BROWSERS.map(([name, re]) => [name, ua.match(re)?.[1]] as const).find(([, v]) => v);
  const os = SYSTEMS.find(([, re]) => re.test(ua))?.[0];
  const label = browser ? `${browser[0]} ${browser[1]}` : "Other";
  return os ? `${label} · ${os}` : label;
}
