4. Frontend Guidelines Document
4.1 Folder Structure
bash
Copy
Edit
/src
  /components
    /ui          # shadcn-based UI components
    /layout      # global layout components
    ...
  /pages
    /dashboard
    /auth
    ...
  /services      # utility functions, API calls
  /styles        # global CSS, theme overrides
  ...
4.2 Styling & Theming
shadcn Components: Ensure consistency across all UI elements.
Global Theme: Defined in a central theme file (see Theme Guide).
Responsiveness: Use Tailwind classes (if integrated) or CSS media queries to ensure mobile-first design.
4.3 Coding Standards
Linting: ESLint + Prettier for code formatting and quality checks.
TypeScript: Strongly recommended for type safety (if possible within your chosen setup).
Naming Conventions:
Components: PascalCase
Hooks & Utility Functions: camelCase
Constants: SCREAMING_SNAKE_CASE
4.4 Accessibility
ARIA Labels: Provide descriptive labels for interactive elements.
Color Contrast: Ensure text/background contrast meets WCAG AA standards (especially important with bright accent colors).
Keyboard Navigation: All interactive elements must be reachable via keyboard.
4.5 Testing
Unit Testing: React Testing Library / Jest for component-level tests.
Integration Testing: Cypress or Playwright for end-to-end tests.