import { defineField, defineType } from "sanity";

export default defineType({
  name: "contactMessage",
  title: "Contact Messages",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string"
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string"
    }),
    defineField({
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
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: "lastRepliedAt",
      title: "Last replied at",
      type: "datetime",
      readOnly: true
    }),
    defineField({
      name: "replies",
      title: "Replies",
      type: "array",
      of: [{ type: "contactMessageReply" }],
      readOnly: true
    }),
    defineField({
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used to associate messages with visitor records."
    })
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "message",
      status: "status",
      replyCount: "replies"
    },
    prepare({
      title,
      subtitle,
      status,
      replyCount
    }: {
      title?: string;
      subtitle?: string;
      status?: string;
      replyCount?: unknown[];
    }) {
      const replies = Array.isArray(replyCount) ? replyCount.length : 0;
      const replyLabel = replies > 0 ? ` · ${replies} repl${replies === 1 ? "y" : "ies"}` : "";
      return {
        title: title || "Untitled Message",
        subtitle: `${status}${replyLabel} - ${subtitle?.slice(0, 60)}...`
      };
    }
  }
});
