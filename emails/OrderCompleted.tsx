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
};

export default function OrderCompleted(props: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu pedido {props.orderNumber} fue entregado — Karyana Bakery</Preview>
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
              Order completed
            </Text>
            <Heading style={{ ...styles.h1, fontSize: 24, marginTop: 4 }}>
              {props.orderNumber}
            </Heading>

            <Text style={styles.body1}>
              ¡Hola {props.customerName}! Tu pedido ya fue entregado / picked
              up. Gracias por apoyar el pan artesanal hecho a mano — ¡esperamos
              que te haga sentir como en México! 🍞
            </Text>

            <Text style={{ ...styles.tagline, textAlign: "center" as const }}>
              — Karyana Ruiz Bakery
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
