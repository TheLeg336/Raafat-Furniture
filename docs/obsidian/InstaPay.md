---
type: feature
tags: [payments, instapay, egypt]
---

# InstaPay

Manual bank transfer via Egyptian InstaPay apps.

## Customer instructions

On order confirmation + email, customer must put this in the **transfer note / title**:

```
{ORDER_NUMBER} {FULL_NAME}
```

Example: `EG123456KY Ahmed Hassan`

UI: copyable field on `OrderConfirmation` + email `transferNoteHint`.

## Admin verification

1. Admin → Orders → open order
2. **Payment verification** section
3. Check InstaPay for matching amount + note
4. Click **Confirm payment received**

## Order state

- Starts `pending_payment` / `payment_verification`
- Admin confirms → `paid`

## Related

- [[Payments]]
- [[Order Lifecycle]]
- [[Resend Email]]
