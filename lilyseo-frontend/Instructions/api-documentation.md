# LilySEO API Documentation

This document provides technical details about the API endpoints implemented for the new features in LilySEO.

## Table of Contents

1. [AI Recommendations API](#ai-recommendations-api)
2. [Industry Detection API](#industry-detection-api)
3. [Google Search Console API](#google-search-console-api)
4. [Project Templates API](#project-templates-api)
5. [Authentication and Security](#authentication-and-security)

## AI Recommendations API

### Generate Recommendations

Generates AI-powered recommendations based on the website URL and other parameters.

**Endpoint:** `POST /api/ai/recommendations`

**Authentication Required:** Yes

**Request Body:**

```json
{
  "url": "https://example.com",
  "industry": "Technology",
  "keywords": ["seo", "search engine optimization"],
  "competitors": ["competitor1.com", "competitor2.com"],
  "crawlFrequency": "weekly",
  "crawlDepth": 3
}
```

**Response:**

```json
{
  "recommendations": [
    {
      "type": "keyword",
      "title": "Add Long-Tail Keywords",
      "description": "Based on your industry, consider targeting these long-tail keywords...",
      "confidence": "high"
    },
    {
      "type": "crawl_setting",
      "title": "Increase Crawl Frequency",
      "description": "Your site appears to update frequently. Consider daily crawls.",
      "confidence": "medium"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: User is not authenticated
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Error generating recommendations

### Implementation Details

The recommendations API uses Azure OpenAI to generate intelligent suggestions. The implementation is in `src/app/api/ai/recommendations/route.ts`.

The API constructs a prompt based on the provided parameters and sends it to the Azure OpenAI service. The response is then parsed and formatted as a list of recommendations.

## Industry Detection API

### Detect Industry

Automatically detects the industry of a website based on its URL.

**Endpoint:** `POST /api/ai/detect-industry`

**Authentication Required:** Yes

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "industry": "Technology"
}
```

**Error Responses:**

- `401 Unauthorized`: User is not authenticated
- `400 Bad Request`: Missing URL
- `500 Internal Server Error`: Error detecting industry

### Implementation Details

The industry detection API uses Azure OpenAI to analyze the website URL and determine the most likely industry. The implementation is in `src/app/api/ai/detect-industry/route.ts`.

The API sends a prompt to the Azure OpenAI service asking it to categorize the website into one of the predefined industry categories.

## Google Search Console API

### Generate Auth URL

Generates a URL for authenticating with Google Search Console.

**Endpoint:** `GET /api/google/auth?projectId=<project_id>`

**Authentication Required:** Yes

**Query Parameters:**

- `projectId`: The ID of the project to connect to Google Search Console

**Response:**

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

**Error Responses:**

- `401 Unauthorized`: User is not authenticated
- `400 Bad Request`: Missing project ID
- `500 Internal Server Error`: Error generating auth URL

### OAuth Callback

Handles the callback from Google OAuth and stores the tokens.

**Endpoint:** `GET /api/google/callback`

**Authentication Required:** Yes (via state parameter)

**Query Parameters:**

- `code`: The authorization code from Google
- `state`: Base64-encoded JSON containing project ID and user ID

**Response:**

Redirects to the project page with a success or error message.

**Error Responses:**

- `401 Unauthorized`: User is not authenticated or user ID doesn't match
- `400 Bad Request`: Missing code or state parameter
- `500 Internal Server Error`: Error exchanging code for tokens

### Implementation Details

The Google Search Console API implements the OAuth 2.0 flow for authenticating with Google. The implementation is in:

- `src/app/api/google/auth/route.ts`: Generates the auth URL
- `src/app/api/google/callback/route.ts`: Handles the callback and stores tokens

The API stores the tokens in the `google_search_console_connections` table in the database, with row-level security policies to ensure users can only access their own connections.

## Project Templates API

### Save Template

Saves a project template for future use.

**Endpoint:** `POST /api/templates`

**Authentication Required:** Yes

**Request Body:**

```json
{
  "name": "E-commerce Basic",
  "description": "Basic template for e-commerce websites",
  "templateData": {
    "crawl_frequency": "weekly",
    "crawl_depth": 3,
    "keywords": ["product", "buy", "shop"],
    "competitors": ["competitor1.com", "competitor2.com"]
  },
  "industry": "E-commerce"
}
```

**Response:**

```json
{
  "success": true,
  "id": "template-uuid"
}
```

**Error Responses:**

- `401 Unauthorized`: User is not authenticated
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Error saving template

### Get Templates

Gets a list of templates for the current user.

**Endpoint:** `GET /api/templates?industry=<industry>`

**Authentication Required:** Yes

**Query Parameters:**

- `industry` (optional): Filter templates by industry

**Response:**

```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "E-commerce Basic",
      "description": "Basic template for e-commerce websites",
      "industry": "E-commerce",
      "template_data": {
        "crawl_frequency": "weekly",
        "crawl_depth": 3,
        "keywords": ["product", "buy", "shop"],
        "competitors": ["competitor1.com", "competitor2.com"]
      },
      "is_default": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: User is not authenticated
- `500 Internal Server Error`: Error getting templates

### Implementation Details

The project templates API is implemented using Supabase client functions in `src/services/ai-recommendations.ts`:

- `saveProjectTemplate`: Saves a template to the database
- `getProjectTemplates`: Gets templates from the database

These functions interact with the `project_templates` table in the database, which has row-level security policies to ensure users can only access their own templates.

## Authentication and Security

All API endpoints require authentication using Supabase Auth. The authentication is implemented in the following ways:

1. **Server-Side Authentication**: API routes use the `createClient` function from `@/lib/supabase/server` to authenticate requests.

2. **Client-Side Authentication**: Client components use the `createClient` function from `@/lib/supabase/client` to authenticate requests.

3. **Row-Level Security**: Database tables have row-level security policies to ensure users can only access their own data.

### Example Server-Side Authentication

```typescript
// Authenticate the user
const supabase = await createClient()
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
```

### Example Client-Side Authentication

```typescript
const supabase = createClient()

// Get the current user
const { data: { user }, error: userError } = await supabase.auth.getUser()

if (userError || !user) {
  throw new Error("User not authenticated")
}
```

## Error Handling

All API endpoints include proper error handling to provide meaningful error messages to the client. Common error patterns include:

1. **Authentication Errors**: Return 401 Unauthorized when the user is not authenticated.

2. **Validation Errors**: Return 400 Bad Request when required fields are missing or invalid.

3. **Server Errors**: Return 500 Internal Server Error when an unexpected error occurs.

4. **Not Found Errors**: Return 404 Not Found when a requested resource doesn't exist.

### Example Error Handling

```typescript
try {
  // API logic here
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'An error occurred' },
    { status: 500 }
  )
}
``` 