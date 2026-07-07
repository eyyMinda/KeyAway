/* ------------ Store ------------ */
export const storeDetailsQuery = `*[_type=="storeDetails"]{
  title,
  supportEmail,
  description,
  logo,
  logoLight,
  seo{
    siteUrl,
    sharingImage,
    homeMetaTitle,
    homeMetaDescription,
    homeMetaKeywords,
    programsMetaTitle,
    programsMetaDescription,
    programsMetaKeywords,
    privacyMetaTitle,
    privacyMetaDescription,
    privacyMetaKeywords,
    termsMetaTitle,
    termsMetaDescription,
    termsMetaKeywords
  },
  header{
    isLogo,
    headerLinks
  },
  footer{
    isLogo,
    footerLinks
  },
  socialLinks[]{ platform, url },
  otherLinks[]{ kind, url }
}`;

/* ------------ Programs ------------ */
export const featuredBlockProjection = `
featured{
  description,
  showcaseGif
}`;

/** Flattened analytics fields — reads nested `stats` with legacy top-level fallback. */
export const programStatsProjection = `
  "viewCount": coalesce(stats.viewCount, viewCount, 0),
  "downloadCount": coalesce(stats.downloadCount, downloadCount, 0),
  "popularityScore": coalesce(
    stats.popularityScore,
    popularityScore,
    coalesce(stats.viewCount, viewCount, 0) + coalesce(stats.downloadCount, downloadCount, 0) * 3
  )
`;

/* ------------ Programs listing projection (shared: stats + list fields) ------------ */
export const programsListingProjection = `
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  description,
  image,
  _createdAt,
  "vendor": vendor->{ name, "slug": slug.current },
  "keyCount": count(cdKeys[]),
  "hasKeys": count(cdKeys[]) > 0,
  ${programStatsProjection}
`;

/** Related / card rows: no tracking aggregates, no cdKeys[]. */
export const relatedProgramsCardProjection = `
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  description,
  image,
  _createdAt,
  "keyCount": count(cdKeys[]),
  "hasKeys": count(cdKeys[]) > 0
`;

export const allProgramsQuery = `
*[_type == "program"]{
  title, slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  description,
  ${featuredBlockProjection},
  image, cdKeys[]
}
`;
export const adminProgramsQuery = `
*[_type == "program"]{
  _id,
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  _updatedAt,
  description,
  ${featuredBlockProjection},
  latestOfficialVersion,
  "vendor": vendor->{ name, "slug": slug.current, "freeVsProDefaults": freeVsProDefaults },
  seo,
  aboutSections,
  faq,
  image,
  downloadLink,
  "affiliatePro": coalesce(
    affiliatePro,
    select(defined(affiliateProUrl) || defined(affiliateProLabel) => {
      "affiliateProUrl": affiliateProUrl,
      "affiliateProLabel": affiliateProLabel
    })
  ),
  freeVsProComparison,
  programComments[]{
    _key,
    authorName,
    authorRole,
    ipHash,
    body,
    createdAt,
    isPinned,
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt
    }
  },
  cdKeys[]
}
`;
export const adminProgramsWithCommentsQuery = `
*[_type == "program" && count(programComments) > 0] | order(_updatedAt desc) {
  _id,
  title,
  slug,
  programComments[]{
    _key,
    authorName,
    authorRole,
    ipHash,
    body,
    createdAt,
    isPinned,
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt
    }
  }
}`;

export const programBySlugQuery = `
*[_type == "program" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  _updatedAt,
  description,
  ${featuredBlockProjection},
  latestOfficialVersion,
  "vendor": vendor->{ name, "slug": slug.current, "freeVsProDefaults": freeVsProDefaults },
  seo,
  aboutSections,
  faq,
  image,
  downloadLink,
  "affiliatePro": coalesce(
    affiliatePro,
    select(defined(affiliateProUrl) || defined(affiliateProLabel) => {
      "affiliateProUrl": affiliateProUrl,
      "affiliateProLabel": affiliateProLabel
    })
  ),
  freeVsProComparison,
  programComments[]{
    _key,
    authorName,
    authorRole,
    ipHash,
    body,
    createdAt,
    isPinned,
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt
    }
  },
  cdKeys[],
  ${programStatsProjection}
}
`;

