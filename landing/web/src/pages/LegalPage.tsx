import { useTranslation } from "react-i18next";
import logoSrc from "@/assets/logo.png";

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="Flowboard" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-gray-800">Flowboard</span>
        </a>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Retour / Back
        </a>
      </div>
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

function LangBlock({ lang, children }: { lang: string; children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const active = i18n.language.startsWith(lang);
  return (
    <div className={active ? "block" : "hidden"}>
      {children}
    </div>
  );
}

export function TermsPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-2 flex gap-3">
          <button
            className={`text-xs font-medium ${isFr ? "text-indigo-600" : "text-gray-400"} hover:text-indigo-600`}
            onClick={() => i18n.changeLanguage("fr")}
          >
            Français
          </button>
          <span className="text-gray-300">|</span>
          <button
            className={`text-xs font-medium ${!isFr ? "text-indigo-600" : "text-gray-400"} hover:text-indigo-600`}
            onClick={() => i18n.changeLanguage("en")}
          >
            English
          </button>
        </div>

        {/* FRENCH */}
        <LangBlock lang="fr">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
          <p className="mb-10 text-sm text-gray-400">Dernière mise à jour : mai 2025</p>

          <Section title="1. Présentation du service">
            <p>Flowboard est une plateforme SaaS d'affichage dynamique éditée par <strong>Canope</strong> (contact : <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a>, site : <a href="https://canope.org" className="text-indigo-600 hover:underline">canope.org</a>). Le service est hébergé par Hostinger.</p>
            <p>Flowboard permet à ses clients de gérer des écrans d'affichage dynamique, des médias, des diaporamas et des comptes utilisateurs via une interface web.</p>
          </Section>

          <Section title="2. Accès au service">
            <p>L'accès à Flowboard est réservé aux personnes majeures disposant d'un compte valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.</p>
            <p>Canope se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU.</p>
          </Section>

          <Section title="3. Utilisation acceptable">
            <p>Il est interdit d'utiliser Flowboard pour diffuser des contenus illégaux, offensants, trompeurs ou portant atteinte aux droits de tiers. Tout reverse engineering, scraping ou tentative de contournement des mesures de sécurité est strictement interdit.</p>
          </Section>

          <Section title="4. Abonnement et paiement">
            <p>Les abonnements payants sont facturés mensuellement via Stripe. Le prix applicable est celui affiché au moment de la souscription. Aucun remboursement n'est accordé pour les périodes partielles en cours.</p>
            <p>En cas de non-paiement, Canope se réserve le droit de suspendre l'accès au service.</p>
          </Section>

          <Section title="5. Résiliation">
            <p>Vous pouvez résilier votre abonnement à tout moment. La résiliation prend effet à la fin de la période de facturation en cours. Vos données seront conservées pendant 12 mois après la résiliation, puis supprimées.</p>
          </Section>

          <Section title="6. Propriété intellectuelle">
            <p>Flowboard et l'ensemble de ses composants (code, interface, marque) sont la propriété exclusive de Canope. Vos contenus (médias, données) restent votre propriété. Vous accordez à Canope une licence limitée pour les traiter dans le cadre de la fourniture du service.</p>
          </Section>

          <Section title="7. Responsabilité">
            <p>Le service est fourni « tel quel », sans garantie de disponibilité continue. Canope n'est pas responsable des pertes de données, interruptions de service ou dommages indirects. La responsabilité de Canope est limitée aux sommes versées par le client au cours des 3 derniers mois.</p>
          </Section>

          <Section title="8. Modification des CGU">
            <p>Canope se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par e-mail ou via l'interface. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.</p>
          </Section>

          <Section title="9. Droit applicable">
            <p>Les présentes CGU sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux compétents du ressort de Canope.</p>
          </Section>

          <Section title="10. Contact">
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a></p>
          </Section>
        </LangBlock>

        {/* ENGLISH */}
        <LangBlock lang="en">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mb-10 text-sm text-gray-400">Last updated: May 2025</p>

          <Section title="1. About Flowboard">
            <p>Flowboard is a SaaS digital signage platform operated by <strong>Canope</strong> (contact: <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a>, website: <a href="https://canope.org" className="text-indigo-600 hover:underline">canope.org</a>). The service is hosted by Hostinger.</p>
            <p>Flowboard enables customers to manage digital signage screens, media, slideshows, and user accounts through a web interface.</p>
          </Section>

          <Section title="2. Access to the Service">
            <p>Access to Flowboard is restricted to adults with a valid account. You are responsible for keeping your credentials confidential and for all activity performed under your account.</p>
            <p>Canope reserves the right to suspend or terminate any account found to be in violation of these Terms.</p>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You may not use Flowboard to display illegal, offensive, misleading, or infringing content. Reverse engineering, scraping, or circumventing security measures is strictly prohibited.</p>
          </Section>

          <Section title="4. Subscription & Payment">
            <p>Paid plans are billed monthly through Stripe. The applicable price is the one displayed at the time of subscription. No refunds are issued for partial billing periods.</p>
            <p>In case of non-payment, Canope reserves the right to suspend access to the service.</p>
          </Section>

          <Section title="5. Cancellation">
            <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. Your data will be retained for 12 months after cancellation, then permanently deleted.</p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>Flowboard and all its components (code, interface, brand) are the exclusive property of Canope. Your content (media, data) remains yours. You grant Canope a limited licence to process it solely for the purpose of delivering the service.</p>
          </Section>

          <Section title="7. Disclaimer & Liability">
            <p>The service is provided "as is" without any guarantee of continuous availability. Canope is not liable for data loss, service interruptions, or indirect damages. Canope's total liability is limited to the amounts paid by the customer in the preceding 3 months.</p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>Canope may update these Terms at any time. Users will be notified by email or through the interface. Continued use of the service constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="9. Governing Law">
            <p>These Terms are governed by French law. Any dispute shall be submitted to the exclusive jurisdiction of the competent French courts.</p>
          </Section>

          <Section title="10. Contact">
            <p>For any questions regarding these Terms: <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a></p>
          </Section>
        </LangBlock>
      </main>
    </div>
  );
}

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-2 flex gap-3">
          <button
            className={`text-xs font-medium ${isFr ? "text-indigo-600" : "text-gray-400"} hover:text-indigo-600`}
            onClick={() => i18n.changeLanguage("fr")}
          >
            Français
          </button>
          <span className="text-gray-300">|</span>
          <button
            className={`text-xs font-medium ${!isFr ? "text-indigo-600" : "text-gray-400"} hover:text-indigo-600`}
            onClick={() => i18n.changeLanguage("en")}
          >
            English
          </button>
        </div>

        {/* FRENCH */}
        <LangBlock lang="fr">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="mb-10 text-sm text-gray-400">Dernière mise à jour : mai 2025</p>

          <Section title="1. Responsable du traitement">
            <p><strong>Canope</strong> — <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a> — <a href="https://canope.org" className="text-indigo-600 hover:underline">canope.org</a></p>
          </Section>

          <Section title="2. Données collectées">
            <p>Dans le cadre de l'utilisation de Flowboard, nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse e-mail et mot de passe hashé (création de compte)</li>
              <li>Médias et contenus que vous téléversez (images, vidéos)</li>
              <li>Données de navigation et d'utilisation (logs, événements analytics via PostHog)</li>
              <li>Informations de paiement traitées par Stripe (nous ne stockons pas vos données bancaires)</li>
            </ul>
          </Section>

          <Section title="3. Finalités et bases légales">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Exécution du contrat :</strong> fourniture du service, gestion de votre compte, facturation</li>
              <li><strong>Intérêt légitime :</strong> amélioration du service, analyses d'utilisation anonymisées (PostHog)</li>
              <li><strong>Consentement :</strong> cookies analytiques (vous pouvez refuser via les paramètres de votre navigateur)</li>
            </ul>
          </Section>

          <Section title="4. Durée de conservation">
            <p>Vos données sont conservées pendant toute la durée de votre abonnement, puis 12 mois après la résiliation ou suppression de votre compte, sauf obligation légale de conservation plus longue.</p>
          </Section>

          <Section title="5. Sous-traitants et tiers">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> (paiement) — données de facturation, certifié PCI-DSS — <a href="https://stripe.com/privacy" className="text-indigo-600 hover:underline">politique de confidentialité</a></li>
              <li><strong>PostHog</strong> (analytics) — serveurs EU, données pseudonymisées — <a href="https://posthog.com/privacy" className="text-indigo-600 hover:underline">politique de confidentialité</a></li>
              <li><strong>Hostinger</strong> (hébergement) — serveurs en Europe</li>
            </ul>
            <p>Aucun transfert de données vers des pays hors de l'Espace Économique Européen n'est effectué.</p>
          </Section>

          <Section title="6. Vos droits (RGPD)">
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de limitation du traitement</li>
            </ul>
            <p>Pour exercer ces droits, contactez-nous à <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a>. En cas de litige, vous pouvez saisir la <a href="https://www.cnil.fr" className="text-indigo-600 hover:underline">CNIL</a>.</p>
          </Section>

          <Section title="7. Cookies">
            <p>Flowboard utilise :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Des cookies de session (authentification) — nécessaires au fonctionnement</li>
              <li>Des cookies analytiques (PostHog) — pour améliorer le service. Vous pouvez les refuser dans les paramètres de votre navigateur.</li>
            </ul>
          </Section>

          <Section title="8. Modifications">
            <p>Cette politique peut être mise à jour. Toute modification substantielle sera notifiée par e-mail ou via l'interface.</p>
          </Section>

          <Section title="9. Contact">
            <p><a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a></p>
          </Section>
        </LangBlock>

        {/* ENGLISH */}
        <LangBlock lang="en">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mb-10 text-sm text-gray-400">Last updated: May 2025</p>

          <Section title="1. Data Controller">
            <p><strong>Canope</strong> — <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a> — <a href="https://canope.org" className="text-indigo-600 hover:underline">canope.org</a></p>
          </Section>

          <Section title="2. Data We Collect">
            <p>When using Flowboard, we collect the following data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address and hashed password (account creation)</li>
              <li>Media and content you upload (images, videos)</li>
              <li>Usage and navigation data (logs, analytics events via PostHog)</li>
              <li>Payment information processed by Stripe (we do not store your payment card details)</li>
            </ul>
          </Section>

          <Section title="3. Purpose & Legal Basis">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contract performance:</strong> service delivery, account management, billing</li>
              <li><strong>Legitimate interest:</strong> service improvement, anonymised usage analytics (PostHog)</li>
              <li><strong>Consent:</strong> analytics cookies (you may refuse via your browser settings)</li>
            </ul>
          </Section>

          <Section title="4. Retention">
            <p>Your data is retained for the duration of your subscription and for 12 months after cancellation or account deletion, unless a longer retention period is required by law.</p>
          </Section>

          <Section title="5. Sub-processors & Third Parties">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> (payments) — billing data, PCI-DSS certified — <a href="https://stripe.com/privacy" className="text-indigo-600 hover:underline">privacy policy</a></li>
              <li><strong>PostHog</strong> (analytics) — EU servers, pseudonymised data — <a href="https://posthog.com/privacy" className="text-indigo-600 hover:underline">privacy policy</a></li>
              <li><strong>Hostinger</strong> (hosting) — servers located in Europe</li>
            </ul>
            <p>No personal data is transferred outside the European Economic Area.</p>
          </Section>

          <Section title="6. Your Rights (GDPR)">
            <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Right of access to your data</li>
              <li>Right to rectification</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to restriction of processing</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a>. If you are in France, you may also file a complaint with the <a href="https://www.cnil.fr" className="text-indigo-600 hover:underline">CNIL</a>.</p>
          </Section>

          <Section title="7. Cookies">
            <p>Flowboard uses:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Session cookies (authentication) — required for the service to function</li>
              <li>Analytics cookies (PostHog) — to improve the service. You may refuse these in your browser settings.</li>
            </ul>
          </Section>

          <Section title="8. Changes">
            <p>This policy may be updated. Any material change will be notified by email or through the interface.</p>
          </Section>

          <Section title="9. Contact">
            <p><a href="mailto:support@canope.org" className="text-indigo-600 hover:underline">support@canope.org</a></p>
          </Section>
        </LangBlock>
      </main>
    </div>
  );
}
