import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  try {
    return Capacitor?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

