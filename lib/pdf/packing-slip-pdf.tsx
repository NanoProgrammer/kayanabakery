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
    marginBottom: 6,
  },
  logo: {
    width: 58,
    height: 58,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #111111",
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 700,
  },
  fulfillmentBadge: {
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    backgroundColor: "#111111",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 8,
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
    fontSize: 10.5,
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
    minHeight: 36,
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
  fulfillmentType: "PICKUP" | "DELIVERY";
  customerName: string;
  customerPhone?: string | null;
  // For DELIVERY: the customer's delivery address.
  // For PICKUP: the bakery's own pickup address (siteSettings.pickupAddress).
  shippingAddress?: string | null;
  items: { name: string; quantity: number }[];
  note?: string | null;
  logoUrl: string;
};

export function PackingSlipPDF({ data }: { data: PackingSlipData }) {
  const isPickup = data.fulfillmentType === "PICKUP";

  return (
    <Document>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image src={data.logoUrl} style={styles.logo} />
        </View>

        {/* Order meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Order {data.orderNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 2 }]}>{data.date}</Text>
          </View>
          <Text style={styles.fulfillmentBadge}>
            {isPickup ? "Pickup" : "Delivery"}
          </Text>
        </View>

        {/* Billing address — contact info for the order */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Billing Address</Text>
          <Text style={styles.customerName}>{data.customerName}</Text>
          {data.customerPhone && (
            <Text style={styles.addressLine}>{data.customerPhone}</Text>
          )}
        </View>

        {/* Shipping address (delivery) or pickup location (our bakery) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            {isPickup ? "Pickup Location" : "Shipping Address"}
          </Text>
          <Text style={styles.customerName}>
            {isPickup ? "Karyana Ruiz Bakery" : data.customerName}
          </Text>
          {data.shippingAddress && (
            <Text style={styles.addressLine}>{data.shippingAddress}</Text>
          )}
          {!isPickup && data.customerPhone && (
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

        {/* Customer note — always shown, even blank, so there's room to
            write one by hand on the printed slip if there isn't one on file */}
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Customer note</Text>
          {data.note && <Text style={styles.noteText}>{data.note}</Text>}
        </View>

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
