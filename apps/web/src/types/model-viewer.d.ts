import type * as React from 'react';
import type { ModelViewerElement } from '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement>,
        ModelViewerElement
      > & {
        src?: string;
        'ios-src'?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'ar-scale'?: 'auto' | 'fixed';
        'camera-controls'?: boolean;
        'disable-zoom'?: boolean;
        'auto-rotate'?: boolean;
        'interaction-prompt'?: 'auto' | 'none';
        'shadow-intensity'?: string;
        exposure?: string;
        alt?: string;
      };
    }
  }
}

export {};
