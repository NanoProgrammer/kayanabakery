import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
  Link,
  Preview,
} from "@react-email/components";
import { styles } from "./_styles";

/**
 * Sent when a membership renewal is declined, and again if the grace period
 * runs out. Nobody was told either of these before: the membership simply
 * stopped working and the member found out by losing access at the till.
 *
 * The whole point is the button, so it comes before the explanation.
 */
type Props = {
  appUrl: string;
  customerName: string;
  tierName: string;
  locale: "en" | "es";
  /** Days of benefits left; 0 means the membership has already ended. */
  daysLeft: number;
};

export default function RenewalIssue(props: Props) {
  const ended = props.daysLeft <= 0;

  const t =
    props.locale === "es"
      ? {
          preview: ended
            ? `Tu membresía ${props.tierName} terminó`
            : "No pudimos cobrar tu membresía",
          eyebrow: ended ? "Membresía terminada" : "Problema con el cobro",
          title: ended
            ? `Tu membresía ${props.tierName} terminó`
            : `Hola ${props.customerName}`,
          lead: ended
            ? "No logramos cobrar tu tarjeta y el periodo de gracia terminó, así que tu membresía quedó inactiva. Puedes volver cuando quieras — tus puntos siguen ahí."
            : `Tu tarjeta no aceptó el cobro de tu membresía ${props.tierName}. No pasa nada todavía: tus beneficios siguen activos y lo volvemos a intentar cada día.`,
          window:
            props.daysLeft === 1
              ? "Te queda 1 día para actualizar tu tarjeta."
              : `Te quedan ${props.daysLeft} días para actualizar tu tarjeta.`,
          cta: ended ? "Volver a suscribirme" : "Actualizar mi tarjeta",
          why: "Suele ser una tarjeta vencida o un banco que rechazó el cargo. Cambiarla toma menos de un minuto.",
          help: "¿Algo no cuadra? Respóndenos este correo y lo vemos.",
        }
      : {
          preview: ended
            ? `Your ${props.tierName} membership has ended`
            : "We couldn't charge your membership",
          eyebrow: ended ? "Membership ended" : "Payment problem",
          title: ended
            ? `Your ${props.tierName} membership has ended`
            : `Hi ${props.customerName}`,
          lead: ended
            ? "We couldn't charge your card and the grace period ran out, so your membership is now inactive. You're welcome back any time — your points are still there."
            : `Your card declined the charge for your ${props.tierName} membership. Nothing is lost yet: your benefits are still active and we'll keep trying each day.`,
          window:
            props.daysLeft === 1
              ? "You have 1 day left to update your card."
              : `You have ${props.daysLeft} days left to update your card.`,
          cta: ended ? "Subscribe again" : "Update my card",
          why: "It's usually an expired card or a bank declining the charge. Changing it takes under a minute.",
          help: "Something look wrong? Just reply to this email and we'll sort it out.",
        };

  const href = ended
    ? `${props.appUrl}/memberships`
    : `${props.appUrl}/account/membership`;

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${props.appUrl}/logo-email.png`}
              alt="Karyana"
              width="120"
              height="120"
              style={{ margin: "0 auto" }}
            />
          </Section>

          <Section style={styles.card}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#D4AF37",
              }}
            >
              {t.eyebrow}
            </Text>

            <Heading style={styles.h1}>{t.title}</Heading>
            <Text style={styles.body1}>{t.lead}</Text>

            {!ended && (
              <Section style={styles.goldBox}>
                <Text style={{ ...styles.body1, margin: 0, fontWeight: 700 }}>
                  {t.window}
                </Text>
              </Section>
            )}

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={href} style={styles.goldButton}>
                {t.cta}
              </Link>
            </Section>

            <Text style={{ ...styles.body1, marginTop: 24 }}>{t.why}</Text>
            <Text style={styles.body1}>{t.help}</Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Karyana Ruiz Bakery · Calgary, AB
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