/* ------------ Analytics ------------ */
/** Resolves tier/spammer from live visitor or archived visitor bundles (for bundled events). */
export const visitorFieldsFromHashProjection = `
  "visitTier": coalesce(
    *[_type=="visitor" && visitorHash == ^.ipHash][0].visitTier,
    *[_type=="visitorBundle"].visitors[visitorHash == ^.ipHash][0].visitTier
  ),
  "visitorIsSpammer": coalesce(
    *[_type=="visitor" && visitorHash == ^.ipHash][0].isSpammer,
    *[_type=="visitorBundle"].visitors[visitorHash == ^.ipHash][0].isSpammer
  )`;

export const trackingEventsQuery = `*[_type=="trackingEvent" && createdAt >= $since]{
      _id, event, programSlug, notFound, social, path, referrer, country, city, key, activationUrl, programFlow, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;

/* ------------ Analytics with Custom Date Range ------------ */
export const trackingEventsWithRangeQuery = `*[_type=="trackingEvent" && createdAt >= $since && createdAt <= $until]{
      _id, event, programSlug, notFound, social, path, referrer, country, city, key, activationUrl, programFlow, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
    } | order(createdAt desc)`;

/** Admin list / summary: slim projection (import fields in merge helper). */
export const trackingEventsWithRangeSlimQuery = `*[_type=="trackingEvent" && createdAt >= $since && createdAt <= $until]{
      _id, event, programSlug, notFound, social, path, referrer, country, city, ipHash, createdAt
    } | order(createdAt desc)`;

/* ------------ Bundle counts by program (for merging with singular counts) ------------ */
export const bundleCountsQuery = `*[_type == "trackingEventBundle"]{
  "events": events[]{ programSlug, event, notFound }
}`;

/* ------------ Bundled Events (overlaps range, events filtered in-doc) ------------ */
export const trackingEventBundlesQuery = `*[_type == "trackingEventBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{
  _id,
  "events": events[createdAt >= $since && createdAt <= $until]{ event, programSlug, notFound, path, referrer, country, city, social, key, activationUrl, programFlow, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt }
}`;

export const trackingEventBundlesSlimQuery = `*[_type == "trackingEventBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{
  _id,
  "events": events[createdAt >= $since && createdAt <= $until]{ event, programSlug, notFound, social, path, referrer, country, city, ipHash, createdAt, _key }
}`;

/** Active + bundled visitors with lastActivityAt in range (admin tier aggregates). */
export const visitorTagAggregatesQuery = `{
  "singular": *[_type == "visitor" && lastActivityAt >= $since && lastActivityAt <= $until]{ visitTier, isSpammer },
  "bundled": *[_type == "visitorBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{
    "rows": visitors[lastActivityAt >= $since && lastActivityAt <= $until]{ visitTier, isSpammer }
  }.rows[]
}`;

/* ------------ Key Reports ------------ */
export const keyReportsQuery = `*[_type=="keyReport" && _createdAt >= $since]{
      _id, eventType, programSlug, path, referrer, country, city, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt, _createdAt,
      key,
      label
    } | order(_createdAt desc)`;

/* ------------ Program key report counts (community aggregateRating) ------------ */
export const programKeyReportCountsQuery = `{
  "working": count(*[_type == "keyReport" && programSlug == $slug && eventType == "report_key_working"]),
  "expired": count(*[_type == "keyReport" && programSlug == $slug && eventType == "report_key_expired"]),
  "limitReached": count(*[_type == "keyReport" && programSlug == $slug && eventType == "report_key_limit_reached"])
}`;

/* ------------ Program share counts (social_click per network) ------------ */
export const programShareCountsQuery = `{
  "facebook": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-facebook"]),
  "twitter": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-twitter"]),
  "telegram": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-telegram"]),
  "pinterest": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-pinterest"]),
  "tumblr": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-tumblr"]),
  "linkedin": count(*[_type == "trackingEvent" && event == "social_click" && programSlug == $slug && social == "share-linkedin"])
}`;

export const pageShareCountsQuery = `{
  "facebook": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-facebook"]),
  "twitter": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-twitter"]),
  "telegram": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-telegram"]),
  "pinterest": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-pinterest"]),
  "tumblr": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-tumblr"]),
  "linkedin": count(*[_type == "trackingEvent" && event == "social_click" && path == $path && social == "share-linkedin"])
}`;

/* ------------ Vendors ------------ */
/** /vendors index + homepage chips: vendors that have at least one program, with counts. */
export const vendorsWithCountsQuery = `*[_type == "vendor" && count(*[_type == "program" && references(^._id)]) > 0]{
  _id,
  name,
  "slug": slug.current,
  logo,
  "programCount": count(*[_type == "program" && references(^._id)])
} | order(programCount desc, name asc)`;

/** Slugs for generateStaticParams + sitemap (only vendors with programs are worth indexing). */
export const vendorSlugsQuery = `*[_type == "vendor" && defined(slug.current) && count(*[_type == "program" && references(^._id)]) > 0]{
  "slug": slug.current
}`;

/** /vendors/{slug} hub: vendor doc + its programs (listing projection, popularity-sorted). */
export const vendorBySlugQuery = `*[_type == "vendor" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  description,
  logo,
  seo,
  freeVsProDefaults,
  "programs": *[_type == "program" && references(^._id)]{
    ${programsListingProjection}
  } | order(popularityScore desc, _createdAt desc)
}`;

/* ------------ Cron Runs ------------ */
export const cronRunsQuery = `*[_type == "cronRun" && ranAt >= $since]{
  _id, job, source, status, details, ranAt
} | order(ranAt desc) [0...$limit]`;

export const lastCronRunByJobQuery = `*[_type == "cronRun" && job == $job] | order(ranAt desc) [0]{
  ranAt, source, status, details
}`;

/* ------------ Duplicate Key Report Check ------------ */
export const duplicateKeyReportQuery = `*[_type=="keyReport" && ipHash == $ipHash && programSlug == $programSlug && key == $key]{
      _id, eventType, programSlug, key, label, createdAt
    } | order(createdAt desc) [0]`;

/* ------------ Popular Programs (related / light cards — no per-program stats) ------------ */
export const popularProgramsQuery = `*[_type == "program"] | order(_createdAt desc) [0...6]{ ${relatedProgramsCardProjection} }`;

/* @deprecated Use programsWithStatsQuery + mergeProgramStats + sortPrograms("popular") — GROQ order uses stored scores only. */
export const popularProgramsByViewsQuery = `*[_type == "program"]{ ${programsListingProjection}, ${featuredBlockProjection} } | order(popularityScore desc) [0...6]`;

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
  ${programsListingProjection},
  ${featuredBlockProjection}
}`;

