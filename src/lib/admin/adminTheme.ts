/**
 * @fileoverview Admin-only light/dark theme. Dark mode is the `admin-dark` class on <html>, which the
 * `dark:` Tailwind variant targets (globals.css). Only admin routes ever set it, so public pages are unaffected.
 */

export type AdminTheme = "light" | "dark";

export const ADMIN_THEME_STORAGE_KEY = "keyaway-admin-theme";
export const ADMIN_DARK_CLASS = "admin-dark";
/** Set in light mode so native controls (select popups, scrollbars) stop using the public site's dark scheme. */
export const ADMIN_LIGHT_CLASS = "admin-light";
const CHANGE_EVENT = "keyaway-admin-theme-change";

/**
 * Runs inline before the admin page paints (no light flash): saved choice, else the system preference.
 * Keep in sync with `readAdminTheme`.
 */
export const adminThemeInitScript = `try{var t=localStorage.getItem("${ADMIN_THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"${ADMIN_DARK_CLASS}":"${ADMIN_LIGHT_CLASS}")}catch(e){}`;

export function readAdminTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage blocked: fall back to the system preference */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** `null` leaves admin: removes both classes so public pages keep their own styling. */
export function applyAdminTheme(theme: AdminTheme | null): void {
  const classes = document.documentElement.classList;
  classes.toggle(ADMIN_DARK_CLASS, theme === "dark");
  classes.toggle(ADMIN_LIGHT_CLASS, theme === "light");
}

export function setAdminTheme(theme: AdminTheme): void {
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    /* still applies for this visit */
  }
  applyAdminTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeAdminTheme(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
