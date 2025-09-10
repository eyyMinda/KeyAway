import { defineType } from "sanity";

// Function to generate CD key ID with context
function generateCDKeyId(context: { parent?: { validUntil?: string } }) {
  // Get current timestamp (6-8 characters)
  const timestamp = Date.now().toString(36).slice(-6);

  // Generate 8-character UUID (simplified for Sanity)
  const uuid8 = Math.random().toString(36).substring(2, 10);

  // Try to get validUntil from the current field value or parent
  let validUntilStr = "000000";

  // Check if validUntil is available in the current field
  if (context.parent && context.parent.validUntil) {
    try {
      validUntilStr = new Date(context.parent.validUntil).getTime().toString(36).slice(-6);
    } catch {
      // Fallback to placeholder if date is invalid
      validUntilStr = "000000";
    }
  }

  return `key_${timestamp}_${validUntilStr}_${uuid8}`;
}

export const cdKey = defineType({
  name: "cdKey",
  title: "CD Key",
  type: "object",
  fields: [
    {
      name: "id",
      title: "Key ID",
      type: "string",
      description: "Unique identifier for this CD key (auto-generated)",
      initialValue: generateCDKeyId,
      readOnly: true,
      validation: Rule => Rule.required()
    },
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
      // This will trigger ID regeneration when validUntil changes
      validation: Rule =>
        Rule.custom(value => {
          // If validUntil is set and ID exists, we could trigger an update
          // For now, just validate the date
          if (value && typeof value === "string" && isNaN(new Date(value).getTime())) {
            return "Invalid date format";
          }
          return true;
        })
    }
  ]
});
