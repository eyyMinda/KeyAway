import { defineType } from "sanity";

export default defineType({
  name: "contactMessage",
  title: "Contact Messages",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "message",
      title: "Message",
      type: "text",
      validation: Rule => Rule.required()
    },
    {
      name: "name",
      title: "Name",
      type: "string"
    },
    {
      name: "email",
      title: "Email",
      type: "string"
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Read", value: "read" },
          { title: "Replied", value: "replied" },
          { title: "Archived", value: "archived" }
        ]
      },
      initialValue: "new"
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    },
    {
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used to associate messages with visitor records."
    }
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "message",
      status: "status"
    },
    prepare({ title, subtitle, status }) {
      return {
        title: title || "Untitled Message",
        subtitle: `${status} - ${subtitle?.slice(0, 60)}...`
      };
    }
  }
});
