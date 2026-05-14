/**
 * Karyana invoice PDF generator using @react-pdf/renderer.
 * Branded with rosa/dorado palette and logo.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#2B2B2B",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottom: "2px solid #FBB7C5",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#2B2B2B",
  },
  tagline: {
    fontSize: 9,
    color: "#F79BB0",
    fontStyle: "italic",
    marginTop: 2,
  },
  invoiceMeta: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 24,
    color: "#D4AF37",
    fontWeight: 700,
  },
  invoiceNumber: {
    fontSize: 10,
    marginTop: 4,
    color: "#777",
  },
  // Sections
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
  },
  col: {
    flex: 1,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  // Items table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FDE4EA",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
  },
  th: {
    fontSize: 9,
    fontWeight: 700,
    color: "#2B2B2B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  thItem: { flex: 4 },
  thQty: { flex: 1, textAlign: "center" },
  thPrice: { flex: 1, textAlign: "right" },
  thTotal: { flex: 1, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: "0.5px solid #FDE4EA",
  },
  td: { fontSize: 10 },
  tdItem: { flex: 4 },
  tdQty: { flex: 1, textAlign: "center" },
  tdPrice: { flex: 1, textAlign: "right" },
  tdTotal: { flex: 1, textAlign: "right", fontWeight: 700 },
  // Totals
  totalsBox: {
    marginTop: 16,
    marginLeft: "auto",
    width: 240,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  discountText: { color: "#F79BB0", fontWeight: 700 },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FBB7C5",
    borderRadius: 6,
    marginTop: 8,
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 700, color: "#2B2B2B" },
  grandTotalValue: { fontSize: 14, fontWeight: 700, color: "#2B2B2B" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTop: "0.5px solid #FDE4EA",
    fontSize: 8,
    color: "#777",
    textAlign: "center",
  },
});

export type InvoiceData = {
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  fulfillmentType: "PICKUP" | "DELIVERY";
  fulfillmentDetail: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
  items: { name: string; quantity: number; price: string; lineTotal: string }[];
  subtotal: string;
  couponDiscount?: string | null;
  couponCode?: string | null;
  pointsDiscount?: string | null;
  deliveryFee: string;
  gst: string;
  total: string;
  logoUrl: string;
};

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={data.logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.brandText}>Karyana Ruiz Bakery</Text>
              <Text style={styles.tagline}>
                More than bread, a home memory
              </Text>
            </View>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.orderNumber}</Text>
            <Text style={styles.invoiceNumber}>{data.date}</Text>
          </View>
        </View>

        {/* Customer + Fulfillment */}
        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill to</Text>
            <Text style={styles.customerName}>{data.customerName}</Text>
            <Text>{data.customerEmail}</Text>
            {data.customerPhone && <Text>{data.customerPhone}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>
              {data.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              {data.fulfillmentDetail}
            </Text>
            {data.address && (
              <>
                <Text>{data.address.street}</Text>
                <Text>
                  {data.address.city}, {data.address.province}{" "}
                  {data.address.postalCode}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order details</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thItem]}>Item</Text>
            <Text style={[styles.th, styles.thQty]}>Qty</Text>
            <Text style={[styles.th, styles.thPrice]}>Price</Text>
            <Text style={[styles.th, styles.thTotal]}>Total</Text>
          </View>
          {data.items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.tdItem]}>{it.name}</Text>
              <Text style={[styles.td, styles.tdQty]}>{it.quantity}</Text>
              <Text style={[styles.td, styles.tdPrice]}>{it.price}</Text>
              <Text style={[styles.td, styles.tdTotal]}>{it.lineTotal}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{data.subtotal}</Text>
          </View>
          {data.couponDiscount && (
            <View style={styles.totalRow}>
              <Text style={styles.discountText}>
                Coupon ({data.couponCode})
              </Text>
              <Text style={styles.discountText}>−{data.couponDiscount}</Text>
            </View>
          )}
          {data.pointsDiscount && (
            <View style={styles.totalRow}>
              <Text style={styles.discountText}>Points</Text>
              <Text style={styles.discountText}>−{data.pointsDiscount}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>Delivery</Text>
            <Text>{data.deliveryFee}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>GST (5%)</Text>
            <Text>{data.gst}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{data.total}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Karyana Ruiz Bakery · Calgary, AB · hola@karyanabakery.ca
          </Text>
          <Text style={{ marginTop: 4 }}>
            Thank you for supporting handmade Mexican bakery in Calgary.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
