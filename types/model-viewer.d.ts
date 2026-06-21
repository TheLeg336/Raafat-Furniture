// Minimal JSX typing for Google's <model-viewer> web component.
import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          'ios-src'?: string;
          alt?: string;
          poster?: string;
          ar?: boolean | string;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'ar-placement'?: string;
          'camera-controls'?: boolean | string;
          'touch-action'?: string;
          'auto-rotate'?: boolean | string;
          'rotation-per-second'?: string;
          'shadow-intensity'?: string | number;
          'shadow-softness'?: string | number;
          exposure?: string | number;
          'environment-image'?: string;
          'camera-orbit'?: string;
          'field-of-view'?: string;
          'interaction-prompt'?: string;
          'disable-zoom'?: boolean | string;
          loading?: string;
          reveal?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
