/**
 * Nested section registry for readability; wire components with `SECTIONS.group.key`.
 * Flat `SECTION_IDS` is the merged map (same string values) for defaults and tooling.
 */
export const SECTIONS = {
  global: {
    header: "header"
  },
  home: {
    hero: "hero",
    featuredProgram: "featured_program",
    popularPrograms: "popular_programs",
    features: "features",
    cta: "cta"
  },
  browse: {
    /** Full program grid on /programs (browse-all page), not the homepage popular strip */
    allProgramsGrid: "all_programs_grid"
  },
  program: {
    /** Main program page panel — `ProgramInformation.tsx` on `/program/[slug]` */
    programInformation: "program_information"
  }
} as const;

export const SECTION_IDS = {
  ...SECTIONS.global,
  ...SECTIONS.home,
  ...SECTIONS.browse,
  ...SECTIONS.program
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

export const INTERACTION_IDS = {
  heroVisitorHintOpen: "hero_visitor_hint_open",
  heroSuggestCdKey: "hero_suggest_cd_key",
  heroHowItWorks: "hero_how_it_works",
  featuresSuggestCdKey: "features_suggest_cd_key",
  ctaBrowseAllPrograms: "cta_browse_all_programs",
  ctaSuggestCdKey: "cta_suggest_cd_key",
  programsBrowseAll: "programs_browse_all",
  programsSuggestCdKey: "programs_suggest_cd_key",
  featuredProgramViewKeys: "featured_program_view_keys",
  programGridViewKeysImage: "program_grid_view_keys_image",
  programGridViewKeysButton: "program_grid_view_keys_button",
  headerNavLink: "header_nav_link",
  mobileNavLink: "mobile_nav_link",
  headerContact: "header_contact",
  headerContactMobile: "header_contact_mobile",
  mobileContact: "mobile_contact"
} as const;

export type InteractionId = (typeof INTERACTION_IDS)[keyof typeof INTERACTION_IDS];

export const ALLOWED_SECTION_IDS = new Set<SectionId>(Object.values(SECTION_IDS));
export const ALLOWED_INTERACTION_IDS = new Set<InteractionId>(Object.values(INTERACTION_IDS));
