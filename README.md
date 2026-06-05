# Brevo Integration — Karyana Bakery

## Setup

### 1. Add env vars to `.env.local`

```env
BREVO_API_KEY="xkeysib-..."
BREVO_LIST_ID="3"
BREVO_MEMBERS_LIST_ID="4"
```

- **BREVO_API_KEY**: Brevo dashboard → Settings → SMTP & API → API Keys → Generate
- **BREVO_LIST_ID**: Contacts → Lists → create one called "Newsletter" → copy the numeric ID
- **BREVO_MEMBERS_LIST_ID**: (optional) separate list for paying members

### 2. Create Brevo contact attributes

In Brevo dashboard → Contacts → Settings → Contact Attributes, create these:

| Name | Type |
|------|------|
| FIRSTNAME | Text |
| LASTNAME | Text |
| LANGUAGE | Text |
| SOURCE | Text |
| NEWSLETTER | Boolean |
| REGISTERED | Boolean |
| MEMBERSHIP_TIER | Text |
| MEMBERSHIP_STATUS | Text |
| TOTAL_ORDERS | Number |
| TOTAL_SPENT | Number |
| LAST_ORDER_DATE | Date |

### 3. Copy files

Copy `lib/brevo/client.ts` and `lib/brevo/sync.ts` to your project.

### 4. Add integration points to existing files

See INTEGRATION_POINTS.md for exact code to add to each file.

### 5. Add env vars to Vercel

```
vercel env add BREVO_API_KEY
vercel env add BREVO_LIST_ID
vercel env add BREVO_MEMBERS_LIST_ID
```

Then redeploy.
