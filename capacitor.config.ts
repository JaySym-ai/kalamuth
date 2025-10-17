import type { CapacitorConfig } from "@capacitor/cli";

// Choose one of two approaches:
// 1) Static bundle (no SSR): build Next.js with `output: "export"` and set webDir to "out"
// 2) Remote server (SSR): comment webDir and set `server.url` to your deployed Next.js URL

const config: CapacitorConfig = {
  appId: "com.kalamuth.app",
  appName: "Kalamuth",


  server: {
    url: "https://www.kalamuth.com",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      "www.kalamuth.com",
      "accounts.google.com",
      "*.googleusercontent.com",
      "*.gstatic.com",
      "*.googleapis.com",
    ],
  },
};

export default config;

