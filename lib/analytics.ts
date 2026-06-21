/**
 * Google Analytics 4 — consent-gated.
 * No network calls and no cookies until the user grants `analytics` consent.
 * Set VITE_GA_MEASUREMENT_ID to wire it up; absent → no-op (safe in dev).
 */
import { getConsent, onConsentChange } from './consent';

const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || '';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

let scriptInjected = false;

function injectGtag() {
  if (scriptInjected || !GA_ID || typeof document === 'undefined') return;
  scriptInjected = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // Consent Mode v2 defaults — denied until granted.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('config', GA_ID, { anonymize_ip: true, send_page_view: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

function applyConsent() {
  if (!GA_ID || !window.gtag) return;
  const c = getConsent();
  window.gtag('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied',
    ad_user_data: c.marketing ? 'granted' : 'denied',
    ad_personalization: c.marketing ? 'granted' : 'denied',
  });
}

/** Call once at app start. Injects gtag lazily only when analytics consent exists. */
export function initAnalytics() {
  if (!GA_ID) return;
  const maybeStart = () => {
    if (getConsent().analytics) {
      injectGtag();
      applyConsent();
    }
  };
  maybeStart();
  onConsentChange(() => {
    injectGtag();
    applyConsent();
  });
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag || !getConsent().analytics) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: location.href });
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  if (!GA_ID || !window.gtag || !getConsent().analytics) return;
  window.gtag('event', name, params);
}
