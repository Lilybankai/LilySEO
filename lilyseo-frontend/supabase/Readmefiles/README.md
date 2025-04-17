# LilySEO Frontend

The LilySEO frontend is a Next.js application for SEO analysis, built with modern web technologies.

## Features

- Advanced SEO analysis and audit reports
- Project management for multiple websites
- Competitor analysis
- Detailed performance metrics
- White labeling capabilities
- Subscription management
- Toast notifications and date formatting utilities

## Technology Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
```

### Testing

Run the test suite with:

```bash
npm test
# or
npm run test:watch # for watch mode
npm run test:coverage # for coverage report
```

## Project Structure

```
lilyseo-frontend/
├── public/           # Static assets
├── src/              # Source code
│   ├── app/          # Next.js app directory (pages & layouts)
│   ├── components/   # React components
│   ├── lib/          # Utility functions and libraries
│   │   ├── date-utils.ts     # Date formatting utilities
│   │   ├── toast-utils.ts    # Toast notification utilities
│   │   └── ...               # Other utilities
│   ├── services/     # Service layer for API interactions
│   └── types/        # TypeScript type definitions
├── __mocks__/        # Test mocks
└── tests/            # Test files
```

## Utility Functions

### Toast Utilities

The `toast-utils.ts` file provides a set of functions for displaying toast notifications:

- `successToast`: Display a success message
- `errorToast`: Display an error message
- `infoToast`: Display an informational message
- `warningToast`: Display a warning message
- `dismissToast`: Dismiss a specific toast or all toasts

### Date Utilities

The `date-utils.ts` file provides functions for formatting dates and durations:

- `formatDate`: Format a date to display in the format "Jan 1, 2023"
- `formatDateTime`: Format a date to display in the format "Jan 1, 2023, 12:00 PM"
- `getRelativeTimeString`: Returns a relative time string like "2 days ago" or "in 3 hours"
- `formatDuration`: Format a duration in milliseconds to a human-readable format like "2h 30m"

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
