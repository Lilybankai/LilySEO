# LilySEO - SEO Analysis and Optimization Platform

LilySEO is a comprehensive SEO analysis and optimization platform designed to help businesses improve their online visibility and drive organic growth. The platform provides detailed SEO audits, keyword analysis, competitor tracking, and actionable tasks to improve search engine rankings.

## Features

- **SEO Audits**: Comprehensive website analysis with detailed reports on issues and recommendations
- **Keyword Analysis**: Identify primary and secondary keywords, keyword opportunities, and density analysis
- **Performance Metrics**: Track PageSpeed Insights metrics for both mobile and desktop
- **Backlink Analysis**: Monitor backlinks, referring domains, and historical backlink growth
- **Competitor Tracking**: Compare your SEO performance against competitors
- **Task Management**: Convert SEO issues into actionable tasks with priorities
- **White-Label Capabilities**: Customize the platform with your own branding

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Charts and Visualizations**: Recharts
- **UI Components**: Radix UI, Lucide React icons

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lilyseo.git
   cd lilyseo-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
lilyseo-frontend/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   │   ├── audits/     # SEO audit components
│   │   ├── ui/         # UI components
│   │   └── white-label/ # White-label components
│   ├── lib/            # Utility functions and libraries
│   │   └── supabase/   # Supabase client and types
│   └── services/       # API services
└── ...
```

## White-Label Customization

LilySEO supports white-label customization, allowing you to:

- Replace the logo and branding
- Customize colors and themes
- Modify navigation links
- Add custom copyright information
- Configure social media links

To use white-label features, use the `WhiteLabelLayout` component with your custom props.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@lilyseo.com or open an issue in the GitHub repository.
