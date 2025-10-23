"use server";

import { client } from "@/src/sanity/lib/client";
import { CDKey } from "@/src/types";
import { programBySlugQuery } from "./queries";

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
