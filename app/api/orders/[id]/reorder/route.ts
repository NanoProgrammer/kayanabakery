import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { groq } from "next-sanity";

// Fetch current product data from Sanity to verify availability
const productsBySlugsQuery = groq`
  *[_type == "product" && slug.current in $slugs] {
    "productId": slug.current,
    name,
    "nameEs": nameEs,
    "slug": slug.current,
    price,
    inStock,
    leadTime,
  }
`;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the original order
  const order = await prisma.order.findFirst({
    where: { id, userId },
    select: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const originalItems = (order.items as any[]) ?? [];

  if (originalItems.length === 0) {
    return NextResponse.json({ error: "Order has no items" }, { status: 400 });
  }

  // Get current product data from Sanity
  const slugs = originalItems.map((it) => it.slug || it.productId);
  const currentProducts = await sanityFetch<any[]>({
    query: productsBySlugsQuery,
    params: { slugs },
    tags: ["product"],
  });

  const productMap = new Map(
    (currentProducts ?? []).map((p) => [p.slug, p])
  );

  const validItems: any[] = [];
  let droppedCount = 0;

  for (const it of originalItems) {
    const key = it.slug || it.productId;
    const current = productMap.get(key);

    // Drop if product no longer exists or is out of stock
    if (!current || current.inStock === false) {
      droppedCount++;
      continue;
    }

    validItems.push({
      productId: current.productId,
      name: current.name,
      nameEs: current.nameEs ?? current.name,
      slug: current.slug,
      price: current.price,         // current price, not original
      quantity: it.quantity,
      leadTime: current.leadTime ?? 0,
      image: it.image ?? null,
    });
  }

  return NextResponse.json({ items: validItems, droppedCount });
}