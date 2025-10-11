import { defineType } from "sanity";

export default defineType({
  name: "keySuggestion",
  title: "Key Suggestions",
  type: "document",
  fields: [
    {
      name: "cdKey",
      title: "Suggested CD Key",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "programName",
      title: "Program Name",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "programVersion",
      title: "Program Version",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "programLink",
      title: "Program/Download Link",
      type: "url",
      validation: Rule => Rule.required()
    },
    {
      name: "name",
      title: "Contact Name",
      type: "string"
    },
    {
      name: "email",
      title: "Contact Email",
      type: "string"
    },
    {
      name: "message",
      title: "Additional Message",
      type: "text"
    },
    {
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
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }
  ],
  preview: {
    select: {
      title: "programName",
      subtitle: "programVersion",
      status: "status"
    },
    prepare({ title, subtitle, status }) {
      return {
        title: title || "Untitled Suggestion",
        subtitle: `${status} - v${subtitle}`
      };
    }
  }
});
