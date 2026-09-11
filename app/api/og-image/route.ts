import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Proxies a Sanity CDN image under our own domain, as raw JPEG bytes with
 * no content negotiation — so og:image/twitter:image URLs sent to link
 * crawlers (WhatsApp, Facebook, etc.) are same-domain and never subject to
 * a crawler being served (or mishandling) a format-negotiated WebP/AVIF
 * response instead of a plain JPEG.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src");

  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  // Only ever proxy Sanity's own CDN — never an arbitrary URL.
  if (target.protocol !== "https:" || target.hostname !== "cdn.sanity.io") {
    return NextResponse.json({ error: "Unsupported src" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    next: { revalidate: 86400 },
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
