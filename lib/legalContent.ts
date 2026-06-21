/**
 * Legal copy — globally-compliant SHAPE (GDPR, UK-GDPR, CCPA/CPRA, ePrivacy).
 * Replace the [BRACKETED] placeholders with the registered business details before
 * going live. This is not a substitute for review by a qualified lawyer in each
 * market you sell to, but it covers the standard required disclosures.
 */

export interface LegalSection { heading: string; body: string[]; }
export interface LegalDoc {
  slug: 'privacy' | 'cookies' | 'terms';
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const COMPANY = '[Raafat Furniture, registered address, Egypt]';
const CONTACT = '[privacy@raafatfurniture.com]';
const UPDATED = 'June 2026';

export const LEGAL_DOCS: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated: UPDATED,
    intro:
      `${COMPANY} ("we", "us") respects your privacy and is committed to protecting your personal data. ` +
      'This policy explains what we collect, why, the legal bases we rely on, how long we keep it, and the rights you have. ' +
      'It applies to visitors and customers worldwide, including under the EU/UK GDPR and the California CCPA/CPRA.',
    sections: [
      { heading: 'Who we are', body: [`The data controller is ${COMPANY}. For any privacy request, contact us at ${CONTACT}.`] },
      {
        heading: 'Data we collect',
        body: [
          'Account & order data: name, email, phone, delivery address, and order history you provide when you register or check out.',
          'Payment data: processed by our payment provider (Stripe). We do not store full card numbers on our servers.',
          'Technical data: IP address, device and browser type, and pages viewed — only for analytics where you have consented.',
          'Communications: messages you send us and our replies.',
        ],
      },
      {
        heading: 'Why we use it and our legal bases',
        body: [
          'To fulfil your orders and provide customer support — necessary to perform our contract with you.',
          'To send transactional emails (order confirmations, status updates) — necessary for the contract.',
          'To improve the site and understand usage — based on your consent (analytics cookies) or our legitimate interests where permitted.',
          'To comply with tax, accounting, and other legal obligations.',
        ],
      },
      {
        heading: 'Sharing your data',
        body: [
          'We share data only with processors that help us operate: payment (Stripe), hosting and database (Google Firebase), image/media hosting (Cloudinary), email delivery (Resend), and analytics (Google Analytics) where consented.',
          'We never sell your personal information. Under the CCPA/CPRA you have the right to opt out of any "sale" or "sharing" — we do not engage in either.',
          'Some providers may process data outside your country. Where required, transfers rely on appropriate safeguards such as Standard Contractual Clauses.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'Order records are retained for as long as needed to provide the service and to meet legal/tax obligations (typically up to the statutory retention period). Analytics data is retained for a limited period and then aggregated or deleted.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Depending on where you live, you may have the right to access, correct, delete, restrict, or port your data, to object to certain processing, and to withdraw consent at any time.',
          'California residents have the rights to know, delete, correct, and to opt out of sale/sharing, without discrimination.',
          `To exercise any right, contact ${CONTACT}. You also have the right to complain to your local data protection authority.`,
        ],
      },
      { heading: 'Security', body: ['We use industry-standard measures — encryption in transit, access controls, and least-privilege rules — to protect your data. No method is perfectly secure, but we work to keep your information safe.'] },
      { heading: 'Children', body: ['Our store is not directed to children under 16, and we do not knowingly collect their data.'] },
      { heading: 'Changes', body: ['We may update this policy; the “last updated” date will change and material changes will be highlighted on the site.'] },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    updated: UPDATED,
    intro:
      'This policy explains how we use cookies and similar technologies. Non-essential cookies are only set after you opt in. ' +
      'You can change your choice at any time from the “Cookie settings” link in the footer.',
    sections: [
      { heading: 'What cookies are', body: ['Cookies are small files stored on your device. We also use similar technologies such as local storage to remember your cart and preferences.'] },
      {
        heading: 'Categories we use',
        body: [
          'Strictly necessary (always on): authentication, your shopping cart, theme and language preference, and security. The site cannot function without these, so they do not require consent.',
          'Analytics (consent required): Google Analytics, to understand how the site is used so we can improve it. Loaded only after you accept. We enable IP anonymisation and Google Consent Mode.',
          'Marketing (consent required): currently not used. If we add advertising cookies, they will appear here and remain off until you opt in.',
        ],
      },
      { heading: 'Managing cookies', body: ['Use “Cookie settings” in the footer to accept, reject, or fine-tune categories. You can also clear cookies in your browser settings. Rejecting non-essential cookies will not affect your ability to shop.'] },
      { heading: 'Retention', body: ['Necessary storage persists only as long as needed for the feature. Analytics cookies follow Google’s retention settings. Your consent choice is stored for up to 12 months, after which we ask again.'] },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    updated: UPDATED,
    intro: `These terms govern your use of the ${COMPANY} website and the purchase of products. By using the site you agree to them.`,
    sections: [
      { heading: 'Orders', body: ['An order is an offer to buy. We confirm acceptance by email. We may decline or cancel an order (e.g. pricing errors, stock, or suspected fraud) and will refund any payment taken.'] },
      { heading: 'Pricing & payment', body: ['Prices are shown in the store currency and may change. Payment is taken via our provider (Stripe) or, where offered, on pickup/delivery or by bank transfer. Custom orders may require a deposit.'] },
      { heading: 'Delivery & pickup', body: ['Delivery times and costs are confirmed after the order. Risk passes to you on delivery or pickup. Please inspect items on receipt.'] },
      { heading: 'Custom orders', body: ['Made-to-order and custom-dimension items are produced to your specification and may not be returnable except for defects, to the extent permitted by law.'] },
      { heading: 'Returns & your statutory rights', body: ['Nothing in these terms limits your non-waivable consumer rights under applicable law. Contact us to arrange a return or report a defect.'] },
      { heading: 'Liability', body: ['To the extent permitted by law, we are not liable for indirect or consequential loss. Nothing excludes liability that cannot be excluded by law.'] },
      { heading: 'Contact', body: [`Questions about these terms: ${CONTACT}.`] },
    ],
  },
};
