"use client";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  if (!messages?.length) return null;
  const repeated = [...messages, ...messages, ...messages];

  return (
    <div className="overflow-hidden border-b border-canela/20 bg-canela-light py-2 text-xs uppercase tracking-[0.2em] text-ink">
      <div
        className="flex animate-[marquee_40s_linear_infinite] gap-12 whitespace-nowrap"
        style={{ width: "max-content" }}
      >
        {repeated.map((msg, i) => (
          <span key={i} className="flex items-center gap-12">
            {msg}
            <span aria-hidden className="text-canela-dark">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
