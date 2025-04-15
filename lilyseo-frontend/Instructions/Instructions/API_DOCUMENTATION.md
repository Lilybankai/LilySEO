# LilySEO API Documentation

This document provides a comprehensive overview of all API endpoints available in the LilySEO application. Use this as a reference when developing or maintaining the application.

## Table of Contents

- [Authentication](#authentication)
- [User Profile](#user-profile)
- [Projects](#projects)
- [Audits](#audits)
- [Crawl](#crawl)
- [GSC (Google Search Console)](#gsc)
- [Todos](#todos)
- [Notifications](#notifications)
- [Payments & Subscriptions](#payments--subscriptions)
- [White Label](#white-label)
- [API Keys](#api-keys)
- [Response Format](#response-format)

## Authentication

All API endpoints (except public ones) require authentication. The application uses Supabase for authentication.

## User Profile

### GET /api/profile

Retrieves the current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "full_name": "User Name",
    "company_name": "Company Name",
    "avatar_url": "https://example.com/avatar.jpg",
    "subscription_level": "free|pro",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### PUT /api/profile

Updates the current user's profile information.

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "company_name": "Updated Company",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "full_name": "Updated Name",
    "company_name": "Updated Company",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "updated_at": "timestamp"
  }
}
```

## Projects

### GET /api/projects

Retrieves all projects for the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-id",
      "name": "Project Name",
      "url": "https://example.com",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "status": "active|pending|completed"
    }
  ]
}
```

### POST /api/projects

Creates a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "url": "https://example.com",
  "settings": {
    "maxPagesToCrawl": 50,
    "otherSettings": "values"
  }
}
```

### GET /api/projects/[id]

Retrieves a specific project by ID.

### PUT /api/projects/[id]

Updates a specific project.

### DELETE /api/projects/[id]

Deletes a specific project.

### POST /api/projects/save-settings

Saves project settings.

### POST /api/projects/retry-scan

Retries a failed scan for a project.

### POST /api/projects/schedule-crawl

Schedules a crawl for a project.

## Audits

### GET /api/audits

Retrieves all audits for the current user.

### POST /api/audits

Creates a new audit.

### GET /api/audits/[id]

Retrieves a specific audit by ID.

## Crawl

### POST /api/crawl

Initiates a crawl for a website.

### GET /api/crawl/status/[id]

Checks the status of a crawl.

## GSC (Google Search Console)

### GET /api/gsc/auth

Initiates Google Search Console authentication.

### GET /api/gsc/callback

Callback endpoint for Google Search Console authentication.

### GET /api/gsc/sites

Retrieves all sites from Google Search Console.

### GET /api/gsc/data

Retrieves data from Google Search Console.

## Todos

### GET /api/todos

Retrieves all todos for the current user.

### POST /api/todos

Creates a new todo.

### PUT /api/todos/[id]

Updates a specific todo.

### DELETE /api/todos/[id]

Deletes a specific todo.

### GET /api/projects/todos/[projectId]

Retrieves all todos for a specific project.

## Notifications

### GET /api/notifications

Retrieves all notifications for the current user.

### PUT /api/notifications/[id]

Updates a specific notification (e.g., mark as read).

## Payments & Subscriptions

### POST /api/checkout

Creates a checkout session for subscription purchase.

### GET /api/customer-portal

Redirects to the customer portal for subscription management.

### POST /api/stripe-webhook

Webhook endpoint for Stripe events.

## White Label

### GET /api/white-label

Retrieves white label settings.

### PUT /api/white-label

Updates white label settings.

## API Keys

### GET /api/api-keys

Retrieves all API keys for the current user.

### POST /api/api-keys

Creates a new API key.

### DELETE /api/api-keys/[id]

Deletes a specific API key.

## Response Format

All API endpoints follow a consistent response format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Unauthorized Response

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

**Note:** This documentation is a living document and will be updated as the API evolves. Always refer to the latest version when developing. 