"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function PrivacyPage() {
  const { locale } = useLocale();

  return (
    <div className="container-bakery py-16 md:py-20">
      <header className="mb-10 max-w-3xl">
        <span className="eyebrow">
          {locale === "es" ? "Legal" : "Legal"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "Política de Privacidad" : "Privacy Policy"}
        </h1>
        <p className="mt-2 text-xs text-ink-soft uppercase tracking-widest">
          {locale === "es" ? "Última actualización: Octubre 26, 2025" : "Last updated: October 26, 2025"}
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-ink-soft">
        <Section title={locale === "es" ? "1. Introducción" : "1. Introduction"}>
          {locale === "es"
            ? "Bienvenido a Karyana Bakery. Respetamos tu privacidad y estamos comprometidos a proteger tu información personal. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información cuando visitas nuestro sitio web y usas nuestros servicios."
            : "Welcome to Karyana Bakery. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services (including placing orders, creating an account, subscribing to our newsletter, etc.)."}
        </Section>

        <Section title={locale === "es" ? "2. Información que recopilamos" : "2. What Information We Collect"}>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{locale === "es" ? "Información de identificación personal" : "Personal identification information"}</strong>: {locale === "es" ? "nombre, correo electrónico, dirección de facturación/envío, teléfono, nombre de usuario y contraseña de cuenta." : "name, email address, billing/shipping address, phone number, account username & password when you create an account or place an order."}</li>
            <li><strong>{locale === "es" ? "Información de transacciones" : "Transaction information"}</strong>: {locale === "es" ? "detalles de tus compras, método de pago, historial de pedidos." : "details of your purchases, payment method, order history."}</li>
            <li><strong>{locale === "es" ? "Información de uso" : "Usage information"}</strong>: {locale === "es" ? "cómo interactúas con el Sitio, dirección IP, tipo de navegador, páginas visitadas." : "how you interact with the Site, IP address, browser type, pages visited, time spent."}</li>
            <li><strong>{locale === "es" ? "Preferencias de newsletter" : "Newsletter/marketing preferences"}</strong>: {locale === "es" ? "si te suscribes a nuestra lista de correos, registramos tu consentimiento y preferencias." : "if you subscribe to our mailing list, we record your consent and preferences."}</li>
            <li><strong>Cookies</strong>: {locale === "es" ? "usamos cookies y tecnologías similares para mejorar tu experiencia y analizar el uso." : "we use cookies and similar tools to enhance your experience, remember your settings, and analyze usage."}</li>
          </ul>
        </Section>

        <Section title={locale === "es" ? "3. Cómo usamos tu información" : "3. How We Use Your Information"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>{locale === "es" ? "Procesar y cumplir tus pedidos." : "Processing and fulfilling your orders."}</li>
            <li>{locale === "es" ? "Gestionar tu cuenta y soporte al cliente." : "Managing your account and providing customer support."}</li>
            <li>{locale === "es" ? "Mejorar nuestro Sitio, productos y servicios." : "Improving our Site, products and services."}</li>
            <li>{locale === "es" ? "Enviar correos promocionales o newsletters (solo con tu consentimiento)." : "Sending you promotional emails or newsletters (only if you've opted in)."}</li>
            <li>{locale === "es" ? "Asegurar la seguridad e integridad del Sitio." : "Ensuring the security and integrity of our Site."}</li>
          </ul>
        </Section>

        <Section title={locale === "es" ? "4. Divulgación de tu información" : "4. Disclosure of Your Information"}>
          {locale === "es"
            ? "Podemos compartir tu información con proveedores de servicios terceros de confianza (procesadores de pago, empresas de envío, plataformas de marketing por correo) bajo obligaciones de confidencialidad, si lo requiere la ley, o en caso de una transferencia de negocio."
            : "We may share your information with trusted third-party service providers under confidentiality obligations, if required by law, or in the event of a business transfer."}
        </Section>

        <Section title={locale === "es" ? "5. Cookies y seguimiento" : "5. Cookies and Tracking"}>
          {locale === "es"
            ? "Usamos cookies para funcionalidad, análisis y marketing. Puedes deshabilitarlas en tu navegador, aunque esto puede afectar algunas funciones del Sitio."
            : "We use cookies and similar technologies for functionality, analytics, and marketing. You may choose to disable cookies via your browser settings, though this may affect your ability to use some features."}
        </Section>

        <Section title={locale === "es" ? "6. Tus derechos" : "6. Your Rights"}>
          {locale === "es"
            ? "Dependiendo de tu jurisdicción, puedes tener derechos para acceder, corregir, actualizar o solicitar la eliminación de tu información personal. Contáctanos en hello@karyanabakery.ca para ejercer estos derechos."
            : "Depending on your jurisdiction, you may have rights to access, correct, update, or request deletion of your personal information. Contact us at hello@karyanabakery.ca to exercise any of these rights."}
        </Section>

        <Section title={locale === "es" ? "7. Seguridad de datos" : "7. Data Security"}>
          {locale === "es"
            ? "Implementamos medidas técnicas y organizativas razonables para proteger tu información personal. Sin embargo, ninguna transmisión por internet o sistema de almacenamiento puede garantizar 100% de seguridad."
            : "We implement reasonable technical and organisational measures to protect your personal information. However, no internet transmission or storage system can guarantee 100% security."}
        </Section>

        <Section title={locale === "es" ? "8. Privacidad infantil" : "8. Children's Privacy"}>
          {locale === "es"
            ? "Nuestro Sitio no está dirigido a menores de 10 años. No recopilamos intencionalmente información personal de niños sin el consentimiento de los padres."
            : "Our Site is not directed to individuals under the age of 10. We do not knowingly collect personal information from children without parental consent."}
        </Section>

        <Section title={locale === "es" ? "9. Cambios a esta Política" : "9. Changes to this Privacy Policy"}>
          {locale === "es"
            ? "Podemos actualizar esta política en cualquier momento. La fecha en la parte superior reflejará la revisión más reciente."
            :  'We may update this policy from time to time. The "Last updated" date at the top will reflect the most recent revision.'}
        </Section>

        <Section title={locale === "es" ? "10. Contacto" : "10. Contact Us"}>
          {locale === "es"
            ? "Si tienes preguntas o inquietudes sobre esta Política de Privacidad, contáctanos en:"
            : "If you have any questions or concerns about this Privacy Policy, please contact us at:"}
          <br />
          <a href="mailto:hello@karyanabakery.ca" className="text-canela-dark underline">
            hello@karyanabakery.ca
          </a>
        </Section>
      </div>

      <div className="mt-12 flex gap-4 justify-center">
        <Link href="/terms" className="btn-ghost text-xs">
          {locale === "es" ? "Términos y condiciones" : "Terms & Conditions"}
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
