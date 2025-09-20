import "server-only";

// Public paths that don't require authentication
export const PUBLIC_PATHS = ["/auth", "/register", "/login", "/reset-password", "/intro"];

// Protected paths that require authentication
export const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/server-selection",
  "/ludus-creation",
  "/initial-gladiators",
];
