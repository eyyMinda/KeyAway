"use client";

import { useEffect } from "react";

export default function StudioVerification() {
  useEffect(() => {
    // Verify admin access by checking for "Not authorized" text in Studio
    const verifyAccess = async () => {
      try {
        // Wait for Studio to fully load and render
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check for specific Studio states
        const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
        const manageProjectLink = `https://sanity.io/manage/project/${projectId}`;

        // Check for user menu button (indicates successful Studio access)
        const userMenuButton = document.querySelector("button#user-menu[data-ui='MenuButton']");

        let hasManageLink = false;
        let manageProjectLinks: Element[] = [];

        if (userMenuButton) {
          // Click the user menu to open the portal
          try {
            (userMenuButton as HTMLElement).click();

            // Wait a bit for the portal to open
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Look for the manage project link in the portal
            const allLinks = document.querySelectorAll("a[href]");

            // Check for exact match
            hasManageLink = document.querySelector(`a[href="${manageProjectLink}"]`) !== null;

            // Check for partial match
            manageProjectLinks = Array.from(allLinks).filter(link =>
              link.getAttribute("href")?.includes("sanity.io/manage/project/")
            );

            // Close the portal by clicking the user menu button again
            (userMenuButton as HTMLElement).click();
          } catch (error) {
            console.log("❌ Error accessing user menu:", error);
          }
        }

        // Check for authorization error states
        const bodyText = document.body.textContent || "";
        const hasNotAuthorized = bodyText.includes("You are not authorized to access this studio");
        const hasLoginPrompt = bodyText.includes("Choose login provider");

        if (hasNotAuthorized) {
          // User is connected but not authorized for this project
          console.log("❌ Admin access denied - not authorized for this project");
          localStorage.removeItem("keyaway_admin_verified");
        } else if (hasLoginPrompt) {
          // User is still in login process
          console.log("⏳ Admin verification pending - still logging in");
          localStorage.removeItem("keyaway_admin_verified");
        } else if (hasManageLink || manageProjectLinks.length > 0) {
          // User has successful access to Studio (exact match or partial match)
          console.log("✅ Admin access granted - project access verified");

          // Set verified session in localStorage
          const verifiedSession = {
            verifiedAt: new Date().toISOString(),
            projectId: projectId
          };
          localStorage.setItem("keyaway_admin_verified", JSON.stringify(verifiedSession));
        } else if (!userMenuButton) {
          // No user menu button found - user not authenticated
          console.log("❌ Admin access denied - not authenticated");
          localStorage.removeItem("keyaway_admin_verified");
        } else {
          // Studio loaded but no clear indication of access state
          console.log("⚠️ Admin access denied - verification unclear");
          localStorage.removeItem("keyaway_admin_verified");
        }
      } catch (error) {
        console.log("Studio verification error:", error);
        // On error, remove admin access to be safe
        localStorage.removeItem("keyaway_admin_verified");
      }
    };

    verifyAccess();
  }, []);

  // This component doesn't render anything visible
  return null;
}
