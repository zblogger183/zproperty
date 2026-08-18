export interface EasyPaisaOrderResponse {
  orderRefNum?: string;
  paymentUrl?: string;
  responseCode: string;
  responseDesc: string;
}

// EasyPaisa's sandbox and production merchant portals are provisioned per
// merchant, and the sandbox credentials needed to actually exercise this
// endpoint aren't available in this environment — this integration is built
// to EasyPaisa's documented request/response shape (initTransaction, MA
// transaction type, Credentials header) but is only testable once real
// merchant credentials (EASYPAISA_STORE_ID / EASYPAISA_API_KEY) are set.
export async function createEasyPaisaOrder(params: {
  amount: number;
  orderId: string;
  description: string;
  returnUrl: string;
}): Promise<EasyPaisaOrderResponse> {
  const storeId = process.env.EASYPAISA_STORE_ID ?? "";
  const apiKey = process.env.EASYPAISA_API_KEY ?? "";

  const endpoint = "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initTransaction";

  const credentials = Buffer.from(`${storeId}:${apiKey}`).toString("base64");

  const payload = {
    storeId,
    orderId: params.orderId,
    transactionAmount: params.amount.toFixed(2),
    mobileAccountNo: "",
    emailAddress: "",
    transactionType: "MA",
    tokenExpiry: "20501231 235959",
    bankIdentificationNumber: "",
    encryptedHashRequest: "",
    postBackURL: params.returnUrl,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Credentials: credentials,
      },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as EasyPaisaOrderResponse;
  } catch {
    return { responseCode: "ERROR", responseDesc: "Network error" };
  }
}

export interface EasyPaisaInquiryResponse {
  responseCode: string;
  responseDesc: string;
  transactionStatus?: string;
}

// Server-to-server confirmation, called from the callback route instead of
// trusting the browser-redirect query params directly (those are
// client-controlled and were previously accepted as-is — a payment bypass,
// since anyone could hit the callback URL with a forged responseCode
// without ever paying). Mirrors EasyPaisa's documented inquiry shape for
// v4 (same Credentials-header auth as initTransaction above); like
// initTransaction, this is only exercisable against EasyPaisa's real
// endpoint once sandbox/production behavior can be observed, but a network
// or non-2xx failure here must be treated as "not confirmed", not silently
// bypassed, so the fail-closed behavior below is the important part.
export async function confirmEasyPaisaTransaction(orderId: string): Promise<{ paid: boolean }> {
  const storeId = process.env.EASYPAISA_STORE_ID ?? "";
  const apiKey = process.env.EASYPAISA_API_KEY ?? "";

  const endpoint = "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/inquireTransaction";
  const credentials = Buffer.from(`${storeId}:${apiKey}`).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Credentials: credentials,
      },
      body: JSON.stringify({ storeId, orderId }),
    });

    if (!res.ok) return { paid: false };

    const data = (await res.json()) as EasyPaisaInquiryResponse;
    return { paid: data.responseCode === "0000" && data.transactionStatus === "PAID" };
  } catch {
    // Network error, timeout, or malformed response from EasyPaisa — never
    // treat an unconfirmed transaction as paid.
    return { paid: false };
  }
}
