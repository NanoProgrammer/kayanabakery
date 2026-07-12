import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliverySlotDefs } from "@/lib/checkout/schedule";

/**
 * GET /api/checkout/slots
 *
 * Returns delivery windows for the next 14 days with live capacity.
 * Lazy-creates DeliverySlot rows if they don't exist yet.
 */
const EDMONTON_OFFSET_MS = -6 * 60 * 60 * 1000; // MDT = UTC-6

function nowInEdmonton(): Date {
  const utc = Date.now();
  return new Date(utc + EDMONTON_OFFSET_MS);
}

export async function GET() {
  try {
    // Use Edmonton local time so dates match what customers see in Calgary.
    // Lead time filtering happens client-side (browser local time) for accuracy.
    const slotDefs = getDeliverySlotDefs({ from: nowInEdmonton(), daysAhead: 21, minLeadHours: 0 });

    if (slotDefs.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    const minStart = new Date(slotDefs[0].startISO);
    const maxEnd = new Date(slotDefs[slotDefs.length - 1].endISO);

    const existingSlots = await prisma.deliverySlot.findMany({
      where: {
        startTime: { gte: minStart },
        endTime: { lte: maxEnd },
      },
      include: {
        _count: {
          select: {
            orders: {
              where: { status: { not: "CANCELLED" } },
            },
          },
        },
      },
    });

    const slotMap = new Map(
      existingSlots.map((s) => [s.startTime.toISOString(), s])
    );

    const result = [];

    for (const def of slotDefs) {
      let dbSlot = slotMap.get(new Date(def.startISO).toISOString());

      if (!dbSlot) {
        try {
          const created = await prisma.deliverySlot.create({
            data: {
              startTime: new Date(def.startISO),
              endTime: new Date(def.endISO),
              label: def.label,
              capacity: def.capacity,
              isOpen: true,
              membersOnly: false,
            },
          });
          dbSlot = { ...created, _count: { orders: 0 } } as any;
        } catch (e: any) {
          if (e.code === "P2002") {
            const refetched = await prisma.deliverySlot.findFirst({
              where: {
                startTime: new Date(def.startISO),
                endTime: new Date(def.endISO),
              },
              include: {
                _count: {
                  select: {
                    orders: { where: { status: { not: "CANCELLED" } } },
                  },
                },
              },
            });
            if (refetched) dbSlot = refetched;
          }
        }
      }

      if (!dbSlot || !dbSlot.isOpen) continue;

      const reserved = (dbSlot as any)._count?.orders ?? 0;
      const remaining = Math.max(0, dbSlot.capacity - reserved);

      result.push({
        id: dbSlot.id,
        date: def.date,
        dayLabel: def.dayLabel,
        windowLabel: def.windowLabel,
        label: def.label,
        endISO: def.endISO,
        capacity: dbSlot.capacity,
        reserved,
        remaining,
        membersOnly: dbSlot.membersOnly,
        isPriority: def.isPriority,
        feeCentsBasico: def.feeCentsBasico,
        feeCentsArtesano: def.feeCentsArtesano,
      });
    }

    return NextResponse.json({ slots: result });
  } catch (err: any) {
    console.error("[checkout/slots] error:", err.message);
    return NextResponse.json({ slots: [], error: err.message }, { status: 500 });
  }
}
