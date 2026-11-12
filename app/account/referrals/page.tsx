import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ReferralShare } from "@/components/home/ReferralShare";

export const dynamic = "force-dynamic";

const REWARDS = [
  ["Básico", "500"],
  ["Artesano", "600"],
  ["Selecto", "800"],
  ["Legendario", "1,000"],
];

export default async function ReferralsAccountPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login?callbackUrl=/account/referrals");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralRewardCount: true,
      referralRewardLimit: true,
      referralRewardsGiven: { select: { points: true } },
      referrals: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          referralVerificationProcessedAt: true,
          referralRewardReceived: { select: { points: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) redirect("/login");

  const pointsEarned = user.referralRewardsGiven.reduce((sum, reward) => sum + reward.points, 0);
  const paused = user.referralRewardCount >= user.referralRewardLimit;
  const usedInBlock = Math.min(10, Math.max(0, user.referralRewardCount - (user.referralRewardLimit - 10)));
  const progress = Math.round(usedInBlock * 10);
  const appointment = "mailto:hello@karyanabakery.ca?subject=" +
    encodeURIComponent("Karyana Club — Cita por 10 referidos") +
    "&body=" + encodeURIComponent("Hola Karyana Bakery,\n\nYa completé mis 10 referidos de este bloque y me gustaría solicitar una cita personal para poder renovar otros 10 referidos.\n\nMi correo de cuenta es: " + (session?.user?.email || ""));

  return (
    <div>
      <h1 className="font-display text-3xl">Referidos · Refer & earn</h1>
      <p className="mt-2 text-ink-soft">
        Invita a nuevos miembros a Karyana Club y gana Puntos Karyana cuando
        verifiquen su email. No tienen que comprar nada. 100 puntos = $1 CAD
        para usar en cualquier producto de Karyana Bakery.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {REWARDS.map(([name, amount]) => (
          <div key={name} className="rounded-2xl border border-canela/20 bg-cream p-4 text-center">
            <p className="text-sm text-ink-soft">{name}</p>
            <p className="mt-1 font-display text-2xl">{amount}</p>
            <p className="text-xs">puntos por registro</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-canela/20 bg-cream p-6">
        <h2 className="font-display text-xl">Tu bloque de 10 referidos</h2>
        <p className="mt-2 font-bold">{usedInBlock} de 10 recompensados</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-canela/15">
          <div className="h-full bg-canela-dark" style={{ width: progress + "%" }} />
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Total histórico: {user.referralRewardCount} registrados verificados ·
          {pointsEarned.toLocaleString("en-CA")} puntos ganados.
        </p>
        {paused ? (
          <div className="mt-5 rounded-2xl border border-canela/20 p-4">
            <p className="font-semibold">¡Completaste tus 10 referidos de este bloque!</p>
            <p className="mt-2 text-sm">
              Tus nuevas recompensas están pausadas. Escríbenos para programar
              una cita personal. Después de conocernos, Karyana Bakery puede
              aprobar otro bloque de 10 referidos.
            </p>
            <a href={appointment} className="btn-primary mt-4 inline-flex">
              Solicitar cita por email
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm">
            Te quedan {user.referralRewardLimit - user.referralRewardCount} referidos
            recompensados antes de solicitar una cita.
          </p>
        )}
      </div>

      {user.referralCode && (
        <div className="mt-8">
          <ReferralShare code={user.referralCode} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl">Tus registros</h2>
        {user.referrals.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Aún no tienes referidos.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.referrals.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3 rounded-2xl border border-canela/15 bg-cream p-4 text-sm">
                <div>
                  <p className="font-medium">{person.name || "Nuevo miembro"}</p>
                  <p className="text-xs text-ink-soft">
                    Registro: {person.createdAt.toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span className="text-xs font-bold">
                  {person.referralRewardReceived
                    ? "+" + person.referralRewardReceived.points + " pts"
                    : person.referralVerificationProcessedAt ? "Sin recompensa" : "Pendiente de verificar"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
