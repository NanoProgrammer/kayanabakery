import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type Item = {
  name: string;
  quantity: number;
  price: number;
};

type Props = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: Item[];
  subtotal: number;
  total: number;
  createdAt: Date;
  fulfillmentType: string;
  pickupDate?: Date | null;
  pickupTime?: string | null;
  notes?: string | null;
  address?: any;
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FBF6EE",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: "1 solid #6B4423",
  },
  brand: { flexDirection: "column" },
  brandName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#6B4423",
    letterSpacing: -0.5,
  },
  brandTag: { fontSize: 11, color: "#D64545", marginTop: 2, fontStyle: "italic" },
  meta: { textAlign: "right" },
  metaLabel: {
    fontSize: 8,
    color: "#6B4423",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: { fontSize: 14, color: "#2B1810", marginTop: 2, marginBottom: 6 },
  invoiceTitle: {
    fontSize: 24,
    color: "#2B1810",
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },

  twoCol: { flexDirection: "row", gap: 24, marginBottom: 24 },
  col: { flex: 1 },
  sectionLabel: {
    fontSize: 8,
    color: "#6B4423",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  sectionText: { fontSize: 11, color: "#2B1810", lineHeight: 1.5 },

  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #6B4423",
    paddingBottom: 8,
    marginBottom: 8,
    marginTop: 16,
  },
  thDesc: {
    flex: 3,
    fontSize: 9,
    color: "#6B4423",
    letterSpacing: 1.2,
    fontFamily: "Helvetica-Bold",
  },
  thQty: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    color: "#6B4423",
    letterSpacing: 1.2,
    fontFamily: "Helvetica-Bold",
  },
  thPrice: {
    flex: 1,
    textAlign: "right",
    fontSize: 9,
    color: "#6B4423",
    letterSpacing: 1.2,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "0.5 solid #E4D7C3",
  },
  rDesc: { flex: 3, fontSize: 11, color: "#2B1810" },
  rQty: { flex: 1, textAlign: "center", fontSize: 11, color: "#2B1810" },
  rPrice: { flex: 1, textAlign: "right", fontSize: 11, color: "#2B1810" },

  totals: {
    marginTop: 16,
    marginLeft: "auto",
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 11, color: "#4A3428" },
  totalValue: { fontSize: 11, color: "#2B1810" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1 solid #6B4423",
  },
  grandLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#2B1810" },
  grandValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#6B4423" },

  notes: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#F3EADB",
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 8,
    color: "#6B4423",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notesText: { fontSize: 10, color: "#2B1810" },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#4A3428",
    fontStyle: "italic",
  },
});

export function InvoicePdf({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  subtotal,
  total,
  createdAt,
  fulfillmentType,
  pickupDate,
  pickupTime,
  notes,
  address,
}: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>Karyana</Text>
            <Text style={styles.brandTag}>bakery · est. 2018</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>ORDER #</Text>
            <Text style={styles.metaValue}>{orderNumber}</Text>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>
              {createdAt.toLocaleDateString("en-CA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.invoiceTitle}>Invoice / Bill of Lading</Text>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>BILL TO</Text>
            <Text style={styles.sectionText}>
              {customerName}
              {"\n"}
              {customerEmail}
              {customerPhone && `\n${customerPhone}`}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>
              {fulfillmentType === "PICKUP" ? "PICKUP" : "DELIVERY"}
            </Text>
            <Text style={styles.sectionText}>
              {pickupDate &&
                pickupDate.toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              {pickupTime && `\n${pickupTime}`}
              {address &&
                `\n${address.line1}${
                  address.line2 ? ", " + address.line2 : ""
                }\n${address.city}, ${address.province} ${address.postalCode}`}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.thDesc}>DESCRIPTION</Text>
          <Text style={styles.thQty}>QTY</Text>
          <Text style={styles.thPrice}>AMOUNT</Text>
        </View>

        {items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rDesc}>{item.name}</Text>
            <Text style={styles.rQty}>{item.quantity}</Text>
            <Text style={styles.rPrice}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              ${(subtotal / 100).toFixed(2)}
            </Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>${(total / 100).toFixed(2)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Thank you · Karyana Bakery · Calgary, AB · More than bread, a home
          memory.
        </Text>
      </Page>
    </Document>
  );
}

export default InvoicePdf;
