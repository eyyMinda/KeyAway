/* ------------ Store ------------ */
export const sitePromotionsQuery = `*[_type=="sitePromotion" && enabled == true && endsAt > now()] | order(startsAt asc){
  _id,
  startsAt,
  endsAt,
  theme,
  ctaLabel,
  ctaUrl,
  "mascotUrl": mascot.asset->url,
  "bannerMascotUrl": bannerMascot.asset->url,
  bannerText,
  cardTitle,
  cardText,
  cardProgramTitle,
  "programSlugs": programs[]->slug.current,
  bellTitle,
  bellText,
  popupText,
  heroText
}`;

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
/** GROQ fragment: image field with asset metadata for IdealImage (dimensions, lqip, animation flag). */
export const sanityImageFieldProjection = `
  ...,
  preserveAnimation,
  asset->{ url, mimeType, metadata { dimensions, lqip } }
`;

export const featuredBlockProjection = `
featured{
  description,
  showcaseGif{
    ${sanityImageFieldProjection}
  }
}`;

/** About sections with dereferenced image assets for IdealImage. */
export const programAboutSectionsProjection = `
aboutSections[]{
  ...,
  image{
    ${sanityImageFieldProjection}
  },
  points[]{
    ...,
    icon{
      ${sanityImageFieldProjection}
    }
  }
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
  "categories": categories[]->{ _id, title, "slug": slug.current },
  "platforms": coalesce(platforms, ["windows"]),
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
  "vendor": vendor->{ name, "slug": slug.current },
  "categories": categories[]->{ _id, title, "slug": slug.current },
  "platforms": coalesce(platforms, ["windows"]),
  "keyCount": count(cdKeys[]),
  "hasKeys": count(cdKeys[]) > 0,
  ${programStatsProjection}
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
  "vendor": vendor->{ name, "slug": slug.current },
  "categories": categories[]->{ _id, title, "slug": slug.current },
  "platforms": coalesce(platforms, ["windows"]),
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
    editedAt,
    isPinned,
    reactions[]{ emoji },
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt,
      editedAt,
      reactions[]{ emoji }
    }
  },
  cdKeys[]
}
`;
/** Admin programs list: one light row per program (no comments or rich content). */
export const adminProgramListProjection = `{
  _id,
  _updatedAt,
  title,
  slug,
  "programFlow": coalesce(programFlow, "cd_key"),
  latestOfficialVersion,
  downloadLink,
  "vendor": vendor->{ _id, name },
  "categories": categories[]->{ _id, title },
  "platforms": coalesce(platforms, ["windows"]),
  image,
  "aliases": giveawayDiscovery.aliases,
  "popularity": coalesce(stats.popularityScore, 0),
  "aboutCount": count(aboutSections),
  "faqCount": count(faq),
  "freeVsProCount": count(freeVsProComparison),
  "hasSeo": defined(seo.metaTitle) || defined(seo.metaDescription),
  versionCheck,
  versionStatus,
  cdKeys[]{ _key, key, status, version, validUntil, createdAt, accountLabel, username, "linkTitles": giveawayLinks[].title }
}`;
export const adminProgramListQuery = `*[_type == "program"] | order(title asc) ${adminProgramListProjection}`;

/** Admin program editor: every field the editor can change, plus revision and Studio-draft state. */
export const adminProgramEditorQuery = `*[_type == "program" && _id == $id][0]{
  _id,
  _rev,
  _updatedAt,
  title,
  slug,
  vendor,
  categories,
  platforms,
  programFlow,
  latestOfficialVersion,
  downloadLink,
  description,
  "affiliatePro": coalesce(
    affiliatePro,
    select(defined(affiliateProUrl) || defined(affiliateProLabel) => {
      "affiliateProUrl": affiliateProUrl,
      "affiliateProLabel": affiliateProLabel
    })
  ),
  freeVsProComparison,
  seo,
  image,
  aboutSections,
  faq,
  featured,
  giveawayDiscovery,
  versionCheck,
  versionStatus,
  cdKeys,
  "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)
}`;

