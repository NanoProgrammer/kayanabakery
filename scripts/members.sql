-- ============================================================================
-- Karyana — membership queries
--
-- Paste any one of these into the Railway/Postgres query console. Nothing here
-- writes: every statement is a SELECT, so it is safe to run on production.
--
-- Table and column names are quoted because Prisma creates them in camelCase;
-- without the quotes Postgres lowercases them and the query fails.
-- ============================================================================


-- ─── 1. Everyone, at a glance ───────────────────────────────────────────────
SELECT
  u.name,
  u.email,
  m.tier,
  m.status,
  m."weeklyMode"                                    AS weekly_mode,
  CASE WHEN m."weeklyFrequency" = 'EVERY_4_WEEKS'
       THEN 'every 4 weeks' ELSE 'every week' END   AS cadence,
  m."autoDeliveryEnabled"                           AS auto_on,
  (m."squareCardId" IS NOT NULL)                    AS has_card,
  m."startedAt"::date                               AS since,
  m."renewsAt"::date                                AS renews
FROM "Membership" m
JOIN "User" u ON u.id = m."userId"
ORDER BY m.tier, m."startedAt";


-- ─── 2. Who gets bread THIS week ────────────────────────────────────────────
-- Mirrors what the Tuesday cron does: weekly members are always due, and
-- every-4-weeks members are due when a whole multiple of 4 weeks has passed
-- since their anchor week. No anchor falls back to weekly, same as the code.
SELECT
  u.name,
  u.email,
  m.tier,
  CASE WHEN m."weeklyFrequency" = 'EVERY_4_WEEKS'
       THEN 'every 4 weeks' ELSE 'every week' END AS cadence,
  m."weeklyMode"                                  AS weekly_mode,
  m."autoDeliveryEnabled"                         AS auto_on,
  CASE
    WHEN m."weeklyFrequency" <> 'EVERY_4_WEEKS' THEN 'DUE'
    WHEN m."weeklyAnchorAt" IS NULL             THEN 'DUE (no anchor)'
    WHEN MOD(
           ((date_trunc('week', CURRENT_DATE)::date
             - date_trunc('week', m."weeklyAnchorAt")::date) / 7)::int, 4
         ) = 0 THEN 'DUE'
    ELSE 'off week'
  END AS this_week
FROM "Membership" m
JOIN "User" u ON u.id = m."userId"
WHERE m.status = 'ACTIVE'
  AND m.tier IN ('SELECTO', 'LEGENDARIO')
  AND m."weeklyMode" IS NOT NULL
ORDER BY this_week DESC, u.name;


-- ─── 3. Problems — why someone's bread is not going out ─────────────────────
SELECT
  u.name,
  u.email,
  m.tier,
  CASE
    WHEN m."weeklyMode" IS NULL
      THEN 'never chose a weekly mode — nothing will ever send'
    WHEN m."weeklyMode" = 'REPEAT_LAST' AND m."squareCardId" IS NULL
      THEN 'no card on file — auto-orders will FAIL'
    WHEN m."weeklyMode" <> 'MANUAL' AND m."autoDeliveryEnabled" = false
      THEN 'auto-delivery OFF — skipped unless they reply each week'
    WHEN u.email IS NULL
      THEN 'no email — cannot be notified'
  END AS problem
FROM "Membership" m
JOIN "User" u ON u.id = m."userId"
WHERE m.status = 'ACTIVE'
  AND m.tier IN ('SELECTO', 'LEGENDARIO')
  AND (
        m."weeklyMode" IS NULL
     OR (m."weeklyMode" = 'REPEAT_LAST' AND m."squareCardId" IS NULL)
     OR (m."weeklyMode" <> 'MANUAL' AND m."autoDeliveryEnabled" = false)
     OR u.email IS NULL
  )
ORDER BY u.name;


-- ─── 4. One person, in full ─────────────────────────────────────────────────
-- Change the email on the last line.
SELECT
  u.name, u.email, u.phone, u."preferredLang" AS lang, u."pointsBalance" AS points,
  m.tier, m.status, m."weeklyMode" AS weekly_mode, m."weeklyFrequency" AS frequency,
  m."weeklyAnchorAt"::date AS anchor, m."autoDeliveryEnabled" AS auto_on,
  (m."squareCardId" IS NOT NULL) AS has_card,
  m."startedAt"::date AS since, m."renewsAt"::date AS renews
FROM "Membership" m
JOIN "User" u ON u.id = m."userId"
WHERE u.email = 'someone@example.com';


-- ─── 5. Last weeks' send/skip history ───────────────────────────────────────
SELECT
  u.name,
  l."weekStart"::date AS week,
  l.status,
  l."decidedBy"       AS decided_by,
  l."failureNote"     AS failure
FROM "WeeklyOrderLog" l
JOIN "User" u ON u.id = l."userId"
ORDER BY l."weekStart" DESC, u.name
LIMIT 50;


-- ─── 6. Counts ──────────────────────────────────────────────────────────────
SELECT
  m.tier,
  m.status,
  COUNT(*)                                                        AS members,
  COUNT(*) FILTER (WHERE m."weeklyMode" IS NOT NULL)              AS weekly_box_setup,
  COUNT(*) FILTER (WHERE m."weeklyFrequency" = 'EVERY_4_WEEKS')   AS on_monthly
FROM "Membership" m
GROUP BY m.tier, m.status
ORDER BY m.tier, m.status;
