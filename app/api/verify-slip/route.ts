import { NextResponse } from "next/server";
import { verifySlipWithProvider } from "../../../lib/slip-verifier";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = () => ({ apikey: serviceKey!, Authorization: `Bearer ${serviceKey!}`, "Content-Type": "application/json" });
const digits = (value: string) => value.replace(/\D/g, "");
const money = (value: number) => Math.round(value * 100) / 100;

export async function POST(request: Request) {
  if (!url || !serviceKey) return NextResponse.json({ error: "Payment service is not configured" }, { status: 503 });
  const form = await request.formData();
  const contractId = form.get("contract_id");
  const slip = form.get("slip");
  if (typeof contractId !== "string" || !(slip instanceof File)) return NextResponse.json({ error: "contract_id and slip are required" }, { status: 400 });

  // Do not accept shop_id or amount from the client. They are derived from contract data.
  const contractResponse = await fetch(`${url}/rest/v1/consignment_contracts?id=eq.${encodeURIComponent(contractId)}&select=id,shop_id,consignment_amount,expiry_date,status`, { headers: headers(), cache: "no-store" });
  const contracts = await contractResponse.json() as Array<{ id: string; shop_id: string; consignment_amount: number; expiry_date: string; status: string }>;
  const contract = contracts[0];
  if (!contract || contract.status !== "active") return NextResponse.json({ error: "Active consignment contract not found" }, { status: 404 });

  const shopResponse = await fetch(`${url}/rest/v1/shops?id=eq.${contract.shop_id}&select=bank_account_no,extension_rate`, { headers: headers(), cache: "no-store" });
  const shops = await shopResponse.json() as Array<{ bank_account_no: string; extension_rate: number }>;
  const shop = shops[0];
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const expectedAmount = money(Number(contract.consignment_amount) * Number(shop.extension_rate) / 100);

  try {
    const verified = await verifySlipWithProvider(slip);
    const replay = await fetch(`${url}/rest/v1/transactions?bank_trans_id=eq.${encodeURIComponent(verified.transactionId)}&select=id`, { headers: headers(), cache: "no-store" });
    const usedTransactions = await replay.json() as unknown[];
    const valid = usedTransactions.length === 0 && digits(verified.destinationAccountNo) === digits(shop.bank_account_no) && money(verified.amount) === expectedAmount;
    if (!valid) {
      await fetch(`${url}/rest/v1/transactions`, { method: "POST", headers: { ...headers(), Prefer: "return=minimal" }, body: JSON.stringify({ shop_id: contract.shop_id, contract_id: contract.id, amount: verified.amount, bank_trans_id: verified.transactionId, status: "pending_review" }) });
      return NextResponse.json({ error: "Payment needs manual review" }, { status: 422 });
    }
    const expiry = new Date(`${contract.expiry_date}T00:00:00Z`); expiry.setUTCDate(expiry.getUTCDate() + 30);
    const update = await fetch(`${url}/rest/v1/consignment_contracts?id=eq.${contract.id}`, { method: "PATCH", headers: { ...headers(), Prefer: "return=minimal" }, body: JSON.stringify({ expiry_date: expiry.toISOString().slice(0, 10) }) });
    if (!update.ok) throw new Error("Could not extend contract");
    await fetch(`${url}/rest/v1/transactions`, { method: "POST", headers: { ...headers(), Prefer: "return=minimal" }, body: JSON.stringify({ shop_id: contract.shop_id, contract_id: contract.id, amount: expectedAmount, bank_trans_id: verified.transactionId, status: "success" }) });
    return NextResponse.json({ ok: true, expiry_date: expiry.toISOString().slice(0, 10) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify slip" }, { status: 502 });
  }
}
