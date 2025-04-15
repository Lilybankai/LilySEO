import { getUserSubscription } from '@/services/subscription';

/**
 * Types for PDF cover page templates
 */
export interface PdfCoverTemplate {
  id: string;
  name: string;
  description: string;
  background: {
    type: 'solid' | 'gradient';
    value: string;
    gradient?: {
      from: string;
      to: string;
      angle: number;
    };
  };
  accent: string; // Accent color for text
  layout: 'classic' | 'centered' | 'card' | 'minimal';
  isPro: boolean;
}

// Default templates available in the application
export const PDF_TEMPLATES: PdfCoverTemplate[] = [
  {
    id: 'default',
    name: 'Classic Blue',
    description: 'Professional blue gradient background with centered content',
    background: {
      type: 'gradient',
      value: '#0069ff',
      gradient: {
        from: '#0069ff',
        to: '#004db8',
        angle: 135
      }
    },
    accent: '#ffffff',
    layout: 'classic',
    isPro: false
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean white background with subtle accents',
    background: {
      type: 'solid',
      value: '#ffffff',
    },
    accent: '#2563eb',
    layout: 'minimal',
    isPro: true
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Sleek dark background with modern styling',
    background: {
      type: 'solid',
      value: '#111827',
    },
    accent: '#60a5fa',
    layout: 'centered',
    isPro: true
  },
  {
    id: 'card-layout',
    name: 'Card Layout',
    description: 'Card-based layout with a clean look',
    background: {
      type: 'solid',
      value: '#f8fafc',
    },
    accent: '#2563eb',
    layout: 'card',
    isPro: true
  },
  {
    id: 'gradient-purple',
    name: 'Purple Gradient',
    description: 'Vibrant purple gradient for eye-catching reports',
    background: {
      type: 'gradient',
      value: '#8b5cf6',
      gradient: {
        from: '#8b5cf6',
        to: '#6d28d9',
        angle: 135
      }
    },
    accent: '#ffffff',
    layout: 'classic',
    isPro: true
  }
];

// Default template to use when none is selected
export const DEFAULT_TEMPLATE = PDF_TEMPLATES[0];

/**
 * Gets a template by its ID
 * @param templateId - The ID of the template to find
 * @returns The template object or the default template if not found
 */
export const getTemplateById = (templateId?: string): PdfCoverTemplate => {
  if (!templateId) return DEFAULT_TEMPLATE;
  
  const template = PDF_TEMPLATES.find(t => t.id === templateId);
  return template || DEFAULT_TEMPLATE;
};

/**
 * Fetches available templates based on user subscription
 * @param isProUser - Whether the user has a pro subscription
 * @returns Array of available templates
 */
export const getAvailableTemplates = async (isProUser?: boolean): Promise<PdfCoverTemplate[]> => {
  // In a real app, this might fetch from an API or database
  // For now, just filter based on subscription level
  
  // Simulate a short delay to mimic network request
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return either all templates or just the free ones
  return isProUser
    ? PDF_TEMPLATES
    : PDF_TEMPLATES.filter(template => !template.isPro);
};

/**
 * Gets a gradient CSS string from a template background
 * @param template - The template containing background information
 * @returns CSS gradient string or solid color
 */
export const getGradientFromTemplate = (template: PdfCoverTemplate): string => {
  if (template.background.type === 'gradient' && template.background.gradient) {
    const { from, to, angle } = template.background.gradient;
    return `linear-gradient(${angle}deg, ${from}, ${to})`;
  }
  
  return template.background.value;
};

/**
 * Determines if a template can be used by a user
 * @param template - The template to check
 * @param isProUser - Whether the user has a pro subscription
 * @returns Whether the template can be used
 */
export const canUseTemplate = (template: PdfCoverTemplate, isProUser: boolean): boolean => {
  return !template.isPro || isProUser;
}; 