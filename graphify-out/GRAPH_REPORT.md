# Graph Report - KeyAway  (2026-11-22)

## Corpus Check
- Large corpus: 626 files · ~238,650 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3656 nodes · 11032 edges · 162 communities (146 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin API Routes
- Session Track API
- Static SEO Pages
- Ads Admin Dashboard
- Admin Status Routes
- Key Reports Page
- Key Report Events
- Sanity Content Schemas
- Giveaway Draw Editor
- Sitemap Admin Content
- Activity Overview Charts
- Admin Programs List
- Changelog Updates Feed
- Footer Program Hero
- Analytics SQL Schema
- Program Editor Tabs
- Home Page Grid
- Legal About Content
- Changelog Sync Scripts
- Programs Listing Page
- Program Form Mapping
- Comments IndexNow API
- Giveaway Find Updates
- Promotion Components
- Program Detail Page
- Renewal Report Popups
- Admin Reply Email
- Giveaway Listing Fetch
- Key Suggestions Admin
- Notification Feed
- Program Editor Panel
- Sanity Image Rendering
- Tooling Dependencies
- Contact Reply Modal
- Analytics Rollup Transforms
- Admin Comments UI
- Version Fit Reports
- Home Layout Sections
- Vendor Public Pages
- Admin Visitor Modal
- Analytics Event Aggregation
- Key Reports Admin
- CD Key Display
- Social Share Buttons
- Comments Version Checks
- Cache Revalidation
- Vendor Admin Forms
- Admin Data Tables
- Changelog Sync Workflow
- Runtime Dependencies
- Program Slug Prefill
- Giveaway Finds API
- Breadcrumbs Comparison
- TypeScript Config
- Feed Month Sidebar
- Prefill Page Scraper
- Giveaway Finds Page
- Admin Shell Layout
- Admin Picker Sessions
- Program Prefill Dialog
- Changelog Release Cards
- Home Hero Section
- Ad Rails Scripts
- Not Found Tracking
- CD Key Scoring
- Comment Reactions
- Program Title Matching
- Program Prefill Docs
- Catalog Listing Pages
- Visitor Tier Hints
- Comments Section
- Key Suggestion Email
- Giveaway Text Extract
- Public List API
- Client Session Tracking
- Giveaway Draw Store
- Giveaway Finds Table
- Database Usage Insights
- Changelog Sanitizer
- Sanity Studio Config
- Admin Home Dashboard
- Portable Text Markdown
- Ad Frame Context
- Banner Ad Slots
- Activation i18n
- Key Review Signals
- Press Kit Prefill
- Programs Preview Image
- Admin Events Table
- Version Source Lookup
- README Architecture
- Admin Sign In
- Prefill Scrape Script
- Ad Consent Banner
- Program Comment Forms
- Notification History Bundles
- Privacy and Terms
- Hero Image Details
- Key Review Modal
- Related Program Tiles
- Client Session Tracking
- Analytics Database Docs
- Sanity CD Key Input
- Installer Version Parse
- Admin Messages List
- Visitor Hash Docs
- Contact Suggestion Forms
- Visitor Tag Docs
- Centered Logo Image
- Not Found Tracking
- GitHub Changelog Fetch
- Promotion Docs
- NPM Scripts
- Globe Icon
- Dashboard Alerts
- Date Formatting
- Comment Reactions
- Related Programs Ranking
- Program Rating Copy
- Emoji Picker
- Vendor Backfill Script
- Key Icon Image
- Showcase Card Image
- Cron Status Card
- Admin Home Dashboard
- Sanity Error Overlay
- Expired Keys Docs
- Sanity Studio Shell
- Root Layout Metadata
- Brand Banner Image
- White Key Icon
- Store Schema Validators
- Vendor Prefill Docs
- NextAuth Handlers
- Content Security Policy
- Window Icon
- Version Fit Reports
- Analytics Event Labels
- Brand Card Image
- White Logo Image
- File Icon
- Spacious White Icon
- Color Logo Image
- Marketing SEO Pages
- Promotion Components
- Ad Stats SQL
- PostCSS Config
- Trustpilot Logo
- Giveaway Draws SQL
- Admin Event Fields
- Analytics Tailwind Safelist
- Vercel Cron Config
- Verification Token
- IOBIT Driver Booster
- IOBIT Malware Fighter
- IOBIT Smart Defrag
- IOBIT Software Updater
- IOBIT Uninstaller
- iTop Easy Desktop
- Photo Retoucher Card
- NextAuth Route Exports

## God Nodes (most connected - your core abstractions)
1. `react` - 153 edges
2. `next` - 140 edges
3. `rateLimitMiddleware()` - 127 edges
4. `requireAdminSession()` - 106 edges
5. `react-icons` - 79 edges
6. `db()` - 66 edges
7. `Errors` - 62 edges
8. `client` - 50 edges
9. `HoverPrefetchLink()` - 41 edges
10. `ProgramPage()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `KeyAway (llms.txt)` --semantically_similar_to--> `KeyAway`  [INFERRED] [semantically similar]
  public/llms.txt → README.md
- `Hashed IP Tracking` --semantically_similar_to--> `visitor_hash`  [INFERRED] [semantically similar]
  public/llms.txt → docs/visitor-tags.md
- `PROGRAM_WRITING_RULES` --semantically_similar_to--> `PROGRAM_WRITING_RULES`  [INFERRED] [semantically similar]
  docs/program-management.md → .claude/skills/prefill-program/SKILL.md
- `Installer Version Source` --semantically_similar_to--> `Vendor Installer Version`  [INFERRED] [semantically similar]
  docs/program-management.md → .claude/skills/prefill-program/SKILL.md
- `pressKit` --semantically_similar_to--> `Official Press Kit`  [INFERRED] [semantically similar]
  docs/program-management.md → .claude/skills/prefill-program/SKILL.md

## Import Cycles
- 4-file cycle: `src/components/home/PopularProgramsSection.tsx -> src/components/programs/index.ts -> src/components/programs/ProgramsGrid.tsx -> src/components/home/index.ts -> src/components/home/PopularProgramsSection.tsx`

## Hyperedges (group relationships)
- **Key Status Lifecycle** — docs_expired_keys_system_key_status_rules, docs_expired_keys_system_applykeystatusfordisplay, docs_expired_keys_system_updateallexpiredkeys, docs_expired_keys_system_update_expired_keys, docs_expired_keys_system_key_report_review [EXTRACTED 1.00]
- **Program and Vendor Prefill Pipeline** — docs_program_management_prefill, docs_program_management_collectsources, docs_program_management_scrapepage, docs_program_management_presskit, _claude_skills_prefill_program_skill_prefill_program, _claude_skills_prefill_vendor_skill_prefill_vendor [EXTRACTED 1.00]
- **Visitor Identity, Tiers, and Spammer Handling** — docs_visitor_tags_visitor_hash, docs_visitor_tags_visit_tier, docs_visitor_tags_spammer_flag, docs_tag_based_content_visitor_tier_content, docs_expired_keys_system_key_report_review, supabase_readme_visitors [INFERRED 0.85]
- **Document Glyph** — public_file_document_page, public_file_folded_corner, public_file_text_lines [EXTRACTED 1.00]
- **Clipped evenodd globe mark** — public_globe_disc, public_globe_graticule, public_globe_evenodd, public_globe_clippath [INFERRED 0.85]
- **Floating Software Icon Cluster** — public_images_hero_laptop_software_icons_photoshop_ps_icon, public_images_hero_laptop_software_icons_four_pane_icon, public_images_hero_laptop_software_icons_gear_arrow_badge, public_images_hero_laptop_software_icons_window_arrow_badge, public_images_hero_laptop_software_icons_letter_c_badge, public_images_hero_laptop_software_icons_letter_u_badge, public_images_hero_laptop_software_icons_shield_bolt_badge [EXTRACTED 1.00]
- **Desk Still Life** — public_images_hero_laptop_software_icons_laptop, public_images_hero_laptop_software_icons_potted_plants, public_images_hero_laptop_software_icons_notebook_and_pen [EXTRACTED 1.00]
- **KeyAway Centered Brand Lockup** — public_images_keyaway_centered_smiling_laptop, public_images_keyaway_centered_cyan_key, public_images_keyaway_centered_wordmark, public_images_keyaway_centered_free_cd_keys, public_images_keyaway_centered_pro_software [EXTRACTED 1.00]
- **Navy White and Cyan Palette** — public_images_keyaway_centered_navy_background, public_images_keyaway_centered_white_type, public_images_keyaway_centered_purple_cyan_gradient, public_images_keyaway_centered_cyan_key [EXTRACTED 1.00]
- **Visible Program Catalog** — public_images_keyaway_programs_preview_advanced_systemcare, public_images_keyaway_programs_preview_driver_booster, public_images_keyaway_programs_preview_software_updater, public_images_keyaway_programs_preview_malware_fighter, public_images_keyaway_programs_preview_uninstaller, public_images_keyaway_programs_preview_advanced_systemcare_ultimate, public_images_keyaway_programs_preview_smart_defrag, public_images_keyaway_programs_preview_itop_vpn [EXTRACTED 1.00]
- **Program Card Chrome** — public_images_keyaway_programs_preview_program_card, public_images_keyaway_programs_preview_key_count_badge, public_images_keyaway_programs_preview_view_download_stats, public_images_keyaway_programs_preview_view_keys_button [EXTRACTED 1.00]
- **Advanced SystemCare Ranking Badges** — public_images_keyaway_programs_preview_advanced_systemcare, public_images_keyaway_programs_preview_most_viewed_badge, public_images_keyaway_programs_preview_most_downloaded_badge [EXTRACTED 1.00]
- **KeyAway Centered Brand Lockup** — public_images_keyaway_banner_logo_mark, public_images_keyaway_banner_wordmark, public_images_keyaway_banner_free_cd_keys, public_images_keyaway_banner_pro_software [EXTRACTED 1.00]
- **KeyAway logo lockup** — public_images_keyaway_card_keyaway, public_images_keyaway_card_laptop_mascot, public_images_keyaway_card_key_icon, public_images_keyaway_card_free_cd_keys, public_images_keyaway_card_pro_software [EXTRACTED 1.00]
- **Key, open frame, and left chevron form one icon** — public_images_keyaway_icon_key, public_images_keyaway_icon_rounded_frame, public_images_keyaway_icon_left_arrow [EXTRACTED 1.00]
- **Bow, shaft, and bit form the key** — public_images_keyaway_icon_key_bow, public_images_keyaway_icon_key_shaft, public_images_keyaway_icon_key_bit [EXTRACTED 1.00]
- **White key-and-frame icon** — public_images_keyaway_icon_white_icon, public_images_keyaway_icon_white_key, public_images_keyaway_icon_white_rounded_frame, public_images_keyaway_icon_white_left_triangle, public_images_keyaway_icon_white_glow [EXTRACTED 1.00]
- **Key, Frame, and Wedge Form the Mark** — public_images_keyaway_icon_white_spacious_key, public_images_keyaway_icon_white_spacious_frame, public_images_keyaway_icon_white_spacious_wedge [EXTRACTED 1.00]
- **KeyAway Emblem** — public_images_keyaway_logo_key_glyph, public_images_keyaway_logo_play_glyph, public_images_keyaway_logo_rounded_frame [EXTRACTED 1.00]
- **KeyAway White Logo Lockup** — public_images_keyaway_logo_white_wordmark, public_images_keyaway_logo_white_key_glyph, public_images_keyaway_logo_white_rounded_frame, public_images_keyaway_logo_white_left_chevron [EXTRACTED 1.00]
- **Products Listed on the Showcase** — public_images_keyaway_showcase_card_iobit_advanced_systemcare, public_images_keyaway_showcase_card_iobit_malware_fighter, public_images_keyaway_showcase_card_iobit_driver_booster, public_images_keyaway_showcase_card_iobit_software_updater, public_images_keyaway_showcase_card_iobit_uninstaller, public_images_keyaway_showcase_card_iobit_smart_defrag, public_images_keyaway_showcase_card_softorbits_photo_retoucher, public_images_keyaway_showcase_card_itop_easy_desktop [EXTRACTED 1.00]
- **Product Card Layout** — public_images_keyaway_showcase_card_product_card, public_images_keyaway_showcase_card_product_screenshot, public_images_keyaway_showcase_card_view_keys_button, public_images_keyaway_showcase_card_key_count_badge, public_images_keyaway_showcase_card_engagement_metrics [EXTRACTED 1.00]
- **IObit Utilities on the Showcase** — public_images_keyaway_showcase_card_iobit_advanced_systemcare, public_images_keyaway_showcase_card_iobit_malware_fighter, public_images_keyaway_showcase_card_iobit_driver_booster, public_images_keyaway_showcase_card_iobit_software_updater, public_images_keyaway_showcase_card_iobit_uninstaller, public_images_keyaway_showcase_card_iobit_smart_defrag [EXTRACTED 1.00]
- **Window Glyph Subpaths** — public_window_outer_frame, public_window_inner_pane, public_window_control_dots [EXTRACTED 1.00]

## Communities (162 total, 16 thin omitted)

### Community 0 - "Admin API Routes"
Cohesion: 0.05
Nodes (93): auth, GET(), GET(), GET(), GET(), GET(), GET(), GET() (+85 more)

### Community 1 - "Session Track API"
Cohesion: 0.07
Nodes (72): activationUrlFromMeta(), ANALYTICS_EVENTS, IncomingEvent, POST(), activationUrlFromMeta(), ANALYTICS_EVENTS, buildAnalyticsEventDedupeKey(), POST() (+64 more)

### Community 2 - "Static SEO Pages"
Cohesion: 0.06
Nodes (72): AboutPage(), generateMetadata(), AffiliateDisclosurePage(), generateMetadata(), ChangelogPage(), ChangelogPageProps, generateMetadata(), DmcaPage() (+64 more)

### Community 3 - "Ads Admin Dashboard"
Cohesion: 0.08
Nodes (66): AdminAdsPage(), AdsDashboard(), AdStatsResponse, KpiRow(), PATH_PAGES, Period, periodRange(), PERIODS (+58 more)

### Community 4 - "Admin Status Routes"
Cohesion: 0.05
Nodes (54): GET(), CronRunRow, GET(), GET(), ProgramCommentFormProps, ANALYTICS_DB_LIMIT_BYTES, AnalyticsTableUsage, getCachedAnalyticsDbUsage (+46 more)

### Community 5 - "Key Reports Page"
Cohesion: 0.08
Nodes (60): KeyReportsPage(), KeyReportsPageContent(), sendPatch(), EntryInput, FindRow, hasAnyItem(), isoOrUndefined(), POST() (+52 more)

### Community 6 - "Key Report Events"
Cohesion: 0.06
Nodes (53): PATCH(), REPORT_EVENTS, VERSION_FITS, GET(), KeyStatusUpdate, parseUpdates(), PATCH(), VALID_STATUSES (+45 more)

### Community 7 - "Sanity Content Schemas"
Cohesion: 0.06
Nodes (30): sanity, CHANGELOG_TAGS, canonicalDocumentId(), ProgramRow, VendorProgramsInput(), contactMessageReply, giveawayDiscoverySettings, kindOf() (+22 more)

### Community 8 - "Giveaway Draw Editor"
Cohesion: 0.09
Nodes (45): GiveawayPickerContent(), GiveawayPickerPage(), toSummary(), Draft, draftOf(), DrawEditor(), GIVEAWAY_KINDS, mergeEntrants() (+37 more)

### Community 9 - "Sitemap Admin Content"
Cohesion: 0.05
Nodes (46): revalidate, GiveawayVsOfficialProps, ADMIN_CONTENT_QUERIES, AdminContentView, mergeProgramStats(), mergeSingleProgramStats(), applyKeyStatusForDisplay(), adminKeyReportProgramsQuery (+38 more)

### Community 10 - "Activity Overview Charts"
Cohesion: 0.08
Nodes (44): AnalyticsPage(), ActivityOverview(), ActivityOverviewProps, Metric, METRICS, Segmented(), View, axisNumber() (+36 more)

### Community 11 - "Admin Programs List"
Cohesion: 0.07
Nodes (45): loadPage(), PageData, ProgramsPage(), readUrlState(), UrlState, View, writeUrlState(), BasicsTabProps (+37 more)

### Community 12 - "Changelog Updates Feed"
Cohesion: 0.11
Nodes (41): ChangelogContent(), ChangelogContentProps, revalidate, revalidate, UpdatesContent(), UpdatesContentProps, AdSlot(), FeedShowMoreButton() (+33 more)

### Community 13 - "Footer Program Hero"
Cohesion: 0.11
Nodes (35): ContactModal(), IdealImageProps, IdealImageClient(), Footer(), TRUST_FOOTER_LINKS, PROGRAM_HERO_IMAGE_SIZES, ProgramHeroImage(), ProgramInformation() (+27 more)

### Community 14 - "Analytics SQL Schema"
Cohesion: 0.07
Nodes (30): analytics.append_session(), analytics.events, analytics.key_reports, analytics.legacy_documents, analytics.migration_runs, analytics.sessions, analytics.visitor_snapshots, analytics.visitors (+22 more)

### Community 15 - "Program Editor Tabs"
Cohesion: 0.13
Nodes (39): BasicsTab(), chip(), FLOW_OPTIONS, PLATFORMS, ContentTab(), firstLine(), AddRowButton(), Card() (+31 more)

### Community 16 - "Home Page Grid"
Cohesion: 0.10
Nodes (28): react-icons, generateMetadata(), HomePage(), revalidate, AllProgramsSection(), AllProgramsSectionProps, CTASection(), helpWays (+20 more)

### Community 17 - "Legal About Content"
Cohesion: 0.18
Nodes (27): AboutContent(), AffiliateDisclosureContent(), DmcaContent(), buildReportMailto(), GlobalRouteError(), HowItWorksContent(), PartnersContent(), PrivacyContent() (+19 more)

### Community 18 - "Changelog Sync Scripts"
Cohesion: 0.10
Nodes (39): DRAFT, main(), WRITE, CHANGELOG_TAG_ALIASES, CHANGELOG_TAG_SET, CHANGELOG_TAGS, changelogDocId(), createSanityClientFromEnv() (+31 more)

### Community 19 - "Programs Listing Page"
Cohesion: 0.11
Nodes (33): EMPTY_PROGRAMS, listParamsKey(), ProgramsPageClient(), readListParams(), SearchParamsSync(), groqProgramsOrderClause(), normalizeCategoryFilter(), normalizeFilterType() (+25 more)

### Community 20 - "Program Form Mapping"
Cohesion: 0.10
Nodes (39): ImagePickerProps, AboutPointForm, AboutSectionForm, changedFields(), compact(), comparable(), docToForm(), FaqForm (+31 more)

### Community 21 - "Comments IndexNow API"
Cohesion: 0.09
Nodes (32): DELETE(), GET(), getNonProgramUrls(), getProgramUrls(), NON_PROGRAM_PATHS, parseCustomUrls(), POST(), SubmitMode (+24 more)

### Community 22 - "Giveaway Find Updates"
Cohesion: 0.10
Nodes (36): FindRow, IGNORE_REASONS, ITEM_KINDS, ItemRef, parseItemRef(), parseUpdates(), PATCH(), ProgramRow (+28 more)

### Community 23 - "Promotion Components"
Cohesion: 0.12
Nodes (29): geistMono, geistSans, generateMetadata(), HEAD_METADATA_GROUPS, HeadMetaTag, revalidate, RootLayout(), PinnedPromotionItem() (+21 more)

### Community 24 - "Program Detail Page"
Cohesion: 0.09
Nodes (30): generateMetadata(), ProgramPage(), ProgramPageProps, revalidate, ActivationInstructions(), ActivationInstructionsProps, ActivationStepKey, ActivationStepOverrides (+22 more)

### Community 25 - "Renewal Report Popups"
Cohesion: 0.12
Nodes (35): RenewalModal(), RenewButton(), RenewButtonProps, ReportButton(), ReportButtonProps, ReportPopup(), SpammerReportAlert(), defaultState (+27 more)

### Community 26 - "Admin Reply Email"
Cohesion: 0.13
Nodes (35): MESSAGE_SAMPLE, ReplyEmailTemplatePreview(), ReplySample, AdminReplyMailtoOptions, AdminReplyTemplate, buildAdminReplyContentHtml(), buildAdminReplyContentPlain(), buildAdminReplyHtmlBody() (+27 more)

### Community 27 - "Giveaway Listing Fetch"
Cohesion: 0.11
Nodes (34): hasNewActivation(), hasSomethingNew(), decodeEntities(), fetchRssListing(), fetchWpRestListing(), gmtToIso(), toIso(), WpRestRow (+26 more)

### Community 28 - "Key Suggestions Admin"
Cohesion: 0.13
Nodes (31): KeySuggestionsPage(), loadSuggestions(), OPEN, programKey(), REPLY_SAMPLE, SortKey, StatusView, AnalyticsCard() (+23 more)

### Community 29 - "Notification Feed"
Cohesion: 0.09
Nodes (31): GET(), getRecentNotificationsCached, TAG_NOTIFICATION_FEED, deriveCatalogNotificationEvents(), FeedDocument, FeedRow, fetchBellFeedDocument(), fetchFeedDocuments() (+23 more)

### Community 30 - "Program Editor Panel"
Cohesion: 0.10
Nodes (32): DeleteProgramModal(), DeleteProgramModalProps, Banner, BasicsVersionStatus, EDITOR_TABS, EMPTY_SCRAPE, fetchEditorDoc(), FLOW_BADGE (+24 more)

### Community 31 - "Sanity Image Rendering"
Cohesion: 0.14
Nodes (27): @sanity/image-url, AnimatedSanityImage(), AnimatedSanityImageProps, IdealImage(), AboutSectionBlock(), hasAsset(), ProgramAboutSection(), fitInsideBox() (+19 more)

### Community 32 - "Tooling Dependencies"
Cohesion: 0.08
Nodes (30): eslintConfig, devDependencies, autoprefixer@^10.6.1, eslint@^10.13.0, eslint-config-next@16.4.2, @eslint/eslintrc@^3.3.7, postcss@^8.5.31, tailwindcss@^4.3.3 (+22 more)

### Community 33 - "Contact Reply Modal"
Cohesion: 0.16
Nodes (26): AdminDetailsModal(), ContactField(), EmailReplyComposer(), EmailReplyHistory(), hostOf(), KeySuggestionsTable(), KeySuggestionsTableProps, SuggestionUpdatePayload (+18 more)

### Community 34 - "Analytics Rollup Transforms"
Cohesion: 0.10
Nodes (32): transformCountryData(), transformPathActivityTable(), transformProgramData(), transformSocialData(), decodeSourceKey(), getRollupWindow(), nearestDay(), rollupDays() (+24 more)

### Community 35 - "Admin Comments UI"
Cohesion: 0.12
Nodes (26): AdminCommentsPage(), DeleteCommentConfirmModal(), DeleteCommentConfirmModalProps, CommentBlock(), formatDate(), ProgramCommentDetailsModal(), ProgramCommentDetailsModalProps, Avatar() (+18 more)

### Community 36 - "Version Fit Reports"
Cohesion: 0.16
Nodes (29): fitButton(), KeyReportRowProps, VersionFitControl(), VersionFitPrompt(), VersionFitPromptProps, tenths(), applyKeyReportEvent(), countsInProgressBar() (+21 more)

### Community 37 - "Home Layout Sections"
Cohesion: 0.12
Nodes (24): AdminNavIcons(), AdminNavIconsProps, AnnouncementNotifications(), AnnouncementNotificationsProps, Header(), MobileMenu(), MobileMenuProps, IconBadge() (+16 more)

### Community 38 - "Vendor Public Pages"
Cohesion: 0.13
Nodes (24): @portabletext/types, generateStaticParams(), revalidate, VendorPage(), VendorPageProps, FeaturedProgramSection(), components, RichText() (+16 more)

### Community 39 - "Admin Visitor Modal"
Cohesion: 0.11
Nodes (20): react, Accent, AdminDetailsModalProps, AdminVisitorSection(), AdminVisitorSectionProps, MarkSpammerButton(), handleConfirm(), MarkSpammerButtonProps (+12 more)

### Community 40 - "Analytics Event Aggregation"
Cohesion: 0.12
Nodes (23): EventsFilterProps, RecentActivity(), RecentActivityProps, AggregatedData, aggregateEvents(), effectiveReferrerHref(), extractReferrerInfo(), getDateFromPeriod() (+15 more)

### Community 41 - "Key Reports Admin"
Cohesion: 0.09
Nodes (29): Count(), Fact(), KeyReportDetailsModal(), KeyReportDetailsModalProps, RowFilter, shortDate(), topCounts(), KeyReportRow (+21 more)

### Community 42 - "CD Key Display"
Cohesion: 0.22
Nodes (22): react-dom, EmailReplyContent, ToastState, CDKeyActions(), CDKeyItem(), CDKeyMobileCard(), OtherVersionReportHint(), OtherVersionReportHintProps (+14 more)

### Community 43 - "Social Share Buttons"
Cohesion: 0.14
Nodes (23): ProgramSocialShare(), ProgramSocialShareProps, FooterMiniSocialShare(), FooterMiniSocialShareProps, ProgramsPageSocialShare(), ProgramsPageSocialShareProps, NetworkConfig, SHARE_NETWORKS (+15 more)

### Community 44 - "Comments Version Checks"
Cohesion: 0.17
Nodes (24): GET(), logError(), maxDuration, POST(), run(), GET(), logError(), maxDuration (+16 more)

### Community 45 - "Cache Revalidation"
Cohesion: 0.16
Nodes (22): GET(), POST(), resolveProgramSlugForWebhook(), shouldBustSitemapUrlset(), getRolledUntil(), aggregateEventStats(), ProgramStats, runSyncProgramStatsRollup() (+14 more)

### Community 46 - "Vendor Admin Forms"
Cohesion: 0.13
Nodes (24): EDITABLE_PROGRAM_FIELDS, EditableProgramField, FIELD_TAB, isoDate(), isUrl(), MAX_ABOUT_SECTIONS, MAX_META_TITLE, NORMALIZERS (+16 more)

### Community 47 - "Admin Data Tables"
Cohesion: 0.09
Nodes (21): DataTableProps, DataTableRow, TimeFilterProps, timePeriods, Logger, logger, loggerInstance, LogStatus (+13 more)

### Community 48 - "Changelog Sync Workflow"
Cohesion: 0.08
Nodes (25): GITHUB_TOKEN, NEXT_PUBLIC_SANITY_STUDIO_API_VERSION, NEXT_PUBLIC_SANITY_STUDIO_DATASET, NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID, SANITY_API_TOKEN, jobs, sync, name (+17 more)

### Community 49 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (26): dependencies, bad-words@^4.1.5, next@16.4.2, @portabletext/react@^8.0.1, @portabletext/toolkit@^6.0.0, @portabletext/types@^4.0.2, postgres@^3.4.9, react@19.3.1 (+18 more)

### Community 50 - "Program Slug Prefill"
Cohesion: 0.14
Nodes (21): applyVendorPrefill(), vendorFormToPrefill(), SLUG_REGEX, titleToSlug(), validateSlug(), EMPTY_SCRAPE, fetchVendorDoc(), hexRgb() (+13 more)

### Community 51 - "Giveaway Finds API"
Cohesion: 0.13
Nodes (22): GET(), GiveawayFindsPayload, findSourceForUrl(), GiveawayDiscoveryConfig, hostOf(), loadDiscoveryConfig(), SourceRow, toSource() (+14 more)

### Community 52 - "Breadcrumbs Comparison"
Cohesion: 0.14
Nodes (18): Breadcrumbs(), Crumb, FreeVsProComparison(), FreeVsProComparisonProps, ProgramBreadcrumbs(), ProgramBreadcrumbsProps, VendorBreadcrumbs(), VendorBreadcrumbsProps (+10 more)

### Community 53 - "TypeScript Config"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+16 more)

### Community 54 - "Feed Month Sidebar"
Cohesion: 0.17
Nodes (18): FeedMonthSidebar(), FeedMonthSidebarProps, linkClass(), FeedWithMonthSidebar(), FeedWithMonthSidebarProps, useFeedMonthScrollSpy(), useScrollToFeedOnMonthChange(), buildChangelogHref() (+10 more)

### Community 55 - "Prefill Page Scraper"
Cohesion: 0.15
Nodes (20): absolute(), clean(), extractFaqs(), extractImages(), extractSections(), fetchHtml(), iobitFaqs, jsonLdItems() (+12 more)

### Community 56 - "Giveaway Finds Page"
Cohesion: 0.16
Nodes (19): GiveawayFindsPage(), loadFinds(), Payload, AddEntryModal(), AddEntryModalProps, AddEntryPreset, Field(), hostLabel() (+11 more)

### Community 57 - "Admin Shell Layout"
Cohesion: 0.18
Nodes (15): AdminRootLayout(), AdminLayout(), AdminLayoutProps, AdminThemeScope(), AdminHeader(), AdminThemeToggle(), ADMIN_DARK_CLASS, ADMIN_LIGHT_CLASS (+7 more)

### Community 58 - "Admin Picker Sessions"
Cohesion: 0.14
Nodes (19): durationLabel(), FILTERS, SessionRow, SessionsPage(), AdminViewDetailsButton(), adminViewDetailsButtonClass, eventDetail(), reportLabel() (+11 more)

### Community 59 - "Program Prefill Dialog"
Cohesion: 0.16
Nodes (22): programFromScrape(), buildProgramPrompt(), buildVendorPrompt(), cap(), domainLabel(), isObj(), majorMinor(), Obj (+14 more)

### Community 60 - "Changelog Release Cards"
Cohesion: 0.14
Nodes (19): ChangelogReleaseCard(), ChangelogReleaseCardProps, TAG_STYLES, ChangelogReleaseList(), ChangelogReleaseListProps, ChangelogRelease, ChangelogSection, ChangelogTag (+11 more)

### Community 61 - "Home Hero Section"
Cohesion: 0.15
Nodes (14): HeroAtAGlanceStrip(), HeroAtAGlanceStripProps, HERO_ALT, HeroLaptopImage(), HeroVisual(), homeAtAGlanceBullets, HomeAtAGlanceColor, homeAtAGlanceIconShell (+6 more)

### Community 62 - "Ad Rails Scripts"
Cohesion: 0.19
Nodes (16): AdFrame(), AdRails(), RAIL_FORMATS, AdScripts(), AdSlotProps, CARD_FORMATS, GridAdCard(), useAdConsent() (+8 more)

### Community 63 - "Not Found Tracking"
Cohesion: 0.18
Nodes (15): EXCLUDED_HOSTNAMES, NotFoundTracker(), EXCLUDED_HOSTNAMES, EXCLUDED_PATH_PREFIXES, isExcludedPath(), log(), PageViewTracker(), PAGE_VIEW_SKIP_STORAGE_PREFIX (+7 more)

### Community 64 - "CD Key Scoring"
Cohesion: 0.18
Nodes (15): CDKeyTable(), KeyStatusTooltip(), KeyReportFetched, useKeyReportData(), calculateKeyScore(), CDKEY_STATUS_DISPLAY_TEXT, cdKeyHasExpiry(), getExpiringKeysMessage() (+7 more)

### Community 65 - "Comment Reactions"
Cohesion: 0.19
Nodes (18): CommentReactions(), CommentReactionsProps, aggregateCommentReactions(), applyOptimisticReactionToggle(), canVisitorAddReaction(), countVisitorReactionTypes(), MAX_REACTION_EMOJI_LENGTH, MAX_REACTION_ROWS (+10 more)

### Community 66 - "Program Title Matching"
Cohesion: 0.15
Nodes (20): giveawayFindId(), bigrams(), cleanName(), createProgramMatcher(), matchTitle(), matchWatchUrl(), dice(), DiscoveryProgram (+12 more)

### Community 67 - "Program Prefill Docs"
Cohesion: 0.15
Nodes (20): Official Press Kit, prefill:check, Prefill Program, prefill:scrape, Program PrefillResult, PROGRAM_RESULT_SHAPE, PROGRAM_WRITING_RULES, Vendor Installer Version (+12 more)

### Community 68 - "Catalog Listing Pages"
Cohesion: 0.18
Nodes (16): generateMetadata(), ProgramsPage(), revalidate, revalidate, VendorsPage(), JsonLd(), JsonLdProps, ContributeSection() (+8 more)

### Community 69 - "Visitor Tier Hints"
Cohesion: 0.21
Nodes (15): HeroSectionProps, tierFeatureShell(), tierIcon(), VisitorTierHint(), VisitorTierHintProps, VisitorTierHintVariant, buildVisitorHintData(), labelForTier() (+7 more)

### Community 70 - "Comments Section"
Cohesion: 0.18
Nodes (14): CommentBodyText(), CommentsSection(), CommentsSectionProps, ProgramCommentEditInline(), CommentDateLine(), formatCommentDate(), ProgramCommentsList(), ProgramCommentsListProps (+6 more)

### Community 71 - "Key Suggestion Email"
Cohesion: 0.23
Nodes (15): KEY_SUGGESTION_OPENING, keySuggestionReplyContent(), getResendClient(), getResendFromAddress(), getResendReplyToAddress(), isResendConfigured(), buildReplyTemplateOptions(), deliverAdminReply() (+7 more)

### Community 72 - "Giveaway Text Extract"
Cohesion: 0.18
Nodes (17): extractAccounts(), extractGiveaway(), extractKeys(), extractLinks(), extractValidUntil(), extractVersion(), guessFlow(), hashExtracted() (+9 more)

### Community 73 - "Public List API"
Cohesion: 0.17
Nodes (11): next, OPT_IN_COUNTRIES, GET(), GET(), getClientIpFromForwardedHeaders(), PUBLIC_ISR_REVALIDATE_SECONDS, fetchPublishedSlugSet(), getCachedPublishedProgramSlugs() (+3 more)

### Community 74 - "Client Session Tracking"
Cohesion: 0.18
Nodes (14): AppendTrackingSessionInput, clean(), eventTime(), SessionEventInput, toRow(), isOwnSiteHost(), SESSION_ENTRY_LABEL, SESSION_ID_RE (+6 more)

### Community 75 - "Giveaway Draw Store"
Cohesion: 0.21
Nodes (16): DELETE(), GET(), Params, PATCH(), GET(), POST(), createDraw(), deleteDraw() (+8 more)

### Community 76 - "Giveaway Finds Table"
Cohesion: 0.16
Nodes (18): CHIP_STYLES, CopyChip(), DEFAULT_DIR, flowLabel(), GiveawayFindsTable(), GiveawayFindUpdate, ItemRef, ItemRow() (+10 more)

### Community 77 - "Database Usage Insights"
Cohesion: 0.19
Nodes (16): compact(), DbTrafficCard(), formatBytes(), groupQueries(), percent(), QueryGroup, quotaTone(), RollupStatusCard() (+8 more)

### Community 78 - "Changelog Sanitizer"
Cohesion: 0.23
Nodes (17): isSensitiveChangelogLine(), sanitizeChangelogBullet(), sanitizeChangelogText(), SENSITIVE_LINE_PATTERNS, shouldSkipChangelogSection(), SKIP_SECTION_TITLES, extractBullets(), firstParagraph() (+9 more)

### Community 79 - "Sanity Studio Config"
Cohesion: 0.15
Nodes (11): @sanity/color-input@^6.1.8, @sanity/vision@^6.20.0, @sanity/color-input, @sanity/vision, apiVersion, dataset, projectId, promotionTemplates (+3 more)

### Community 80 - "Admin Home Dashboard"
Cohesion: 0.18
Nodes (12): AdminHomePage(), SectionHeading(), AnalyticsDbUsage(), barClass(), Growth(), LABELS, GiveawayPickerCard(), IndexNowSubmitCard() (+4 more)

### Community 81 - "Portable Text Markdown"
Cohesion: 0.22
Nodes (17): RichText, asBlocks(), Block, canonical(), DECORATOR_MD, escapeInline(), escapeLineStart(), INLINE_RULES (+9 more)

### Community 82 - "Ad Frame Context"
Cohesion: 0.19
Nodes (14): AdFillStatus, AdFrameContext, AdFrameContextValue, AdFrameProps, SponsoredLink(), SponsoredLinkProps, TrackedLink(), useAdUnit() (+6 more)

### Community 83 - "Banner Ad Slots"
Cohesion: 0.20
Nodes (14): BannerAd(), BannerAdProps, bannerDocument(), Layout, pickFormat(), NativeBannerAd(), hasRenderedAd(), useNearViewport() (+6 more)

### Community 84 - "Activation i18n"
Cohesion: 0.15
Nodes (15): I18nShell(), DictObject, DictValue, getByPath(), I18nContext, I18nContextValue, I18nProvider(), I18nT (+7 more)

### Community 85 - "Key Review Signals"
Cohesion: 0.15
Nodes (17): brokenStatus(), DoubtfulReport, isNegative(), KeyReview, KeySignal, KeySuggestion, MASS_REPORT_SPREAD, massReporters() (+9 more)

### Community 86 - "Press Kit Prefill"
Cohesion: 0.20
Nodes (15): cheerio@^1.2.0, cheerio, clean(), docxText(), download(), imageKind(), kitsOnPage(), MIME (+7 more)

### Community 87 - "Programs Preview Image"
Cohesion: 0.18
Nodes (15): IOBIT Advanced SystemCare, IOBIT Advanced SystemCare Ultimate, IOBIT Driver Booster, IOBIT, iTop VPN, License Key Count Badge, License Key Catalog, IOBIT Malware Fighter (+7 more)

### Community 88 - "Admin Events Table"
Cohesion: 0.20
Nodes (14): AdminVisitorPanel(), AdminVisitorPanelProps, Stat(), EventsTable(), EventsTableProps, renderHeaderCell(), SortableColumn, sortableHeadToneStyles (+6 more)

### Community 89 - "Version Source Lookup"
Cohesion: 0.25
Nodes (16): installerVersion(), filepumaQueue, findVersionInText(), fromChocolatey(), fromFilepuma(), fromHomebrew(), fromInstaller(), fromPage() (+8 more)

### Community 90 - "README Architecture"
Cohesion: 0.16
Nodes (16): Suggestion and Contact Storage, Program Editor, Programs Table, Vendors Editor, User Contributions, Admin and Studio, Notification Feed, Public API v1 (+8 more)

### Community 91 - "Admin Sign In"
Cohesion: 0.13
Nodes (10): next-auth@^5.0.0-beta.32, next-auth, AdminSignInForm(), AdminSignInPage(), SessionProvider(), next-auth, next-auth/jwt, JWT (+2 more)

### Community 92 - "Prefill Scrape Script"
Cohesion: 0.19
Nodes (12): args, extras(), nameIndex, urls, collectPrefillSources(), prefillExtras(), findPressKit(), kitVersion() (+4 more)

### Community 93 - "Ad Consent Banner"
Cohesion: 0.23
Nodes (14): AdConsentBanner(), AdConsentSnapshot, AdConsentStatus, closeAdConsentPreferences(), hasGlobalPrivacyControl(), initAdConsent(), listeners, openAdConsentPreferences() (+6 more)

### Community 94 - "Program Comment Forms"
Cohesion: 0.23
Nodes (12): CommentBodyTextProps, ProgramCommentEditInlineProps, flattenProgramCommentsForAdmin(), ProgramWithComments, pushCommentRow(), pushReplyRow(), visitorFields(), commentBodyToPlain() (+4 more)

### Community 95 - "Notification History Bundles"
Cohesion: 0.24
Nodes (15): appendNotificationHistoryEvents(), BundleDoc, createEmptyBundle(), fetchBundles(), fetchExistingHistoryKeys(), getOpenBundle(), NOTIFICATION_BUNDLE_CAPACITY, NOTIFICATION_HISTORY_DERIVE_DAYS (+7 more)

### Community 96 - "Privacy and Terms"
Cohesion: 0.15
Nodes (13): Advertising Consent, Affiliate and Outbound Links, One-way IP Hash, Privacy Policy, Affiliate Disclosure, Donations, Key Validity, Terms of Service (+5 more)

### Community 97 - "Hero Image Details"
Cohesion: 0.15
Nodes (15): Blue Burst Laptop Screen, Sunlit Desk Still Life, Four-Pane Window Icon, Red Gear and Up-Arrow Badge, Silver Open Laptop, Cyan Letter C Badge, Green Letter U Badge, Notebook and Pen (+7 more)

### Community 98 - "Key Review Modal"
Cohesion: 0.27
Nodes (14): statusLabel(), KeyCard(), keyLink(), KeyReviewModal(), keySignalChip(), pct(), ReportBar(), reportFlagChip() (+6 more)

### Community 99 - "Related Program Tiles"
Cohesion: 0.28
Nodes (12): MacGlyph(), WindowsGlyph(), computePageStarts(), programPlatforms(), ProgramTile(), readItemsPerView(), RelatedPrograms(), RelatedProgramsProps (+4 more)

### Community 100 - "Client Session Tracking"
Cohesion: 0.27
Nodes (14): bindFlushListeners(), classifyClientSessionEntry(), enqueueAnalyticsEvent(), ensureSession(), flushTrackingSession(), navigationType(), newSession(), queue (+6 more)

### Community 101 - "Analytics Database Docs"
Cohesion: 0.19
Nodes (14): Doubtful Reports, Key Report Review, Analytics Schema, analytics.giveaway_draws, analytics.key_reports, analytics.legacy_documents, prune-cron-runs Rollup Hook, analytics.prune_visitors (+6 more)

### Community 102 - "Sanity CD Key Input"
Cohesion: 0.24
Nodes (11): CdKeyRow, CdKeysArrayInput(), compareCdKeys(), createdAtMs(), statusRank(), aboutPoint, aboutSection, faqItem (+3 more)

### Community 103 - "Installer Version Parse"
Cohesion: 0.29
Nodes (10): exeVersionInfo(), finish(), isExe(), isXar(), isZip(), normalizeInstallerVersion(), pkgVersionInfo(), readHead() (+2 more)

### Community 104 - "Admin Messages List"
Cohesion: 0.37
Nodes (11): loadMessages(), MessagesPage(), SortKey, MessagesTable(), filterMessagesByView(), inView(), MESSAGE_VIEWS, messageHasNoEmail() (+3 more)

### Community 105 - "Visitor Hash Docs"
Cohesion: 0.20
Nodes (11): carryOverVisitorHash, Analytics Salt Rotation, visitor_hash, Security Contact, Verification Policy, Automation and Freshness, KeyAway (llms.txt), Operator eyyMinda (+3 more)

### Community 106 - "Contact Suggestion Forms"
Cohesion: 0.21
Nodes (10): ContactForm(), ContactFormProps, KeySuggestionForm(), KeySuggestionFormProps, ProgramCommentForm(), handleSubmit(), getTrackingSessionId(), getTrackingSessionMeta() (+2 more)

### Community 107 - "Visitor Tag Docs"
Cohesion: 0.25
Nodes (11): buildVisitorHintData, getVisitorContextForPublicPage, isSpammerVisitor, Visitor-tier Content, VisitorTierHint, analytics.visitors, setVisitorSpammer, Spammer Flag (+3 more)

### Community 108 - "Centered Logo Image"
Cohesion: 0.29
Nodes (10): Free CD Keys and Pro Software Branding, Cyan Key Mark, Free CD Keys Line, KeyAway Logo Lockup, Near-Black Navy Background, Pro Software Line, Purple-to-Cyan Gradient, Smiling Laptop Mark (+2 more)

### Community 109 - "Not Found Tracking"
Cohesion: 0.25
Nodes (7): metadata, NotFound(), metadata, NotFound(), copy, NotFoundVariant, NotFoundView()

### Community 110 - "GitHub Changelog Fetch"
Cohesion: 0.29
Nodes (8): fetchChangelogReleasesFromGitHub(), fetchMergedPullRequests(), GitHubPullApiItem, fetchChangelogReleasesFromSanity(), loadChangelogReleases(), mapSanityRow(), SanityChangelogRow, publishedChangelogReleasesQuery

### Community 111 - "Promotion Docs"
Cohesion: 0.27
Nodes (10): Promotion Placements, Promotion Click Analytics, sitePromotion, Promotion Themes and Presets, Analytics, Changelog Sync, KeyAway, Sanity CMS (+2 more)

### Community 112 - "NPM Scripts"
Cohesion: 0.20
Nodes (10): scripts, backfill:changelog, backfill:vendors, build, dev, lint, prefill:check, prefill:scrape (+2 more)

### Community 113 - "Globe Icon"
Cohesion: 0.29
Nodes (9): clipPath a, Globe disc, #666, Globe graticule, Clipped group, Globe Icon, Globe compound path, svg (+1 more)

### Community 114 - "Dashboard Alerts"
Cohesion: 0.27
Nodes (9): AlertLink(), DashboardAlerts(), fetchAlerts(), SEVERITY_STYLES, VersionsTile(), KeyReviewTab, AlertSeverity, DashboardAlerts (+1 more)

### Community 115 - "Date Formatting"
Cohesion: 0.31
Nodes (8): formatRelativeTime(), formatSmartDate(), formatTime(), getRelativeParts(), isToday(), isYesterday(), MS, s()

### Community 116 - "Comment Reactions"
Cohesion: 0.38
Nodes (9): reactionStorageKey(), escapeKey(), fetchReactions(), newKey(), reactionsFieldPath(), ReactionTarget, SanityReactionRow, toggleCommentReaction() (+1 more)

### Community 117 - "Related Programs Ranking"
Cohesion: 0.29
Nodes (9): anchorCategoryCacheKey(), categoryIdSet(), fetchRelatedCandidates(), getCachedRankedRelatedPrograms(), rankRelatedPrograms(), RelatedProgramsAnchor, relatedProgramsCandidatesQuery, ProgramCategoryRef (+1 more)

### Community 118 - "Program Rating Copy"
Cohesion: 0.38
Nodes (8): FlowLocaleKey, flowToLocaleKey(), getByPath(), interpolate(), LocaleRoot, programT(), programTCommon(), programTips()

### Community 119 - "Emoji Picker"
Cohesion: 0.28
Nodes (5): emoji-picker-react@^4.22.3, emoji-picker-react, EmojiPicker, EmojiPickerPopover(), EmojiPickerPopoverProps

### Community 120 - "Vendor Backfill Script"
Cohesion: 0.28
Nodes (8): @sanity/client@^8.10.1, @sanity/client, BRAND_RULES, client, deriveVendorName(), main(), slugify(), WRITE

### Community 121 - "Key Icon Image"
Cohesion: 0.28
Nodes (9): Outline key, Two-tooth key bit, Circular key bow with center hole, Key exiting left, Diagonal key shaft, Left-pointing chevron, Key icon mark, White stroke on black (+1 more)

### Community 122 - "Showcase Card Image"
Cohesion: 0.28
Nodes (7): Software Catalog Grid, View and Download Counts, IOBIT Advanced SystemCare, License Key Count Badge, Product Screenshot Thumbnail, Most Viewed and Most Downloaded Badges, View Keys Button

### Community 123 - "Cron Status Card"
Cohesion: 0.39
Nodes (8): CronJobKey, CronRun, CronStatusCard(), dot(), JobLabel(), JobStatusRow(), RecentRun(), SourceBadge()

### Community 124 - "Admin Home Dashboard"
Cohesion: 0.33
Nodes (8): barClass(), DatasetDocCounts(), Growth(), growthClass(), LABELS, Payload, Row, stockClass()

### Community 125 - "Sanity Error Overlay"
Cohesion: 0.29
Nodes (7): __sanityErrorChannel, _handleError, _renderErrorOverlay, window error listener, React issue 10384, Sanity Studio Shell, window.onerror

### Community 126 - "Expired Keys Docs"
Cohesion: 0.29
Nodes (8): applyKeyStatusForDisplay, getProgramBySlug, Key Status Rules, update-expired-keys, updateAllExpiredKeys, Giveaway Finder, Scheduled Cron Jobs, Version Checks

### Community 127 - "Sanity Studio Shell"
Cohesion: 0.29
Nodes (3): next-sanity@^13.3.4, next-sanity, StudioPage()

### Community 128 - "Root Layout Metadata"
Cohesion: 0.46
Nodes (6): @vercel/analytics@^2.0.1, @vercel/analytics, VercelPublicMetrics(), isVercelAnalyticsEnabled(), isVercelProductionDeployment(), shouldTrackPublicVercelMetrics()

### Community 129 - "Brand Banner Image"
Cohesion: 0.43
Nodes (8): KeyAway Brand Banner, Free CD Keys, Cyan Key Icon, KeyAway, Smiling Laptop, Smiling Laptop and Key Logo, Pro Software, KeyAway Wordmark

### Community 130 - "White Key Icon"
Cohesion: 0.36
Nodes (8): White Bloom Glow, White Glowing Key Icon, Diagonal Key Glyph, Key Bit, Key Bow, Key Shaft, Left-Pointing Triangle, Rounded Frame with Left Opening

### Community 131 - "Store Schema Validators"
Cohesion: 0.46
Nodes (5): storeDetails, storeOtherLink, validateOptionalSupportEmail(), validateStoreOtherLinkUrl(), validateStoreSiteUrl()

### Community 132 - "Vendor Prefill Docs"
Cohesion: 0.33
Nodes (7): prefill:check, prefill:scrape, Prefill Vendor, Vendor PrefillResult, VENDOR_RESULT_SHAPE, VENDOR_WRITING_RULES, VENDOR_WRITING_RULES

### Community 133 - "NextAuth Handlers"
Cohesion: 0.38
Nodes (4): handlers, signIn, signOut, verifyAdminMembership()

### Community 134 - "Content Security Policy"
Cohesion: 0.29
Nodes (5): AD_ORIGINS, imageProviders, nextConfig, PUBLIC_CSP, STRICT_CSP

### Community 135 - "Window Icon"
Cohesion: 0.33
Nodes (7): Three 0.75 Radius Circles, #666 Fill, Inner Rounded Rectangle, Outer Rounded Rectangle, Compound Evenodd Path, Window Icon SVG, 16 by 16 ViewBox

### Community 137 - "Analytics Event Labels"
Cohesion: 0.48
Nodes (5): analyticsEventPreviewTitle(), EVENT_DISPLAY, normalizeAnalyticsEventName(), normalizeAnalyticsPathLabel(), slugToTitle()

### Community 138 - "Brand Card Image"
Cohesion: 0.53
Nodes (6): KeyAway Brand Card, Free CD Keys, Cyan Key Icon, KeyAway, Smiling Laptop Mascot, Pro Software

### Community 139 - "White Logo Image"
Cohesion: 0.67
Nodes (6): Key Glyph, KeyAway, Left-Pointing Chevron, KeyAway White Logo, Rounded Rectangular Frame, Key Away Wordmark

### Community 140 - "File Icon"
Cohesion: 0.70
Nodes (3): Document Page, Folded Corner, Text Lines

### Community 141 - "Spacious White Icon"
Cohesion: 0.70
Nodes (5): Open Rounded Rectangular Frame, White Key Icon on Black, Diagonal Key Glyph, Key-in-Frame Motif, Right-Pointing Triangular Wedge

### Community 142 - "Color Logo Image"
Cohesion: 0.50
Nodes (5): Key Glyph, KeyAway Logo, Play Button Glyph, Rounded Tag Frame, KeyAway Stacked Wordmark

### Community 143 - "Marketing SEO Pages"
Cohesion: 0.50
Nodes (4): generateMetadata(), UpdatesPage(), UpdatesPageProps, generateUpdatesMetadata()

### Community 144 - "Promotion Components"
Cohesion: 0.40
Nodes (3): PROMOTION_THEMES, sitePromotion, themeOptions

### Community 145 - "Ad Stats SQL"
Cohesion: 0.60
Nodes (4): ad_stats_daily_page_idx, ad_stats_paths_page_idx, analytics.ad_stats_daily, analytics.ad_stats_paths

### Community 147 - "Trustpilot Logo"
Cohesion: 0.67
Nodes (3): Trustpilot Green Star, Trustpilot Logo, Trustpilot

## Ambiguous Edges - Review These
- `Scheduled Cron Jobs` → `Automation and Freshness`  [AMBIGUOUS]
  public/llms.txt · relation: conceptually_related_to
- `One-way IP Hash` → `Analytics Rollups`  [AMBIGUOUS]
  docs/PRIVACY_POLICY.md · relation: conceptually_related_to
- `Automation and Freshness` → `Sanity Analytics Migration`  [AMBIGUOUS]
  public/llms.txt · relation: conceptually_related_to

## Knowledge Gaps
- **65 isolated node(s):** `{ GET, POST }`, `prefill:scrape`, `prefill:check`, `_renderErrorOverlay`, `React issue 10384` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 811 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Admin Visitor Modal` to `Static SEO Pages`, `Ads Admin Dashboard`, `Admin Status Routes`, `Key Reports Page`, `Sanity Content Schemas`, `Giveaway Draw Editor`, `Sitemap Admin Content`, `Activity Overview Charts`, `Admin Programs List`, `Footer Program Hero`, `Program Editor Tabs`, `Home Page Grid`, `Legal About Content`, `Programs Listing Page`, `Program Form Mapping`, `Promotion Components`, `Program Detail Page`, `Renewal Report Popups`, `Admin Reply Email`, `Key Suggestions Admin`, `Program Editor Panel`, `Sanity Image Rendering`, `Tooling Dependencies`, `Contact Reply Modal`, `Admin Comments UI`, `Version Fit Reports`, `Home Layout Sections`, `Vendor Public Pages`, `Analytics Event Aggregation`, `Key Reports Admin`, `CD Key Display`, `Social Share Buttons`, `Admin Data Tables`, `Runtime Dependencies`, `Program Slug Prefill`, `Feed Month Sidebar`, `Giveaway Finds Page`, `Admin Shell Layout`, `Admin Picker Sessions`, `Ad Rails Scripts`, `Not Found Tracking`, `CD Key Scoring`, `Comment Reactions`, `Catalog Listing Pages`, `Visitor Tier Hints`, `Comments Section`, `Giveaway Finds Table`, `Database Usage Insights`, `Admin Home Dashboard`, `Ad Frame Context`, `Banner Ad Slots`, `Activation i18n`, `Admin Events Table`, `Admin Sign In`, `Ad Consent Banner`, `Program Comment Forms`, `Key Review Modal`, `Related Program Tiles`, `Sanity CD Key Input`, `Admin Messages List`, `Contact Suggestion Forms`, `Dashboard Alerts`, `Emoji Picker`, `Cron Status Card`, `Admin Home Dashboard`, `Sanity Studio Shell`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **What connects `{ GET, POST }`, `prefill:scrape`, `prefill:check` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.054603174603174605 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Public List API` to `Admin API Routes`, `Session Track API`, `Static SEO Pages`, `Ads Admin Dashboard`, `Admin Status Routes`, `Key Reports Page`, `Content Security Policy`, `Key Report Events`, `Giveaway Draw Editor`, `Sitemap Admin Content`, `Footer Program Hero`, `Home Page Grid`, `Programs Listing Page`, `Comments IndexNow API`, `Giveaway Find Updates`, `Promotion Components`, `Program Detail Page`, `Notification Feed`, `Sanity Image Rendering`, `Tooling Dependencies`, `Admin Comments UI`, `Home Layout Sections`, `Vendor Public Pages`, `Key Reports Admin`, `Social Share Buttons`, `Comments Version Checks`, `Cache Revalidation`, `Runtime Dependencies`, `Giveaway Finds API`, `Feed Month Sidebar`, `Admin Shell Layout`, `Home Hero Section`, `Ad Rails Scripts`, `Not Found Tracking`, `Comment Reactions`, `Catalog Listing Pages`, `Visitor Tier Hints`, `Comments Section`, `Giveaway Draw Store`, `Admin Home Dashboard`, `Admin Sign In`, `Ad Consent Banner`, `Key Review Modal`, `Not Found Tracking`, `GitHub Changelog Fetch`, `Dashboard Alerts`, `Related Programs Ranking`, `Emoji Picker`, `Admin Home Dashboard`, `Sanity Studio Shell`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Should `Session Track API` be split into smaller, more focused modules?**
  _Cohesion score 0.0681766186227408 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Scheduled Cron Jobs` and `Automation and Freshness`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `One-way IP Hash` and `Analytics Rollups`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._