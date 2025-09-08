"use client";

import { useEffect } from "react";
import { clearAdminVerification } from "@/src/lib/adminAuth";

export default function StudioVerification() {
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
        const manageProjectLink = `https://sanity.io/manage/project/${projectId}`;
        const userMenuButton = document.querySelector("button#user-menu[data-ui='MenuButton']");

        let hasManageLink = false;
        let manageProjectLinks: Element[] = [];

        if (userMenuButton) {
          try {
            (userMenuButton as HTMLElement).click();
            await new Promise(resolve => setTimeout(resolve, 1000));

            const allLinks = document.querySelectorAll("a[href]");
            hasManageLink = document.querySelector(`a[href="${manageProjectLink}"]`) !== null;
            manageProjectLinks = Array.from(allLinks).filter(link =>
              link.getAttribute("href")?.includes("sanity.io/manage/project/")
            );

            (userMenuButton as HTMLElement).click();
          } catch {
            console.log("❌ Error accessing user menu");
          }
        }

        const bodyText = document.body.textContent || "";
        const hasNotAuthorized = bodyText.includes("You are not authorized to access this studio");
        const hasLoginPrompt = bodyText.includes("Choose login provider");

        if (hasNotAuthorized) {
          console.log("❌ Admin access denied - not authorized for this project");
          clearAdminVerification();
        } else if (hasLoginPrompt) {
          console.log("⏳ Admin verification pending - still logging in");
          clearAdminVerification();
        } else if (hasManageLink || manageProjectLinks.length > 0) {
          console.log("✅ Admin access granted - project access verified");
          const verifiedSession = {
            verifiedAt: new Date().toISOString(),
            projectId: projectId
          };
          localStorage.setItem("keyaway_admin_verified", JSON.stringify(verifiedSession));
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent("keyaway_admin_verified_changed"));
        } else if (!userMenuButton) {
          console.log("❌ Admin access denied - not authenticated");
          clearAdminVerification();
        } else {
          console.log("⚠️ Admin access denied - verification unclear");
          clearAdminVerification();
        }
      } catch {
        console.log("❌ Studio verification failed");
        clearAdminVerification();
      }
    };

    verifyAccess();
  }, []);

  return null;
}
