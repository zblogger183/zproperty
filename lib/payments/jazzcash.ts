import crypto from "node:crypto";

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integrityKey: string;
  sandbox: boolean;
}

function getConfig(): JazzCashConfig {
  return {
    merchantId: process.env.JAZZCASH_MERCHANT_ID ?? "",
    password: process.env.JAZZCASH_PASSWORD ?? "",
    integrityKey: process.env.JAZZCASH_INTEGRITY_KEY ?? "",
    sandbox: process.env.JAZZCASH_SANDBOX !== "false",
  };
}

export function getJazzCashPostUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
}

// JazzCash's documented secure-hash algorithm (per their MWALLET
// integration docs): sort every pp_-prefixed field alphabetically by key,
// drop empty values, join the remaining values with '&', prefix with the
// integrity salt (integrityKey), then HMAC-SHA256 and uppercase-hex the
// result. verifyJazzCashCallback (below) already has to implement exactly
// this for inbound callbacks — generateJazzCashParams uses the identical
// algorithm on the outbound side, since a hand-picked field subset/order
// would produce a hash JazzCash rejects.
function computeSecureHash(integrityKey: string, fields: Record<string, string>): string {
  const sortedKeys = Object.keys(fields)
    .filter((key) => key !== "pp_SecureHash" && fields[key] !== "")
    .sort();

  const hashString = [integrityKey, ...sortedKeys.map((key) => fields[key])].join("&");

  return crypto.createHmac("sha256", integrityKey).update(hashString).digest("hex").toUpperCase();
}

export function generateJazzCashParams(params: {
  amount: number; // PKR amount (NOT paisas)
  orderId: string; // unique order reference
  description: string;
  returnUrl: string;
  mobileNumber?: string;
}): { postUrl: string; fields: Record<string, string> } {
  const cfg = getConfig();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDateTime = (date: Date) =>
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

  const datetime = formatDateTime(now);
  // Built from a real Date one day out, not `getDate() + 1` padded raw —
  // that breaks at month-end (e.g. day 31 -> "32").
  const expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiry = `${expiryDate.getFullYear()}${pad(expiryDate.getMonth() + 1)}${pad(expiryDate.getDate())}235959`;

  const amountStr = String(Math.round(params.amount * 100)); // paisas
  const txnRef = `T${datetime}-${params.orderId.slice(0, 8)}`;
  const currency = "PKR";
  const language = "EN";
  const txnType = "MWALLET";

  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: txnType,
    pp_Language: language,
    pp_MerchantID: cfg.merchantId,
    pp_Password: cfg.password,
    pp_TxnRefNo: txnRef,
    pp_Amount: amountStr,
    pp_TxnCurrency: currency,
    pp_TxnDateTime: datetime,
    pp_BillReference: params.orderId,
    pp_Description: params.description.slice(0, 100),
    pp_TxnExpiryDateTime: expiry,
    pp_ReturnURL: params.returnUrl,
    ppmpf_1: "",
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  if (params.mobileNumber) {
    fields.pp_MobileNumber = params.mobileNumber;
  }

  fields.pp_SecureHash = computeSecureHash(cfg.integrityKey, fields);

  return { postUrl: getJazzCashPostUrl(cfg.sandbox), fields };
}

export function verifyJazzCashCallback(callbackParams: Record<string, string>): boolean {
  const cfg = getConfig();
  const receivedHash = callbackParams.pp_SecureHash;
  if (!receivedHash) return false;

  const expectedHash = computeSecureHash(cfg.integrityKey, callbackParams);

  const received = Buffer.from(receivedHash);
  const expected = Buffer.from(expectedHash);
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(received, expected);
}
