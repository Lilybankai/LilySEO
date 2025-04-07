# Competitor Analysis Implementation Plan

## Overview

This document outlines the implementation plan for the Competitor Analysis feature in Lily-SEO. The feature will allow users to track and analyze competitor websites, providing actionable insights to improve their SEO performance.

## Goals

1. Create a system to track and analyze competitor websites
2. Provide valuable comparison data between user's site and competitors
3. Generate actionable insights based on competitor analysis
4. Integrate with existing audit system while keeping it as a separate feature
5. Implement tier-based limitations on competitor tracking

## Implementation Phases

### Phase 1: Database Schema Updates

- [x] Create competitors table
  - Link to projects
  - Store competitor URL
  - Track analysis status
  - Store last analysis date
  
- [x] Create competitor_analysis table
  - Store SEO metrics (domain authority, backlinks, keywords)
  - Store technical metrics (page speed, mobile friendliness)
  - Store content metrics (word count, readability)
  - Store keyword gaps and backlink opportunities
  
- [x] Update projects table
  - Add competitor_limit field based on subscription tier
  - Add last_competitor_analysis_date field

### Phase 2: Backend Services Development

- [x] Create competitor-analysis.ts service
  - Implement logic to analyze competitor websites
  - Generate comparison data
  - Create actionable insights
  
- [x] Extend crawler.ts
  - Add function to crawl competitor websites
  - Implement rate limiting
  - Extract key metrics
  
- [x] Update queue.ts
  - Add competitor analysis job queue
  - Schedule periodic analysis based on subscription tier

### Phase 3: API Routes Development

- [x] Implement competitor management routes
  - GET/POST/DELETE /api/competitors
  - GET /api/competitors/[id]
  - POST /api/competitors/analyze
  
- [x] Implement analysis result routes
  - GET /api/competitors/analysis
  - GET /api/competitors/analysis/[id]
  - GET /api/competitors/insights
  
- [x] Add competitor summary to project dashboard API

### Phase 4: Frontend Components Development

- [ ] Create competitors page
  - List view of added competitors
  - Add/remove competitor functionality
  - Analysis status indicators
  
- [ ] Create competitor analysis dashboard
  - Overview cards with key metrics
  - Comparison charts
  - Tabs for different analysis categories
  
- [ ] Create insight components
  - Actionable recommendations
  - Opportunity cards
  - Implementation difficulty ratings
  
- [ ] Add competitor summary to project dashboard

### Phase 5: Testing and Refinement

- [ ] Perform functional testing
  - Test competitor addition/removal
  - Verify analysis process
  - Check insight generation
  
- [ ] Optimize performance
  - Improve analysis speed
  - Optimize database queries
  - Implement caching where appropriate
  
- [ ] Refine UI/UX
  - Enhance visualizations
  - Improve usability
  - Add interactive elements

## Subscription Tier Limits

- Free Tier: 1 competitor, Monthly analysis
- Pro Tier: 5 competitors, Weekly analysis
- Enterprise Tier: 10 competitors, Daily analysis

## Technical Architecture

### Database Schema

```sql
-- Competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Competitor analysis table
CREATE TABLE public.competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  seo_metrics JSONB,
  technical_metrics JSONB,
  content_metrics JSONB,
  insights JSONB
);
```

### Service Architecture

```typescript
// competitor-analysis.ts
export interface CompetitorAnalysis {
  competitorUrl: string;
  analysisDate: string;
  metrics: {
    domain: string;
    trafficEstimate: number;
    keywordCount: number;
    backlinks: number;
    domainAuthority: number;
    topKeywords: Array<{ keyword: string; position: number; volume: number; }>;
    contentGaps: Array<{ keyword: string; competitorPosition: number; volume: number; }>;
    backlinksOverlap: number;
    pageSpeed: number;
    mobileFriendliness: number;
  };
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}
```

## UI Mockups

### Competitors List Page
```
+---------------------------------------+
| Competitors                      [+]  |
+---------------------------------------+
| example.com                 [Analyze] |
| Status: Completed (2 days ago)  [✕]  |
+---------------------------------------+
| competitor.com              [Analyze] |
| Status: In progress              [✕]  |
+---------------------------------------+
```

### Competitor Analysis Dashboard
```
+---------------------------------------+
| example.com - Analysis                |
+---------------------------------------+
| Overview | Keywords | Backlinks | Tech|
+---------------------------------------+
| Domain Authority   | Page Speed      |
| You: 35/100        | You: 75/100     |
| Comp: 42/100       | Comp: 88/100    |
+---------------------------------------+
| [Chart: Keyword Rankings Comparison]  |
+---------------------------------------+
| Top Opportunities                     |
| - Improve page speed (Medium)         |
| - Target these keywords (High)        |
| - Fix technical issues (Low)          |
+---------------------------------------+
```

## Reporting

The competitor analysis will be included in the overall project reporting:

- Weekly email summaries including competitor insights
- PDF reports with competitor comparison
- Dashboard widgets showing key competitive metrics

## Development Timeline

- Phase 1: Completed ✓
- Phase 2: Completed ✓
- Phase 3: Completed ✓
- Phase 4: 2 weeks (in progress)
- Phase 5: 1 week

Estimated completion: 3 more weeks

## Success Metrics

- User engagement with competitor analysis features
- Number of implemented recommendations from insights
- Improvement in users' rankings compared to competitors
- Retention impact for users actively using competitor analysis 