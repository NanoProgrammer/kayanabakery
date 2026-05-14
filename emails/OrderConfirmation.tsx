import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Row,
  Column,
  Img,
  Link,
  Preview,
} from "@react-email/components";
import { styles } from "./_styles";

type Props = {
  appUrl: string;
  orderNumber: string;
  customerName: string;
  fulfillmentLabel: string;
  fulfillmentDetail: string;
  addressLine?: string | null;
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  couponLine?: { label: string; value: string };
  pointsLine?: { label: string; value: string };
  deliveryLine: { label: string; value: string };
  gst: string;
  total: string;
  pointsEarned: number;
  locale: "en" | "es";
};

export default function OrderConfirmation(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: `Tu orden ${props.orderNumber} está confirmada`,
          thanks: `¡Gracias, ${props.customerName}!`,
          confirmed: `Tu orden ${props.orderNumber} está confirmada y nos pusimos a hornear.`,
          items: "Productos",
          subtotal: "Subtotal",
          gst: "GST (5%)",
          total: "Total",
          earned: "Ganaste",
          points: "puntos",
          viewOrder: "Ver mi orden",
          tagline: "Más que pan, un recuerdo de hogar.",
        }
      : {
          preview: `Your order ${props.orderNumber} is confirmed`,
          thanks: `Thanks, ${props.customerName}!`,
          confirmed: `Your order ${props.orderNumber} is confirmed and we're getting baking.`,
          items: "Items",
          subtotal: "Subtotal",
          gst: "GST (5%)",
          total: "Total",
          earned: "You earned",
          points: "points",
          viewOrder: "View my order",
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
              alt="Karyana Bakery"
              width="120"
              style={{ margin: "0 auto" }}
            />
            <Text style={styles.tagline}>{t.tagline}</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.h1}>{t.thanks}</Heading>
            <Text style={styles.body1}>{t.confirmed}</Text>

            <Section style={styles.pinkBox}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#777",
                  margin: 0,
                }}
              >
                {props.fulfillmentLabel}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#2B2B2B",
                  margin: "4px 0 0",
                }}
              >
                {props.fulfillmentDetail}
              </Text>
              {props.addressLine && (
                <Text style={{ fontSize: 13, color: "#777", margin: "4px 0 0" }}>
                  {props.addressLine}
                </Text>
              )}
            </Section>

            <Heading as="h2" style={styles.h2}>
              {t.items}
            </Heading>
            {props.items.map((it, i) => (
              <Row key={i} style={{ marginBottom: 4 }}>
                <Column>
                  <Text style={{ fontSize: 14, color: "#2B2B2B", margin: 0 }}>
                    {it.quantity}× {it.name}
                  </Text>
                </Column>
                <Column align="right">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#2B2B2B",
                      margin: 0,
                    }}
                  >
                    {it.lineTotal}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={styles.hr} />

            {[
              { label: t.subtotal, value: props.subtotal, accent: false },
              ...(props.couponLine
                ? [{ label: props.couponLine.label, value: props.couponLine.value, accent: true }]
                : []),
              ...(props.pointsLine
                ? [{ label: props.pointsLine.label, value: props.pointsLine.value, accent: true }]
                : []),
              {
                label: props.deliveryLine.label,
                value: props.deliveryLine.value,
                accent: false,
              },
              { label: t.gst, value: props.gst, accent: false },
            ].map((row, i) => (
              <Row key={i}>
                <Column>
                  <Text
                    style={{
                      fontSize: 14,
                      color: row.accent ? "#F79BB0" : "#2B2B2B",
                      fontWeight: row.accent ? 600 : 400,
                      margin: 0,
                    }}
                  >
                    {row.label}
                  </Text>
                </Column>
                <Column align="right">
                  <Text
                    style={{
                      fontSize: 14,
                      color: row.accent ? "#F79BB0" : "#2B2B2B",
                      fontWeight: row.accent ? 600 : 400,
                      margin: 0,
                    }}
                  >
                    {row.value}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={styles.hr} />

            <Row>
              <Column>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#2B2B2B",
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {t.total}
                </Text>
              </Column>
              <Column align="right">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#2B2B2B",
                    fontFamily: "Georgia, serif",
                    margin: 0,
                  }}
                >
                  {props.total}
                </Text>
              </Column>
            </Row>

            {props.pointsEarned > 0 && (
              <Section style={styles.goldBox}>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#2B2B2B",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  ✨ {t.earned} <strong>{props.pointsEarned}</strong> {t.points}
                </Text>
              </Section>
            )}

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={`${props.appUrl}/account/orders`} style={styles.button}>
                {t.viewOrder}
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
