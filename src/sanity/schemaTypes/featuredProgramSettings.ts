import { defineType } from "sanity";

export const featuredProgramSettings = defineType({
  name: "featuredProgramSettings",
  title: "Featured Program Settings",
  type: "document",
  fields: [
    {
      name: "currentFeaturedProgram",
      title: "Current Featured Program",
      type: "reference",
      to: [{ type: "program" }],
      description:
        "The currently featured program. You can manually set this, or leave empty for auto-selection. Once rotation interval passes, it will automatically rotate based on the selected criteria."
    },
    {
      name: "rotationSchedule",
      title: "Rotation Schedule",
      type: "string",
      options: {
        list: [
          { title: "Weekly", value: "weekly" },
          { title: "Bi-weekly", value: "biweekly" },
          { title: "Monthly", value: "monthly" }
        ]
      },
      initialValue: "weekly",
      description: "How often to rotate the featured program. Rotation happens automatically based on lastRotationDate."
    },
    {
      name: "lastRotationDate",
      title: "Last Rotation Date",
      type: "datetime",
      description:
        "When the featured program was last rotated (automatically updated). Set this when manually changing the program to reset the rotation timer."
    },
    {
      name: "autoSelectCriteria",
      title: "Auto-Select Criteria",
      type: "string",
      options: {
        list: [
          { title: "Highest Working Keys", value: "highest_working_keys" },
          { title: "Most Popular", value: "most_popular" },
          { title: "Random", value: "random" }
        ]
      },
      initialValue: "highest_working_keys",
      description: "Criteria for auto-selecting featured program when rotation interval passes"
    }
  ],
  preview: {
    select: {
      program: "currentFeaturedProgram.title",
      schedule: "rotationSchedule",
      criteria: "autoSelectCriteria"
    },
    prepare({ program, schedule, criteria }) {
      return {
        title: program || `Auto: ${criteria}`,
        subtitle: `Rotation: ${schedule || "weekly"}`
      };
    }
  }
});
