import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { ColorSchemeOption, LanguageOption, TypographyOption, type TFunction } from './types';
import { COLOR_SCHEMES, TEXTS } from './constants';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';
import UserAccount from './pages/UserAccount';
import Onboarding from './pages/Onboarding';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';

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
    if (!authLoading && user && (!firstName || !lastName) && location.pathname !== '/onboarding') {
      navigate('/onboarding');
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
    document.documentElement.dir = 'ltr';

    setIsShineAnimating(false);
    const timer = setTimeout(() => {
        setIsShineAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, [language]);
  
  const t: TFunction = useCallback((key: string): string => {
    let text;
    if (dynamicTexts && dynamicTexts[language]) {
      text = dynamicTexts[language][key];
    }
    if (!text) {
      text = TEXTS[language]?.[key] || TEXTS[LanguageOption.English][key];
    }
    return text || key;
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
      <Routes>
        <Route path="/admin" element={<Admin t={t} language={language} />} />
        <Route path="/login" element={<Login t={t} />} />
        <Route path="/onboarding" element={<Onboarding />} />
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
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Home t={t} headerHeight={headerHeight} />} />
                <Route path="/shop" element={<Shop t={t} />} />
                <Route path="/product/:id" element={<ProductDetails t={t} />} />
              </Routes>
            </div>
            <Footer 
              t={t}
            />
          </>
        } />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;