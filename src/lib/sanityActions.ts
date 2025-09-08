"use server";

import { client } from "@/src/sanity/lib/client";
import { CDKey } from "@/src/types/ProgramType";
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
      let hasUpdates = false;
      const updatedKeys = program.cdKeys.map((key: CDKey) => {
        const validUntil = new Date(key.validUntil);

        // If the key is not already expired and the validUntil date has passed
        if (key.status.toLowerCase() !== "expired" && now > validUntil) {
          hasUpdates = true;
          return { ...key, status: "expired" };
        }

        return key;
      });

      // Only update if there were changes
      if (hasUpdates) {
        await client.patch(program._id).set({ cdKeys: updatedKeys }).commit();

        console.log(`Updated expired keys for program: ${program._id}`);
      }
    }
  } catch (error) {
    console.error("Failed to update all expired keys:", error);
    throw new Error("Failed to update expired keys");
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

    // Process and update expired keys
    const now = new Date();
    let hasUpdates = false;
    const updatedKeys = (program.cdKeys || []).map((key: CDKey) => {
      const validUntil = new Date(key.validUntil);

      if (key.status.toLowerCase() !== "expired" && now > validUntil) {
        hasUpdates = true;
        return { ...key, status: "expired" };
      }
      return key;
    });

    // Update in Sanity if there were changes
    if (hasUpdates) {
      await client.patch(program._id).set({ cdKeys: updatedKeys }).commit();

      console.log(`Updated expired keys for program: ${program.title}`);
    }
    program.slug = { current: slug };

    // Return the updated program
    return {
      ...program,
      cdKeys: updatedKeys
    };
  } catch (error) {
    console.error("Failed to get program with updated keys:", error);
    throw new Error("Failed to fetch program");
  }
}
