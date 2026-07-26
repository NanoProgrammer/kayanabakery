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
  modeLabel: string;
  sendUrl: string;
  skipUrl: string;
  editUrl: string;
  locale: "en" | "es";
};

export default function WeeklyBoxReminder(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: "Tu pan semanal de Karyana está listo 🍞",
          title: `Hola, ${props.customerName}`,
          subtitle: "¿Quieres recibir tu pan esta semana?",
          modeText: `Tu modo actual: ${props.modeLabel}`,
          send: "Enviar esta semana",
          skip: "Omitir esta semana",
          edit: "Editar mi caja",
          cutoff: "Debes responder antes del jueves 11:59 PM. Después de esa hora aplicamos tu comportamiento predeterminado.",
        }
      : {
          preview: "Your Karyana weekly bread is ready 🍞",
          title: `Hi ${props.customerName}`,
          subtitle: "Do you want to receive your bread this week?",
          modeText: `Your current mode: ${props.modeLabel}`,
          send: "Send this week",
          skip: "Skip this week",
          edit: "Edit my box",
          cutoff: "Please respond before Thursday 11:59 PM. After that we apply your default behavior.",
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
            <Text style={styles.body1}>{t.subtitle}</Text>

            <Section style={styles.pinkBox}>
              <Text style={{ fontSize: 13, margin: 0, color: "#2B2B2B" }}>
                {t.modeText}
              </Text>
            </Section>

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={props.sendUrl} style={{ ...styles.goldButton, marginRight: 8 }}>
                {t.send}
              </Link>
              <Link href={props.skipUrl} style={styles.button}>
                {t.skip}
              </Link>
            </Section>

            <Section style={{ textAlign: "center", marginTop: 12 }}>
              <Link href={props.editUrl} style={{ fontSize: 12, color: "#777" }}>
                {t.edit}
              </Link>
            </Section>

            <Text style={{ fontSize: 11, color: "#999", marginTop: 24, textAlign: "center" as const }}>
              {t.cutoff}
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>Karyana Ruiz Bakery · Calgary, AB</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
