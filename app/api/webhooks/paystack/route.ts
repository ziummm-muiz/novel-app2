import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Paystack Payment Webhook Endpoint
 * 
 * Security & Integrity Protections:
 * 1. Cryptographic HMAC-SHA512 verification with crypto.timingSafeEqual against timing attacks
 * 2. Strict event status validation (must be 'charge.success' with data.status === 'success')
 * 3. Database-level unique constraint on reference (idx_coin_transactions_reference)
 * 4. Atomic PostgreSQL fulfillment function (process_paystack_deposit) preventing race conditions
 * 5. Privileged execution strictly through service_role client (no browser exposure)
 */
interface PaystackEventPayload {
  event?: string
  data?: {
    status?: string
    reference?: string
    amount?: number
    metadata?: {
      user_id?: string
      coins?: number
    }
  }
}

export async function POST(req: Request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY is not configured.')
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 })
    }

    // 1. Extract signature and raw body text
    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 })
    }

    const rawBody = await req.text()

    // 2. Compute expected HMAC-SHA512
    const computedHash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex')

    // 3. Timing-safe signature comparison
    const signatureBuffer = Buffer.from(signature, 'hex')
    const hashBuffer = Buffer.from(computedHash, 'hex')

    if (
      signatureBuffer.length !== hashBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, hashBuffer)
    ) {
      console.warn('[Paystack Webhook] Invalid signature detected. Request rejected.')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    // 4. Parse verified payload
    let payload: PaystackEventPayload
    try {
      payload = JSON.parse(rawBody) as PaystackEventPayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { event, data } = payload

    // 5. Semantic event validation
    if (event !== 'charge.success' || !data || data.status !== 'success') {
      // Return 200 to acknowledge unhandled/non-charge events without taking financial action
      return NextResponse.json({ message: 'Event ignored: not a successful charge' }, { status: 200 })
    }

    const reference = data.reference
    if (!reference || typeof reference !== 'string' || !reference.trim()) {
      return NextResponse.json({ error: 'Missing or invalid transaction reference' }, { status: 400 })
    }

    // Extract user ID from metadata
    const userId = data.metadata?.user_id
    if (!userId || typeof userId !== 'string') {
      console.error('[Paystack Webhook] Missing user_id in payment metadata:', data.metadata)
      return NextResponse.json({ error: 'Missing user_id in transaction metadata' }, { status: 400 })
    }

    // Calculate coin amount (from metadata.coins or standard conversion: 1 coin per 10 NGN / 1000 kobo)
    let coinsToAdd = 0
    if (typeof data.metadata?.coins === 'number' && data.metadata.coins > 0) {
      coinsToAdd = Math.floor(data.metadata.coins)
    } else if (typeof data.amount === 'number' && data.amount > 0) {
      // Paystack amount is in kobo (100 kobo = 1 NGN). Default: 1 coin per 10 NGN = amount / 1000
      coinsToAdd = Math.max(1, Math.floor(data.amount / 1000))
    }

    if (coinsToAdd <= 0) {
      return NextResponse.json({ error: 'Calculated coin amount must be greater than zero' }, { status: 400 })
    }

    // 6. Execute atomic, idempotent fulfillment in PostgreSQL via service-role
    const supabaseAdmin = createAdminClient()
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('process_paystack_deposit', {
      p_user_id: userId,
      p_amount_coins: coinsToAdd,
      p_reference: reference.trim(),
    })

    if (rpcError) {
      console.error('[Paystack Webhook] Database error executing process_paystack_deposit:', rpcError)
      return NextResponse.json({ error: 'Failed to record deposit transaction' }, { status: 500 })
    }

    // 7. Inspect atomic result
    if (result?.status === 'DUPLICATE') {
      // Replay or duplicate webhook delivery caught idempotently
      console.info(`[Paystack Webhook] Idempotent duplicate delivery for reference: ${reference}`)
      return NextResponse.json(
        { message: 'Transaction already processed', status: 'duplicate', reference },
        { status: 200 }
      )
    }

    if (result?.status !== 'SUCCESS') {
      console.error('[Paystack Webhook] Deposit rejected by database function:', result)
      return NextResponse.json({ error: result?.message || 'Deposit could not be completed' }, { status: 400 })
    }

    console.info(`[Paystack Webhook] Deposit fulfilled: ${coinsToAdd} coins for user ${userId}, ref: ${reference}`)
    return NextResponse.json(
      { message: 'Payment fulfilled successfully', status: 'success', reference },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[Paystack Webhook] Unhandled exception in webhook handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
