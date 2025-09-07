import { defineType } from "sanity";

export default defineType({
  name: "socialLink",
  title: "Social Link",
  type: "document",
  fields: [
    {
      name: "platform",
      title: "Platform",
      type: "string",
      options: {
        list: [
          { title: "GitHub", value: "github" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "Instagram", value: "instagram" },
          { title: "Twitter", value: "twitter" },
          { title: "YouTube", value: "youtube" },
          { title: "Website/Portfolio", value: "website" }
        ],
        layout: "dropdown"
      },
      validation: Rule => Rule.required()
    },
    {
      name: "url",
      title: "URL",
      type: "url",
      validation: Rule =>
        Rule.required().uri({
          scheme: ["http", "https", "mailto"]
        })
    }
  ],
  preview: {
    select: {
      title: "platform",
      subtitle: "url"
    }
  }
});
