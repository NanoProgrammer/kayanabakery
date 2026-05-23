"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function TermsPage() {
  const { locale } = useLocale();

  return (
    <div className="container-bakery py-16 md:py-20">
      <header className="mb-10 max-w-3xl">
        <span className="eyebrow">
          {locale === "es" ? "Legal" : "Legal"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "Términos y Condiciones" : "Terms & Conditions"}
        </h1>
        <p className="mt-2 text-xs text-ink-soft uppercase tracking-widest">
          {locale === "es" ? "Última actualización: Octubre 26, 2025" : "Last updated: October 26, 2025"}
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title={locale === "es" ? "1. Aceptación de términos" : "1. Acceptance of Terms"}>
          {locale === "es"
            ? "Al acceder o usar el Sitio, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con todos estos Términos, no debes acceder ni usar el Sitio."
            : "By accessing or using the Site, you agree to be bound by these Terms & Conditions. If you do not agree with all of these Terms, you must not access or use the Site."}
        </Section>

        <Section title={locale === "es" ? "2. Uso del Sitio" : "2. Use of the Site"}>
          {locale === "es"
            ? "Aceptas usar el Sitio solo para fines legales y de una manera que no infrinja los derechos de, restrinja o inhiba el uso del Sitio por parte de cualquier otra persona. No debes intentar interferir o dañar ninguna parte del Sitio."
            : "You agree to use the Site only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use of the Site. You must not attempt to interfere with or damage any part of the Site."}
        </Section>

        <Section title={locale === "es" ? "3. Pedidos y pago" : "3. Orders and Payment"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {locale === "es"
                ? "Al realizar un pedido, aceptas que la información que proporcionas es precisa y completa."
                : "When you place an order, you agree that the information you provide is accurate and complete."}
            </li>
            <li>
              {locale === "es"
                ? "Nos reservamos el derecho de aceptar o rechazar tu pedido por cualquier motivo."
                : "We reserve the right to accept or decline your order for any reason (e.g., product availability, errors in pricing or product description)."}
            </li>
            <li>
              {locale === "es"
                ? "El pago debe realizarse al momento de ordenar, salvo acuerdo previo."
                : "Payment must be made at the time of ordering, unless otherwise agreed."}
            </li>
            <li>
              {locale === "es"
                ? "Los precios están sujetos a cambio sin previo aviso. Se te cobrará el precio vigente al momento de tu pedido."
                : "Prices listed on the Site are subject to change without notice. We will charge you the price listed at the time you place your order."}
            </li>
          </ul>
        </Section>

        <Section title={locale === "es" ? "4. Envío y entrega" : "4. Delivery and Shipping"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {locale === "es"
                ? "Haremos esfuerzos razonables para entregar los productos dentro de los plazos estimados, pero pueden ocurrir retrasos."
                : "We will make reasonable efforts to deliver products within the estimated time frames, but delays may occur."}
            </li>
            <li>
              {locale === "es"
                ? "El riesgo pasa a ti cuando los productos son entregados en la dirección de envío que proporcionaste."
                : "Risk passes to you when products are delivered to the shipping address you provided. It is your responsibility to ensure deliveries are accepted."}
            </li>
            <li>
              {locale === "es"
                ? "No somos responsables de pérdidas o daños resultantes de tu falla en aceptar la entrega."
                : "We are not liable for losses or damages resulting from your failure to accept delivery."}
            </li>
          </ul>
        </Section>

        <Section title={locale === "es" ? "5. Devoluciones, reembolsos y cancelaciones" : "5. Returns, Refunds and Cancellations"}>
          {locale === "es"
            ? "Si crees que hay un problema con tu pedido (defecto, artículo incorrecto, daño en tránsito), debes contactarnos el mismo día de la entrega."
            : "If you believe there is an issue with your order (defect, incorrect item, damage in transit), you must contact us within the same day of delivery."}
        </Section>

        <Section title={locale === "es" ? "6. Propiedad intelectual" : "6. Intellectual Property Rights"}>
          {locale === "es"
            ? "Todo el contenido del Sitio (texto, gráficos, logotipos, imágenes, software) es propiedad o está bajo licencia nuestra y está protegido por las leyes de derechos de autor canadienses e internacionales. No puedes reproducir, distribuir ni crear obras derivadas sin nuestro consentimiento expreso."
            : "All content on the Site (text, graphics, logos, images, software) is owned or licensed by us and is protected by Canadian and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express consent."}
        </Section>

        <Section title={locale === "es" ? "7. Limitación de responsabilidad" : "7. Limitations of Liability"}>
          {locale === "es"
            ? "En la máxima medida permitida por la ley, no garantizamos que el Sitio estará ininterrumpido o libre de errores. No somos responsables de daños indirectos, consecuentes o especiales derivados de tu uso del Sitio o productos comprados a través del Sitio."
            : "To the maximum extent permitted by law, we do not guarantee the Site will be uninterrupted or error-free. We are not liable for indirect, consequential or special damages arising from your use of the Site or products purchased through the Site."}
        </Section>

        <Section title={locale === "es" ? "8. Indemnización" : "8. Indemnification"}>
          {locale === "es"
            ? "Aceptas indemnizar y mantener libre de responsabilidad a Karyana Bakery, sus funcionarios, directores, empleados y agentes de cualquier reclamo, responsabilidad, daño, pérdida y gasto que surja de tu uso del Sitio."
            : "You agree to indemnify, defend and hold harmless Karyana Bakery, its officers, directors, employees and agents from and against any claims, liabilities, damages, losses and expenses arising from your use of the Site, your violation of these Terms, or your infringement of any rights of a third party."}
        </Section>

        <Section title={locale === "es" ? "9. Ley aplicable" : "9. Governing Law"}>
          {locale === "es"
            ? "Estos Términos se regirán por las leyes de la Provincia de Alberta y las leyes federales de Canadá aplicables. Aceptas someterte a la jurisdicción exclusiva de los tribunales de Alberta."
            : "These Terms shall be governed by and construed in accordance with the laws of the Province of Alberta and the federal laws of Canada applicable therein. You agree to submit to the exclusive jurisdiction of the courts of Alberta."}
        </Section>

        <Section title={locale === "es" ? "10. Cambios a estos Términos" : "10. Changes to these Terms"}>
          {locale === "es"
            ? "Podemos revisar estos Términos en cualquier momento. Tu uso continuado del Sitio después de dichos cambios constituye tu aceptación de los Términos revisados."
            : "We may revise these Terms at any time. The "Last updated" date at the top will reflect when changes were made. Your continued use of the Site after such changes constitutes your acceptance of the revised Terms."}
        </Section>

        <Section title={locale === "es" ? "11. Contacto" : "11. Contact Us"}>
          {locale === "es"
            ? "Si tienes preguntas sobre estos Términos, contáctanos en:"
            : "If you have any questions about these Terms, please contact us at:"}
          <br />
          <a href="mailto:hello@karyanabakery.ca" className="text-canela-dark underline">
            hello@karyanabakery.ca
          </a>
        </Section>
      </div>

      <div className="mt-12 flex gap-4 justify-center">
        <Link href="/privacy" className="btn-ghost text-xs">
          {locale === "es" ? "Política de privacidad" : "Privacy Policy"}
        </Link>
        <Link href="/cake-terms" className="btn-ghost text-xs">
          {locale === "es" ? "Términos de pasteles" : "Cake Order Terms"}
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg text-ink mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
