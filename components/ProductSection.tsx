import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import type { TFunction } from '../types';
import ProductSectionHeader from './ProductSectionHeader';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';

interface ProductSectionProps {
  t: TFunction;
  headerHeight: number;
}

const CategoryCardSleek: React.FC<{ category: any; t: TFunction; }> = ({ category, t }) => {
    const name = t(category.labelKey);

    return (
        <Link to={`/shop?category=${category.id}`} className="relative group text-center flex flex-col h-full block">
            <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                <img 
                    src={category.imageUrl} 
                    alt={name} 
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                {name}
            </h3>
        </Link>
    );
};

const ProductSection: React.FC<ProductSectionProps> = ({ t, headerHeight }) => {
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } }
    };
    
    const STICKY_HEADER_OFFSET = 'top-[var(--header-height)]';
    const [isSticky, setIsSticky] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (sentinelRef.current) {
                const rect = sentinelRef.current.getBoundingClientRect();
                setIsSticky(rect.top <= headerHeight + 1);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [headerHeight]);

    return (
        <section id="shop" className="bg-[var(--color-background)] transition-colors duration-500">
            <div className="relative">
                <div ref={sentinelRef} className="absolute w-full h-px pointer-events-none" />
                
                <div className={`sticky ${STICKY_HEADER_OFFSET} z-10 bg-[var(--color-background)]/90 backdrop-blur-xl transition-all duration-300 ${isSticky ? 'shadow-md' : ''}`}>
                    <div className="container mx-auto px-6 pt-12 pb-6 md:pt-20 md:pb-10">
                        <ProductSectionHeader t={t} />
                    </div>
                </div>

                <div className="container mx-auto px-6 mt-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-16 sm:pb-20 md:pb-28">
                        {CATEGORIES.map((cat) => {
                            return (
                                <motion.div 
                                    key={cat.id} 
                                    variants={itemVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.3 }}
                                    whileHover={{ scale: 1.03, y: -8 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <CategoryCardSleek 
                                      category={cat} 
                                      t={t}
                                    />
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductSection;