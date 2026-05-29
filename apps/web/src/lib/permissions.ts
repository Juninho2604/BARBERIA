// Re-export desde @barberia/shared para que web y api consuman la misma
// matriz. El archivo original vive en packages/shared/src/permissions.ts.
export { can, ROLE_LABEL, type Action } from "@barberia/shared";
