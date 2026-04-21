import { defineField, defineType } from "sanity";

export default defineType({
  name: "keySuggestion",
  title: "Key Suggestions",
  type: "document",
  fields: [
    defineField({
      name: "cdKey",
      title: "Suggested CD Key",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "programName",
      title: "Program Name",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "programVersion",
      title: "Program Version",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "programLink",
      title: "Program/Download Link",
      type: "url",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "name",
      title: "Contact Name",
      type: "string"
    }),
    defineField({
      name: "email",
      title: "Contact Email",
      type: "string"
    }),
    defineField({
      name: "message",
      title: "Additional Message",
      type: "text"
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Reviewing", value: "reviewing" },
          { title: "Added", value: "added" },
          { title: "Rejected", value: "rejected" }
        ]
      },
      initialValue: "new"
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used to attribute suggestions to visitor records."
    })
  ],
  preview: {
    select: {
      title: "programName",
      subtitle: "programVersion",
      status: "status"
    },
    prepare({ title, subtitle, status }: { title?: string; subtitle?: string; status?: string }) {
      return {
        title: title || "Untitled Suggestion",
        subtitle: `${status} - v${subtitle}`
      };
    }
  }
});
