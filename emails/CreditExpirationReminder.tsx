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
  balanceDollars: string;
  daysLeft: number;
  expirationDateLabel: string;
  mode: "FORFEIT" | "DONATE";
  locale: "en" | "es";
};

export default function CreditExpirationReminder(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: `${props.balanceDollars} en puntos vencen el ${props.expirationDateLabel}`,
          title: `Hola, ${props.customerName}`,
          subtitle:
            props.mode === "FORFEIT"
              ? `Tienes ${props.balanceDollars} en puntos que vencerán en ${props.daysLeft} día(s), el ${props.expirationDateLabel}.`
              : `Tienes ${props.balanceDollars} en puntos. Si no los usas antes del ${props.expirationDateLabel}, se donarán como tarjetas de regalo a familias necesitadas.`,
          cta: "Usar mis puntos ahora",
          cta2: "Ver productos elegibles",
        }
      : {
          preview: `${props.balanceDollars} in points expire ${props.expirationDateLabel}`,
          title: `Hi ${props.customerName}`,
          subtitle:
            props.mode === "FORFEIT"
              ? `You have ${props.balanceDollars} in points expiring in ${props.daysLeft} day(s), on ${props.expirationDateLabel}.`
              : `You have ${props.balanceDollars} in points. If unused by ${props.expirationDateLabel}, they'll be donated as gift cards to families in need.`,
          cta: "Use credits now",
          cta2: "View eligible products",
        };

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={`${props.appUrl}/logo.png`} alt="Karyana" width="120" style={{ margin: "0 auto" }} />
          </Section>
          <Section style={styles.card}>
            <Heading style={styles.h1}>{t.title}</Heading>
            <Text style={styles.body1}>{t.subtitle}</Text>
            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={`${props.appUrl}/shop`} style={{ ...styles.goldButton, marginRight: 8 }}>
                {t.cta}
              </Link>
              <Link href={`${props.appUrl}/shop`} style={styles.button}>
                {t.cta2}
              </Link>
            </Section>
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>Karyana Ruiz Bakery · Calgary, AB</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
