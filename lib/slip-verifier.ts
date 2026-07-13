export type VerifiedSlip = {
  transactionId: string;
  amount: number;
  destinationAccountNo: string;
};

/**
 * Provider adapter. Normalise your selected provider response here; it must never
 * be called from the browser. The API route performs the business checks itself.
 */
export async function verifySlipWithProvider(slip: File): Promise<VerifiedSlip> {
  const url = process.env.SLIP_VERIFY_URL;
  const apiKey = process.env.SLIP_VERIFY_API_KEY;
  if (!url || !apiKey) throw new Error("Slip verification provider is not configured");

  const form = new FormData();
  form.append("file", slip);
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, cache: "no-store" });
  if (!response.ok) throw new Error("Slip verification provider rejected the request");
  const payload = await response.json() as Record<string, unknown>;

  // Map this adapter to the selected provider's documented response shape.
  const transactionId = String(payload.transactionId ?? payload.transRef ?? "");
  const amount = Number(payload.amount);
  const destinationAccountNo = String(payload.destinationAccountNo ?? payload.receiverAccount ?? "").replace(/\D/g, "");
  if (!transactionId || !Number.isFinite(amount) || !destinationAccountNo) throw new Error("Invalid verification response");
  return { transactionId, amount, destinationAccountNo };
}
