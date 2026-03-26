import axios from "axios";
import { getSession } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const session = await getSession();
  const jwt = session?.user?.jwt;

  const res = await fetch(`${API_URL}/api/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
