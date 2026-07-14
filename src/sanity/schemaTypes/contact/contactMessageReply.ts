import { defineField, defineType } from "sanity";

export const contactMessageReply = defineType({
  name: "contactMessageReply",
  title: "Message reply",
  type: "object",
  fields: [
    defineField({
      name: "body",
      title: "Reply body",
      type: "text",
      rows: 4,
      validation: Rule => Rule.required().max(10000)
    }),
    defineField({
      name: "subject",
      title: "Email subject",
      type: "string",
      validation: Rule => Rule.required().max(300)
    }),
    defineField({
      name: "sentTo",
      title: "Sent to",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "sentBy",
      title: "Sent by (admin)",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "sentAt",
      title: "Sent at",
      type: "datetime",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "resendId",
      title: "Resend message ID",
      type: "string",
      description: "Provider ID for delivery tracking."
    })
  ],
  preview: {
    select: { sentBy: "sentBy", body: "body", sentAt: "sentAt" },
    prepare({ sentBy, body, sentAt }) {
      const preview =
        typeof body === "string" && body.trim()
          ? body.trim().length > 60
            ? `${body.trim().slice(0, 60)}…`
            : body.trim()
          : "Reply";
      return {
        title: typeof sentBy === "string" && sentBy.trim() ? sentBy.trim() : "Admin reply",
        subtitle: sentAt ? `${preview} · ${sentAt}` : preview
      };
    }
  }
});
