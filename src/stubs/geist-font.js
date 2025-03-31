// Stub for geist font module
console.log('GeistSans variable: --font-geist-sans-stub');
console.log('GeistMono variable: --font-geist-mono-stub');

const SANS_FALLBACK = `ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const MONO_FALLBACK = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;

export const GeistSans = {
  style: {
    fontFamily: SANS_FALLBACK,
    fontWeight: 'normal'
  },
  variable: '--font-geist-sans-stub'
};

export const GeistMono = {
  style: {
    fontFamily: MONO_FALLBACK,
    fontWeight: 'normal'
  },
  variable: '--font-geist-mono-stub'
};

// Default export might not be strictly necessary if only named imports are used
export default {
  GeistSans,
  GeistMono
}; 