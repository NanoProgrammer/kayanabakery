/**
 * Seed delivery slots for the next 4 weeks.
 *
 * Standard windows:
 *   Monday 6-8 PM (public)
 *   Friday 7-9 PM (public)
 *
 * Member-only weekday windows (Tue/Wed/Thu):
 *   9-11 AM, 11 AM-1 PM, 1-3 PM, 3-5 PM
 *
 * Usage:
 *   npx tsx scripts/seed-delivery-slots.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIMEZONE_OFFSET_HOURS = -7; // America/Edmonton (MDT)

function localDate(
  year: number,
  month: number, // 0-indexed
  day: number,
  hour: number,
  minute: number
): Date {
  // Create UTC date adjusted for Edmonton time
  const date = new Date(Date.UTC(year, month, day, hour - TIMEZONE_OFFSET_HOURS, minute));
  return date;
}

async function main() {
  console.log("📅 Seeding delivery slots for next 4 weeks...\n");

  const now = new Date();
  const slots: any[] = [];

  for (let week = 0; week < 4; week++) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + week * 7 + dayOffset);
      day.setHours(0, 0, 0, 0);

      // Skip past dates
      if (day <= now) continue;

      const dayOfWeek = day.getDay();
      const y = day.getFullYear();
      const m = day.getMonth();
      const d = day.getDate();

      // Monday (1): 6-8 PM public
      if (dayOfWeek === 1) {
        slots.push({
          startTime: localDate(y, m, d, 18, 0),
          endTime: localDate(y, m, d, 20, 0),
          label: "Mon evening",
          capacity: 15,
          membersOnly: false,
          isOpen: true,
        });
      }

      // Friday (5): 7-9 PM public
      if (dayOfWeek === 5) {
        slots.push({
          startTime: localDate(y, m, d, 19, 0),
          endTime: localDate(y, m, d, 21, 0),
          label: "Fri evening",
          capacity: 20,
          membersOnly: false,
          isOpen: true,
        });
      }

      // Tue/Wed/Thu (2,3,4): 4 weekday windows for members
      if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
        const windows = [
          { start: 9, end: 11, label: "Morning" },
          { start: 11, end: 13, label: "Late morning" },
          { start: 13, end: 15, label: "Afternoon" },
          { start: 15, end: 17, label: "Late afternoon" },
        ];
        for (const w of windows) {
          slots.push({
            startTime: localDate(y, m, d, w.start, 0),
            endTime: localDate(y, m, d, w.end, 0),
            label: `${w.label} · members`,
            capacity: 8,
            membersOnly: true,
            isOpen: true,
          });
        }
      }
    }
  }

  // Use createMany — skip duplicates if re-running
  for (const slot of slots) {
    const existing = await prisma.deliverySlot.findFirst({
      where: {
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });
    if (existing) continue;
    await prisma.deliverySlot.create({ data: slot });
  }

  console.log(`✓ Created ${slots.length} slots (skipping any duplicates)`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
