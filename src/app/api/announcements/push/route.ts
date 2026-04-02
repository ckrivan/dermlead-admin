import { NextResponse } from "next/server";

/**
 * Proxy push notification requests to the Supabase Edge Function
 * using the service role key so the gateway doesn't reject the JWT.
 */
export async function POST(request: Request) {
  const body = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 },
    );
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error || `Edge Function returned ${res.status}` },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
}
