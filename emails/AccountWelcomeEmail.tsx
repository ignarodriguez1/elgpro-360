import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface AccountWelcomeEmailProps {
  name: string;
  /** Frase de contexto según el tipo de cuenta (equipo / cliente). */
  intro: string;
  /** Link a la pantalla de login correspondiente (admin o portal). */
  loginUrl: string;
}

export function AccountWelcomeEmail({ name, intro, loginUrl }: AccountWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={logoStyle}>ELG PRO</Text>

          <Section style={contentStyle}>
            <Text style={headingStyle}>Bienvenido, {name}</Text>
            <Text style={textStyle}>{intro}</Text>
            <Text style={textStyle}>
              Para activar tu cuenta, ingresá con tu email: te enviamos un código
              de acceso al instante. No hay contraseñas que recordar.
            </Text>

            <Button style={buttonStyle} href={loginUrl}>
              Activar mi cuenta
            </Button>

            <Text style={smallTextStyle}>
              Si no esperabas este acceso, ignorá este email.
            </Text>
          </Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            ELG Pro — Paint & Detail | Rosario, Argentina
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = { backgroundColor: "#0C0C0C", fontFamily: "sans-serif" };
const containerStyle = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const logoStyle = { color: "#C41E2A", fontSize: "28px", fontWeight: "800" as const, letterSpacing: "2px", textAlign: "center" as const };
const contentStyle = { backgroundColor: "#1A1A1A", borderRadius: "8px", padding: "32px", marginTop: "24px" };
const headingStyle = { color: "#F5F5F5", fontSize: "22px", fontWeight: "600" as const };
const textStyle = { color: "#B0B0B0", fontSize: "15px", lineHeight: "1.6" };
const buttonStyle = { backgroundColor: "#C41E2A", color: "#FFFFFF", padding: "12px 32px", borderRadius: "6px", fontSize: "15px", fontWeight: "600" as const, textDecoration: "none", display: "inline-block", marginTop: "16px" };
const smallTextStyle = { color: "#6B7280", fontSize: "13px", marginTop: "20px" };
const hrStyle = { borderColor: "#374151", marginTop: "32px" };
const footerStyle = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };
