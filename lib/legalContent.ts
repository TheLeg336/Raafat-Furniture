/**
 * Legal copy — drafted for WORLDWIDE compliance: EU GDPR, UK-GDPR, California
 * CCPA/CPRA, and Egypt's Personal Data Protection Law (Law No. 151 of 2020),
 * since the business ships internationally with its physical base in Egypt.
 *
 * BEFORE PUBLISHING, fill the identity blanks (search for "[" ):
 *   [BUSINESS LEGAL NAME…] · [الاسم القانوني…] · [REGISTERED ADDRESS, EGYPT] ·
 *   [privacy@DOMAIN] · [DOMAIN] · [COMMERCIAL REGISTRATION NO.] · [TAX REGISTRATION NO.]
 * Registered-name rule: if the business name is registered in Arabic, the Arabic
 * docs must state it EXACTLY as registered; the English docs use a Latin
 * transliteration followed by the registered Arabic name in parentheses.
 * A translation alone is not the legal name.
 * Returns policy: 14-day (owner-selected, pending business confirmation).
 * Custom orders: non-returnable + deposit (owner-selected).
 *
 * This is a thorough, real draft — but have a qualified lawyer in your key markets
 * review it before you go live. It is not a substitute for legal advice.
 *
 * Arabic: formal Modern Standard Arabic (فصحى قانونية) for legal compliance —
 * precise, compliant tone; not Egyptian dialect. Legal meaning matches English.
 */

export interface LegalSection { heading: string; body: string[]; }
export interface LegalDoc {
  slug: 'privacy' | 'cookies' | 'terms';
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

// English docs: Latin transliteration + registered Arabic name in parentheses.
const COMPANY = '[BUSINESS LEGAL NAME — Latin transliteration] ([REGISTERED ARABIC NAME])';
// Arabic docs: the registered Arabic name EXACTLY as it appears in the commercial register.
const COMPANY_AR = '[الاسم القانوني المسجّل بالعربية]';
const ADDRESS = '[REGISTERED ADDRESS, EGYPT]';
const ADDRESS_AR = '[العنوان المسجّل، مصر]';
const COMMERCIAL_REG = '[COMMERCIAL REGISTRATION NO.]';
const TAX_REG = '[TAX REGISTRATION NO.]';
const CONTACT = '[privacy@DOMAIN]';
const SITE = '[DOMAIN]';
const PHONE = '01010279777';
const UPDATED_EN = 'July 2026';
const UPDATED_AR = 'يوليو ٢٠٢٦';

const LEGAL_DOCS_EN: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated: UPDATED_EN,
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
          `The data controller responsible for your personal data is ${COMPANY}, with its registered place of business at ${ADDRESS}, commercial registration no. ${COMMERCIAL_REG}, tax registration no. ${TAX_REG}.`,
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
          'Launch waitlist: if you join our pre-launch waitlist, we collect your name, email, and (optionally) phone number — used only to tell you about our opening, based on your consent. You can unsubscribe at any time and we will delete your waitlist entry.',
          'Reviews: if you post a product review, the display name and review text you submit are shown publicly on the product page after moderation. Do not include personal details you do not want public; you can ask us to remove your review at any time.',
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
          'To tell you about our launch if you joined the waitlist — based on your consent, which you can withdraw at any time via the unsubscribe link or by contacting us.',
          'To comply with tax, accounting, consumer-protection, and other legal obligations — necessary for compliance with a legal obligation.',
          'Where we rely on consent, you can withdraw it at any time; this does not affect processing carried out before withdrawal.',
        ],
      },
      {
        heading: 'Who we share your data with',
        body: [
          'We share personal data only with service providers ("processors") that help us run the business, under contracts that require them to protect it and use it only on our instructions:',
          '• Payments — Stripe, Inc. and Paymob (process your card payment; each acts as an independent controller of the card data you enter on their pages).',
          '• Website hosting & content delivery — Vercel, Inc. (serves the site and processes IP addresses in server logs).',
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
    updated: UPDATED_EN,
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
    updated: UPDATED_EN,
    intro:
      `These terms govern your use of the ${COMPANY} website (${SITE}) and your purchase of our products. By using ` +
      'the site or placing an order, you agree to these terms. Please read them carefully.',
    sections: [
      {
        heading: 'About us & contact',
        body: [
          `This website is operated by ${COMPANY}, registered at ${ADDRESS}, commercial registration no. ${COMMERCIAL_REG}, tax registration no. ${TAX_REG}. You can reach us at ${CONTACT} or ${PHONE}.`,
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
          'If you are a consumer in the EU or UK, you additionally have a statutory 14-day right to withdraw from a distance purchase without giving a reason, starting the day you (or your nominated recipient) receive the goods. To exercise it, tell us clearly within that period (email is enough). This right does not apply to goods made to your specifications or clearly personalised (see Custom & made-to-order items). Consumers in Egypt enjoy the return rights provided by the Consumer Protection Law No. 181 of 2018.',
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
          'Voluntary warranty: [WARRANTY PERIOD & COVERAGE — e.g. "2-year warranty on frames and joinery; excludes normal wear, fabric, and misuse" — fill in or delete this line]. Any voluntary warranty is in addition to, and does not limit, your statutory rights.',
        ],
      },
      {
        heading: 'Events outside our control',
        body: [
          'We are not responsible for delay or failure to perform caused by events outside our reasonable control (e.g. natural disasters, war, strikes, transport or customs disruption). We will notify you, and if the delay is substantial you may cancel an affected order for a refund of any amount paid for undelivered goods (custom items already in production excepted, to the extent permitted by law).',
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
          `If we cannot resolve a complaint together, consumers in Egypt may refer it to the Consumer Protection Agency (جهاز حماية المستهلك); consumers elsewhere may use the dispute-resolution bodies available in their country. Please contact us first at ${CONTACT} — most issues are resolved quickly.`,
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

const LEGAL_DOCS_AR: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'سياسة الخصوصية',
    updated: UPDATED_AR,
    intro:
      `${COMPANY_AR} («رأفت للأثاث»، «نحن»، «لنا») تحترم خصوصيتكم وتلتزم بحماية بياناتكم الشخصية. ` +
      'توضّح هذه السياسة ما نجمعه من بيانات، وأغراض الجمع، والأسس القانونية التي نعتمد عليها، والجهات التي نشاركها معها، ' +
      'ومدد الاحتفاظ، والحقوق المقرّرة لكم. وتسري على كل من يستخدم موقعنا أو يشتري منا في أي مكان في العالم، ' +
      'بما في ذلك اللائحة العامة لحماية البيانات (GDPR) في الاتحاد الأوروبي والمملكة المتحدة، وقانون خصوصية المستهلك في كاليفورنيا (CCPA/CPRA)، وقانون حماية البيانات الشخصية المصري (رقم ١٥١ لسنة ٢٠٢٠).',
    sections: [
      {
        heading: 'من نحن',
        body: [
          `المسؤول عن معالجة بياناتكم الشخصية (مراقب البيانات) هو ${COMPANY_AR}، ومقرّه المسجّل في ${ADDRESS_AR}، سجل تجاري رقم ${COMMERCIAL_REG}، وتسجيل ضريبي رقم ${TAX_REG}.`,
          `لأي استفسار يتعلق بالخصوصية أو لممارسة حقوقكم، يُرجى التواصل معنا عبر ${CONTACT} أو الاتصال على ${PHONE}.`,
          'إذا اقتضى القانون تعيين ممثل أو مسؤول حماية بيانات في سوق معيّن، فستُضاف بيانات التواصل الخاصة به هنا.',
        ],
      },
      {
        heading: 'البيانات الشخصية التي نجمعها',
        body: [
          'بيانات الحساب والملف الشخصي: الاسم، وعنوان البريد الإلكتروني، ورقم الهاتف، وتفاصيل التوصيل والتفضيلات إن اخترتم حفظها.',
          'بيانات الطلب والمعاملة: المنتجات التي تطلبونها، ورقم الطلب، وطريقة الاستيفاء (الاستلام من المعرض، أو التوصيل، أو الطلب المخصّص)، وعنوان التوصيل، وسجل الطلبات.',
          'بيانات الدفع: تُعالَج مدفوعات البطاقات مباشرةً لدى مزوّدي الدفع (Stripe, Inc. للبطاقات والمحافظ الدولية؛ وPaymob للبطاقات في مصر). أما إنستاباي والتحويلات البنكية فتُجرى مباشرةً من تطبيقكم المصرفي — ولا نستلم سوى مرجع التحويل الذي تزودوننا به. لا نجمع رقم البطاقة الكامل ولا نخزّنه على خوادمنا؛ وإنما نستلم تأكيدًا وبيانات وصفية محدودة عن المعاملة.',
          'البيانات التقنية وبيانات الاستخدام: عنوان بروتوكول الإنترنت (IP)، ونوع الجهاز والمتصفح، والصفحات التي تمت زيارتها. ولا نجمع بيانات التحليلات إلا بموافقتكم (انظر سياسة ملفات تعريف الارتباط).',
          'تشخيص الموثوقية: إذا واجه الموقع خطأً تقنيًا، فقد نسجّل بصمت تشخيصًا موجزًا (رسالة الخطأ، ومسار الصفحة، وجهة تقريبية، ونوع المتصفح) لتمكين المطوّرين من إصلاح الأعطال. ولا يشمل ذلك محتويات النماذج، أو تفاصيل الدفع، أو كلمات المرور، أو إطارات الكاميرا، أو الموقع الجغرافي الدقيق، ولا يُستخدم لأغراض إعلانية.',
          'المراسلات: الرسائل التي ترسلونها إلينا (مثل الاستفسارات وطلبات التصنيع المخصّص) وردودنا عليها.',
          'قائمة الانتظار قبل الافتتاح: إذا انضممتم إلى قائمة الانتظار، نجمع الاسم والبريد الإلكتروني ورقم الهاتف (اختياريًا) — وتُستخدم فقط لإبلاغكم بافتتاحنا، استنادًا إلى موافقتكم. ويمكنكم إلغاء الاشتراك في أي وقت وسنحذف قيدكم من القائمة.',
          'المراجعات: إذا نشرتم مراجعة لمنتج، فإن الاسم المعروض ونص المراجعة اللذين تقدمونهما يُعرضان علنًا على صفحة المنتج بعد المراجعة والاعتماد. يُرجى عدم تضمين بيانات شخصية لا ترغبون في إظهارها للعامة؛ ويمكنكم طلب إزالة مراجعتكم في أي وقت.',
          'لا نجمع عمدًا بيانات من فئة خاصة (حسّاسة)، ونطلب منكم عدم إرسالها إلينا.',
        ],
      },
      {
        heading: 'أغراض استخدام بياناتكم والأسس القانونية',
        body: [
          'لإنشاء حسابكم، ومعالجة طلباتكم واستيفائها، وتقديم دعم العملاء — وهو أمر ضروري لتنفيذ العقد المبرم معكم (أو، إن لم تكونوا عملاء بعد، لاتخاذ خطوات بناءً على طلبكم قبل إبرام العقد).',
          'لإرسال رسائل المعاملات إليكم، مثل تأكيدات الطلب وإيصالات الدفع وتحديثات التوصيل أو الاستلام — وهو أمر ضروري للعقد.',
          'لتشغيل موقعنا وتأمينه وتحسينه ومنع الاحتيال — استنادًا إلى مصالحنا المشروعة، مع مراعاة حقوقكم، وإلى الموافقة حيث يقتضي القانون ذلك (مثل ملفات تعريف الارتباط الخاصة بالتحليلات).',
          'لتشخيص الأعطال التقنية على الموقع وإصلاحها (تقارير أخطاء صامتة) — استنادًا إلى مصالحنا المشروعة في الحفاظ على موثوقية المتجر وأمنه؛ ومقصور على التشخيص التقني المبيّن أعلاه.',
          'لفهم كيفية استخدام الموقع — استنادًا إلى موافقتكم (التحليلات).',
          'لإبلاغكم بافتتاحنا إذا انضممتم إلى قائمة الانتظار — استنادًا إلى موافقتكم، ويمكنكم سحبها في أي وقت عبر رابط إلغاء الاشتراك أو بالتواصل معنا.',
          'للامتثال للالتزامات الضريبية والمحاسبية وحماية المستهلك وسائر الالتزامات القانونية — وهو أمر ضروري للامتثال لالتزام قانوني.',
          'حيث نعتمد على الموافقة، يجوز لكم سحبها في أي وقت؛ ولا يؤثر ذلك على المعالجة التي جرت قبل السحب.',
        ],
      },
      {
        heading: 'الجهات التي نشارك معها بياناتكم',
        body: [
          'نشارك البيانات الشخصية فقط مع مزوّدي خدمات («معالجين») يساعدوننا في تشغيل الأعمال، بموجب عقود تُلزمهم بحمايتها واستخدامها وفق تعليماتنا فحسب:',
          '• المدفوعات — Stripe, Inc. وPaymob (يعالجان دفع البطاقة؛ ويعمل كل منهما كمراقب مستقل لبيانات البطاقة التي تدخلونها على صفحاتهما).',
          '• استضافة الموقع وتوصيل المحتوى — Vercel, Inc. (تخدم الموقع وتعالج عناوين IP في سجلات الخادم).',
          '• الاستضافة وقاعدة البيانات والمصادقة وتخزين الملفات — Google Firebase / Google Cloud.',
          '• استضافة صور المنتجات وتوصيلها — Cloudinary.',
          '• تسليم البريد الإلكتروني للمعاملات — Resend.',
          '• تحليلات الموقع — Google Analytics 4 (فقط بموافقتكم؛ مع تفعيل إخفاء عنوان IP ووضع موافقة جوجل).',
          'وقد نفصح عن البيانات أيضًا حيث يقتضي القانون ذلك، أو لإنفاذ شروطنا، أو لحماية حقوقنا أو عملائنا أو الجمهور.',
          'نحن لا نبيع معلوماتكم الشخصية، ولا «نشاركها» لأغراض الإعلان السلوكي عبر السياقات بالمعنى المعرّف في قانون CCPA/CPRA.',
        ],
      },
      {
        heading: 'نقل البيانات دوليًا',
        body: [
          'نظرًا لبيعنا دوليًا واستخدامنا للمزوّدين المذكورين أعلاه، قد تُعالَج بياناتكم الشخصية في بلدان خارج بلدكم، بما في ذلك الولايات المتحدة والاتحاد الأوروبي.',
          'حيث ننقل بيانات شخصية خارج المنطقة الاقتصادية الأوروبية أو المملكة المتحدة أو مصر إلى بلد لا يحظى بقرار كفاية، نعتمد على ضمانات مناسبة مثل البنود التعاقدية القياسية للمفوضية الأوروبية (وإضافة المملكة المتحدة) مع تدابير تقنية وتنظيمية إضافية.',
        ],
      },
      {
        heading: 'مدة احتفاظنا ببياناتكم',
        body: [
          'نحتفظ بسجلات الطلبات والمعاملات طالما كان ذلك لازمًا لتقديم الخدمة وللوفاء بالتزاماتنا القانونية والضريبية والمحاسبية (وهي في كثير من الولايات القضائية تمتد لعدة سنوات بعد الطلب).',
          'تُحفظ بيانات الحساب طوال فترة نشاط الحساب ولفترة معقولة بعدها. وتُحتفظ ببيانات التحليلات لمدة محدودة ثم تُجمَّع أو تُحذف. ويُخزَّن اختيار موافقتكم على ملفات تعريف الارتباط لمدة تصل إلى ١٢ شهرًا، وبعدها نطلب منكم مجددًا.',
        ],
      },
      {
        heading: 'حقوقكم',
        body: [
          'بحسب مكان إقامتكم، تتمتعون ببعض أو كل الحقوق التالية: الوصول إلى بياناتكم؛ وتصحيحها؛ ومحوها؛ وتقييد المعالجة أو الاعتراض عليها؛ وقابلية نقل البيانات؛ وسحب الموافقة في أي وقت.',
          'الاتحاد الأوروبي / المملكة المتحدة (GDPR): الحقوق أعلاه، إضافةً إلى حق تقديم شكوى إلى السلطة الرقابية المحلية.',
          'كاليفورنيا (CCPA/CPRA): حقوق المعرفة والمحو والتصحيح؛ والانسحاب من «البيع» أو «المشاركة» (ونحن لا نقوم بأي منهما)؛ وتقييد استخدام المعلومات الشخصية الحسّاسة؛ وعدم التمييز بسبب ممارستكم لحقوقكم.',
          'مصر (قانون ١٥١/٢٠٢٠): حقوق الإخطار والوصول والتصحيح والمحو وسحب الموافقة والاعتراض على معالجة بياناتكم الشخصية.',
          `لممارسة أي حق، يُرجى التواصل معنا عبر ${CONTACT}. وسنتحقق من هويتكم ونرد خلال المدة التي يقتضيها القانون المعمول به. ويجوز لكم الاستعانة بوكيل مفوّض حيث يسمح القانون بذلك.`,
        ],
      },
      {
        heading: 'الأمان',
        body: [
          'نستخدم تدابير معيارية في الصناعة لحماية بياناتكم، بما في ذلك التشفير أثناء النقل (HTTPS)، وضوابط الوصول، وقواعد أمان قاعدة البيانات بأقل صلاحيات لازمة، وخطافات الدفع (webhooks) المتحقَّق من توقيعها. ولا توجد طريقة نقل أو تخزين آمنة تمامًا، غير أننا نعمل باستمرار على حماية معلوماتكم، وسنُخطركم والسلطات المختصة بأي خرق لبيانات شخصية حيث يقتضي القانون ذلك.',
        ],
      },
      {
        heading: 'الأطفال',
        body: [
          'متجرنا موجّه للبالغين وليس موجّهًا للأطفال. ولا نجمع عمدًا بيانات شخصية من أطفال دون سن ١٦ عامًا (أو سن الموافقة الرقمية في بلدكم). وإذا اعتقدتم أن طفلًا قد زوّدنا ببيانات، فيُرجى التواصل معنا وسنقوم بحذفها.',
        ],
      },
      {
        heading: 'التعديلات على هذه السياسة',
        body: [
          'يجوز لنا تحديث هذه السياسة من حين لآخر. وسيُغيَّر تاريخ «آخر تحديث»، وسنُبرز التغييرات الجوهرية على الموقع. يُرجى مراجعتها دوريًا.',
        ],
      },
      {
        heading: 'كيفية تقديم شكوى',
        body: [
          `إذا كان لديكم أي قلق، فيُرجى التواصل معنا أولًا عبر ${CONTACT}. كما يحق لكم تقديم شكوى إلى سلطة حماية بيانات: في مصر، مركز حماية البيانات الشخصية؛ وفي الاتحاد الأوروبي، السلطة الرقابية المحلية؛ وفي المملكة المتحدة، مكتب مفوّض المعلومات (ICO)؛ وفي كاليفورنيا، وكالة حماية الخصوصية في كاليفورنيا أو النائب العام.`,
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    title: 'سياسة ملفات تعريف الارتباط',
    updated: UPDATED_AR,
    intro:
      'توضّح هذه السياسة كيفية استخدام رأفت للأثاث لملفات تعريف الارتباط والتقنيات المماثلة (مثل التخزين المحلي في المتصفح). ' +
      'ولا نضع ملفات تعريف الارتباط غير الضرورية إلا بعد موافقتكم. ويمكنكم تغيير اختياركم في أي وقت عبر رابط «إعدادات ملفات تعريف الارتباط» في تذييل الموقع.',
    sections: [
      {
        heading: 'ما هي ملفات تعريف الارتباط والتقنيات المماثلة',
        body: [
          'ملفات تعريف الارتباط هي ملفات نصية صغيرة تُخزَّن على جهازكم. ونستخدم أيضًا تقنيات مماثلة مثل التخزين المحلي لتذكّر سلة التسوق والمظهر واللغة بين الزيارات. وبعضها يُعيَّن من قِبلنا (طرف أول) وبعضها من قِبل مزوّدينا (طرف ثالث).',
        ],
      },
      {
        heading: 'الفئات التي نستخدمها',
        body: [
          'ضرورية تمامًا (مفعّلة دائمًا، ولا تتطلب موافقة): تسجيل الدخول/المصادقة، وسلة التسوق والعناصر المحفوظة، وتفضيل المظهر واللغة، والأمان، وسجل اختياركم لملفات تعريف الارتباط، وتشخيص أخطاء تقنية محدود يُستخدم فقط للحفاظ على عمل الموقع (رسالة الخطأ ومسار الصفحة — دون محتويات النماذج أو المدفوعات أو بيانات الكاميرا). ولا يمكن للموقع أن يعمل على النحو السليم دونها.',
          'التحليلات (تتطلب موافقة): Google Analytics 4، لفهم كيفية استخدام الموقع وتحسينه. ولا تُحمَّل إلا بعد قبولكم. ونفعّل إخفاء عنوان IP ووضع موافقة جوجل، فلا تُعيَّن ملفات تعريف ارتباط للتحليلات حتى توافقوا.',
          'التسويق (يتطلب موافقة): لا نستخدم حاليًا أي ملفات تعريف ارتباط إعلانية أو تسويقية. وإذا أضفناها مستقبلًا فستظهر في هذه الفئة وستظل معطّلة حتى توافقوا.',
          'وقد تُعيَّن أيضًا ملفات تعريف ارتباط لطرف ثالث عند استخدامكم Stripe Checkout أو Paymob (للدفع) أو تسجيل الدخول عبر Google؛ وتخضع تلك الملفات لسياسات الخصوصية وملفات تعريف الارتباط الخاصة بهؤلاء المزوّدين.',
        ],
      },
      {
        heading: 'إدارة اختياراتكم',
        body: [
          'استخدموا «إعدادات ملفات تعريف الارتباط» في تذييل الموقع لقبول الكل، أو رفض غير الضروري، أو ضبط كل فئة بدقة. ويمكنكم أيضًا حظر ملفات تعريف الارتباط أو حذفها من إعدادات المتصفح. ورفض الملفات غير الضرورية لا يمنعكم من التصفح أو الشراء — وإنما يؤثر فقط على التحليلات الاختيارية.',
        ],
      },
      {
        heading: 'مدة الاحتفاظ',
        body: [
          'يستمر التخزين الضروري فقط طالما كان لازمًا للميزة (الجلسة، وسلة التسوق، والتفضيلات). وتتبع ملفات تعريف ارتباط التحليلات إعدادات الاحتفاظ لدى جوجل. ويُخزَّن اختيار موافقتكم لمدة تصل إلى ١٢ شهرًا، وبعدها نطلب منكم مجددًا.',
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'شروط الخدمة',
    updated: UPDATED_AR,
    intro:
      `تحكم هذه الشروط استخدامكم لموقع ${COMPANY_AR} (${SITE}) وشراءكم لمنتجاتنا. وباستخدامكم ` +
      'الموقع أو تقديم طلب، فإنكم توافقون على هذه الشروط. يُرجى قراءتها بعناية.',
    sections: [
      {
        heading: 'من نحن وبيانات التواصل',
        body: [
          `يُشغَّل هذا الموقع من قِبل ${COMPANY_AR}، المسجّلة في ${ADDRESS_AR}، سجل تجاري رقم ${COMMERCIAL_REG}، وتسجيل ضريبي رقم ${TAX_REG}. ويمكنكم التواصل معنا عبر ${CONTACT} أو ${PHONE}.`,
        ],
      },
      {
        heading: 'الأهلية',
        body: [
          'يجب أن يكون عمركم ١٨ عامًا على الأقل (أو سن الرشد في بلد إقامتكم) وأن تكونوا قادرين على إبرام عقد ملزم لتقديم طلب.',
        ],
      },
      {
        heading: 'الطلبات',
        body: [
          'عند تقديمكم طلبًا، فإنكم تقدّمون عرضًا للشراء. ولا ينعقد العقد إلا عند تأكيدنا قبول طلبكم (على سبيل المثال، بتأكيد عبر البريد الإلكتروني).',
          'يجوز لنا رفض طلب أو إلغاؤه — على سبيل المثال بسبب خطأ في السعر أو الوصف، أو عدم توفّر المخزون، أو الاشتباه في احتيال، أو تعذّر التوصيل إلى منطقتكم — وإذا كنتم قد دفعتم بالفعل، فسنقوم برد المبلغ إليكم.',
        ],
      },
      {
        heading: 'الأسعار والدفع',
        body: [
          'تُعرض الأسعار بعملة المتجر ويجوز تغييرها في أي وقت، غير أن التغييرات لا تؤثر على الطلبات التي قبلناها بالفعل. وحيث يظهر على المنتج «السعر عند الطلب»، فسنؤكّد السعر قبل قبول طلبكم.',
          'يمكنكم الدفع بالبطاقة بما في ذلك Apple Pay وGoogle Pay (عبر Stripe أو، في مصر، Paymob)، أو عبر إنستاباي أو التحويل البنكي (بعد التحقق من مرجع المعاملة الذي تزودوننا به)، أو — لطلبات الاستلام في مصر — نقدًا عند الاستلام. ويجب سداد طلبات التوصيل بالكامل عند تقديم الطلب. وتشمل أسعار الطلبات داخل مصر ضريبة القيمة المضافة بنسبة ١٤٪؛ أما الصادرات فمعفاة من الضريبة (صفرية المعدل) وأي رسوم جمركية أو ضرائب استيراد تقع على عاتقكم. ولا تنتقل ملكية البضاعة إليكم إلا بعد استلامنا الدفع بالكامل.',
          'تكون الأسعار شاملة أو غير شاملة للضرائب المعمول بها حسب ما يُبيَّن عند إتمام الشراء؛ وأنتم مسؤولون عن أي رسوم جمركية أو ضرائب استيراد حيثما تنطبق.',
        ],
      },
      {
        heading: 'التوصيل والاستلام',
        body: [
          'بالنسبة لطلبات التوصيل، تُؤكَّد مواعيد التوصيل وأي رسوم توصيل بعد تقديم الطلب، استنادًا إلى المنتجات وموقعكم. وبالنسبة لطلبات الاستلام، سنُعلمكم عندما يصبح طلبكم جاهزًا للاستلام من أحد معارضنا.',
          'ينتقل خطر الفقد أو التلف إليكم عند تسليم البضاعة إليكم (أو إلى المستلم الذي عيّنتموه) أو عند استلامها من المعرض. يُرجى فحص المنتجات عند الاستلام وإبلاغنا فورًا بأي مشكلة.',
        ],
      },
      {
        heading: 'الإرجاع والإلغاء',
        body: [
          'يجوز لكم إرجاع معظم المنتجات القياسية (المتوفرة في المخزون) غير المستخدمة وغير التالفة خلال ١٤ يومًا من التسليم أو الاستلام مقابل استرداد، بشرط أن تكون بحالتها وتغليفها الأصليين. وأنتم مسؤولون عن شحن الإرجاع ما لم يكن المنتج معيبًا أو غير صحيح. وتُصدر المبالغ المستردة إلى وسيلة الدفع الأصلية خلال فترة معقولة بعد استلامنا للمنتج وفحصه.',
          'إذا كنتم مستهلكين في الاتحاد الأوروبي أو المملكة المتحدة، فلكم إضافةً إلى ذلك حق نظامي في العدول عن الشراء عن بُعد خلال ١٤ يومًا دون إبداء أسباب، تبدأ من يوم استلامكم (أو استلام من عيّنتموه) للبضاعة. ولممارسته، أبلغونا بوضوح خلال تلك المدة (يكفي البريد الإلكتروني). ولا يسري هذا الحق على البضائع المصنوعة وفق مواصفاتكم أو المخصّصة بوضوح (انظر المنتجات المخصّصة). ويتمتع المستهلكون في مصر بحقوق الإرجاع المقرّرة بقانون حماية المستهلك رقم ١٨١ لسنة ٢٠١٨.',
          'وفي جميع الأحوال، لا يقيّد أي مما ورد هنا حقوقكم النظامية غير القابلة للتنازل كمستهلكين، والتي تسري دائمًا حيث يكون المنتج معيبًا أو تالفًا أو غير مطابق للوصف.',
        ],
      },
      {
        heading: 'المنتجات المخصّصة والمصنوعة حسب الطلب',
        body: [
          'تُنتَج المنتجات المخصّصة والمصنوعة حسب الطلب وذات المقاسات المخصّصة خصيصًا لكم. ويُشترط دفع عربون غير قابل للاسترداد قبل بدء التصنيع، ولا يمكن إلغاء هذه المنتجات أو إرجاعها بعد بدء التصنيع، إلا حيث يكون المنتج معيبًا أو غير مطابق للوصف. ويستحق الرصيد وفق ما يُتفق عليه قبل التوصيل أو الاستلام.',
          'ولا تتأثر حقوقكم النظامية فيما يتعلق بالبضاعة المعيبة أو الموصوفة وصفًا غير صحيح.',
        ],
      },
      {
        heading: 'الضمان والمنتجات المعيبة',
        body: [
          'نلتزم بجودة أثاثنا. وإذا كان منتج معيبًا أو تالفًا أثناء النقل أو غير مطابق للوصف، فيُرجى التواصل معنا فورًا وسنقوم بإصلاحه أو استبداله أو رد ثمنه وفق ما يقتضيه قانون حماية المستهلك الساري عليكم.',
          'الضمان الاختياري: [مدة الضمان ونطاقه — مثال: «ضمان سنتان على الهياكل والنجارة؛ ويستثنى البِلى الطبيعي والأقمشة وسوء الاستخدام» — أكمِلوا هذا البند أو احذفوه]. وأي ضمان اختياري يكون بالإضافة إلى حقوقكم النظامية ولا يقيّدها.',
        ],
      },
      {
        heading: 'الظروف الخارجة عن إرادتنا',
        body: [
          'لا نتحمل المسؤولية عن التأخير أو التعذّر في التنفيذ الناجم عن ظروف خارجة عن سيطرتنا المعقولة (مثل الكوارث الطبيعية، أو الحروب، أو الإضرابات، أو اضطراب النقل أو الجمارك). وسنُخطركم بذلك، وإذا كان التأخير جوهريًا جاز لكم إلغاء الطلب المتأثر واسترداد أي مبلغ دفعتموه عن بضاعة لم تُسلَّم (باستثناء المنتجات المخصّصة التي بدأ تصنيعها، في الحدود التي يسمح بها القانون).',
        ],
      },
      {
        heading: 'الاستخدام المقبول والملكية الفكرية',
        body: [
          'جميع محتويات هذا الموقع — بما في ذلك النصوص والصور والشعارات والنماذج ثلاثية الأبعاد والتصميم — مملوكة لنا أو لمرخّصينا ومحمية بقوانين الملكية الفكرية. ولا يجوز لكم نسخها أو إعادة بيعها أو إساءة استخدامها. وتوافقون على عدم استخدام الموقع بصورة غير مشروعة، أو التدخل في تشغيله، أو محاولة الوصول غير المصرّح به.',
        ],
      },
      {
        heading: 'المسؤولية',
        body: [
          'إلى أقصى حد يسمح به القانون، لا نتحمل المسؤولية عن الخسائر غير المباشرة أو العرضية أو التبعية الناشئة عن استخدامكم للموقع أو لمنتجاتنا. ولا يستبعد أي مما ورد في هذه الشروط أو يقيّد مسؤولية لا يجوز استبعادها أو تقييدها بموجب القانون (بما في ذلك المسؤولية عن الوفاة أو الإصابة الشخصية الناجمة عن الإهمال، أو الاحتيال، أو حقوقكم غير القابلة للتنازل كمستهلكين).',
        ],
      },
      {
        heading: 'القانون الحاكم وتسوية النزاعات',
        body: [
          'تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص محاكم مصر بالنظر فيها — دون حرمانكم من أي حماية تمنحها لكم قوانين حماية المستهلك الإلزامية في البلد الذي تقيمون فيه.',
          `إذا تعذّر علينا حل شكوى بالتراضي، يجوز للمستهلكين في مصر إحالتها إلى جهاز حماية المستهلك؛ وللمستهلكين في بلدان أخرى اللجوء إلى جهات تسوية النزاعات المتاحة في بلدهم. يُرجى التواصل معنا أولًا عبر ${CONTACT} — فمعظم المسائل تُحل سريعًا.`,
        ],
      },
      {
        heading: 'التعديلات على هذه الشروط',
        body: [
          'يجوز لنا تحديث هذه الشروط من حين لآخر. وتسري على كل طلب النسخة المعمول بها وقت تقديمه. ويبيّن تاريخ «آخر تحديث» آخر مرة عُدِّلت فيها.',
        ],
      },
    ],
  },
};

/** Prefer Arabic when lang starts with `ar`; otherwise English. */
export function getLegalDocs(lang?: string): Record<LegalDoc['slug'], LegalDoc> {
  return lang?.toLowerCase().startsWith('ar') ? LEGAL_DOCS_AR : LEGAL_DOCS_EN;
}

/** @deprecated Use getLegalDocs(lang) — kept for imports that expect a static map (defaults to EN). */
export const LEGAL_DOCS = LEGAL_DOCS_EN;
