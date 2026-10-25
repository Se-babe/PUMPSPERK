import { isValidName } from "./logic";

export const STAFF_KEY = "pumpperks-mvp-staff";
export const ADMIN_KEY = "pumpperks-mvp-admin";
export const STATION_CODE = "2048";
export const ADMIN_CODE = "4482";

export function readNamedSession(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { name?: string };
    return data.name && isValidName(data.name) ? data.name : null;
  } catch {
    return null;
  }
}

export function saveNamedSession(key: string, name: string) {
  localStorage.setItem(key, JSON.stringify({ name }));
}