/* ------------ Programs Count Query ------------ */
export const programsCountQuery = `count(*[_type == "program"])`;

/* ------------ Featured Program Settings Query ------------ */
export const featuredProgramSettingsQuery = `*[_type == "featuredProgramSettings"][0]{
  currentFeaturedProgram->{
    _id,
    title,
    slug,
    "programFlow": coalesce(programFlow, "cd_key"),
    description,
    ${featuredBlockProjection},
    image,
    cdKeys[]
  },
  rotationSchedule,
  lastRotationDate,
  autoSelectCriteria,
  _id
}`;

/* ------------ Featured Program Query (with key stats) ------------ */
export const featuredProgramQuery = `*[_type == "program" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  description,
  image,
  downloadLink,
  cdKeys[],
  "totalKeys": count(cdKeys[]),
  "workingKeys": count(cdKeys[status == "active" || status == "new"]),
  ${programStatsProjection}
}`;

/* ------------ Programs for Auto-Selection (highest working keys) ------------ */
export const programsForAutoSelectionQuery = `*[_type == "program"]{
  _id,
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  description,
  ${featuredBlockProjection},
  image,
  downloadLink,
  cdKeys[],
  "totalKeys": count(cdKeys[]),
  "workingKeys": count(cdKeys[status == "active" || status == "new"]),
  ${programStatsProjection}
} | order(workingKeys desc, popularityScore desc)`;
