import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's "detect" calls context.getFilename, which ESLint 10 removed.
  { settings: { react: { version: "19.2" } } },
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"])
]);

export default eslintConfig;
