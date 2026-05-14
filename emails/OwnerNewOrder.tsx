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
  Preview,
} from "@react-email/components";
import { styles } from "./_styles";

type Props = {
  appUrl: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  fulfillmentLabel: string;
  fulfillmentDetail: string;
  addressBlock?: string | null;
  addressNotes?: string | null;
  items: { name: string; quantity: number; lineTotal: string }[];
  subtotal: string;
  couponLine?: { label: string; value: string } | null;
  pointsLine?: { label: string; value: string } | null;
  deliveryLine: { label: string; value: string };
  gst: string;
  total: string;
  ambassadorName?: string | null;
};

export default function OwnerNewOrder(props: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        New order {props.orderNumber} — {props.total}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${props.appUrl}/logo.png`}
              alt="Karyana"
              width="100"
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
              New order
            </Text>
            <Heading style={{ ...styles.h1, fontSize: 24, marginTop: 4 }}>
              {props.orderNumber}
            </Heading>

            <Hr style={styles.hr} />

            <Heading as="h2" style={styles.h2}>
              Customer
            </Heading>
            <Text style={{ fontSize: 14, margin: 0 }}>
              <strong>{props.customerName}</strong>
              <br />
              {props.customerEmail}
              {props.customerPhone && (
                <>
                  <br />
                  {props.customerPhone}
                </>
              )}
            </Text>

            <Heading as="h2" style={styles.h2}>
              {props.fulfillmentLabel}
            </Heading>
            <Section style={styles.pinkBox}>
              <Text style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                {props.fulfillmentDetail}
              </Text>
              {props.addressBlock && (
                <Text style={{ fontSize: 13, color: "#777", margin: "8px 0 0", whiteSpace: "pre-line" }}>
                  {props.addressBlock}
                </Text>
              )}
              {props.addressNotes && (
                <Text
                  style={{
                    fontSize: 13,
                    fontStyle: "italic",
                    color: "#F79BB0",
                    margin: "8px 0 0",
                  }}
                >
                  Notes: {props.addressNotes}
                </Text>
              )}
              {props.ambassadorName && (
                <Text style={{ fontSize: 13, color: "#777", margin: "8px 0 0" }}>
                  Assigned to: <strong>{props.ambassadorName}</strong>
                </Text>
              )}
            </Section>

            <Heading as="h2" style={styles.h2}>
              Items
            </Heading>
            {props.items.map((it, i) => (
              <Row key={i}>
                <Column>
                  <Text style={{ fontSize: 14, margin: 0 }}>
                    {it.quantity}× {it.name}
                  </Text>
                </Column>
                <Column align="right">
                  <Text style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                    {it.lineTotal}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={styles.hr} />

            {[
              { label: "Subtotal", value: props.subtotal },
              ...(props.couponLine ? [props.couponLine] : []),
              ...(props.pointsLine ? [props.pointsLine] : []),
              props.deliveryLine,
              { label: "GST", value: props.gst },
            ].map((row, i) => (
              <Row key={i}>
                <Column>
                  <Text style={{ fontSize: 14, margin: 0 }}>{row.label}</Text>
                </Column>
                <Column align="right">
                  <Text style={{ fontSize: 14, margin: 0 }}>{row.value}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={styles.hr} />
            <Row>
              <Column>
                <Text style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Total
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {props.total}
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
