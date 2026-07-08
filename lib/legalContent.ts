/**
 * Legal copy — drafted for WORLDWIDE compliance: EU GDPR, UK-GDPR, California
 * CCPA/CPRA, and Egypt's Personal Data Protection Law (Law No. 151 of 2020),
 * since the business ships internationally with its physical base in Egypt.
 *
 * BEFORE PUBLISHING, fill the four identity blanks (search for "[" ):
 *   [BUSINESS LEGAL NAME] · [REGISTERED ADDRESS, EGYPT] · [privacy@DOMAIN] · [DOMAIN]
 * Returns policy: 14-day (owner-selected, pending business confirmation).
 * Custom orders: non-returnable + deposit (owner-selected).
 *
 * This is a thorough, real draft — but have a qualified lawyer in your key markets
 * review it before you go live. It is not a substitute for legal advice.
 */

export interface LegalSection { heading: string; body: string[]; }
export interface LegalDoc {
  slug: 'privacy' | 'cookies' | 'terms';
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const COMPANY = '[BUSINESS LEGAL NAME]';
const ADDRESS = '[REGISTERED ADDRESS, EGYPT]';
const CONTACT = '[privacy@DOMAIN]';
const SITE = '[DOMAIN]';
const PHONE = '01010279777';
const UPDATED = 'July 2026';

export const LEGAL_DOCS: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated: UPDATED,
    intro:
      `${COMPANY} ("Raafat Furniture", "we", "us") respects your privacy and is committed to protecting your ` +
      'personal data. This policy explains what we collect, why, the legal bases we rely on, who we share it ' +
      'with, how long we keep it, and the rights you have. It applies to everyone who uses our website or buys ' +
      'from us anywhere in the world, including under the EU and UK GDPR, the California CCPA/CPRA, and Egypt’s ' +
      'Personal Data Protection Law (Law No. 151 of 2020).',
    sections: [
      {
        heading: 'Who we are',
        body: [
          `The data controller responsible for your personal data is ${COMPANY}, with its registered place of business at ${ADDRESS}.`,
          `For any privacy question or to exercise your rights, contact us at ${CONTACT} or call ${PHONE}.`,
          'If we are required to appoint a representative or data protection officer in a particular market, their contact details will be added here.',
        ],
      },
      {
        heading: 'The personal data we collect',
        body: [
          'Account & profile data: your name, email address, phone number, and (if you choose to save them) delivery details and preferences.',
          'Order & transaction data: the items you order, order number, fulfilment choice (pickup, delivery, or custom order), delivery address, and order history.',
          'Payment data: card payments are processed directly by our payment providers (Stripe, Inc. for international cards and wallets; Paymob for cards in Egypt). InstaPay and bank transfers are made directly from your banking app — we receive only the transfer reference you give us. We do not collect or store your full card number on our servers; we receive only a confirmation and limited transaction metadata.',
          'Technical & usage data: IP address, device and browser type, and pages viewed. We collect analytics data only where you have given consent (see our Cookie Policy).',
          'Reliability diagnostics: if the site encounters a technical error, we may silently record a short diagnostic (error message, page path, approximate destination, and browser type) so our developers can fix bugs. This does not include form contents, payment details, passwords, camera frames, or precise location, and it is not used for advertising.',
          'Communications: messages you send us (e.g. enquiries, custom-order requests) and our replies.',
          'We do not intentionally collect special-category (sensitive) data, and we ask that you do not send it to us.',
        ],
      },
      {
        heading: 'Why we use your data and our legal bases',
        body: [
          'To create your account, process and fulfil your orders, and provide customer support — necessary for the performance of our contract with you (and, where you are not yet a customer, to take steps at your request before entering a contract).',
          'To send you transactional messages such as order confirmations, payment receipts, and delivery or pickup updates — necessary for the contract.',
          'To operate, secure, and improve our website and prevent fraud — based on our legitimate interests, balanced against your rights, and on consent where the law requires it (e.g. analytics cookies).',
          'To diagnose and fix technical failures on the site (silent error reports) — based on our legitimate interests in keeping the store reliable and secure; limited to technical diagnostics described above.',
          'To understand how the site is used — based on your consent (analytics).',
          'To comply with tax, accounting, consumer-protection, and other legal obligations — necessary for compliance with a legal obligation.',
          'Where we rely on consent, you can withdraw it at any time; this does not affect processing carried out before withdrawal.',
        ],
      },
      {
        heading: 'Who we share your data with',
        body: [
          'We share personal data only with service providers ("processors") that help us run the business, under contracts that require them to protect it and use it only on our instructions:',
          '• Payments — Stripe, Inc. and Paymob (process your card payment; each acts as an independent controller of the card data you enter on their pages).',
          '• Hosting, database, authentication & file storage — Google Firebase / Google Cloud.',
          '• Product image hosting & delivery — Cloudinary.',
          '• Transactional email delivery — Resend.',
          '• Website analytics — Google Analytics 4 (only if you consent; IP anonymisation and Google Consent Mode are enabled).',
          'We may also disclose data where required by law, to enforce our terms, or to protect our rights, customers, or the public.',
          'We do NOT sell your personal information, and we do not "share" it for cross-context behavioural advertising as those terms are defined under the CCPA/CPRA.',
        ],
      },
      {
        heading: 'International data transfers',
        body: [
          'Because we sell internationally and use the providers listed above, your personal data may be processed in countries outside your own, including the United States and the European Union.',
          'Where we transfer personal data out of the EEA, the UK, or Egypt to a country without an adequacy decision, we rely on appropriate safeguards such as the European Commission’s Standard Contractual Clauses (and the UK Addendum) together with additional technical and organisational measures.',
        ],
      },
      {
        heading: 'How long we keep your data',
        body: [
          'We keep order and transaction records for as long as needed to provide the service and to meet our legal, tax, and accounting obligations (which in many jurisdictions is several years after the order).',
          'Account data is kept while your account is active and for a reasonable period afterwards. Analytics data is retained for a limited period and then aggregated or deleted. Your cookie-consent choice is stored for up to 12 months, after which we ask again.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Depending on where you live, you have some or all of these rights: to access your data; to correct it; to delete it; to restrict or object to processing; to data portability; and to withdraw consent at any time.',
          'EU/UK (GDPR): the rights above, plus the right to lodge a complaint with your local supervisory authority.',
          'California (CCPA/CPRA): the rights to know, delete, and correct your personal information; to opt out of "sale" or "sharing" (we do neither); to limit the use of sensitive personal information; and to not be discriminated against for exercising your rights.',
          'Egypt (Law 151/2020): the rights to be informed, to access, to correct, to erase, to withdraw consent, and to object to processing of your personal data.',
          `To exercise any right, contact us at ${CONTACT}. We will verify your identity and respond within the time required by applicable law. You may use an authorised agent where the law permits.`,
        ],
      },
      {
        heading: 'Security',
        body: [
          'We use industry-standard measures to protect your data, including encryption in transit (HTTPS), access controls, least-privilege database security rules, and signature-verified payment webhooks. No method of transmission or storage is perfectly secure, but we work continuously to protect your information and will notify you and the relevant authorities of a personal-data breach where the law requires.',
        ],
      },
      {
        heading: 'Children',
        body: [
          'Our store is intended for adults and is not directed to children. We do not knowingly collect personal data from children under 16 (or the age of digital consent in your country). If you believe a child has provided us data, contact us and we will delete it.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: [
          'We may update this policy from time to time. The "last updated" date will change, and we will highlight material changes on the site. Please review it periodically.',
        ],
      },
      {
        heading: 'How to complain',
        body: [
          `If you have a concern, please contact us first at ${CONTACT}. You also have the right to complain to a data protection authority: in Egypt, the Personal Data Protection Centre; in the EU, your local supervisory authority; in the UK, the Information Commissioner’s Office (ICO); and in California, the California Privacy Protection Agency or Attorney General.`,
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    updated: UPDATED,
    intro:
      'This policy explains how Raafat Furniture uses cookies and similar technologies (such as browser local ' +
      'storage). We only set non-essential cookies after you opt in. You can change your choice at any time using ' +
      'the “Cookie settings” link in the footer.',
    sections: [
      {
        heading: 'What cookies and similar technologies are',
        body: [
          'Cookies are small text files stored on your device. We also use similar technologies such as local storage to remember your cart, theme, and language between visits. Some are set by us (first-party) and some by our providers (third-party).',
        ],
      },
      {
        heading: 'The categories we use',
        body: [
          'Strictly necessary (always on, no consent required): sign-in/authentication, your shopping cart and saved items, your theme and language preference, security, a record of your cookie choice, and limited technical error diagnostics used only to keep the site working (error message and page path — never form contents, payments, or camera data). The site cannot function properly without these.',
          'Analytics (consent required): Google Analytics 4, to understand how the site is used so we can improve it. These load only after you accept. We enable IP anonymisation and Google Consent Mode, so no analytics cookies are set until you opt in.',
          'Marketing (consent required): we currently use no advertising or marketing cookies. If we add them in future they will appear in this category and will remain off until you opt in.',
          'Third-party cookies may also be set when you use Stripe Checkout or Paymob (payment) or sign in with Google; these are governed by those providers’ own privacy and cookie policies.',
        ],
      },
      {
        heading: 'Managing your choices',
        body: [
          'Use “Cookie settings” in the footer to accept all, reject non-essential, or fine-tune each category. You can also block or delete cookies in your browser settings. Rejecting non-essential cookies will not stop you from browsing or buying — only the optional analytics are affected.',
        ],
      },
      {
        heading: 'Retention',
        body: [
          'Necessary storage persists only as long as needed for the feature (your session, cart, and preferences). Analytics cookies follow Google’s retention settings. Your consent choice is stored for up to 12 months, after which we ask again.',
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    updated: UPDATED,
    intro:
      `These terms govern your use of the ${COMPANY} website (${SITE}) and your purchase of our products. By using ` +
      'the site or placing an order, you agree to these terms. Please read them carefully.',
    sections: [
      {
        heading: 'About us & contact',
        body: [
          `This website is operated by ${COMPANY}, registered at ${ADDRESS}. You can reach us at ${CONTACT} or ${PHONE}.`,
        ],
      },
      {
        heading: 'Eligibility',
        body: [
          'You must be at least 18 years old (or the age of majority where you live) and able to enter into a binding contract to place an order.',
        ],
      },
      {
        heading: 'Orders',
        body: [
          'When you place an order, you are making an offer to buy. A contract is formed only when we confirm acceptance of your order (for example, by email confirmation).',
          'We may decline or cancel an order — for example because of a pricing or description error, stock unavailability, suspected fraud, or inability to deliver to your area — and where you have already paid, we will refund you.',
        ],
      },
      {
        heading: 'Prices & payment',
        body: [
          'Prices are shown in the store currency and may change at any time, but changes do not affect orders we have already accepted. Where an item shows "Price on Request", we will confirm the price before accepting your order.',
          'You can pay by card including Apple Pay and Google Pay (processed by Stripe or, in Egypt, Paymob), by InstaPay or bank transfer (verified against the transaction reference you provide), or — for pickup orders in Egypt — cash on pickup. Delivery orders must be paid in full when the order is placed. Prices for orders within Egypt include 14% VAT; exports are zero-rated and any import duties or taxes are your responsibility. Title to the goods passes to you only once we have received payment in full.',
          'Prices are inclusive or exclusive of applicable taxes as indicated at checkout; you are responsible for any import duties or taxes where these apply.',
        ],
      },
      {
        heading: 'Delivery & pickup',
        body: [
          'For delivery orders, delivery times and any delivery charge are confirmed after you order, based on the items and your location. For pickup orders, we will let you know when your order is ready to collect from one of our showrooms.',
          'Risk of loss or damage passes to you when the goods are delivered to you (or your nominated recipient) or collected at pickup. Please inspect your items on receipt and tell us promptly about any problem.',
        ],
      },
      {
        heading: 'Returns & cancellations',
        body: [
          'You may return most unused, undamaged standard (in-stock) items within 14 days of delivery or pickup for a refund, provided they are in their original condition and packaging. You are responsible for return shipping unless the item was faulty or incorrect. Refunds are issued to your original payment method within a reasonable period after we receive and inspect the item.',
          'In every case, nothing here limits your non-waivable statutory consumer rights, which always apply where an item is faulty, damaged, or not as described.',
        ],
      },
      {
        heading: 'Custom & made-to-order items',
        body: [
          'Custom, made-to-order, and custom-dimension items are produced specifically for you. A non-refundable deposit is required before production begins, and these items cannot be cancelled or returned once production has started, except where the item is defective or not as described. The balance is due as agreed before delivery or pickup.',
          'Your statutory rights in respect of faulty or misdescribed goods are not affected.',
        ],
      },
      {
        heading: 'Warranty & faulty items',
        body: [
          'We stand behind the quality of our furniture. If an item is faulty, damaged in transit, or not as described, contact us promptly and we will repair, replace, or refund it as required by the consumer law that applies to you.',
        ],
      },
      {
        heading: 'Acceptable use & intellectual property',
        body: [
          'All content on this site — including text, images, logos, 3D models, and design — is owned by us or our licensors and is protected by intellectual-property laws. You may not copy, resell, or misuse it. You agree not to use the site unlawfully, to interfere with its operation, or to attempt unauthorised access.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential loss arising from your use of the site or our products. Nothing in these terms excludes or limits liability that cannot be excluded or limited by law (including liability for death or personal injury caused by negligence, fraud, or your non-waivable consumer rights).',
        ],
      },
      {
        heading: 'Governing law & disputes',
        body: [
          'These terms are governed by the laws of the Arab Republic of Egypt, and the courts of Egypt have jurisdiction — without depriving you of any protection given to you by mandatory consumer-protection laws of the country where you live.',
        ],
      },
      {
        heading: 'Changes to these terms',
        body: [
          'We may update these terms from time to time. The version in force when you place an order applies to that order. The "last updated" date shows when we last changed them.',
        ],
      },
    ],
  },
};
