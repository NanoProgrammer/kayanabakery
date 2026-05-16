import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "");

export const FROM_EMAIL =
  process.env.FROM_EMAIL || "Karyana Bakery <hola@karyanabakery.ca>";

export const OWNER_EMAIL =
  process.env.OWNER_EMAIL || "hola@karyanabakery.ca";