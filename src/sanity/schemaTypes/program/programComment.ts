import { defineField, defineType } from "sanity";

export const programCommentReply = defineType({
  name: "programCommentReply",
  title: "Comment reply",
  type: "object",
  fields: [
    defineField({
      name: "authorName",
      title: "Author name",
      type: "string",
      validation: Rule => Rule.required().max(80)
    }),
    defineField({
      name: "authorRole",
      title: "Role (optional)",
      type: "string",
      description: 'e.g. "KeyAway team", "Community member"',
      validation: Rule => Rule.max(60)
    }),
    defineField({
      name: "ipHash",
      title: "Visitor hash",
      type: "string",
      description: "Hashed IP of poster (for spam review in admin).",
      readOnly: true
    }),
    defineField({
      name: "body",
      title: "Reply",
      type: "text",
      rows: 4,
      validation: Rule => Rule.required().max(2000)
    }),
    defineField({
      name: "createdAt",
      title: "Date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: { authorName: "authorName", body: "body", createdAt: "createdAt" },
    prepare({ authorName, body, createdAt }) {
      const name = typeof authorName === "string" && authorName.trim() ? authorName.trim() : "Reply";
      const preview =
        typeof body === "string" && body.trim()
          ? body.trim().length > 60
            ? `${body.trim().slice(0, 60)}…`
            : body.trim()
          : "";
      const date =
        typeof createdAt === "string"
          ? new Date(createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })
          : "";
      return { title: name, subtitle: [preview, date].filter(Boolean).join(" · ") };
    }
  }
});

export const programComment = defineType({
  name: "programComment",
  title: "Program comment",
  type: "object",
  fields: [
    defineField({
      name: "authorName",
      title: "Author name",
      type: "string",
      validation: Rule => Rule.required().max(80)
    }),
    defineField({
      name: "authorRole",
      title: "Role (optional)",
      type: "string",
      validation: Rule => Rule.max(60)
    }),
    defineField({
      name: "ipHash",
      title: "Visitor hash",
      type: "string",
      description: "Hashed IP of poster (for spam review in admin).",
      readOnly: true
    }),
    defineField({
      name: "body",
      title: "Comment",
      type: "text",
      rows: 4,
      validation: Rule => Rule.required().max(2000)
    }),
    defineField({
      name: "createdAt",
      title: "Date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "isPinned",
      title: "Pin to top",
      type: "boolean",
      initialValue: false
    }),
    defineField({
      name: "replies",
      title: "Replies",
      type: "array",
      of: [{ type: "programCommentReply" }],
      description: "Optional threaded replies (one level)."
    })
  ],
  preview: {
    select: { authorName: "authorName", body: "body", isPinned: "isPinned", createdAt: "createdAt" },
    prepare({ authorName, body, isPinned, createdAt }) {
      const name = typeof authorName === "string" && authorName.trim() ? authorName.trim() : "Comment";
      const preview =
        typeof body === "string" && body.trim()
          ? body.trim().length > 60
            ? `${body.trim().slice(0, 60)}…`
            : body.trim()
          : "";
      const date =
        typeof createdAt === "string"
          ? new Date(createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })
          : "";
      return {
        title: isPinned ? `📌 ${name}` : name,
        subtitle: [preview, date].filter(Boolean).join(" · ")
      };
    }
  }
});
