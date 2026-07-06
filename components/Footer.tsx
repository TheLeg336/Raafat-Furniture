import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import type { TFunction } from '../types';
import { openCookieSettings } from './CookieConsent';

interface FooterProps {
  t: TFunction;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } },
  };

  return (
    <footer id="footer" className="bg-[var(--color-text-primary)] text-[var(--color-background)] py-10 max-md:pb-12 md:py-14 lg:py-20 transition-colors duration-500">
      <motion.div
        className="container mx-auto px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-6 mb-10">
          <p className="font-heading text-2xl sm:text-3xl font-bold">{t('footer_tagline') || 'Raafat Furniture'}</p>
          <p className="text-sm sm:text-base opacity-80 max-w-md">{t('footer_hours')}</p>
          <a
            href={`tel:${t('footer_phone_number')}`}
            className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            dir="ltr"
          >
            <Phone size={18} aria-hidden />
            {t('footer_phone_number')}
          </a>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="pt-8 border-t border-[var(--color-background)]/15 flex flex-col sm:flex-row justify-between items-center gap-5 text-sm"
        >
          <p className="opacity-70 order-2 sm:order-1">{t('footer_copyright')}</p>
          <nav className="order-1 sm:order-2 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label={t('legal') || 'Legal'}>
            <Link to="/contact" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('contact_title') || 'Contact'}</Link>
            <Link to="/faq" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('faq_short') || 'FAQ'}</Link>
            <Link to="/track" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('track_order') || 'Track order'}</Link>
            <Link to="/legal/privacy" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('privacy_policy') || 'Privacy Policy'}</Link>
            <Link to="/legal/cookies" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('cookie_policy') || 'Cookie Policy'}</Link>
            <Link to="/legal/terms" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('terms') || 'Terms'}</Link>
            <button type="button" onClick={openCookieSettings} className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('cookie_settings') || 'Cookie settings'}</button>
          </nav>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;
