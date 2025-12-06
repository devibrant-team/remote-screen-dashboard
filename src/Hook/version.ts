// src/version.ts
import pkg from "../../package.json";

// 👇 this is "1.1.1" from your package.json
export const APP_VERSION = pkg.version as string;
