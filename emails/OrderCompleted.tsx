import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
  Preview,
  Link,
} from "@react-email/components";
import { styles } from "./_styles";
import { GOOGLE_REVIEW_URL } from "@/lib/reviews/link";

type Props = {
  appUrl: string;
  orderNumber: string;
  customerName: string;
  locale?: "en" | "es";
};

const COPY = {
  es: {
    preview: (n: string) => `Tu pedido ${n} fue completado — Karyana Bakery`,
    eyebrow: "Pedido completado",
    body: (name: string) =>
      `¡Hola ${name}! Tu pedido ya fue completado. Gracias por apoyar el pan artesanal hecho a mano — ¡esperamos que te haga sentir como en México! 🍞`,
    reviewTitle: "¿Nos regalas un minuto?",
    reviewBody:
      "Somos una panadería pequeña y las reseñas son la forma en que la gente nos encuentra. Si te gustó tu pan, contarlo nos ayuda muchísimo.",
    reviewCta: "Dejar una reseña en Google",
  },
  en: {
    preview: (n: string) => `Your order ${n} is complete — Karyana Bakery`,
    eyebrow: "Order completed",
    body: (name: string) =>
      `Hi ${name}! Your order is complete. Thank you for supporting handmade artisan bread — we hope it tastes like home! 🍞`,
    reviewTitle: "Could you spare a minute?",
    reviewBody:
      "We're a small bakery, and reviews are how people find us. If you enjoyed your bread, saying so helps us more than you'd think.",
    reviewCta: "Leave a review on Google",
  },
} as const;

export default function OrderCompleted(props: Props) {
  const t = COPY[props.locale === "es" ? "es" : "en"];

  return (
    <Html>
      <Head />
      <Preview>{t.preview(props.orderNumber)}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${props.appUrl}/logo-email.png`}
              alt="Karyana"
              width="100"
              height="100"
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
                color: "#F79BB0",
                margin: 0,
              }}
            >
              {t.eyebrow}
            </Text>
            <Heading style={{ ...styles.h1, fontSize: 24, marginTop: 4 }}>
              {props.orderNumber}
            </Heading>

            <Text style={styles.body1}>{t.body(props.customerName)}</Text>

            {/* Asked here rather than in a separate email later: this is the
                one message a customer opens while the bread is still on the
                table, and a follow-up a day later reads as marketing. */}
            <Section
              style={{
                marginTop: 24,
                padding: "18px 20px",
                borderRadius: 14,
                backgroundColor: "#FDF2F3",
                border: "1px solid #F3D7DD",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#2B1810",
                }}
              >
                {t.reviewTitle}
              </Text>
              <Text
                style={{
                  margin: "6px 0 14px",
                  fontSize: 13,
                  lineHeight: "1.5",
                  color: "#6b5a52",
                }}
              >
                {t.reviewBody}
              </Text>
              <Link
                href={GOOGLE_REVIEW_URL}
                style={{
                  display: "inline-block",
                  backgroundColor: "#6B4423",
                  color: "#FAD9D5",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "11px 22px",
                  borderRadius: 999,
                }}
              >
                ⭐ {t.reviewCta}
              </Link>
            </Section>

            <Text style={{ ...styles.tagline, textAlign: "center" as const }}>
              — Karyana Ruiz Bakery
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
