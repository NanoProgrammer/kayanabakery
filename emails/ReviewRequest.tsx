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
 * Asking for a review, the day after.
 *
 * This used to be a line inside the "your order is complete" message, which
 * reaches the customer while they are still in the shop or just back in the
 * car — the worst moment to ask anyone to sit and write something. It arrives
 * the middle of the next day now, once they have actually eaten the bread.
 */
type Props = {
  appUrl: string;
  customerName: string;
  reviewUrl: string;
  locale: "en" | "es";
};

export default function ReviewRequest(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: "¿Nos regalas un minuto?",
          eyebrow: "Gracias",
          title: `Hola ${props.customerName}`,
          lead: "Esperamos que hayas disfrutado tu pan.",
          body: "Somos una panadería pequeña y las reseñas son la forma en que la gente nos encuentra. Si te gustó, contarlo nos ayuda muchísimo — te toma menos de un minuto.",
          cta: "Dejar una reseña",
          closing: "Y si algo no estuvo bien, respóndenos este correo y lo arreglamos.",
        }
      : {
          preview: "Could you spare a minute?",
          eyebrow: "Thank you",
          title: `Hi ${props.customerName}`,
          lead: "We hope you enjoyed your bread.",
          body: "We're a small bakery, and reviews are how people find us. If you liked it, saying so helps us more than you'd think — it takes under a minute.",
          cta: "Leave a review",
          closing: "And if something wasn't right, just reply to this email and we'll fix it.",
        };

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
            <Text style={styles.body1}>{t.body}</Text>

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={props.reviewUrl} style={styles.goldButton}>
                {t.cta}
              </Link>
            </Section>

            <Text style={{ ...styles.body1, marginTop: 24 }}>{t.closing}</Text>
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
