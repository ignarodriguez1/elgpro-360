import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface LoginCodeEmailProps {
  code: string;
}

export function LoginCodeEmail({ code }: LoginCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={logoStyle}>ELG PRO</Text>

          <Section style={contentStyle}>
            <Text style={headingStyle}>Tu código de acceso</Text>
            <Text style={textStyle}>
              Usá este código para ingresar a ELG Pro 360. Tené en cuenta que
              vence en 10 minutos.
            </Text>

            <Text style={codeStyle}>{code}</Text>

            <Text style={smallTextStyle}>
              Si no pediste este código, ignorá este email. Nunca lo compartas con
              nadie.
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
const codeStyle = {
  color: "#FFFFFF",
  backgroundColor: "#0C0C0C",
  border: "1px solid #C41E2A",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  fontSize: "34px",
  fontWeight: "800" as const,
  letterSpacing: "10px",
  textAlign: "center" as const,
  fontFamily: "monospace",
};
const smallTextStyle = { color: "#6B7280", fontSize: "13px", marginTop: "20px" };
const hrStyle = { borderColor: "#374151", marginTop: "32px" };
const footerStyle = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };
