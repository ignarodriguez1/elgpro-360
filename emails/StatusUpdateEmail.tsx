import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface StatusUpdateEmailProps {
  customerName: string;
  vehicleName: string;
  updateTitle: string;
  updateDescription?: string | null;
  orderTitle: string;
}

export function StatusUpdateEmail({
  customerName,
  vehicleName,
  updateTitle,
  updateDescription,
  orderTitle,
}: StatusUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={logoStyle}>ELG PRO</Text>

          <Section style={contentStyle}>
            <Text style={headingStyle}>Nueva actualización</Text>
            <Text style={textStyle}>Hola {customerName},</Text>
            <Text style={textStyle}>
              Hay una novedad sobre el trabajo en tu {vehicleName}:
            </Text>

            <Section style={updateBoxStyle}>
              <Text style={updateTitleStyle}>{updateTitle}</Text>
              <Text style={orderTitleStyle}>{orderTitle}</Text>
              {updateDescription && (
                <Text style={textStyle}>{updateDescription}</Text>
              )}
            </Section>

            <Text style={smallTextStyle}>
              Ingresá a tu portal de cliente para ver el detalle completo.
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
const updateBoxStyle = { backgroundColor: "#1F1F1F", borderRadius: "6px", padding: "20px", margin: "16px 0", borderLeft: "3px solid #C41E2A" };
const updateTitleStyle = { color: "#F5F5F5", fontSize: "17px", fontWeight: "600" as const, margin: "0 0 4px 0" };
const orderTitleStyle = { color: "#6B7280", fontSize: "13px", margin: "0 0 12px 0" };
const smallTextStyle = { color: "#6B7280", fontSize: "13px", marginTop: "20px" };
const hrStyle = { borderColor: "#374151", marginTop: "32px" };
const footerStyle = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };
