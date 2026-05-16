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

function LangSwitcher() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  return (
    <div className="mb-8 flex gap-3">
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
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-sm font-semibold text-gray-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function LangBlock({ lang, children }: { lang: string; children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const active = i18n.language.startsWith(lang);
  return <div className={active ? "block" : "hidden"}>{children}</div>;
}

const link = "text-indigo-600 hover:underline";

// ─────────────────────────────────────────────────────────────────────────────
// TERMS OF SERVICE (CGU/CGV)
// ─────────────────────────────────────────────────────────────────────────────
export function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LangSwitcher />

        {/* ── FRANÇAIS ── */}
        <LangBlock lang="fr">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Conditions Générales d'Utilisation et de Vente
          </h1>
          <p className="mb-10 text-sm text-gray-400">Dernière mise à jour : 16 mai 2026</p>

          <Section title="1. Objet">
            <p>
              Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU ») ont pour
              objet de définir les modalités et conditions dans lesquelles :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                l'utilisateur (ci-après « l'Utilisateur ») peut accéder au service flowboard
                (ci-après « le Service »), accessible à l'adresse{" "}
                <a href="https://flowboard.canope.org" className={link}>
                  https://flowboard.canope.org
                </a>{" "}
                ;
              </li>
              <li>l'Utilisateur peut souscrire un abonnement payant au Service.</li>
            </ul>
            <p>
              Le Service est édité par la société <strong>Canope</strong>, SASU au capital de 500 euros,
              dont le siège social est situé 21 rue Guérin, 95430 Auvers-sur-Oise, France, immatriculée
              au RCS de Pontoise sous le numéro 990 246 589 (ci-après « l'Éditeur »).
            </p>
            <p>
              Contact :{" "}
              <a href="mailto:support@canope.org" className={link}>
                support@canope.org
              </a>
            </p>
          </Section>

          <Section title="2. Acceptation des CGU">
            <p>
              L'utilisation du Service implique l'acceptation pleine et entière des présentes CGU par
              l'Utilisateur. Cette acceptation est matérialisée lors de la création du compte par le fait
              de cocher la case prévue à cet effet.
            </p>
            <p>
              Les CGU applicables sont celles en vigueur à la date de connexion et d'utilisation du
              Service par l'Utilisateur.
            </p>
          </Section>

          <Section title="3. Description du Service">
            <p>
              flowboard est un service en ligne (SaaS – Software as a Service) d'affichage dynamique,
              permettant à l'Utilisateur de créer, gérer et diffuser des contenus visuels sur un ou
              plusieurs écrans connectés.
            </p>
            <p>
              L'Éditeur se réserve le droit de faire évoluer le Service, ses fonctionnalités et son
              interface à tout moment.
            </p>
          </Section>

          <Section title="4. Création de compte">
            <p>
              L'accès au Service nécessite la création d'un compte utilisateur. L'Utilisateur s'engage à :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>fournir des informations exactes, complètes et à jour lors de son inscription ;</li>
              <li>maintenir la confidentialité de ses identifiants de connexion ;</li>
              <li>
                informer sans délai l'Éditeur de toute utilisation non autorisée de son compte.
              </li>
            </ul>
            <p>
              L'Utilisateur est seul responsable de toutes les actions effectuées depuis son compte. La
              création de compte est réservée aux personnes physiques majeures et aux personnes morales
              agissant via un représentant légal.
            </p>
          </Section>

          <Section title="5. Tarifs et abonnement">
            <SubSection title="5.1 Essai gratuit">
              <p>
                Le Service propose un essai gratuit dont les conditions (durée, fonctionnalités incluses)
                sont précisées sur la page de souscription. À l'issue de la période d'essai, l'abonnement
                bascule automatiquement en abonnement payant, sauf résiliation préalable par l'Utilisateur.
              </p>
            </SubSection>
            <SubSection title="5.2 Tarifs">
              <p>
                Les tarifs du Service sont indiqués en euros, toutes taxes comprises (TTC), sur la page de
                souscription du Site. Ils peuvent être modifiés à tout moment par l'Éditeur ; les nouveaux
                tarifs ne s'appliqueront qu'aux abonnements souscrits ou renouvelés postérieurement à la
                modification.
              </p>
            </SubSection>
            <SubSection title="5.3 Modalités de paiement">
              <p>
                Le paiement est effectué exclusivement par carte bancaire via le prestataire{" "}
                <strong>Stripe</strong>. Aucune donnée bancaire n'est conservée par l'Éditeur.
                L'abonnement est facturé de manière récurrente (mensuelle ou annuelle, selon la formule
                choisie) et renouvelé tacitement à chaque échéance.
              </p>
            </SubSection>
            <SubSection title="5.4 Défaut de paiement">
              <p>
                En cas de défaut de paiement, l'Éditeur se réserve le droit de suspendre l'accès au
                Service après notification à l'Utilisateur, jusqu'à régularisation.
              </p>
            </SubSection>
          </Section>

          <Section title="6. Droit de rétractation">
            <p>
              Conformément à l'article L.221-28 du Code de la consommation, le consommateur (Utilisateur
              agissant à des fins n'entrant pas dans le cadre de son activité professionnelle) renonce
              expressément à son droit de rétractation dès lors que l'exécution du Service a commencé
              avec son accord exprès et après qu'il a reconnu perdre son droit de rétractation. Cet
              accord est recueilli au moment de la souscription.
            </p>
            <p>Pour les Utilisateurs professionnels, le droit de rétractation ne s'applique pas.</p>
          </Section>

          <Section title="7. Résiliation">
            <SubSection title="7.1 Résiliation à l'initiative de l'Utilisateur">
              <p>
                L'Utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La
                résiliation prend effet à la fin de la période d'abonnement en cours, déjà payée. Aucun
                remboursement au prorata ne sera effectué.
              </p>
            </SubSection>
            <SubSection title="7.2 Résiliation à l'initiative de l'Éditeur">
              <p>
                L'Éditeur se réserve le droit de suspendre ou résilier le compte d'un Utilisateur, sans
                préavis ni indemnité, en cas de manquement grave aux présentes CGU, notamment en cas
                d'utilisation frauduleuse du Service, de défaut de paiement, ou d'utilisation contraire à
                la loi.
              </p>
            </SubSection>
            <SubSection title="7.3 Effets de la résiliation">
              <p>
                À la résiliation, l'accès au Service est désactivé. Les données de l'Utilisateur peuvent
                être conservées pendant une durée maximale de 30 jours afin de permettre leur récupération
                sur demande, puis sont définitivement supprimées, sous réserve des durées de conservation
                imposées par la loi.
              </p>
            </SubSection>
          </Section>

          <Section title="8. Obligations de l'Utilisateur">
            <p>
              L'Utilisateur s'engage à utiliser le Service conformément à sa destination, aux présentes
              CGU, à la législation en vigueur et aux bonnes mœurs. Il s'interdit notamment :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>de porter atteinte aux droits de tiers (propriété intellectuelle, vie privée, etc.) ;</li>
              <li>
                de diffuser des contenus illicites, injurieux, diffamatoires ou contraires à l'ordre
                public ;
              </li>
              <li>
                de tenter de compromettre la sécurité du Service (intrusion, déni de service, injection,
                etc.) ;
              </li>
              <li>d'utiliser le Service à des fins de spam ou de prospection non sollicitée ;</li>
              <li>de revendre l'accès au Service ou d'en faire un usage commercial non autorisé.</li>
            </ul>
          </Section>

          <Section title="9. Propriété intellectuelle">
            <p>
              L'ensemble des éléments du Service (logiciels, interfaces, marques, logos, textes, base de
              données) sont la propriété exclusive de l'Éditeur. L'Éditeur concède à l'Utilisateur un
              droit personnel, non exclusif et non transférable d'utilisation du Service pour la durée de
              son abonnement.
            </p>
            <p>
              L'Utilisateur conserve la propriété pleine et entière des contenus qu'il publie sur le
              Service. Il concède toutefois à l'Éditeur une licence non exclusive d'hébergement et de
              traitement strictement nécessaire à la fourniture du Service.
            </p>
          </Section>

          <Section title="10. Disponibilité du Service">
            <p>
              L'Éditeur s'efforce d'assurer une disponibilité du Service 24h/24 et 7j/7. Toutefois, il
              ne saurait être tenu responsable d'interruptions liées à des opérations de maintenance, à
              des cas de force majeure, ou à des défaillances du réseau Internet ou de l'hébergeur.
            </p>
          </Section>

          <Section title="11. Responsabilité">
            <p>
              Le Service est fourni « en l'état ». L'Éditeur ne saurait garantir que le Service répondra
              à toutes les attentes de l'Utilisateur ou qu'il sera exempt d'erreurs.
            </p>
            <p>
              La responsabilité de l'Éditeur est limitée aux dommages directs subis par l'Utilisateur et
              résultant directement d'un manquement de l'Éditeur. Sauf disposition légale impérative
              contraire, le montant total de la responsabilité de l'Éditeur ne pourra excéder le montant
              des sommes effectivement versées par l'Utilisateur au cours des 12 derniers mois.
            </p>
            <p>
              L'Éditeur ne saurait être tenu responsable des dommages indirects (perte de données, perte
              d'exploitation, manque à gagner, atteinte à l'image, etc.).
            </p>
          </Section>

          <Section title="12. Données personnelles">
            <p>
              Le traitement des données personnelles de l'Utilisateur est régi par la{" "}
              <a href="/privacy" className={link}>
                Politique de confidentialité
              </a>
              , qui fait partie intégrante des présentes CGU.
            </p>
          </Section>

          <Section title="13. Force majeure">
            <p>
              Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations
              résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.
            </p>
          </Section>

          <Section title="14. Modification des CGU">
            <p>
              L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs
              seront informés de toute modification substantielle par e-mail ou notification dans le
              Service, au moins 30 jours avant l'entrée en vigueur des nouvelles conditions. À défaut
              d'acceptation, l'Utilisateur pourra résilier son abonnement.
            </p>
          </Section>

          <Section title="15. Droit applicable et juridiction compétente">
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de
              résolution amiable préalable, les tribunaux français seront seuls compétents. Pour les
              Utilisateurs professionnels, compétence est expressément attribuée aux tribunaux du ressort
              du siège social de l'Éditeur.
            </p>
          </Section>
        </LangBlock>

        {/* ── ENGLISH ── */}
        <LangBlock lang="en">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mb-10 text-sm text-gray-400">Last updated: 16 May 2026</p>

          <Section title="1. Purpose">
            <p>
              These Terms of Service (hereinafter "Terms") govern the conditions under which:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                the user (hereinafter "User") may access the flowboard service (hereinafter "Service"),
                available at{" "}
                <a href="https://flowboard.canope.org" className={link}>
                  https://flowboard.canope.org
                </a>{" "}
                ;
              </li>
              <li>the User may subscribe to a paid plan.</li>
            </ul>
            <p>
              The Service is published by <strong>Canope</strong>, a simplified joint-stock company
              (SASU) with a share capital of €500, registered at 21 rue Guérin, 95430 Auvers-sur-Oise,
              France, registered with the Pontoise Trade and Companies Registry under number 990 246 589
              (hereinafter "Publisher").
            </p>
            <p>
              Contact:{" "}
              <a href="mailto:support@canope.org" className={link}>
                support@canope.org
              </a>
            </p>
          </Section>

          <Section title="2. Acceptance of Terms">
            <p>
              Using the Service constitutes full and unconditional acceptance of these Terms. Acceptance
              is confirmed when the User ticks the relevant box upon account creation.
            </p>
            <p>The applicable Terms are those in force on the date the User connects to the Service.</p>
          </Section>

          <Section title="3. Description of the Service">
            <p>
              flowboard is an online SaaS (Software as a Service) digital signage platform allowing Users
              to create, manage and broadcast visual content on one or more connected screens.
            </p>
            <p>
              The Publisher reserves the right to evolve the Service, its features and interface at any
              time.
            </p>
          </Section>

          <Section title="4. Account Creation">
            <p>
              Access to the Service requires creating a user account. The User agrees to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>provide accurate, complete and up-to-date information upon registration;</li>
              <li>keep login credentials confidential;</li>
              <li>notify the Publisher immediately of any unauthorised use of their account.</li>
            </ul>
            <p>
              The User is solely responsible for all actions taken from their account. Account creation is
              reserved for adults and legal entities acting through a legal representative.
            </p>
          </Section>

          <Section title="5. Pricing and Subscription">
            <SubSection title="5.1 Free trial">
              <p>
                The Service offers a free tier whose conditions (duration, included features) are specified
                on the subscription page. At the end of the free period, the subscription automatically
                converts to a paid plan unless cancelled beforehand by the User.
              </p>
            </SubSection>
            <SubSection title="5.2 Pricing">
              <p>
                Prices are shown in euros, inclusive of all applicable taxes, on the subscription page.
                They may be changed at any time by the Publisher; new prices will only apply to
                subscriptions taken out or renewed after the change.
              </p>
            </SubSection>
            <SubSection title="5.3 Payment">
              <p>
                Payment is made exclusively by credit or debit card through <strong>Stripe</strong>. No
                banking data is stored by the Publisher. The subscription is charged on a recurring basis
                (monthly or annually, depending on the chosen plan) and renewed automatically at each due
                date.
              </p>
            </SubSection>
            <SubSection title="5.4 Non-payment">
              <p>
                In the event of non-payment, the Publisher reserves the right to suspend access to the
                Service after notifying the User, until the outstanding amount is settled.
              </p>
            </SubSection>
          </Section>

          <Section title="6. Right of Withdrawal">
            <p>
              In accordance with Article L.221-28 of the French Consumer Code, a consumer User who has
              expressly requested that performance of the Service begin before the end of the withdrawal
              period, and who has acknowledged losing their right of withdrawal, waives that right. This
              consent is collected at the time of subscription.
            </p>
            <p>The right of withdrawal does not apply to professional Users.</p>
          </Section>

          <Section title="7. Cancellation">
            <SubSection title="7.1 Cancellation by the User">
              <p>
                The User may cancel their subscription at any time from their personal account. Cancellation
                takes effect at the end of the current billing period already paid. No pro-rata refund will
                be issued.
              </p>
            </SubSection>
            <SubSection title="7.2 Cancellation by the Publisher">
              <p>
                The Publisher reserves the right to suspend or terminate a User's account without notice or
                compensation in the event of a serious breach of these Terms, including fraudulent use of
                the Service, non-payment, or unlawful use.
              </p>
            </SubSection>
            <SubSection title="7.3 Effects of cancellation">
              <p>
                Upon cancellation, access to the Service is deactivated. User data may be retained for up
                to 30 days to allow retrieval upon request, then permanently deleted, subject to any
                legally mandated retention periods.
              </p>
            </SubSection>
          </Section>

          <Section title="8. User Obligations">
            <p>
              The User agrees to use the Service in accordance with its intended purpose, these Terms, and
              applicable law. The User shall not:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>infringe any third-party rights (intellectual property, privacy, etc.);</li>
              <li>
                broadcast unlawful, offensive, defamatory or public-order-violating content;
              </li>
              <li>
                attempt to compromise the security of the Service (intrusion, denial of service,
                injection, etc.);
              </li>
              <li>use the Service for spam or unsolicited solicitation;</li>
              <li>resell access to the Service or make any unauthorised commercial use of it.</li>
            </ul>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              All elements of the Service (software, interfaces, trademarks, logos, texts, databases) are
              the exclusive property of the Publisher. The Publisher grants the User a personal,
              non-exclusive and non-transferable right to use the Service for the duration of their
              subscription.
            </p>
            <p>
              The User retains full ownership of the content they publish on the Service. However, the
              User grants the Publisher a non-exclusive licence to host and process that content solely as
              necessary to provide the Service.
            </p>
          </Section>

          <Section title="10. Service Availability">
            <p>
              The Publisher endeavours to ensure Service availability 24/7. However, it cannot be held
              liable for interruptions due to maintenance operations, force majeure events, or failures of
              the Internet network or hosting provider.
            </p>
          </Section>

          <Section title="11. Liability">
            <p>
              The Service is provided "as is". The Publisher cannot guarantee that the Service will meet
              all User expectations or be free from errors.
            </p>
            <p>
              The Publisher's liability is limited to direct damages suffered by the User and directly
              resulting from a breach by the Publisher. Unless mandated by law, the Publisher's total
              liability shall not exceed the amounts actually paid by the User in the preceding 12 months.
            </p>
            <p>
              The Publisher shall not be liable for indirect damages (data loss, loss of business,
              loss of profit, reputational damage, etc.).
            </p>
          </Section>

          <Section title="12. Personal Data">
            <p>
              The processing of the User's personal data is governed by the{" "}
              <a href="/privacy" className={link}>
                Privacy Policy
              </a>
              , which forms an integral part of these Terms.
            </p>
          </Section>

          <Section title="13. Force Majeure">
            <p>
              Neither party shall be held liable for a failure to fulfil its obligations resulting from a
              force majeure event within the meaning of Article 1218 of the French Civil Code.
            </p>
          </Section>

          <Section title="14. Changes to the Terms">
            <p>
              The Publisher reserves the right to amend these Terms at any time. Users will be notified of
              any material change by email or in-service notification at least 30 days before the new
              terms take effect. If the User does not accept the changes, they may cancel their
              subscription.
            </p>
          </Section>

          <Section title="15. Governing Law and Jurisdiction">
            <p>
              These Terms are governed by French law. In the event of a dispute, and failing prior
              amicable resolution, the competent French courts shall have exclusive jurisdiction. For
              professional Users, jurisdiction is expressly granted to the courts of the Publisher's
              registered office.
            </p>
          </Section>
        </LangBlock>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY POLICY
