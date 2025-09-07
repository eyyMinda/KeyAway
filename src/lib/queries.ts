export const allProgramsQuery = `
*[_type == "program"]{
  title, slug, description, image
}
`;

export const programBySlugQuery = `
*[_type == "program" && slug.current == $slug][0]{
  title, description, image, cdKeys[]
}
`;
