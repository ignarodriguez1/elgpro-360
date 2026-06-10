import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface ReadyForPickupEmailProps {
  customerName: string;
  vehicleName: string;
  orderTitle: string;
}

export function ReadyForPickupEmail({
  customerName,
  vehicleName,
  orderTitle,
}: ReadyForPickupEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={logoStyle}>ELG PRO</Text>

          <Section style={contentStyle}>
            <Text style={headingStyle}>Tu vehículo está listo</Text>
            <Text style={textStyle}>Hola {customerName},</Text>
            <Text style={textStyle}>
              Te informamos que el trabajo en tu {vehicleName} finalizó y ya
              podés pasar a retirarlo.
            </Text>

            <Section style={detailBoxStyle}>
              <Text style={detailLabelStyle}>Trabajo realizado</Text>
              <Text style={detailValueStyle}>{orderTitle}</Text>
            </Section>

            <Text style={textStyle}>
              Coordiná el retiro comunicándote con nosotros o ingresando a tu
              portal de cliente.
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
const headingStyle = { color: "#22C55E", fontSize: "22px", fontWeight: "600" as const };
const textStyle = { color: "#B0B0B0", fontSize: "15px", lineHeight: "1.6" };
const detailBoxStyle = { backgroundColor: "#1F1F1F", borderRadius: "6px", padding: "20px", margin: "16px 0", borderLeft: "3px solid #22C55E" };
const detailLabelStyle = { color: "#6B7280", fontSize: "12px", textTransform: "uppercase" as const, margin: "0 0 4px 0" };
const detailValueStyle = { color: "#F5F5F5", fontSize: "17px", fontWeight: "600" as const, margin: "0" };
const hrStyle = { borderColor: "#374151", marginTop: "32px" };
const footerStyle = { color: "#6B7280", fontSize: "12px", textAlign: "center" as const };
