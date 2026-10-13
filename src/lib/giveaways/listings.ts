import * as cheerio from "cheerio";
import type {
  GiveawayListingItem,
  RssGiveawaySource,
  WpRestGiveawaySource
} from "@/src/types/giveaways";
import { politeFetch } from "./politeFetch";

const LISTING_SIZE = 20;

/** Decodes HTML entities in a plain-text title (`&#8211;`, `&amp;`, ...). */
export function decodeEntities(text: string): string {
  return cheerio.load(`<p>${text}</p>`)("p").text().trim();
}

function toIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
}

/** WP REST `*_gmt` fields have no timezone suffix. */
function gmtToIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return toIso(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export async function fetchRssListing(source: RssGiveawaySource): Promise<GiveawayListingItem[]> {
  const res = await politeFetch(source.url, "application/rss+xml,application/xml,text/xml");
  if (!res.ok) throw new Error(`${source.url}: ${res.error}`);

  const $ = cheerio.load(res.text, { xml: true });
  const items: GiveawayListingItem[] = [];
  $("item").each((_, el) => {
    const item = $(el);
    const url = item.children("link").first().text().trim();
    const title = decodeEntities(item.children("title").first().text());
    if (!url || !title) return;
    items.push({
      sourceId: source.id,
      url,
      title,
      publishedAt: toIso(item.children("pubDate").first().text().trim()),
      contentHtml: source.contentInFeed ? item.children("content\\:encoded").first().text() || undefined : undefined
    });
  });
  return items.slice(0, LISTING_SIZE);
}

type WpRestRow = {
  link?: string;
  title?: { rendered?: string };
  date_gmt?: string;
  modified_gmt?: string;
  content?: { rendered?: string };
};

export async function fetchWpRestListing(source: WpRestGiveawaySource): Promise<GiveawayListingItem[]> {
  const fields = ["link", "title", "date_gmt", "modified_gmt", ...(source.contentInApi ? ["content"] : [])];
  const params = new URLSearchParams({
    [source.taxonomy]: source.termIds.join(","),
    per_page: String(LISTING_SIZE),
    orderby: "modified",
    order: "desc",
    _fields: fields.join(",")
  });
  const url = `${source.baseUrl}/wp-json/wp/v2/${source.postType}?${params}`;
  const res = await politeFetch(url, "application/json");
  if (!res.ok) throw new Error(`${url}: ${res.error}`);

  let rows: WpRestRow[];
  try {
    rows = JSON.parse(res.text) as WpRestRow[];
  } catch {
    throw new Error(`${url}: response is not JSON`);
  }
  if (!Array.isArray(rows)) throw new Error(`${url}: unexpected response`);

  return rows
    .filter(row => row.link && row.title?.rendered)
    .map(row => ({
      sourceId: source.id,
      url: row.link!,
      title: decodeEntities(row.title!.rendered!),
      publishedAt: gmtToIso(row.date_gmt),
      modifiedAt: gmtToIso(row.modified_gmt),
      contentHtml: source.contentInApi ? row.content?.rendered || undefined : undefined
    }));
}
