import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import type { TFunction } from '../types';
import { openCookieSettings } from './CookieConsent';

interface FooterProps {
    t: TFunction;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
    const branches = [
        { name: t('footer_cairo_branch_title'), address: t('footer_cairo_branch_address') },
        { name: t('footer_minya_branch_title'), address: t('footer_minya_branch_address') },
        { name: t('footer_new_minya_branch_title'), address: t('footer_new_minya_branch_address') },
    ];
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
                <motion.div variants={titleVariants} className="text-center mb-12">
                    <div className="font-heading text-3xl sm:text-4xl tracking-wide">RAAFAT</div>
                    <div className="font-heading tracking-[0.35em] text-sm opacity-80 mt-1">FURNITURE</div>
                    <div className="h-0.5 w-12 bg-[var(--color-primary)] mx-auto mt-5 rounded-full" />
                </motion.div>

                {/* Locations */}
                <div className="grid sm:grid-cols-3 gap-5 mb-10">
                    {branches.map((b, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="rounded-[var(--radius-lg)] bg-[var(--color-background)]/[0.06] p-6 flex flex-col"
                        >
                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center mb-4">
                                <MapPin size={18} />
                            </div>
                            <h3 className="font-heading text-lg font-bold text-[var(--color-primary)] mb-2">{b.name}</h3>
                            <p className="opacity-80 text-sm leading-relaxed flex-1">{b.address}</p>
                            <p className="opacity-70 text-sm mt-4 flex items-center gap-2"><Clock size={14} className="text-[var(--color-primary)]" /> {t('footer_hours')}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div variants={itemVariants} className="flex justify-center mb-12">
                    <a href={`tel:${t('footer_phone_number')}`} className="text-lg font-semibold text-[var(--color-primary)] hover:opacity-80 transition-opacity" dir="ltr">
                        {t('footer_phone_number')}
                    </a>
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