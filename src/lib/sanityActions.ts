"use server";

import { client } from "@/src/sanity/lib/client";
import { CDKey, Program } from "@/src/types";
import { programBySlugQuery, featuredProgramSettingsQuery, programsForAutoSelectionQuery } from "./queries";

/**
 * Updates expired CD keys in Sanity for a specific program
 * @param programId - The Sanity document ID of the program
 * @param updatedKeys - Array of updated CD keys with new statuses
 */
export async function updateExpiredKeys(programId: string, updatedKeys: CDKey[]): Promise<void> {
  try {
    await client.patch(programId).set({ cdKeys: updatedKeys }).commit();
  } catch (error) {
    console.error("Failed to update expired keys in Sanity:", error);
    throw new Error("Failed to update expired keys");
  }
}

/**
 * Gets all programs and updates any expired keys
 * @returns Promise<void>
 */
export async function updateAllExpiredKeys(): Promise<void> {
  try {
    // Get all programs
    const programs = await client.fetch(`
      *[_type == "program"] {
        _id,
        cdKeys
      }
    `);

    for (const program of programs) {
      if (!program.cdKeys || program.cdKeys.length === 0) continue;

      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      let hasUpdates = false;
      const updatedKeys = program.cdKeys.map((key: CDKey) => {
        let updatedKey = { ...key };

        // Check if key should be expired based on validUntil date
        if (key.status.toLowerCase() !== "expired" && key.validUntil) {
          const validUntil = new Date(key.validUntil);
          if (now > validUntil) {
            hasUpdates = true;
            updatedKey = { ...updatedKey, status: "expired" };
          }
        }

        // Check if "new" key is older than 1 month and convert to "active"
        if (key.status.toLowerCase() === "new") {
          // Check createdAt first, then fall back to validFrom
          const keyDate = key.createdAt || key.validFrom;
          if (keyDate) {
            const checkDate = new Date(keyDate);
            if (checkDate < oneMonthAgo) {
              hasUpdates = true;
              updatedKey = { ...updatedKey, status: "active" };
            }
          }
        }

        return updatedKey;
      });

      // Only update if there were changes
      if (hasUpdates) {
        await client.patch(program._id).set({ cdKeys: updatedKeys }).commit();

        console.log(`Updated keys for program: ${program._id}`);
      }
    }
  } catch (error) {
    console.error("Failed to update all keys:", error);
    throw new Error("Failed to update keys");
  }
}

/**
 * Gets a program by slug and updates any expired keys
 * @param slug - The program slug
 * @returns Updated program data
 */
export async function getProgramWithUpdatedKeys(slug: string) {
  try {
    // First, get the program
    const program = await client.fetch(programBySlugQuery, { slug }, { next: { tags: [`program-${slug}`] } });

    if (!program) return null;

    // Process and update keys (expired and new->active)
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let hasUpdates = false;
    const updatedKeys = (program.cdKeys || []).map((key: CDKey) => {
      let updatedKey = { ...key };

      // Check if key should be expired based on validUntil date
      if (key.status.toLowerCase() !== "expired" && key.validUntil) {
        const validUntil = new Date(key.validUntil);
        if (now > validUntil) {
          hasUpdates = true;
          updatedKey = { ...updatedKey, status: "expired" };
        }
      }

      // Check if "new" key is older than 1 month and convert to "active"
      if (key.status.toLowerCase() === "new") {
        // Check createdAt first, then fall back to validFrom
        const keyDate = key.createdAt || key.validFrom;
        if (keyDate) {
          const checkDate = new Date(keyDate);
          if (checkDate < oneMonthAgo) {
            hasUpdates = true;
            updatedKey = { ...updatedKey, status: "active" };
          }
        }
      }

      return updatedKey;
    });

    // Update in Sanity if there were changes (non-blocking - don't fail if update fails)
    if (hasUpdates && program._id) {
      try {
        await client.patch(program._id).set({ cdKeys: updatedKeys }).commit();
        console.log(`Updated keys for program: ${program.title}`);
      } catch (updateError) {
        console.error("Failed to update keys in Sanity (non-critical):", updateError);
        // Continue anyway - return the program with updated keys even if Sanity update failed
      }
    }
    program.slug = { current: slug };

    // Return the updated program
    return {
      ...program,
      cdKeys: updatedKeys
    };
  } catch (error) {
    console.error("Failed to fetch program:", error);
    // Only throw if it's a fetch error - this means the program doesn't exist or network failed
    return null;
  }
}

/**
 * Helper: Get program stats (keys, views, downloads)
 */
