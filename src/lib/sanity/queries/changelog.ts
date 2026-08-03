export const publishedChangelogReleasesQuery = `*[_type == "changelogRelease" && published == true] | order(releasedAt desc) {
  "id": _id,
  releasedAt,
  title,
  prNumber,
  tags,
  summary,
  highlights,
  sections[]{
    title,
    items
  }
}`;
