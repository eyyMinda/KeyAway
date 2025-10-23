import { defineType } from "sanity";

export const cdKey = defineType({
  name: "cdKey",
  title: "CD Key",
  type: "object",
  fields: [
    { name: "key", title: "Key", type: "string" },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Active", value: "active" },
          { title: "Expired", value: "expired" },
          { title: "Limit Reached", value: "limit" }
        ]
      }
    },
    { name: "version", title: "Program Version", type: "string" },
    { name: "validFrom", title: "Valid From", type: "datetime" },
    {
      name: "validUntil",
      title: "Valid Until",
      type: "datetime",
      validation: Rule =>
        Rule.custom(value => {
          if (value && typeof value === "string" && isNaN(new Date(value).getTime())) {
            return "Invalid date format";
          }
          return true;
        })
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this key was first added (auto-filled on creation)",
      initialValue: () => new Date().toISOString(),
      readOnly: ({ parent }) => !!parent?.createdAt
    }
  ]
});
