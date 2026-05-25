/** True when Next is running with NODE_ENV=development (local `npm run dev`). */
export function isDevelopmentEnv(): boolean {
  return process.env.NODE_ENV === "development";
}
