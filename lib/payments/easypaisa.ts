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
