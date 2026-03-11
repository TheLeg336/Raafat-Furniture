import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';

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
                <motion.h2 
                    variants={titleVariants}
                    className="text-3xl sm:text-4xl text-center font-bold mb-12"
                >
                    {t('footer_locations_title')}
                </motion.h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center sm:text-start">
                    <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-bold text-[var(--color-primary)] mb-3">
                            {t('footer_cairo_branch_title')}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                            {t('footer_cairo_branch_address')}
                        </p>
                        <p className="opacity-70 text-sm mt-2">
                            {t('footer_hours')}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-bold text-[var(--color-primary)] mb-3">
                           {t('footer_minya_branch_title')}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                             {t('footer_minya_branch_address')}
                        </p>
                        <p className="opacity-70 text-sm mt-2">
                            {t('footer_hours')}
                        </p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-bold text-[var(--color-primary)] mb-3">
                             {t('footer_new_minya_branch_title')}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                             {t('footer_new_minya_branch_address')}
                        </p>
                        <p className="opacity-70 text-sm mt-2">
                             {t('footer_hours')}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h3 className="text-xl font-bold text-[var(--color-primary)] mb-3">
                            {t('footer_phone_title')}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                          {t('footer_phone_label')}
                          {' '}
                          <span className="inline-block" dir="ltr">
                             {t('footer_phone_number')}
                          </span>
                        </p>
                    </motion.div>
                </div>

                <motion.div 
                    variants={itemVariants} 
                    className="text-center text-sm text-[var(--color-text-secondary)] mt-16 pt-8 border-t border-[var(--color-secondary)]/30 flex flex-col sm:flex-row justify-between items-center gap-4"
                >
                    <p>
                        {t('footer_copyright')}
                    </p>
                </motion.div>
            </motion.div>
        </footer>
    )
};

export default Footer;