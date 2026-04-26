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
  customerEmail: string;
  customerPhone?: string | null;
  items: Item[];
  total: number;
  fulfillmentType: string;
  pickupDate?: string | null;
  pickupTime?: string | null;
  notes?: string | null;
  address?: any;
};

export function OwnerNewOrderEmail({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  total,
  fulfillmentType,
  pickupDate,
  pickupTime,
  notes,
  address,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New Karyana order: {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={banner}>
            <Text style={bannerText}>🥖 NEW ORDER</Text>
          </Section>

          <Heading style={h1}>{orderNumber}</Heading>
          <Text style={totalText}>${(total / 100).toFixed(2)} CAD</Text>

          <Hr style={hr} />

          <Heading style={h3}>Customer</Heading>
          <Text style={paragraph}>
            <strong>{customerName}</strong>
            <br />
            {customerEmail}
            {customerPhone && (
              <>
                <br />
                {customerPhone}
              </>
            )}
          </Text>

          <Heading style={h3}>
            {fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
          </Heading>
          <Text style={paragraph}>
            {pickupDate &&
              new Date(pickupDate).toLocaleDateString("en-CA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            {pickupTime && ` at ${pickupTime}`}
          </Text>
          {address && (
            <Text style={paragraph}>
              {address.line1}
              {address.line2 && `, ${address.line2}`}
              <br />
              {address.city}, {address.province} {address.postalCode}
            </Text>
          )}

          <Heading style={h3}>Items</Heading>
          {items.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column>
                <Text style={itemName}>
                  {item.name} × {item.quantity}
                </Text>
              </Column>
              <Column align="right">
                <Text style={itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </Column>
            </Row>
          ))}

          {notes && (
            <>
              <Heading style={h3}>Notes</Heading>
              <Text style={notesStyle}>{notes}</Text>
            </>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            A printable invoice/BOL is attached to this email.
          </Text>
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
const banner = {
  backgroundColor: "#D64545",
  borderRadius: "12px",
  padding: "12px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};
const bannerText = {
  color: "#FBF6EE",
  margin: "0",
  letterSpacing: "0.2em",
  fontSize: "14px",
  fontWeight: "bold",
};
const h1 = {
  fontSize: "28px",
  color: "#2B1810",
  margin: "0",
  fontFamily: "monospace",
  textAlign: "center" as const,
};
const totalText = {
  fontSize: "36px",
  color: "#6B4423",
  margin: "8px 0 24px",
  textAlign: "center" as const,
  fontWeight: "bold",
};
const h3 = {
  fontSize: "11px",
  color: "#2B1810",
  opacity: 0.6,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  marginTop: "24px",
};
const paragraph = { fontSize: "15px", color: "#2B1810", lineHeight: "1.6" };
const hr = { borderColor: "#6B4423", opacity: 0.15, margin: "24px 0" };
const itemRow = { margin: "6px 0" };
const itemName = { fontSize: "14px", color: "#2B1810", margin: "0" };
const itemPrice = { fontSize: "14px", color: "#6B4423", margin: "0" };
const notesStyle = {
  fontSize: "14px",
  color: "#2B1810",
  backgroundColor: "#F3EADB",
  padding: "12px 16px",
  borderRadius: "12px",
  margin: "8px 0",
};
const footer = { fontSize: "12px", color: "#4A3428", opacity: 0.7, textAlign: "center" as const };

export default OwnerNewOrderEmail;
