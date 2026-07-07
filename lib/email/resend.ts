import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "");

export const FROM_EMAIL =
  process.env.FROM_EMAIL || "Karyana Bakery <hola@karyanabakery.ca>";

// General inquiries / contact form
export const OWNER_EMAIL =
  process.env.OWNER_EMAIL || "hello@karyanabakery.ca";

// Order confirmations / receipts
export const ORDERS_EMAIL =
  process.env.ORDERS_EMAIL || "orders@karyanabakery.ca";