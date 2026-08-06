import "server-only";

import { PayOS } from "@payos/node";

export function hasPayOSConfig() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY,
  );
}

export function getPayOSClient() {
  if (!hasPayOSConfig()) {
    throw new Error("Thiếu cấu hình payOS phía máy chủ.");
  }

  return new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID!,
    apiKey: process.env.PAYOS_API_KEY!,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    maxRetries: 2,
    timeout: 15_000,
  });
}
