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
export const programBySlugQuery = `
*[_type == "program" && slug.current == $slug][0]{
  title, description, image, downloadLink, cdKeys[]
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

/* ------------ Key Reports ------------ */
export const keyReportsQuery = `*[_type=="keyReport" && createdAt >= $since]{
      _id, eventType, programSlug, path, referrer, country, city, keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;
