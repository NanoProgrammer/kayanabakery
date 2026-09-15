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
} from "@react-email/components";
import { styles } from "./_styles";

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
  },
  en: {
    preview: (n: string) => `Your order ${n} is complete — Karyana Bakery`,
    eyebrow: "Order completed",
    body: (name: string) =>
      `Hi ${name}! Your order is complete. Thank you for supporting handmade artisan bread — we hope it tastes like home! 🍞`,
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

            <Text style={{ ...styles.tagline, textAlign: "center" as const }}>
              — Karyana Ruiz Bakery
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
