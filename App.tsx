import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { ColorSchemeOption, LanguageOption, TypographyOption, type TFunction } from './types';
import { COLOR_SCHEMES, TEXTS } from './constants';
import AdminLayout from './components/admin/AdminLayout';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LaunchProvider } from './contexts/LaunchContext';
import { StoreProvider } from './contexts/StoreContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { PageSpinner } from './components/ui/Spinner';

// Code-split heavy / non-landing routes to shrink the initial bundle.
const Shop = React.lazy(() => import('./pages/Shop'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Login = React.lazy(() => import('./pages/Login'));
const UserAccount = React.lazy(() => import('./pages/UserAccount'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const Legal = React.lazy(() => import('./pages/Legal'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const Staff = React.lazy(() => import('./pages/Staff'));
const AdminTeam = React.lazy(() => import('./pages/AdminTeam'));
const AdminDev = React.lazy(() => import('./pages/AdminDev'));
const Contact = React.lazy(() => import('./pages/Contact'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
import { CookieConsent } from './components/CookieConsent';
import { ComingSoonOverlay } from './components/ComingSoonOverlay';
import { SmoothScroll } from './components/SmoothScroll';
import { initAnalytics, trackPageView } from './lib/analytics';
import { db } from './lib/firebase';
import { ADMIN_BASE, STAFF_BASE, LOGIN_PATH } from './lib/paths';

type ThemeMode = 'light' | 'dark';

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('themeMode');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return COLOR_SCHEMES[ColorSchemeOption.BlackGold].defaultMode;
};

const getInitialLanguage = (): LanguageOption => {
  if (typeof window !== 'undefined') {
    const storedLang = localStorage.getItem('language');
    if (storedLang === LanguageOption.English || storedLang === LanguageOption.Arabic) {
      return storedLang;
    }
    if (navigator.language.startsWith('ar')) {
      return LanguageOption.Arabic;
    }
  }
  return LanguageOption.English;
};

import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import StoreChrome from './components/StoreChrome';

const AppContent: React.FC = () => {
  const colorScheme = ColorSchemeOption.BlackGold;
  const typography = TypographyOption.LuxeModern;

  const { user, firstName, lastName, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState<LanguageOption>(getInitialLanguage);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [isShineAnimating, setIsShineAnimating] = useState(true);
  const [dynamicTexts, setDynamicTexts] = useState<any>(null);
  const headerRef = useRef<HTMLElement>(null);

  const [headerHeight, setHeaderHeight] = useState(0);

  // Redirection logic for onboarding
  useEffect(() => {
    // Only redirect if we are sure the user is logged in, auth is not loading,
    // and we have explicitly checked the profile and found it missing.
    if (!authLoading && user && firstName === null && lastName === null && location.pathname !== '/onboarding') {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        if (firstName === null && lastName === null) {
          navigate('/onboarding');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, firstName, lastName, authLoading, navigate, location.pathname]);

  useLayoutEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    let lastHeight = 0;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        const newHeight = headerElement.offsetHeight;
        if (newHeight !== lastHeight) {
          lastHeight = newHeight;
          document.documentElement.style.setProperty('--header-height', `${newHeight}px`);
          setHeaderHeight(newHeight);
        }
      });
    });

    observer.observe(headerElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      doc(db, 'content', 'live'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const parsedData: any = {};
          // Handle case where Firestore data might be stored as JSON strings
          for (const key in data) {
            if (typeof data[key] === 'string') {
              try {
                parsedData[key] = JSON.parse(data[key]);
              } catch (e) {
                parsedData[key] = data[key];
              }
            } else {
              parsedData[key] = data[key];
            }
          }
          setDynamicTexts(parsedData);
        }
      },
      (error) => {
        console.error("Error fetching dynamic content:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    const root = document.documentElement;
    const scheme = COLOR_SCHEMES[colorScheme][themeMode];
    root.style.setProperty('--color-primary', scheme.primary);
    root.style.setProperty('--color-primary-hsl-values', scheme.primaryHsl);
    root.style.setProperty('--color-secondary', scheme.secondary);
    root.style.setProperty('--color-background', scheme.background);
    root.style.setProperty('--color-text-primary', scheme.textPrimary);
    root.style.setProperty('--color-text-secondary', scheme.textSecondary);
    root.style.setProperty('--color-success', scheme.success);
    root.style.backgroundColor = scheme.background;
    root.style.color = scheme.textPrimary;
    // Expose theme as a class so CSS token overrides (styles/theme.css) apply.
    root.classList.toggle('dark', themeMode === 'dark');
    root.setAttribute('data-theme', themeMode);
  }, [colorScheme, themeMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('themeMode')) {
            setThemeMode(e.matches ? 'dark' : 'light');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === LanguageOption.Arabic ? 'rtl' : 'ltr';

    setIsShineAnimating(false);
    const timer = setTimeout(() => {
        setIsShineAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, [language]);

  // Analytics: init once (consent-gated), then track route changes.
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location.pathname, location.search]);

  useEffect(() => {
    document.title = 'Raafat Furniture';
  }, [location.pathname]);

  const t: TFunction = useCallback((key: string): string => {
    let text;
    if (dynamicTexts && dynamicTexts[language]) {
      text = dynamicTexts[language][key];
    }
    if (!text) {
      text = TEXTS[language]?.[key] || TEXTS[LanguageOption.English][key];
    }
    // Return '' (not the key) for truly-missing strings so callers' `|| 'fallback'`
    // works and raw i18n keys never leak into the UI.
    return text || '';
  }, [language, dynamicTexts]);
  
  const getFontClasses = () => {
    if (language === 'ar') return 'font-arabic';
    switch (typography) {
      case TypographyOption.LuxeModern:
        return 'font-body-luxe font-heading-luxe';
      default:
        return '';
    }
  };

  return (
    <div className={`${getFontClasses()} bg-[var(--color-background)] text-[var(--color-text-primary)] transition-colors duration-500 min-h-screen flex flex-col`}>
      <a href="#main-content" className="skip-link">{t('skip_to_content') || 'Skip to content'}</a>
      <SmoothScroll />
      <React.Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<AdminLayout t={t} />}>
          <Route path={ADMIN_BASE} element={<Admin t={t} language={language} />} />
          <Route path={`${ADMIN_BASE}/orders`} element={<AdminOrders t={t} />} />
          <Route path={`${ADMIN_BASE}/team`} element={<AdminTeam t={t} />} />
          <Route path={`${ADMIN_BASE}/dev`} element={<AdminDev t={t} />} />
        </Route>
        <Route path={STAFF_BASE} element={<Staff t={t} />} />
        <Route path={LOGIN_PATH.slice(1)} element={<Login t={t} />} />
        <Route path="admin/*" element={<NotFound t={t} />} />
        <Route path="staff/*" element={<NotFound t={t} />} />
        <Route path="login" element={<NotFound t={t} />} />
        <Route path="/onboarding" element={<Onboarding t={t} />} />
        <Route path="/account" element={<UserAccount t={t} />} />
        <Route path="*" element={
          <>
            <Header 
              ref={headerRef} 
              language={language} 
              setLanguage={setLanguage} 
              t={t} 
              isShineAnimating={isShineAnimating}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
            />
            <main id="main-content" className="flex-grow max-md:pb-[calc(var(--mobile-tab-height)+env(safe-area-inset-bottom,0px))]">
              <Routes>
                <Route path="/" element={<Home t={t} headerHeight={headerHeight} />} />
                <Route path="/shop" element={<Shop t={t} />} />
                <Route path="/product/:id" element={<ProductDetails t={t} />} />
                <Route path="/checkout" element={<Checkout t={t} />} />
                <Route path="/order/confirmation" element={<OrderConfirmation t={t} />} />
                <Route path="/track" element={<TrackOrder t={t} />} />
                <Route path="/contact" element={<Contact t={t} />} />
                <Route path="/faq" element={<FAQ t={t} />} />
                <Route path="/legal/:slug" element={<Legal t={t} />} />
                <Route path="*" element={<NotFound t={t} />} />
              </Routes>
            </main>
            <Footer
              t={t}
            />
            <CartDrawer t={t} />
            <AuthModal t={t} />
            <StoreChrome t={t} />
          </>
        } />
      </Routes>
      </React.Suspense>
      <CookieConsent t={t} />
      <ComingSoonOverlay t={t} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LaunchProvider>
        <CurrencyProvider>
          <StoreProvider>
            <ToastProvider>
              <Router>
                <AppContent />
              </Router>
            </ToastProvider>
          </StoreProvider>
        </CurrencyProvider>
        </LaunchProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;