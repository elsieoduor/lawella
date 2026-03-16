// /**
//  * lib/mpesa.ts
//  * All M-Pesa Daraja API logic lives here.
//  * Used only server-side (API routes).
//  */

// const IS_PRODUCTION = process.env.MPESA_ENV === "production"

// const BASE_URL = IS_PRODUCTION
//   ? "https://api.safaricom.co.ke"
//   : "https://sandbox.safaricom.co.ke"

// // ── Types ─────────────────────────────────────────────────────────────────────

// export interface StkPushParams {
//   phoneNumber: string   // 254XXXXXXXXX format
//   amount: number        // KES, whole number
//   orderId: string       // used as AccountReference
//   orderNumber: string   // e.g. LW-0042
// }

// export interface StkPushResult {
//   success: boolean
//   checkoutRequestId?: string
//   merchantRequestId?: string
//   responseCode?: string
//   customerMessage?: string
//   errorMessage?: string
// }

// export interface MpesaCallbackBody {
//   Body: {
//     stkCallback: {
//       MerchantRequestID: string
//       CheckoutRequestID: string
//       ResultCode: number       // 0 = success
//       ResultDesc: string
//       CallbackMetadata?: {
//         Item: Array<{ Name: string; Value: string | number }>
//       }
//     }
//   }
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// /** Returns current timestamp in Daraja format: YYYYMMDDHHmmss */
// function getTimestamp(): string {
//   return new Date()
//     .toISOString()
//     .replace(/[-T:.Z]/g, "")
//     .slice(0, 14)
// }

// /** Base64(ShortCode + Passkey + Timestamp) */
// function getPassword(timestamp: string): string {
//   const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
//   return Buffer.from(raw).toString("base64")
// }

// /** Normalise phone: strip leading 0 or +, ensure starts with 254 */
// export function normalisePhone(phone: string): string {
//   const digits = phone.replace(/\D/g, "")
//   if (digits.startsWith("254")) return digits
//   if (digits.startsWith("0"))   return "254" + digits.slice(1)
//   if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits
//   return digits
// }

// // ── OAuth Token ───────────────────────────────────────────────────────────────

// let cachedToken: { token: string; expiresAt: number } | null = null

// export async function getAccessToken(): Promise<string> {
//   // Return cached token if still valid (tokens last 1 hour; refresh 5 min early)
//   if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
//     return cachedToken.token
//   }

//   const credentials = Buffer.from(
//     `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
//   ).toString("base64")

//   const res = await fetch(
//     `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
//     {
//       method: "GET",
//       headers: { Authorization: `Basic ${credentials}` },
//       cache: "no-store",
//     }
//   )

//   if (!res.ok) {
//     const text = await res.text()
//     throw new Error(`Failed to get M-Pesa token: ${res.status} ${text}`)
//   }

//   const data = await res.json()
//   cachedToken = {
//     token: data.access_token,
//     expiresAt: Date.now() + Number(data.expires_in) * 1000,
//   }
//   return cachedToken.token
// }

// // ── STK Push ─────────────────────────────────────────────────────────────────

// export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
//   try {
//     const token = await getAccessToken()
//     const timestamp = getTimestamp()
//     const password = getPassword(timestamp)

//     const body = {
//       BusinessShortCode: process.env.MPESA_SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: "CustomerPayBillOnline",
//       Amount: Math.ceil(params.amount),            // M-Pesa requires integers
//       PartyA: params.phoneNumber,
//       PartyB: process.env.MPESA_SHORTCODE,
//       PhoneNumber: params.phoneNumber,
//       CallBackURL: process.env.MPESA_CALLBACK_URL,
//       AccountReference: params.orderNumber,        // shown on customer's phone
//       TransactionDesc: `Lawella order ${params.orderNumber}`,
//     }

//     const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(body),
//     })

//     const data = await res.json()

//     if (data.ResponseCode === "0") {
//       return {
//         success: true,
//         checkoutRequestId: data.CheckoutRequestID,
//         merchantRequestId: data.MerchantRequestID,
//         responseCode: data.ResponseCode,
//         customerMessage: data.CustomerMessage,
//       }
//     }

//     return {
//       success: false,
//       errorMessage: data.errorMessage || data.ResponseDescription || "STK push failed",
//     }
//   } catch (err: any) {
//     return { success: false, errorMessage: err.message }
//   }
// }

// // ── Query STK Status (polling) ────────────────────────────────────────────────

// export async function queryStkStatus(checkoutRequestId: string) {
//   const token = await getAccessToken()
//   const timestamp = getTimestamp()
//   const password = getPassword(timestamp)

//   const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       BusinessShortCode: process.env.MPESA_SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       CheckoutRequestID: checkoutRequestId,
//     }),
//   })
//   return res.json()
// }

// // ── Parse Callback Metadata ───────────────────────────────────────────────────

// export function parseCallbackMetadata(
//   metadata: MpesaCallbackBody["Body"]["stkCallback"]["CallbackMetadata"]
// ) {
//   if (!metadata) return {}
//   return Object.fromEntries(metadata.Item.map((i) => [i.Name, i.Value]))
// }
/**
 * lib/mpesa.ts
 * All M-Pesa Daraja API logic lives here.
 * Used only server-side (API routes).
 */

const IS_PRODUCTION = process.env.MPESA_ENV === "production"

const BASE_URL = IS_PRODUCTION
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StkPushParams {
  phoneNumber: string   // 254XXXXXXXXX format
  amount: number        // KES, whole number
  orderId: string       // used as AccountReference
  orderNumber: string   // e.g. LW-0042
}

export interface StkPushResult {
  success: boolean
  checkoutRequestId?: string
  merchantRequestId?: string
  responseCode?: string
  customerMessage?: string
  errorMessage?: string
}

export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number       // 0 = success
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns current timestamp in Daraja format: YYYYMMDDHHmmss */
function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14)
}

/** Base64(ShortCode + Passkey + Timestamp) */
function getPassword(timestamp: string): string {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  return Buffer.from(raw).toString("base64")
}

/** Normalise phone: strip leading 0 or +, ensure starts with 254 */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("254")) return digits
  if (digits.startsWith("0"))   return "254" + digits.slice(1)
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits
  return digits
}

// ── OAuth Token ───────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (tokens last 1 hour; refresh 5 min early)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token
  }

  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64")

  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get M-Pesa token: ${res.status} ${text}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
  }
  return cachedToken.token
}

// ── STK Push ─────────────────────────────────────────────────────────────────

export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
  try {
    const token = await getAccessToken()
    const timestamp = getTimestamp()
    const password = getPassword(timestamp)

    const body = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(params.amount),            // M-Pesa requires integers
      PartyA: params.phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: params.phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.orderNumber,        // shown on customer's phone
      TransactionDesc: `Lawella order ${params.orderNumber}`,
    }

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseCode: data.ResponseCode,
        customerMessage: data.CustomerMessage,
      }
    }

    return {
      success: false,
      errorMessage: data.errorMessage || data.ResponseDescription || "STK push failed",
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message }
  }
}

// ── Query STK Status (polling) ────────────────────────────────────────────────

export async function queryStkStatus(checkoutRequestId: string) {
  const token = await getAccessToken()
  const timestamp = getTimestamp()
  const password = getPassword(timestamp)

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  })
  return res.json()
}

// ── Parse Callback Metadata ───────────────────────────────────────────────────

export function parseCallbackMetadata(
  metadata: MpesaCallbackBody["Body"]["stkCallback"]["CallbackMetadata"]
) {
  if (!metadata) return {}
  return Object.fromEntries(metadata.Item.map((i) => [i.Name, i.Value]))
}
