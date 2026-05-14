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
  approved: boolean;
  locale: "en" | "es";
};

export default function AmbassadorDecision(props: Props) {
  const t = props.approved
    ? props.locale === "es"
      ? {
          preview: "¡Bienvenido al programa de Embajadores!",
          title: `¡Bienvenido, ${props.customerName}!`,
          body:
            "Tu aplicación al programa de Embajadores Karyana fue aprobada. Tu membresía Embajador ya está activa.",
          benefits: "Ahora tienes:",
          list: [
            "10x puntos en cada compra",
            "Acceso completo a productos fuera de temporada y agotados",
            "Hasta 4 panes nuevos gratis al mes",
            "Pago por entregas ($8–$10 cada una)",
          ],
          cta: "Ver mi cuenta",
        }
      : {
          preview: "Welcome to the Karyana Ambassador program!",
          title: `Welcome, ${props.customerName}!`,
          body:
            "Your application to the Karyana Ambassador program has been approved. Your Embajador membership is now active.",
          benefits: "You now have:",
          list: [
            "10x points on every order",
            "Full access to off-season and out-of-stock items",
            "Up to 4 free new breads per month",
            "Paid deliveries ($8–$10 each)",
          ],
          cta: "Go to my account",
        }
    : props.locale === "es"
    ? {
        preview: "Sobre tu aplicación de Embajador",
        title: `Hola ${props.customerName}`,
        body:
          "Gracias por aplicar al programa de Embajadores Karyana. Por ahora no podemos avanzar con tu aplicación, pero apreciamos mucho tu interés en apoyarnos. Esperamos que sigas disfrutando de nuestro pan.",
      }
    : {
        preview: "About your Ambassador application",
        title: `Hi ${props.customerName}`,
        body:
          "Thank you for applying to the Karyana Ambassador program. We can't move forward with your application at this time, but we genuinely appreciate your interest in supporting us. We hope you'll continue enjoying our bread.",
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
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.h1}>{t.title}</Heading>
            <Text style={styles.body1}>{t.body}</Text>

            {props.approved && "list" in t && (
              <>
                <Heading as="h2" style={styles.h2}>
                  {t.benefits}
                </Heading>
                <ul
                  style={{ margin: 0, padding: "0 0 0 20px", color: "#2B2B2B" }}
                >
                  {t.list.map((b, i) => (
                    <li
                      key={i}
                      style={{ fontSize: 14, marginBottom: 6, lineHeight: 1.5 }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                <Section style={{ textAlign: "center", marginTop: 32 }}>
                  <Link href={`${props.appUrl}/account/membership`} style={styles.goldButton}>
                    {t.cta}
                  </Link>
                </Section>
              </>
            )}
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
