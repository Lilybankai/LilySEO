# LilySEO AI Integration

This document provides information about the AI integration in LilySEO, including how to configure different AI providers for the SEO analysis feature.

## Available AI Providers

LilySEO supports the following AI providers for SEO analysis:

1. **Azure OpenAI** (Default) - Uses Microsoft Azure's OpenAI service for SEO analysis
2. **Claude** - Uses Anthropic's Claude models for SEO analysis

## User Preferences

Users can select their preferred AI provider in the dashboard settings. This preference is stored in the database and used for all future SEO analyses for that user.

## Configuration

### System Default

To configure the default AI provider at the system level, set the `AI_PROVIDER` environment variable in your `.env.local` file:

```
# AI Provider Configuration
AI_PROVIDER=azure_openai  # Options: azure_openai, claude
```

### Provider-Specific Configuration

Each provider requires specific API keys and configuration:

#### Claude

```
# Claude Configuration
CLAUDE_API_KEY=your_claude_api_key
```

#### Azure OpenAI

```
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

## Implementation Details

The AI integration is implemented with a provider pattern that allows for easy switching between different AI services:

- `src/services/ai-provider.ts` - Main entry point that selects the appropriate AI provider based on user preference
- `src/services/ai-analysis-claude.ts` - Claude implementation
- `src/services/ai-analysis-azure.ts` - Azure OpenAI implementation

All providers implement the same interface and return standardized analysis results:

```typescript
export type AiAnalysisOutput = {
  priorityIssues: string[];
  recommendations: string[];
  seoScore: number;
  summary: string;
  provider: string; // Identifies which provider was used
};
```

## User Interface

The system includes UI components for:

1. **Provider Selection**: Users can select their preferred AI provider in the dashboard settings.
2. **Feedback Collection**: After viewing an AI analysis, users can rate the quality and provide feedback.

## Monitoring and Feedback

The system includes comprehensive monitoring and feedback mechanisms:

1. **Performance Metrics**: Each AI analysis request logs performance metrics including provider, duration, and success/failure status.
2. **User Feedback**: Users can rate the quality of AI analyses on a 1-5 scale and provide text feedback.
3. **Provider Tracking**: Each analysis result includes information about which provider was used.

## Fallback Mechanism

If the selected AI provider fails, the system will automatically fall back to Azure OpenAI. If all providers fail, a default error response will be returned.

## Database Schema

The system uses the following database tables for AI provider preferences and feedback:

1. **users**: Includes an `ai_provider` column to store the user's preferred provider.
2. **ai_analysis_feedback**: Stores user feedback on AI analyses, including ratings and comments.

## Adding New Providers

To add a new AI provider:

1. Create a new implementation file (e.g., `src/services/ai-analysis-new-provider.ts`)
2. Implement the `analyzeWithAI` function with the same interface
3. Update the `AiProvider` enum in `src/services/ai-provider.ts`
4. Add the new provider to the switch statement in the main `analyzeWithAI` function
5. Update the UI components to include the new provider option

## Troubleshooting

If you encounter issues with the AI analysis:

1. Check that the correct environment variables are set for your chosen provider
2. Verify API keys are valid and have sufficient permissions/credits
3. Check the server logs for specific error messages and performance metrics
4. Review user feedback to identify patterns in provider performance
5. Try switching to a different provider temporarily to isolate the issue 