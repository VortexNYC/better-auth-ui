import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

export interface EmailLayoutProps {
  children: ReactNode;
  previewText?: string;
  brandName?: string;
  logoUrl?: string;
  brandColor?: string;
}

const defaultBrandColor = "#0052cc";

export function EmailLayout({
  children,
  previewText,
  brandName = "Vortex",
  logoUrl,
  brandColor = defaultBrandColor,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={{ backgroundColor: "#f6f7fb", margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {logoUrl ? (
            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Img
                src={logoUrl}
                alt={brandName}
                width="120"
                height="auto"
                style={{ margin: "0 auto" }}
              />
            </Section>
          ) : (
            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Text
                style={{
                  color: brandColor,
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {brandName}
              </Text>
            </Section>
          )}

          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            {children}
          </Section>

          <Text
            style={{
              color: "#6b7280",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
