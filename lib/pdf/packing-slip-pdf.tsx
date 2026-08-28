/**
 * Karyana packing slip PDF generator using @react-pdf/renderer.
 * Kitchen/packing document — no prices, just what to pack, for whom, and
 * any customer note. Sized for 4x6 label/receipt paper, so it's a compact
 * single-column layout, not a side-by-side Billing/Shipping invoice layout.
 */

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// 4in x 6in at 72pt/in
const PAGE_WIDTH = 4 * 72;
const PAGE_HEIGHT = 6 * 72;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#111111",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #111111",
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 700,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#777777",
    marginBottom: 3,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  noteBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#FFF8E5",
    border: "1px solid #D4AF37",
    borderRadius: 4,
  },
  noteLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#B8860B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111111",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  thProduct: { flex: 4 },
  thQty: { flex: 1, textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: "0.5px solid #E5E5E5",
  },
  td: { fontSize: 9 },
  tdProduct: { flex: 4, fontWeight: 700 },
  tdQty: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700 },
  footer: {
    marginTop: "auto",
    textAlign: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
});

export type PackingSlipData = {
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    buzzer?: string | null;
  } | null;
  items: { name: string; quantity: number }[];
  note?: string | null;
  logoUrl: string;
};

export function PackingSlipPDF({ data }: { data: PackingSlipData }) {
  return (
    <Document>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image src={data.logoUrl} style={styles.logo} />
        </View>

        {/* Order meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Order {data.orderNumber}</Text>
          <Text style={styles.metaLabel}>{data.date}</Text>
        </View>

        {/* Ship to — one address block, not duplicated Billing/Shipping columns */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Ship to</Text>
          <Text style={styles.customerName}>{data.customerName}</Text>
          {data.address && (
            <>
              <Text style={styles.addressLine}>
                {data.address.street}
                {data.address.buzzer ? ` (Buzzer: ${data.address.buzzer})` : ""}
              </Text>
              <Text style={styles.addressLine}>
                {data.address.city} {data.address.province}{" "}
                {data.address.postalCode}
              </Text>
            </>
          )}
          {data.customerPhone && (
            <Text style={styles.addressLine}>{data.customerPhone}</Text>
          )}
        </View>

        {/* Items — quantities only, no pricing */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thProduct]}>Product</Text>
            <Text style={[styles.th, styles.thQty]}>Qty</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.tdProduct]}>{it.name}</Text>
              <Text style={styles.tdQty}>{it.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Customer note — the reason this exists separately from the invoice */}
        {data.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Customer note</Text>
            <Text style={styles.noteText}>{data.note}</Text>
          </View>
        )}

        {/* Footer tagline */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            WE HOPE OUR BREAD MAKE YOU FEEL LIKE IN MEXICO :)
          </Text>
        </View>
      </Page>
    </Document>
  );
}