async function getProgramStats(program: Program) {
  const sortedCdKeys = program.cdKeys || [];
  const totalKeys = sortedCdKeys.length;
  const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;

  const [viewCount, downloadCount] = await Promise.all([
    client.fetch(
      `count(*[_type == "trackingEvent" && event == "page_viewed" && programSlug == $slug])`,
      { slug: program.slug.current },
      { next: { tags: ["featured-program"] } }
    ),
    client.fetch(
      `count(*[_type == "trackingEvent" && event == "download_click" && programSlug == $slug])`,
      { slug: program.slug.current },
      { next: { tags: ["featured-program"] } }
    )
  ]);

  return { ...program, totalKeys, workingKeys, viewCount: viewCount || 0, downloadCount: downloadCount || 0 };
}

/**
 * Helper: Check if rotation is needed
 */
function needsRotation(lastRotationDate: string | null, rotationSchedule: string): boolean {
  if (!lastRotationDate) return true;
  const daysSince = Math.floor((Date.now() - new Date(lastRotationDate).getTime()) / (1000 * 60 * 60 * 24));
  const rotationDays = rotationSchedule === "weekly" ? 7 : rotationSchedule === "biweekly" ? 14 : 30;
  return daysSince >= rotationDays;
}

/**
 * Helper: Select program based on criteria
 */
function selectProgramByCriteria(
  programs: Array<{ program: Program; workingKeys: number; popularityScore: number }>,
  criteria: string
) {
  const withKeys = programs.filter(p => p.workingKeys > 0);
  if (withKeys.length === 0) return null;

  switch (criteria) {
    case "highest_working_keys":
      return withKeys.sort((a, b) => b.workingKeys - a.workingKeys)[0];
    case "most_popular":
      return withKeys.sort((a, b) => b.popularityScore - a.popularityScore)[0];
    case "random":
      return withKeys[Math.floor(Math.random() * withKeys.length)];
    default:
      return withKeys[0];
  }
}

/**
 * Gets the featured program based on settings and rotation logic
 * @returns Featured program with key statistics, or null if none found
 */
export async function getFeaturedProgram(): Promise<
  | (Program & {
      totalKeys: number;
      workingKeys: number;
      viewCount: number;
      downloadCount: number;
    })
  | null
> {
  try {
    const settings = await client.fetch(featuredProgramSettingsQuery, {}, { next: { tags: ["featured-program"] } });

    if (!settings) {
      // No settings: auto-select first program with working keys
      const programs = await client.fetch(programsForAutoSelectionQuery, {}, { next: { tags: ["featured-program"] } });
      for (const p of programs as Array<{ slug: { current: string }; viewCount?: number; downloadCount?: number }>) {
        const program = await getProgramWithUpdatedKeys(p.slug.current);
        if (!program) continue;
        const workingKeys = (program.cdKeys || []).filter(
          (cd: CDKey) => cd.status === "active" || cd.status === "new"
        ).length;
        if (workingKeys > 0) {
          return {
            ...program,
            totalKeys: program.cdKeys?.length || 0,
            workingKeys,
            viewCount: p.viewCount || 0,
            downloadCount: p.downloadCount || 0
          };
        }
      }
      return null;
    }

    const needsRot = needsRotation(settings.lastRotationDate, settings.rotationSchedule);

    // Use current program if rotation not needed
    if (!needsRot && settings.currentFeaturedProgram) {
      const program = await getProgramWithUpdatedKeys(settings.currentFeaturedProgram.slug.current);
      return program ? await getProgramStats(program) : null;
    }

    // Auto-select when rotation needed
    if (needsRot) {
      const programs = await client.fetch(programsForAutoSelectionQuery, {}, { next: { tags: ["featured-program"] } });
      const programsWithStats = await Promise.all(
        programs.map(
          async (p: {
            slug: { current: string };
            viewCount?: number;
            downloadCount?: number;
            popularityScore?: number;
          }) => {
            const program = await getProgramWithUpdatedKeys(p.slug.current);
            if (!program) return null;
            const sortedCdKeys = program.cdKeys || [];
            return {
              program,
              totalKeys: sortedCdKeys.length,
              workingKeys: sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length,
              viewCount: p.viewCount || 0,
              downloadCount: p.downloadCount || 0,
              popularityScore: p.popularityScore || 0
            };
          }
        )
      );

      const selected = selectProgramByCriteria(
        programsWithStats.filter((p): p is NonNullable<typeof p> => p !== null),
        settings.autoSelectCriteria
      );
      if (!selected) return null;

      // Update settings (non-blocking)
      if (settings._id) {
        client
          .patch(settings._id)
          .set({
            lastRotationDate: new Date().toISOString(),
            currentFeaturedProgram: { _type: "reference", _ref: selected.program._id }
          })
          .commit()
          .catch(err => console.error("Failed to update rotation:", err));
      }

      return await getProgramStats(selected.program);
    }

    return null;
  } catch (error) {
    console.error("Failed to get featured program:", error);
    return null;
  }
}
