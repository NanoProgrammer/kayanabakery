// Shared inline styles for all Karyana email templates
// Karyana brand: rosa (#FBB7C5), cream (#FFF5F7), dorado (#D4AF37), ink (#2B2B2B)

export const styles = {
  body: {
    backgroundColor: "#FFF5F7",
    fontFamily: "system-ui, -apple-system, sans-serif",
    margin: 0,
    padding: 0,
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px 16px",
  },
  header: {
    textAlign: "center" as const,
    paddingBottom: 16,
  },
  tagline: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic" as const,
    fontSize: 14,
    color: "#FBB7C5",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
  },
  h1: {
    fontSize: 32,
    fontWeight: 700,
    color: "#2B2B2B",
    margin: "0 0 8px",
    fontFamily: "Georgia, serif",
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    color: "#777",
    margin: "24px 0 12px",
  },
  body1: {
    fontSize: 16,
    color: "#777",
    margin: "0 0 24px",
  },
  hr: { border: 0, borderTop: "1px solid #FDE4EA", margin: "16px 0" },
  button: {
    backgroundColor: "#FBB7C5",
    color: "#2B2B2B",
    padding: "14px 28px",
    borderRadius: 9999,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-block",
  },
  goldButton: {
    backgroundColor: "#D4AF37",
    color: "#FFFFFF",
    padding: "14px 28px",
    borderRadius: 9999,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-block",
  },
  footer: { textAlign: "center" as const, marginTop: 32 },
  footerText: { fontSize: 11, color: "#777", margin: 0 },
  pinkBox: {
    backgroundColor: "#FDE4EA",
    borderRadius: 12,
    padding: 16,
    margin: "16px 0",
  },
  goldBox: {
    backgroundColor: "#FFF8E5",
    borderRadius: 12,
    padding: 16,
    margin: "16px 0",
    border: "1px solid #D4AF37",
  },
};
