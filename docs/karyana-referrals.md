# Karyana Club referral points — November 2026

## Business rules

- Only the inviting Karyana Club member receives points.
- Points per newly registered, email-verified member:
  - Inviter BASICO: 500 points
  - Inviter ARTESANO: 600 points
  - Inviter SELECTO: 800 points
  - Inviter LEGENDARIO: 1,000 points
- 100 Karyana points = CAD $1, usable on any eligible product at checkout.
- No purchase is required from the new member.
- Each inviter gets an initial block of TEN rewarded referrals.
- At 10, awards pause. The inviter can email hello@karyanabakery.ca
  requesting a personal meeting.
- Only ADMIN may approve an additional block of ten AFTER meeting the member.
  Approval is recorded with administrator and date.
- Rewards are based on the inviter's effective tier WHEN the new member
  verifies their email.
- No automatic retroactive rewards for signups while paused.
- Existing accounts, unverified signups, repeated confirmations and
  self-referrals never create another reward.
- EMBAJADOR is separate and has no reward rate in the agreed four-tier table.

## Technical deployment checklist

1. Review the PR. Do not deploy while schema changes are unapplied.
2. Back up the production database.
3. Apply Prisma schema changes using the repository's controlled npm run
   db:push procedure and verify with npm run db:verify. The normal build
   includes a schema drift guard.
4. Ensure Vercel has RESEND_API_KEY, FROM_EMAIL, AUTH_SECRET,
   NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.
5. Verify Resend sender domain and mail delivery.
6. Test registration with/without referrer, all 4 reward tiers,
   verification expiry/resend and email duplicates.
7. Test transitions 9→10, 10→pause, admin approval 10→20, 19→20.
   Verify multiple simultaneous confirmations do not pay reward #11.
8. Test full and partial redemption, including a $0 points-funded order
   and ensure Square is not charged for that case.
9. Test ordinary checkout, existing members and Google login before merge.

## Main code paths

- prisma/schema.prisma — referral rewards and renewal audit records.
- lib/referrals/* — signed email verification and atomic points grants.
- app/api/register/route.ts, components/auth/RegisterForm.tsx — invite flow.
- app/api/referrals/*, app/(auth)/referral-verify/page.tsx — verify and resend.
- app/account/referrals/page.tsx — progress and appointment email button.
- app/admin/referrals/page.tsx — approve additional ten after meeting.
- app/api/checkout/route.ts — remove old $10 reward on first purchase;
  allow full redemption by Karyana points.

## Limitations

- Email confirmation is not identity verification; a person might own
  multiple emails. The 10-reward cap and personal approval limit exposure.
- The program does not automatically award points for historical signups.
- Schema migration and integration tests remain required before publishing.
