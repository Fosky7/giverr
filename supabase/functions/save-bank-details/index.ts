// supabase/functions/save-bank-details/index.ts
//
// Edge function that securely persists a campaign's bank disbursement details.
//
// Why an edge function?
//   The full account number should never round-trip through the public anon key
//   or be selectable by clients. This function runs with the SERVICE ROLE key
//   (server-only), verifies the caller owns the campaign, obfuscates the account
//   number (storing only the last 4 in the clear + an encrypted blob), and
//   upserts the `campaign_bank_details` row.
//
// Secrets are read from the environment — never hardcoded:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BANK_DETAILS_ENC_KEY (optional).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BankDetailsPayload {
  campaignId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftBic?: string;
  country: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Lightweight symmetric obfuscation of the account number so the raw value is
 * not stored in plaintext. Uses AES-GCM with a key derived from an env secret.
 * (For production-grade key management, swap this for a KMS/Vault-backed key.)
 */
async function encrypt(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(value)
  );
  // Prefix the IV so it can be recovered for later decryption.
  const bytes = new Uint8Array(iv.length + cipher.byteLength);
  bytes.set(iv, 0);
  bytes.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...bytes));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const encKey =
      Deno.env.get("BANK_DETAILS_ENC_KEY") ?? serviceRoleKey ?? "fallback-key";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server is not configured." }, 500);
    }

    // Identify the caller from their JWT using an anon-context client.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "Missing authorization token." }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return json({ error: "Invalid or expired session." }, 401);
    }

    const payload = (await req.json()) as Partial<BankDetailsPayload>;

    const required: (keyof BankDetailsPayload)[] = [
      "campaignId",
      "accountHolderName",
      "bankName",
      "accountNumber",
      "country",
    ];
    for (const field of required) {
      if (!payload[field] || String(payload[field]).trim().length === 0) {
        return json({ error: `Missing required field: ${field}.` }, 400);
      }
    }

    // Verify the caller owns the campaign before storing anything.
    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id, creator_id")
      .eq("id", payload.campaignId)
      .single();

    if (campaignError || !campaign) {
      return json({ error: "Campaign not found." }, 404);
    }

    if (campaign.creator_id !== user.id) {
      return json({ error: "You do not own this campaign." }, 403);
    }

    const accountNumber = String(payload.accountNumber).trim();
    const last4 = accountNumber.slice(-4);
    const accountNumberEnc = await encrypt(accountNumber, encKey);

    const { error: upsertError } = await admin
      .from("campaign_bank_details")
      .upsert(
        {
          campaign_id: payload.campaignId,
          creator_id: user.id,
          account_holder_name: String(payload.accountHolderName).trim(),
          bank_name: String(payload.bankName).trim(),
          account_last4: last4,
          account_number_enc: accountNumberEnc,
          routing_number: payload.routingNumber?.trim() || null,
          swift_bic: payload.swiftBic?.trim() || null,
          country: String(payload.country).trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id" }
      );

    if (upsertError) {
      return json({ error: upsertError.message }, 500);
    }

    return json({ success: true, accountLast4: last4 });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      500
    );
  }
});