// ─────────────────────────────────────────────────────────────────────────────
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LangSwitcher />

        {/* ── FRANÇAIS ── */}
        <LangBlock lang="fr">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="mb-10 text-sm text-gray-400">Dernière mise à jour : 16 mai 2026</p>

          <p className="mb-8 text-sm text-gray-600 leading-relaxed">
            La présente politique de confidentialité a pour objet d'informer les utilisateurs du site{" "}
            <strong>flowboard</strong>, accessible à l'adresse{" "}
            <a href="https://flowboard.canope.org" className={link}>
              https://flowboard.canope.org
            </a>
            , des modalités de collecte et de traitement de leurs données personnelles, conformément au
            Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi française n° 78-17 du
            6 janvier 1978 modifiée (Loi Informatique et Libertés).
          </p>

          <Section title="1. Responsable du traitement">
            <ul className="list-none space-y-0.5">
              <li><strong>Dénomination :</strong> Canope</li>
              <li><strong>Forme :</strong> SASU au capital de 500 euros</li>
              <li><strong>Siège social :</strong> 21 rue Guérin, 95430 Auvers-sur-Oise, France</li>
              <li><strong>RCS :</strong> Pontoise 990 246 589</li>
              <li><strong>SIRET :</strong> 990 246 589 00016</li>
              <li><strong>Représentant légal :</strong> Raphaël Desmonts, Président</li>
              <li>
                <strong>Contact :</strong>{" "}
                <a href="mailto:support@canope.org" className={link}>
                  support@canope.org
                </a>
              </li>
            </ul>
          </Section>

          <Section title="2. Données collectées">
            <p><strong>Données d'identification et de compte :</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>nom, prénom ;</li>
              <li>adresse e-mail ;</li>
              <li>mot de passe (stocké sous forme hachée) ;</li>
              <li>identifiant interne unique.</li>
            </ul>
            <p><strong>Données de facturation :</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>nom et prénom du titulaire ;</li>
              <li>adresse de facturation ;</li>
              <li>historique des transactions et factures ;</li>
              <li>
                les <strong>données de carte bancaire ne sont jamais collectées ni stockées par l'Éditeur</strong> :
                elles sont transmises directement à Stripe, prestataire certifié PCI-DSS.
              </li>
            </ul>
            <p><strong>Données d'usage et techniques :</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>adresse IP ;</li>
              <li>type et version du navigateur, système d'exploitation ;</li>
              <li>pages consultées, actions effectuées dans le Service, durée des sessions ;</li>
              <li>date et heure de connexion.</li>
            </ul>
            <p><strong>Contenus créés par l'Utilisateur :</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>toute donnée saisie ou téléversée par l'Utilisateur dans le cadre de l'utilisation du Service.</li>
            </ul>
          </Section>

          <Section title="3. Finalités et bases légales du traitement">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Finalité</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Création et gestion du compte utilisateur", "Exécution du contrat (art. 6.1.b RGPD)"],
                    ["Fourniture du Service", "Exécution du contrat (art. 6.1.b RGPD)"],
                    ["Facturation et gestion des paiements", "Exécution du contrat + obligation légale (art. 6.1.b et 6.1.c RGPD)"],
                    ["Conservation des factures et documents comptables", "Obligation légale (art. 6.1.c RGPD)"],
                    ["Envoi d'e-mails transactionnels (confirmation, facture, alerte)", "Exécution du contrat (art. 6.1.b RGPD)"],
                    ["Envoi d'e-mails marketing", "Consentement de l'Utilisateur (art. 6.1.a RGPD)"],
                    ["Mesure d'audience et amélioration du Service (PostHog)", "Consentement de l'Utilisateur (art. 6.1.a RGPD)"],
                    ["Sécurité du Service, prévention de la fraude", "Intérêt légitime (art. 6.1.f RGPD)"],
                    ["Respect d'obligations légales et réglementaires", "Obligation légale (art. 6.1.c RGPD)"],
                  ].map(([finalite, base]) => (
                    <tr key={finalite} className="even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2">{finalite}</td>
                      <td className="border border-gray-200 px-3 py-2">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Destinataires et sous-traitants">
            <p>
              Les données personnelles sont traitées par les équipes habilitées de l'Éditeur et, dans la
              limite de leurs missions, par les sous-traitants suivants :
            </p>
            <SubSection title="Stripe – Traitement des paiements">
              <ul className="list-none space-y-0.5">
                <li>Fournisseur : Stripe Payments Europe, Ltd., Irlande.</li>
                <li>Données traitées : nom, prénom, adresse de facturation, données de carte bancaire, historique de paiements.</li>
                <li>Garanties : Stripe est certifié PCI-DSS niveau 1. Les transferts hors UE sont encadrés par les Clauses Contractuelles Types de la Commission européenne.</li>
                <li>Politique : <a href="https://stripe.com/fr/privacy" className={link}>stripe.com/fr/privacy</a></li>
              </ul>
            </SubSection>
            <SubSection title="PostHog – Mesure d'audience et analyse comportementale">
              <ul className="list-none space-y-0.5">
                <li>Fournisseur : PostHog Inc. (serveurs EU).</li>
                <li>Données traitées : adresse IP (pseudonymisée), identifiant de session, événements d'usage, navigateur, OS.</li>
                <li>Garanties : transferts hors UE encadrés par les Clauses Contractuelles Types. Le traitement n'est activé qu'après recueil du consentement via la bannière cookies.</li>
                <li>Politique : <a href="https://posthog.com/privacy" className={link}>posthog.com/privacy</a></li>
              </ul>
            </SubSection>
            <SubSection title="Hostinger – Hébergement">
              <ul className="list-none space-y-0.5">
                <li>Fournisseur : Hostinger International Ltd., Chypre.</li>
                <li>Données traitées : ensemble des données techniques et applicatives nécessaires au fonctionnement du Service.</li>
                <li>Politique : <a href="https://www.hostinger.fr/politique-confidentialite" className={link}>hostinger.fr/politique-confidentialite</a></li>
              </ul>
            </SubSection>
            <p>Aucune donnée n'est vendue, louée ou cédée à des tiers à des fins commerciales.</p>
          </Section>

          <Section title="5. Transferts hors Union européenne">
            <p>
              Certains sous-traitants (Stripe, PostHog) peuvent être amenés à traiter des données en
              dehors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>les Clauses Contractuelles Types (CCT) adoptées par la Commission européenne ;</li>
              <li>et/ou l'adhésion du destinataire au Data Privacy Framework (DPF) le cas échéant.</li>
            </ul>
            <p>
              L'Utilisateur peut obtenir une copie de ces garanties en contactant l'Éditeur à l'adresse
              indiquée à l'article 1.
            </p>
          </Section>

          <Section title="6. Durées de conservation">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Catégorie de données</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Données de compte (compte actif)", "Pendant toute la durée de la relation contractuelle"],
                    ["Données de compte après résiliation", "30 jours (puis suppression définitive)"],
                    ["Données de facturation et documents comptables", "10 ans à compter de la clôture de l'exercice (obligation légale)"],
                    ["Logs de connexion et de sécurité", "12 mois maximum (recommandation CNIL)"],
                    ["Données de mesure d'audience (PostHog)", "13 mois maximum (recommandation CNIL)"],
                    ["Données utilisées pour la prospection commerciale", "3 ans à compter du dernier contact actif"],
                  ].map(([cat, duree]) => (
                    <tr key={cat} className="even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2">{cat}</td>
                      <td className="border border-gray-200 px-3 py-2">{duree}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="7. Droits des utilisateurs">
            <p>
              Conformément aux articles 15 à 22 du RGPD, l'Utilisateur dispose des droits suivants sur
              ses données personnelles :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d'accès</strong> : obtenir la confirmation que ses données sont traitées et en recevoir copie ;</li>
              <li><strong>Droit de rectification</strong> : faire corriger des données inexactes ou incomplètes ;</li>
              <li><strong>Droit à l'effacement</strong> (« droit à l'oubli ») : demander la suppression de ses données, sous réserve des obligations légales de conservation ;</li>
              <li><strong>Droit à la limitation</strong> du traitement ;</li>
              <li><strong>Droit à la portabilité</strong> : recevoir ses données dans un format structuré et couramment utilisé ;</li>
              <li><strong>Droit d'opposition</strong> au traitement, notamment à des fins de prospection ;</li>
              <li><strong>Droit de retirer son consentement</strong> à tout moment, lorsque le traitement est fondé sur celui-ci ;</li>
              <li><strong>Droit de définir des directives</strong> relatives au sort de ses données après son décès.</li>
            </ul>
            <p>
              Ces droits peuvent être exercés en écrivant à :{" "}
              <a href="mailto:support@canope.org" className={link}>support@canope.org</a>, en justifiant de son identité.
            </p>
            <p>
              L'Éditeur répondra dans un délai d'un mois à compter de la réception de la demande.
              En cas de réponse insatisfaisante, l'Utilisateur peut introduire une réclamation auprès de
              la <strong>CNIL</strong> :{" "}
              <a href="https://www.cnil.fr/fr/plaintes" className={link}>cnil.fr/fr/plaintes</a> — 3 place de Fontenoy,
              75334 Paris Cedex 07.
            </p>
          </Section>

          <Section title="8. Cookies et traceurs">
            <p>
              <strong>Cookies strictement nécessaires</strong> (exemptés de consentement) : permettent
              le fonctionnement du Service (authentification, sécurité, préférences essentielles).
            </p>
            <p>
              <strong>Cookies de mesure d'audience</strong> (PostHog) : permettent d'analyser l'usage du
              Service afin de l'améliorer. Ces cookies ne sont déposés qu'après recueil du consentement
              via la bannière présentée à la première visite.
            </p>
            <p>
              L'Utilisateur peut à tout moment modifier ses préférences via les paramètres de son
              navigateur. Le refus des cookies de mesure d'audience n'empêche pas l'accès au Service.
              La durée de conservation des cookies n'excède pas 13 mois (recommandation CNIL).
            </p>
          </Section>

          <Section title="9. Sécurité">
            <p>L'Éditeur met en œuvre les mesures techniques et organisationnelles appropriées, notamment :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>chiffrement des communications via HTTPS (TLS) ;</li>
              <li>hachage des mots de passe ;</li>
              <li>contrôle des accès aux données par les équipes ;</li>
              <li>sauvegardes régulières ;</li>
              <li>traçabilité des accès sensibles.</li>
            </ul>
            <p>
              En cas de violation de données susceptible d'engendrer un risque élevé, l'Éditeur en
              informera la CNIL dans un délai de 72 heures et, si nécessaire, les Utilisateurs concernés.
            </p>
          </Section>

          <Section title="10. Mineurs">
            <p>
              Le Service n'est pas destiné aux mineurs de moins de 15 ans. La création de compte est
              interdite aux personnes mineures sans autorisation parentale.
            </p>
          </Section>

          <Section title="11. Modification de la politique">
            <p>
              La présente politique peut être modifiée à tout moment. Les Utilisateurs seront informés de
              toute modification substantielle par e-mail ou notification dans le Service.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              <a href="mailto:support@canope.org" className={link}>support@canope.org</a>
              {" — "}Canope, 21 rue Guérin, 95430 Auvers-sur-Oise, France
            </p>
          </Section>
        </LangBlock>

        {/* ── ENGLISH ── */}
        <LangBlock lang="en">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mb-10 text-sm text-gray-400">Last updated: 16 May 2026</p>

          <p className="mb-8 text-sm text-gray-600 leading-relaxed">
            This Privacy Policy explains how <strong>flowboard</strong>, available at{" "}
            <a href="https://flowboard.canope.org" className={link}>
              https://flowboard.canope.org
            </a>
            , collects and processes personal data, in accordance with Regulation (EU) 2016/679 of
            27 April 2016 (GDPR) and the French Data Protection Act (Loi n° 78-17 of 6 January 1978).
          </p>

          <Section title="1. Data Controller">
            <ul className="list-none space-y-0.5">
              <li><strong>Company:</strong> Canope</li>
              <li><strong>Legal form:</strong> SASU — share capital €500</li>
              <li><strong>Registered office:</strong> 21 rue Guérin, 95430 Auvers-sur-Oise, France</li>
              <li><strong>Trade registry:</strong> RCS Pontoise 990 246 589</li>
              <li><strong>SIRET:</strong> 990 246 589 00016</li>
              <li><strong>Legal representative:</strong> Raphaël Desmonts, CEO</li>
              <li>
                <strong>Contact:</strong>{" "}
                <a href="mailto:support@canope.org" className={link}>support@canope.org</a>
              </li>
            </ul>
          </Section>

          <Section title="2. Data We Collect">
            <p><strong>Account and identification data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>first name, last name;</li>
              <li>email address;</li>
              <li>password (stored as a hash);</li>
              <li>unique internal identifier.</li>
            </ul>
            <p><strong>Billing data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>cardholder name;</li>
              <li>billing address;</li>
              <li>transaction and invoice history;</li>
              <li>
                <strong>card details are never collected or stored by the Publisher</strong>: they are
                transmitted directly to Stripe, a PCI-DSS certified provider.
              </li>
            </ul>
            <p><strong>Usage and technical data:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address;</li>
              <li>browser type and version, operating system;</li>
              <li>pages visited, actions performed in the Service, session duration;</li>
              <li>connection date and time.</li>
            </ul>
            <p><strong>User-created content:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>any data entered or uploaded by the User while using the Service.</li>
            </ul>
          </Section>

          <Section title="3. Purposes and Legal Basis">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Purpose</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Legal basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Account creation and management", "Contract performance (Art. 6.1.b GDPR)"],
                    ["Provision of the Service", "Contract performance (Art. 6.1.b GDPR)"],
                    ["Billing and payment management", "Contract performance + legal obligation (Art. 6.1.b & 6.1.c GDPR)"],
                    ["Retention of invoices and accounting documents", "Legal obligation (Art. 6.1.c GDPR)"],
                    ["Transactional emails (confirmation, invoice, alert)", "Contract performance (Art. 6.1.b GDPR)"],
                    ["Marketing emails", "User consent (Art. 6.1.a GDPR)"],
                    ["Audience measurement and Service improvement (PostHog)", "User consent (Art. 6.1.a GDPR)"],
                    ["Service security and fraud prevention", "Legitimate interest (Art. 6.1.f GDPR)"],
                    ["Compliance with legal and regulatory obligations", "Legal obligation (Art. 6.1.c GDPR)"],
                  ].map(([purpose, basis]) => (
                    <tr key={purpose} className="even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2">{purpose}</td>
                      <td className="border border-gray-200 px-3 py-2">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Recipients and Sub-processors">
            <p>
              Personal data is processed by authorised Publisher staff and, within the scope of their
              missions, by the following sub-processors:
            </p>
            <SubSection title="Stripe – Payment processing">
              <ul className="list-none space-y-0.5">
                <li>Provider: Stripe Payments Europe, Ltd., Ireland.</li>
                <li>Data processed: name, billing address, card details, payment history.</li>
                <li>Safeguards: Stripe is PCI-DSS Level 1 certified. Transfers outside the EU are governed by Standard Contractual Clauses.</li>
                <li>Policy: <a href="https://stripe.com/privacy" className={link}>stripe.com/privacy</a></li>
              </ul>
            </SubSection>
            <SubSection title="PostHog – Analytics">
              <ul className="list-none space-y-0.5">
                <li>Provider: PostHog Inc. (EU servers).</li>
                <li>Data processed: pseudonymised IP address, session ID, usage events, browser, OS.</li>
                <li>Safeguards: EU transfers governed by Standard Contractual Clauses. Processing is only activated after consent via the cookie banner.</li>
                <li>Policy: <a href="https://posthog.com/privacy" className={link}>posthog.com/privacy</a></li>
              </ul>
            </SubSection>
            <SubSection title="Hostinger – Hosting">
              <ul className="list-none space-y-0.5">
                <li>Provider: Hostinger International Ltd., Cyprus.</li>
                <li>Data processed: all technical and application data required to operate the Service.</li>
                <li>Policy: <a href="https://www.hostinger.com/privacy-policy" className={link}>hostinger.com/privacy-policy</a></li>
              </ul>
            </SubSection>
            <p>No personal data is sold, rented or transferred to third parties for commercial purposes.</p>
          </Section>

          <Section title="5. International Transfers">
            <p>
              Some sub-processors (Stripe, PostHog) may process data outside the European Union,
              particularly in the United States. These transfers are governed by:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Standard Contractual Clauses (SCCs) adopted by the European Commission;</li>
              <li>and/or the recipient's adherence to the Data Privacy Framework (DPF) where applicable.</li>
            </ul>
            <p>
              Users may obtain a copy of these safeguards by contacting the Publisher at the address in
              Article 1.
            </p>
          </Section>

          <Section title="6. Retention Periods">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Data category</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Retention period</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Account data (active account)", "For the duration of the contractual relationship"],
                    ["Account data after cancellation", "30 days (then permanent deletion)"],
                    ["Billing data and accounting documents", "10 years from the end of the financial year (legal obligation)"],
                    ["Connection and security logs", "Up to 12 months (CNIL recommendation)"],
                    ["Audience measurement data (PostHog)", "Up to 13 months (CNIL recommendation)"],
                    ["Commercial prospecting data", "3 years from last active contact"],
                  ].map(([cat, period]) => (
                    <tr key={cat} className="even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2">{cat}</td>
                      <td className="border border-gray-200 px-3 py-2">{period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="7. Your Rights (GDPR)">
            <p>Under Articles 15–22 of the GDPR, you have the following rights over your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right of access:</strong> obtain confirmation that your data is being processed and receive a copy;</li>
              <li><strong>Right to rectification:</strong> have inaccurate or incomplete data corrected;</li>
              <li><strong>Right to erasure</strong> ("right to be forgotten"): request deletion of your data, subject to legal retention obligations;</li>
              <li><strong>Right to restriction</strong> of processing;</li>
              <li><strong>Right to data portability:</strong> receive your data in a structured, commonly used format;</li>
              <li><strong>Right to object</strong> to processing, in particular for direct marketing;</li>
              <li><strong>Right to withdraw consent</strong> at any time, where processing is based on consent;</li>
              <li><strong>Right to give instructions</strong> regarding your data after death.</li>
            </ul>
            <p>
              To exercise these rights, write to{" "}
              <a href="mailto:support@canope.org" className={link}>support@canope.org</a>, providing
              proof of identity. The Publisher will respond within one month.
            </p>
            <p>
              If you are unsatisfied with the response, you may lodge a complaint with the{" "}
              <strong>CNIL</strong> (France's data protection authority):{" "}
              <a href="https://www.cnil.fr/fr/plaintes" className={link}>cnil.fr/fr/plaintes</a>.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              <strong>Strictly necessary cookies</strong> (consent-exempt): required for the Service to
              function (authentication, security, essential preferences).
            </p>
            <p>
              <strong>Analytics cookies</strong> (PostHog): used to analyse Service usage and improve it.
              These cookies are only set after collecting consent via the cookie banner on the first visit.
            </p>
            <p>
              You may change your cookie preferences at any time via your browser settings. Refusing
              analytics cookies does not prevent access to the Service. Cookies are retained for no more
              than 13 months.
            </p>
          </Section>

          <Section title="9. Security">
            <p>The Publisher implements appropriate technical and organisational measures, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS (TLS) encryption of all communications;</li>
              <li>password hashing;</li>
              <li>access control to data by authorised staff;</li>
              <li>regular backups;</li>
              <li>audit trails for sensitive access.</li>
            </ul>
            <p>
              In the event of a data breach likely to result in a high risk to Users' rights, the
              Publisher will notify the CNIL within 72 hours and, if necessary, the affected Users.
            </p>
          </Section>

          <Section title="10. Minors">
            <p>
              The Service is not intended for children under the age of 15. Account creation is prohibited
              for minors without parental consent.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              This policy may be updated at any time. Any material change will be communicated to Users
              by email or in-service notification.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              <a href="mailto:support@canope.org" className={link}>support@canope.org</a>
              {" — "}Canope, 21 rue Guérin, 95430 Auvers-sur-Oise, France
            </p>
          </Section>
        </LangBlock>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL NOTICE (MENTIONS LÉGALES)
// ─────────────────────────────────────────────────────────────────────────────
export function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LangSwitcher />

        {/* ── FRANÇAIS ── */}
        <LangBlock lang="fr">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Mentions légales</h1>
          <p className="mb-10 text-sm text-gray-400">Dernière mise à jour : 16 mai 2026</p>

          <p className="mb-8 text-sm text-gray-600 leading-relaxed">
            Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004
            pour la Confiance dans l'économie numérique (LCEN), il est porté à la connaissance des
            utilisateurs et visiteurs du site <strong>flowboard</strong>, accessible à l'adresse{" "}
            <a href="https://flowboard.canope.org" className={link}>
              https://flowboard.canope.org
            </a>
            , les informations suivantes.
          </p>

          <Section title="1. Éditeur du site">
            <ul className="list-none space-y-0.5">
              <li><strong>Dénomination sociale :</strong> Canope</li>
              <li><strong>Forme juridique :</strong> Société par actions simplifiée unipersonnelle (SASU)</li>
              <li><strong>Capital social :</strong> 500 euros</li>
              <li><strong>Siège social :</strong> 21 rue Guérin, 95430 Auvers-sur-Oise, France</li>
              <li><strong>Numéro SIRET :</strong> 990 246 589 00016</li>
              <li><strong>Numéro RCS :</strong> RCS Pontoise 990 246 589</li>
              <li><strong>Numéro de TVA intracommunautaire :</strong> non applicable</li>
              <li><strong>Président :</strong> Raphaël Desmonts</li>
              <li>
                <strong>Adresse e-mail de contact :</strong>{" "}
                <a href="mailto:support@canope.org" className={link}>support@canope.org</a>
              </li>
            </ul>
          </Section>

          <Section title="2. Directeur de la publication">
            <p>
              Le directeur de la publication du Site est Raphaël Desmonts, en sa qualité de Président de
              la société.
            </p>
          </Section>

          <Section title="3. Hébergeur">
            <ul className="list-none space-y-0.5">
              <li><strong>Société :</strong> Hostinger International Ltd.</li>
              <li><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
              <li>
                <strong>Site web :</strong>{" "}
                <a href="https://www.hostinger.fr" className={link}>www.hostinger.fr</a>
              </li>
              <li><strong>Contact :</strong> disponible via le site de l'hébergeur</li>
            </ul>
          </Section>

          <Section title="4. Propriété intellectuelle">
            <p>
              L'ensemble des éléments composant le Site (textes, graphismes, logos, icônes, images,
              vidéos, sons, logiciels, base de données, code source) est la propriété exclusive de
              l'éditeur ou de ses partenaires, et est protégé par les lois françaises et internationales
              relatives à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation ou exploitation de
              tout ou partie des éléments du Site, par quelque procédé que ce soit et sur quelque support
              que ce soit, est interdite sans l'autorisation écrite préalable de l'éditeur.
            </p>
            <p>
              Toute exploitation non autorisée du Site ou de l'un quelconque des éléments qu'il contient
              sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux
              dispositions des articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </Section>

          <Section title="5. Liens hypertextes">
            <p>
              Le Site peut contenir des liens hypertextes vers d'autres sites internet. L'éditeur
              n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu,
              leur fonctionnement ou leur disponibilité.
            </p>
          </Section>

          <Section title="6. Données personnelles">
            <p>
              Le traitement des données personnelles collectées via le Site est décrit dans la{" "}
              <a href="/privacy" className={link}>Politique de confidentialité</a>.
            </p>
          </Section>

          <Section title="7. Droit applicable">
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige, et
              après tentative de résolution amiable, compétence exclusive est attribuée aux tribunaux
              français.
            </p>
          </Section>
        </LangBlock>

        {/* ── ENGLISH ── */}
        <LangBlock lang="en">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Legal Notice</h1>
          <p className="mb-10 text-sm text-gray-400">Last updated: 16 May 2026</p>

          <p className="mb-8 text-sm text-gray-600 leading-relaxed">
            In accordance with French Law n° 2004-575 of 21 June 2004 on Confidence in the Digital
            Economy (LCEN), the following information is provided to users and visitors of the{" "}
            <strong>flowboard</strong> website, available at{" "}
            <a href="https://flowboard.canope.org" className={link}>
              https://flowboard.canope.org
            </a>
            .
          </p>

          <Section title="1. Publisher">
            <ul className="list-none space-y-0.5">
              <li><strong>Company name:</strong> Canope</li>
              <li><strong>Legal form:</strong> Simplified single-member joint-stock company (SASU)</li>
              <li><strong>Share capital:</strong> €500</li>
              <li><strong>Registered office:</strong> 21 rue Guérin, 95430 Auvers-sur-Oise, France</li>
              <li><strong>SIRET number:</strong> 990 246 589 00016</li>
              <li><strong>Trade registry:</strong> RCS Pontoise 990 246 589</li>
              <li><strong>VAT number:</strong> not applicable</li>
              <li><strong>CEO:</strong> Raphaël Desmonts</li>
              <li>
                <strong>Contact email:</strong>{" "}
                <a href="mailto:support@canope.org" className={link}>support@canope.org</a>
              </li>
            </ul>
          </Section>

          <Section title="2. Publication Director">
            <p>
              The publication director of the Website is Raphaël Desmonts, in his capacity as CEO of
              the company.
            </p>
          </Section>

          <Section title="3. Hosting Provider">
            <ul className="list-none space-y-0.5">
              <li><strong>Company:</strong> Hostinger International Ltd.</li>
              <li><strong>Address:</strong> 61 Lordou Vironos Street, 6023 Larnaca, Cyprus</li>
              <li>
                <strong>Website:</strong>{" "}
                <a href="https://www.hostinger.com" className={link}>www.hostinger.com</a>
              </li>
              <li><strong>Contact:</strong> available via the hosting provider's website</li>
            </ul>
          </Section>

          <Section title="4. Intellectual Property">
            <p>
              All elements of the Website (texts, graphics, logos, icons, images, videos, sounds,
              software, databases, source code) are the exclusive property of the publisher or its
              partners, and are protected by French and international intellectual property laws.
            </p>
            <p>
              Any reproduction, representation, modification, publication, adaptation or exploitation of
              all or part of the Website's elements, by any means and on any medium, is prohibited
              without the publisher's prior written authorisation.
            </p>
            <p>
              Any unauthorised use of the Website or any of its elements will be considered an act of
              infringement and prosecuted under Articles L.335-2 et seq. of the French Intellectual
              Property Code.
            </p>
          </Section>

          <Section title="5. Hyperlinks">
            <p>
              The Website may contain hyperlinks to other websites. The publisher has no control over
              those sites and accepts no liability for their content, operation or availability.
            </p>
          </Section>

          <Section title="6. Personal Data">
            <p>
              The processing of personal data collected through the Website is described in the{" "}
              <a href="/privacy" className={link}>Privacy Policy</a>.
            </p>
          </Section>

          <Section title="7. Governing Law">
            <p>
              This legal notice is governed by French law. In the event of a dispute, and after an
              attempt at amicable resolution, exclusive jurisdiction is granted to the competent French
              courts.
            </p>
          </Section>
        </LangBlock>
      </main>
    </div>
  );
}
