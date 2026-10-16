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
    "discover-giveaways": *[_type == "cronRun" && job == "discover-giveaways" && ranAt >= $since] | order(ranAt desc)[0]{${cronRunFields}}
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
