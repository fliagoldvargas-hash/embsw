const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const raw = await response.text();
  const data = parseJson(raw);

  if (!response.ok) {
    throw new Error(getSupabaseError(data, response.status));
  }

  return data as T;
}

function parseJson(value: string) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeSupabaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

function getSupabaseError(data: unknown, status: number) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  return `Supabase request failed with status ${status}.`;
}
