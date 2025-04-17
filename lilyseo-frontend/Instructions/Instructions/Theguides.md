8. Theme Guide
This guide outlines the design system used in the LilySEO platform, featuring a modern and professional look with a clean blue primary color scheme and an accessible interface.

8.1 Color Palette
Base Colors:
- Primary: hsl(220 70% 50%) - Buttons, Icons, Highlights
- Primary Hover: hsl(220 70% 45%) - Button hover states
- Accent: #FF6B6B - Accent elements, Notifications
- Dark: #333333 - Main Text, Headers
- Light: #FFFFFF - Background, Cards
- Gray: #F5F7FA - Section Backgrounds

Semantic Colors (Light Mode):
- Background: hsl(0 0% 100%)
- Foreground: hsl(240 10% 3.9%)
- Card: hsl(0 0% 100%)
- Card Foreground: hsl(240 10% 3.9%)
- Popover: hsl(0 0% 100%)
- Popover Foreground: hsl(240 10% 3.9%)
- Primary: hsl(220 70% 50%)
- Primary Foreground: hsl(0 0% 100%)
- Secondary: hsl(240 4.8% 95.9%)
- Secondary Foreground: hsl(240 5.9% 10%)
- Muted: hsl(240 4.8% 95.9%)
- Muted Foreground: hsl(240 3.8% 46.1%)
- Border: hsl(240 5.9% 90%)
- Input: hsl(240 5.9% 90%)
- Ring: hsl(220 70% 50%)

Chart Colors:
- Chart 1: hsl(220 70% 50%)
- Chart 2: hsl(160 60% 45%)
- Chart 3: hsl(30 80% 55%)
- Chart 4: hsl(280 65% 60%)
- Chart 5: hsl(340 75% 55%)

Utility Colors:
- Success Background: #DCFCE7
- Success Text: #166534
- Warning Background: #FEF9C3
- Warning Text: #854D0E
- Destructive: hsl(0 84.2% 60.2%)
- Destructive Foreground: hsl(0 0% 98%)

8.2 Typography
Primary Fonts: 
- "Poppins" (primary)
- "Montserrat" (fallback)
- sans-serif (system fallback)

Font Weights:
- Light: 300
- Regular: 400
- Medium: 500
- Semi-bold: 600
- Bold: 700

Text Sizes:
- Body: sm (14px) to base (16px)
- Headings: Scaled appropriately using Tailwind's size scale

8.3 Component Styling
Buttons:
- Primary: Background hsl(var(--primary)), text hsl(var(--primary-foreground))
- Hover: Opacity 0.9 of primary color
- Border Radius: 0.5rem (--radius)

Cards:
- Background: White or rgba(255, 255, 255, 0.8)
- Border: rgba(229, 231, 235, 0.8)
- Shadow: Subtle elevation using Tailwind's shadow utilities

Form Elements:
- Input Background: rgba(249, 250, 251, 0.8)
- Focus Ring: Primary color
- Border: rgba(229, 231, 235, 0.8)

8.4 Imagery & Iconography
- Icon Library: Lucide Icons (configured in components.json)
- Style: Clean, minimal line icons
- Custom Icons: Match the weight and style of Lucide icons

8.5 Layout & Spacing
- Border Radius: 0.5rem (configurable via --radius)
- Grid System: Tailwind's grid and flex utilities
- Spacing Scale: Tailwind's default spacing scale
- Container Max-Width: Based on Tailwind's container defaults

8.6 Dark Mode Support
The theme includes a comprehensive dark mode that inverts the color scheme while maintaining readability and contrast. Dark mode colors are defined using CSS variables and can be toggled using the 'dark' class.

8.7 Accessibility Considerations
- Contrast Ratios: Maintain WCAG 2.1 AA standard (minimum 4.5:1 for normal text)
- Focus States: Visible focus indicators for keyboard navigation
- Interactive Elements: Clear hover and active states
- Form Labels: Always visible and properly associated with inputs
- Color Usage: Never rely solely on color to convey information
