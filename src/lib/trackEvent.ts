export async function trackEvent(
  event: "copy_cdkey" | "download_click" | "social_click",
  meta?: Record<string, unknown>
) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, meta }),
      keepalive: true // better delivery when user navigates away
    });
  } catch (e) {
    void e;
    // keep silent; analytics should never break UX
  }
}
