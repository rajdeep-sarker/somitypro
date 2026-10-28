import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "./auth-middleware";

// Cloudflare R2 is S3-compatible. We generate SigV4 presigned URLs server-side
// so the browser can upload/download directly without exposing credentials.

const encoder = new TextEncoder();

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key as ArrayBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, encoder.encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function r2Config() {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET"] ?? "somiti-member-docs";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 সেটআপ অসম্পূর্ণ — অ্যাডমিনকে জানান");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, host: `${accountId}.r2.cloudflarestorage.com` };
}

async function presign(method: "PUT" | "GET", key: string, expires = 600): Promise<string> {
  const { accessKeyId, secretAccessKey, bucket, host } = r2Config();
  const region = "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const path = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expires)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).sort().join("&");
  const canonicalRequest = [method, path, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(canonicalRequest)].join("\n");

  let k: ArrayBuffer = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  k = await hmac(k, region);
  k = await hmac(k, service);
  k = await hmac(k, "aws4_request");
  const signature = hex(await hmac(k, stringToSign));

  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}

function safeKey(memberId: string, kind: string, fileName: string): string {
  const ext = (fileName.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `members/${memberId}/${kind}-${crypto.randomUUID()}.${ext}`;
}

export const getMemberDocUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((input: { memberId: string; kind: "photo" | "id_doc"; fileName: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.memberId || !data.fileName) throw new Error("সদস্য ও ফাইল নির্বাচন করুন");
    const key = safeKey(data.memberId, data.kind, data.fileName);
    const url = await presign("PUT", key);
    return { url, key, userId: context.userId };
  });

export const getMemberDocViewUrl = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    if (!data.key.startsWith("members/")) throw new Error("অবৈধ ফাইল");
    return { url: await presign("GET", data.key, 300) };
  });
