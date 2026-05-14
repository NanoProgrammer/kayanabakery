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

type Props = {
  appUrl: string;
  customerName: string;
  tierName: string;
  pointsMultiplier: number;
  benefits: string[];
  locale: "en" | "es";
};

export default function MembershipWelcome(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: `Bienvenido al plan ${props.tierName}`,
          title: `Bienvenido, ${props.customerName}`,
          subtitle: `Tu membresía ${props.tierName} está activa`,
          benefitsTitle: "Tus beneficios",
          multiplier: `Ahora ganas ${props.pointsMultiplier}x puntos en cada compra`,
          cta: "Ver mi cuenta",
          tagline: "Más que pan, un recuerdo de hogar.",
        }
      : {
          preview: `Welcome to ${props.tierName}`,
          title: `Welcome, ${props.customerName}`,
          subtitle: `Your ${props.tierName} membership is active`,
          benefitsTitle: "Your benefits",
          multiplier: `You now earn ${props.pointsMultiplier}x points on every order`,
          cta: "Go to my account",
          tagline: "More than bread, a home memory.",
        };

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${props.appUrl}/logo.png`}
              alt="Karyana"
              width="120"
              style={{ margin: "0 auto" }}
            />
            <Text style={styles.tagline}>{t.tagline}</Text>
          </Section>

          <Section style={styles.card}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#D4AF37",
                margin: 0,
              }}
            >
              ✨ {props.tierName}
            </Text>
            <Heading style={styles.h1}>{t.title}</Heading>
            <Text style={styles.body1}>{t.subtitle}</Text>

            <Section style={styles.goldBox}>
              <Text
                style={{
                  fontSize: 14,
                  textAlign: "center",
                  color: "#2B2B2B",
                  margin: 0,
                }}
              >
                {t.multiplier}
              </Text>
            </Section>

            <Heading as="h2" style={styles.h2}>
              {t.benefitsTitle}
            </Heading>
            <ul style={{ margin: 0, padding: "0 0 0 20px", color: "#2B2B2B" }}>
              {props.benefits.map((b, i) => (
                <li
                  key={i}
                  style={{ fontSize: 14, marginBottom: 6, lineHeight: 1.5 }}
                >
                  {b}
                </li>
              ))}
            </ul>

            <Section style={{ textAlign: "center", marginTop: 32 }}>
              <Link href={`${props.appUrl}/account/overview`} style={styles.goldButton}>
                {t.cta}
              </Link>
            </Section>
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
