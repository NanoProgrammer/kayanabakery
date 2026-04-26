import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";

type Item = {
  name: string;
  quantity: number;
  price: number;
};

type Props = {
  orderNumber: string;
  customerName: string;
  items: Item[];
  subtotal: number;
  total: number;
  fulfillmentType: string;
  pickupDate?: string | null;
  pickupTime?: string | null;
};

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  total,
  fulfillmentType,
  pickupDate,
  pickupTime,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your Karyana Bakery order is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Karyana</Heading>
          <Text style={script}>bakery</Text>

          <Heading style={h2}>¡Gracias, {customerName}!</Heading>
          <Text style={paragraph}>
            Your order is in the oven. We&apos;ll have everything fresh and
            ready for you.
          </Text>

          <Section style={orderBox}>
            <Text style={label}>ORDER NUMBER</Text>
            <Text style={orderNumStyle}>{orderNumber}</Text>
          </Section>

          <Hr style={hr} />

          <Heading style={h3}>Your order</Heading>
          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemQty}>× {item.quantity}</Text>
              </Column>
              <Column align="right">
                <Text style={itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </Column>
            </Row>
          ))}

          <Hr style={hr} />

          <Row>
            <Column>
              <Text style={totalLabel}>Subtotal</Text>
            </Column>
            <Column align="right">
              <Text style={totalValue}>${(subtotal / 100).toFixed(2)}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={totalLabelBold}>Total</Text>
            </Column>
            <Column align="right">
              <Text style={totalValueBold}>${(total / 100).toFixed(2)}</Text>
            </Column>
          </Row>

          <Hr style={hr} />

          <Heading style={h3}>
            {fulfillmentType === "PICKUP" ? "Pickup details" : "Delivery"}
          </Heading>
          {pickupDate && (
            <Text style={paragraph}>
              {new Date(pickupDate).toLocaleDateString("en-CA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {pickupTime && ` at ${pickupTime}`}
            </Text>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Questions? Reply to this email or reach us at{" "}
            <a href="mailto:karyana@karyanabakery.ca" style={link}>
              karyana@karyanabakery.ca
            </a>
          </Text>
          <Text style={tagline}>More than bread, a home memory.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#FBF6EE", fontFamily: "system-ui, sans-serif" };
const container = {
  maxWidth: "580px",
  margin: "0 auto",
  padding: "40px 32px",
  backgroundColor: "#FBF6EE",
};
const h1 = {
  fontSize: "32px",
  margin: "0",
  color: "#6B4423",
  fontFamily: "Georgia, serif",
  textAlign: "center" as const,
};
const script = {
  fontSize: "18px",
  margin: "4px 0 40px",
  color: "#D64545",
  fontStyle: "italic" as const,
  textAlign: "center" as const,
};
const h2 = { fontSize: "28px", color: "#2B1810", marginTop: "32px" };
const h3 = { fontSize: "18px", color: "#2B1810", marginTop: "24px" };
const paragraph = { fontSize: "14px", color: "#4A3428", lineHeight: "1.6" };
const orderBox = {
  backgroundColor: "#F3EADB",
  borderRadius: "16px",
  padding: "20px",
  margin: "24px 0",
};
const label = {
  fontSize: "10px",
  fontWeight: "bold",
  letterSpacing: "0.2em",
  color: "#6B4423",
  margin: "0",
};
const orderNumStyle = {
  fontSize: "20px",
  color: "#2B1810",
  margin: "4px 0 0",
  fontFamily: "monospace",
};
const hr = { borderColor: "#6B4423", opacity: 0.15, margin: "24px 0" };
const itemRow = { margin: "8px 0" };
const itemName = { fontSize: "14px", color: "#2B1810", margin: "0" };
const itemQty = { fontSize: "12px", color: "#2B1810", opacity: 0.6, margin: "0" };
const itemPrice = { fontSize: "14px", color: "#6B4423", margin: "0" };
const totalLabel = { fontSize: "14px", color: "#4A3428", margin: "4px 0" };
const totalValue = { fontSize: "14px", color: "#2B1810", margin: "4px 0" };
const totalLabelBold = { fontSize: "16px", color: "#2B1810", fontWeight: "bold", margin: "8px 0" };
const totalValueBold = { fontSize: "20px", color: "#6B4423", fontWeight: "bold", margin: "8px 0" };
const footer = { fontSize: "12px", color: "#4A3428", opacity: 0.7, textAlign: "center" as const };
const link = { color: "#6B4423" };
const tagline = { fontSize: "14px", color: "#D64545", fontStyle: "italic" as const, textAlign: "center" as const, marginTop: "16px" };

export default OrderConfirmationEmail;
