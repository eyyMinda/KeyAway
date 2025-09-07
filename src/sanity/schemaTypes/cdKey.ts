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
    { name: "validUntil", title: "Valid Until", type: "datetime" }
  ]
});
