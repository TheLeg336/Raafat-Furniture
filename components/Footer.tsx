import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { TFunction } from '../types';
import { openCookieSettings } from './CookieConsent';

interface FooterProps {
    t: TFunction;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
    const containerVariants: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } }
    };

    const titleVariants: Variants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
    };


    return (
        <footer id="contact" className="bg-[var(--color-text-primary)] text-[var(--color-background)] py-16 sm:py-20 md:py-24 transition-colors duration-500">
            <motion.div 
                className="container mx-auto px-6"
                initial="hidden" 
                whileInView="visible" 
                viewport={{once: true, amount: 0.3}} 
                variants={containerVariants}
            >
                <motion.div variants={titleVariants} className="text-center mb-10">
                    <div className="font-heading text-3xl sm:text-4xl tracking-wide">RAAFAT</div>
                    <div className="font-heading tracking-[0.35em] text-sm opacity-80 mt-1">FURNITURE</div>
                    <div className="h-0.5 w-12 bg-[var(--color-primary)] mx-auto mt-5 rounded-full" />
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 mb-12">
                    <a href={`tel:${t('footer_phone_number')}`} className="text-lg font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity" dir="ltr">
                        {t('footer_phone_number')}
                    </a>
                    <p className="opacity-70 text-sm">{t('footer_hours')}</p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-5 text-sm"
                >
                    <p className="opacity-70 order-2 sm:order-1">
                        {t('footer_copyright')}
                    </p>
                    <nav className="order-1 sm:order-2 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label={t('legal') || 'Legal'}>
                        <Link to="/legal/privacy" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('privacy_policy') || 'Privacy Policy'}</Link>
                        <Link to="/legal/cookies" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('cookie_policy') || 'Cookie Policy'}</Link>
                        <Link to="/legal/terms" className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('terms') || 'Terms'}</Link>
                        <button onClick={openCookieSettings} className="opacity-80 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">{t('cookie_settings') || 'Cookie settings'}</button>
                    </nav>
                </motion.div>
            </motion.div>
        </footer>
    )
};

export default Footer;