/** Slim fields for admin event list / analytics merge (no key, utm, userAgent). */
export const ADMIN_EVENT_LIST_GROQ_FIELDS = `
  _id, event, programSlug, notFound, social, path, referrer, country, city, ipHash, createdAt
`;
