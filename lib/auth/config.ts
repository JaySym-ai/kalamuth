import "server-only";

// Authentication configuration for next-firebase-auth-edge
export const authConfig = {
  loginPath: process.env.AUTH_LOGIN_PATH || "/api/login",
  logoutPath: process.env.AUTH_LOGOUT_PATH || "/api/logout",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  cookieName: process.env.AUTH_COOKIE_NAME || "AuthToken",
  cookieSignatureKeys: JSON.parse(process.env.AUTH_COOKIE_SIGNATURE_KEYS || '["default-key-change-in-production"]'),
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24, // 12 days
  },
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
  enableMultipleCookies: true,
  enableCustomToken: false,
  debug: process.env.NODE_ENV === "development",
  checkRevoked: false, // Set to true if you need to check revoked tokens on every request
} as const;

// Public paths that don't require authentication
export const PUBLIC_PATHS = ["/auth", "/register", "/login", "/reset-password", "/intro"];

// Protected paths that require authentication
export const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/server-selection",
  "/ludus-creation",
  "/initial-gladiators"
];