/** Admin vendors list row. */
export const adminVendorListProjection = `{
  _id,
  _updatedAt,
  name,
  slug,
  logo,
  logoBackgroundColor,
  aliases,
  "hasDescription": count(description) > 0,
  "comparisonCount": count(giveawayVsOfficial),
  "hasSeo": defined(seo.metaTitle) || defined(seo.metaDescription),
  "programCount": count(*[_type == "program" && vendor._ref == ^._id && !(_id in path("drafts.**"))])
}`;

/** Admin vendor editor doc. */
export const adminVendorEditorQuery = `*[_type == "vendor" && _id == $id][0]{
  _id,
  _rev,
  _updatedAt,
  name,
  slug,
  description,
  logo,
  logoBackgroundColor,
  seo,
  aliases,
  giveawayVsOfficial,
  "programs": *[_type == "program" && vendor._ref == ^._id && !(_id in path("drafts.**"))] | order(title asc){ _id, title },
  "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)
}`;

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
    editedAt,
    isPinned,
    reactions[]{ emoji, ipHash, createdAt },
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt,
      editedAt,
      reactions[]{ emoji }
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
  "vendor": vendor->{ name, "slug": slug.current },
  "categories": categories[]->{ _id, title, "slug": slug.current },
  "platforms": coalesce(platforms, ["windows"]),
  seo,
  ${programAboutSectionsProjection},
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
    editedAt,
    isPinned,
    reactions[]{ emoji },
    replies[]{
      _key,
      authorName,
      authorRole,
      ipHash,
      body,
      createdAt,
      editedAt,
      reactions[]{ emoji }
    }
  },
  cdKeys[],
  ${programStatsProjection}
}
`;

/* ------------ Vendors ------------ */
/** /vendors index + homepage chips: vendors that have at least one program, with counts. */
export const vendorsWithCountsQuery = `*[_type == "vendor" && count(*[_type == "program" && references(^._id)]) > 0]{
  _id,
  name,
  "slug": slug.current,
  logo,
  logoBackgroundColor,
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
  logoBackgroundColor,
  seo,
  giveawayVsOfficial,
  "programs": *[_type == "program" && references(^._id)]{
    ${programsListingProjection}
  } | order(popularityScore desc, _createdAt desc)
}`;

/* ------------ Cron Runs ------------ */
const cronRunFields = `_id, job, source, status, details, ranAt`;

/** Latest run of each job, plus the 20 newest runs. A global limit would hide daily jobs behind frequent ones. */
export const cronStatusQuery = `{
  "recent": *[_type == "cronRun" && ranAt >= $since] | order(ranAt desc) [0...20]{
    ${cronRunFields}
  },
  "latestByJob": {
    "sync-program-stats": *[_type == "cronRun" && job == "sync-program-stats" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}},
    "update-expired-keys": *[_type == "cronRun" && job == "update-expired-keys" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}},
    "prune-cron-runs": *[_type == "cronRun" && job == "prune-cron-runs" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}},
    "discover-giveaways": *[_type == "cronRun" && job == "discover-giveaways" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}},
    "check-versions": *[_type == "cronRun" && job == "check-versions" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}}
  }
}`;

export const lastCronRunByJobQuery = `*[_type == "cronRun" && job == $job] | order(ranAt desc) [0]{
  ranAt, source, status, details
}`;

/* ------------ Popular Programs (related / light cards — no per-program stats) ------------ */
export const popularProgramsQuery = `*[_type == "program"] | order(_createdAt desc) [0...6]{ ${relatedProgramsCardProjection} }`;

/** Full candidate pool for related-program scoring (excludes current slug at fetch time). */
export const relatedProgramsCandidatesQuery = `*[_type == "program" && slug.current != $slug]{ ${relatedProgramsCardProjection} }`;

/* @deprecated Use programsWithStatsQuery + mergeProgramStats + sortPrograms("popular") — GROQ order uses stored scores only. */
export const popularProgramsByViewsQuery = `*[_type == "program"]{ ${programsListingProjection}, ${featuredBlockProjection} } | order(popularityScore desc) [0...6]`;

/* ------------ Statistics ------------ */
export const siteStatsQuery = `{
  "totalPrograms": count(*[_type == "program"]),
  "totalKeys": count(*[_type == "program"].cdKeys[]._key)
}`;

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
