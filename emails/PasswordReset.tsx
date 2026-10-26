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
 * The link that lets someone back into their account.
 *
 * `hasPassword` is false for an account that only ever signed in with Google.
 * Those people have no password to have forgotten, so telling them to "reset"
 * one is confusing — the mail says they are setting one for the first time.
 */
type Props = {
  appUrl: string;
  customerName: string;
  resetUrl: string;
  hasPassword: boolean;
  locale: "en" | "es";
};

export default function PasswordReset(props: Props) {
  const t =
    props.locale === "es"
      ? {
          preview: props.hasPassword
            ? "Restablece tu contraseña"
            : "Crea tu contraseña",
          eyebrow: "Tu cuenta",
          title: props.hasPassword
            ? `Hola ${props.customerName}`
            : `Hola ${props.customerName}`,
          lead: props.hasPassword
            ? "Pediste restablecer tu contraseña. Toca el botón y elige una nueva."
            : "Tu cuenta entra con Google, así que nunca tuviste contraseña. Puedes crear una aquí para entrar también con tu correo.",
          cta: props.hasPassword ? "Elegir nueva contraseña" : "Crear mi contraseña",
          expiry: "El enlace sirve por una hora y solo se puede usar una vez.",
          ignore:
            "¿No fuiste tú? Ignora este correo — tu contraseña no cambia hasta que uses el enlace.",
        }
      : {
          preview: props.hasPassword ? "Reset your password" : "Set your password",
          eyebrow: "Your account",
          title: `Hi ${props.customerName}`,
          lead: props.hasPassword
            ? "You asked to reset your password. Tap the button and pick a new one."
            : "Your account signs in with Google, so you've never had a password. You can set one here to sign in with your email too.",
          cta: props.hasPassword ? "Choose a new password" : "Set my password",
          expiry: "The link works for one hour and can only be used once.",
          ignore:
            "Didn't ask for this? Ignore this email — your password doesn't change until you use the link.",
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

            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Link href={props.resetUrl} style={styles.goldButton}>
                {t.cta}
              </Link>
            </Section>

            <Text style={{ ...styles.body1, marginTop: 24 }}>{t.expiry}</Text>
            <Text style={styles.body1}>{t.ignore}</Text>
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
