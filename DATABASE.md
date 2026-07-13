# Database setup — Gold Consignment SaaS

This project is designed for Supabase PostgreSQL. It keeps each gold shop’s data separate with `shop_id`, and uses the **ขายฝาก** contract model throughout.

## 1. Create the Supabase project

1. Create a Supabase project and open **Project Settings → API**.
2. Copy the project URL, anon key, and service-role key into `.env.local`. Use `.env.example` as the template.
3. In **SQL Editor**, run [supabase/schema.sql](./supabase/schema.sql) once.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never begin with `NEXT_PUBLIC_`, be sent to a browser, or be stored in client-side code.

## 2. Data model

```text
shops
 ├── customers
 │    └── consignment_contracts
 └── transactions ───► consignment_contracts
```

| Table | Purpose | Tenant key |
| --- | --- | --- |
| `shops` | ร้านทอง, ธีม, บัญชีธนาคาร, อัตราค่าขยายเวลาไถ่ถอน | `id` |
| `customers` | ผู้ขายฝากจาก LINE Login | `shop_id` |
| `consignment_contracts` | สัญญาขายฝาก, ยอดขายฝาก, วันครบกำหนดไถ่ถอน | `shop_id` |
| `transactions` | สลิปและผลการชำระค่าขยายเวลาไถ่ถอน | `shop_id` |

`citizen_id_encrypted` must contain encrypted data only. Do not log it, return it to the browser, or display it without masking.

## 3. Row Level Security

The schema enables RLS on every tenant table. The supplied read policies use the `shop_id` claim in the authenticated JWT, so an application user can never read a different shop’s records.

Before enabling customer-facing queries, configure your LINE authentication bridge or Supabase custom access token hook to include:

```json
{ "shop_id": "<shop UUID>" }
```

Every query must still filter by `shop_id`. RLS is the mandatory second barrier; a browser-provided `shop_id` is never sufficient for authorization.

## 4. Contract lifecycle

`consignment_contracts.status` accepts:

| Value | Meaning |
| --- | --- |
| `active` | สัญญายังใช้งานอยู่ |
| `redeemed` | ไถ่ถอนแล้ว |
| `expired` | หลุดเป็นสิทธิ |

The default extension-rate guardrail is **1.25% per month (15% per year)**. The owner UI warns above that value; it does not hard-block a shop’s configured rate.

## 5. Slip verification route

`POST /api/verify-slip` accepts a multipart form with `contract_id` and `slip`. It derives shop, receiving account, and required amount from the server-side contract record — never from request fields.

It verifies three conditions before extending `expiry_date` by 30 days:

1. `bank_trans_id` has not been used before.
2. The receiving account matches the shop attached to the contract.
3. The transferred amount exactly matches the computed extension fee.

Invalid payments are saved as `pending_review`; valid payments are saved as `success`. Configure the selected provider’s response mapping in [lib/slip-verifier.ts](./lib/slip-verifier.ts). Its credentials belong only in `.env.local`.

## 6. Local validation

After setting values, restart the dev server and run:

```bash
npm run build
```

The UI remains a demo until LINE LIFF, Supabase credentials, and the selected slip verification provider have been configured.
