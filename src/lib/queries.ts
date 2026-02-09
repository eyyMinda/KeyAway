/* ------------ Store ------------ */
export const storeDetailsQuery = `*[_type=="storeDetails"]{
  title,
  description,
  logo,
  logoLight,
  header->{
    isLogo,
    headerLinks
  },
  footer->{
    isLogo,
    footerLinks
  }
}`;

/* ------------ Header ------------ */
export const headerQuery = `*[_type=="header"]{
  islogo,
  headerLinks
}`;
/* ------------ Footer ------------ */
export const footerQuery = `*[_type=="footer"]{
  islogo,
  footerLinks
}`;

/* Header and Footer Links */
export const headerLinksQuery = `*[_type=="headerLink"] | order(_createdAt asc) {
  title,
  slug,
  external,
  url
}`;
export const footerLinksQuery = `*[_type=="footerLink"] | order(_createdAt asc) {
  title,
  slug,
  external,
  url
}`;

/* ------------ Programs ------------ */
export const allProgramsQuery = `
*[_type == "program"]{
  title, slug, description, image, cdKeys[]
}
`;
export const adminProgramsQuery = `
*[_type == "program"]{
  _id, title, slug, description, image, downloadLink, cdKeys[]
}
`;
export const programBySlugQuery = `
*[_type == "program" && slug.current == $slug][0]{
  _id, title, description, image, downloadLink, cdKeys[]
}
`;

/* ------------ Social ------------ */
export const socialLinksQuery = `*[_type=="socialLink"] | order(_createdAt asc) {
  platform,
  url
}`;

/* ------------ Analytics ------------ */
export const trackingEventsQuery = `*[_type=="trackingEvent" && createdAt >= $since]{
      _id, event, programSlug, social, path, referrer, country, city, keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;

/* ------------ Analytics with Custom Date Range ------------ */
export const trackingEventsWithRangeQuery = `*[_type=="trackingEvent" && createdAt >= $since && createdAt <= $until]{
      _id, event, programSlug, social, path, referrer, country, city, keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;

/* ------------ Key Reports ------------ */
export const keyReportsQuery = `*[_type=="keyReport" && createdAt >= $since]{
      _id, eventType, programSlug, path, referrer, country, city, keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;

/* ------------ Duplicate Key Report Check ------------ */
export const duplicateKeyReportQuery = `*[_type=="keyReport" && ipHash == $ipHash && programSlug == $programSlug && keyHash == $keyHash]{
      _id, eventType, programSlug, keyHash, keyIdentifier, createdAt
    } | order(createdAt desc) [0]`;

/* ------------ Popular Programs ------------ */
export const popularProgramsQuery = `*[_type == "program"] | order(_createdAt desc) [0...6]{
  title, slug, description, image, cdKeys[]
}`;

/* ------------ Popular Programs by Page Views ------------ */
export const popularProgramsByViewsQuery = `*[_type == "program"]{
  title, slug, description, image, cdKeys[],
  "viewCount": count(*[_type == "trackingEvent" && event == "page_viewed" && programSlug == ^.slug.current]),
  "downloadCount": count(*[_type == "trackingEvent" && event == "download_click" && programSlug == ^.slug.current]),
  "hasKeys": count(cdKeys[]) > 0,
  "popularityScore": count(*[_type == "trackingEvent" && event == "page_viewed" && programSlug == ^.slug.current]) + count(*[_type == "trackingEvent" && event == "download_click" && programSlug == ^.slug.current]) * 3,
  _createdAt
} | order(popularityScore desc) [0...6]`;

/* ------------ Statistics ------------ */
export const siteStatsQuery = `{
  "totalPrograms": count(*[_type == "program"]),
  "totalKeys": count(*[_type == "program"].cdKeys[]._key),
  "totalReports": count(*[_type == "keyReport"]),
  "recentReports": count(*[_type == "keyReport" && createdAt >= $weekAgo])
}`;

/* ------------ Recent Reports Query ------------ */
export const recentReportsQuery = `*[_type == "keyReport" && createdAt >= $weekAgo] | order(createdAt desc)`;

/* ------------ Programs with Filtering ------------ */
export const programsWithStatsQuery = `*[_type == "program"]{
  title, slug, description, image, cdKeys[], _createdAt,
  "viewCount": count(*[_type == "trackingEvent" && event == "page_viewed" && programSlug == ^.slug.current]),
  "downloadCount": count(*[_type == "trackingEvent" && event == "download_click" && programSlug == ^.slug.current]),
  "hasKeys": count(cdKeys[]) > 0,
  "popularityScore": count(*[_type == "trackingEvent" && event == "page_viewed" && programSlug == ^.slug.current]) + count(*[_type == "trackingEvent" && event == "download_click" && programSlug == ^.slug.current]) * 3
}`;

/* ------------ Programs Count Query ------------ */
export const programsCountQuery = `count(*[_type == "program"])`;
