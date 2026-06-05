

## 4. `app/api/membership/subscribe/route.ts`

Add at the top:
```ts
import { syncMembershipChange } from "@/lib/brevo/sync";
```

After the `prisma.membership.upsert` in the POST handler, add:
```ts
// Sync tier change to Brevo
syncMembershipChange({
  email: session.user.email,
  tier,
  status: "ACTIVE",
});
```

In the DELETE handler (cancellation), after updating Prisma, add:
```ts
// Sync cancellation to Brevo

```

---

## 5. `app/api/dev/set-membership/route.ts` (dev only)

Add at the top:
```ts
import { syncMembershipChange } from "@/lib/brevo/sync";
```

After the upsert/delete, add:
```ts
// Also sync to Brevo in dev
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { email: true },
});
if (user?.email) {
  syncMembershipChange({
    email: user.email,
    tier,
    status: tier === "BASICO" ? "INACTIVE" : "ACTIVE",
  });
}
```
