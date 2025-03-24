# Lily SEO - Scheduler System

This document outlines the scheduler system for Lily SEO, which handles automated audit scheduling based on project settings.

## Architecture Overview

The scheduler system consists of two main components:

1. **Verify Audits Endpoint** (`/api/scheduler/verify-audits`): Checks which projects need audits based on their crawl frequency settings.
2. **Daily Cron Job** (`/api/cron/daily`): A daily cron job triggered by Vercel Cron that calls the verify-audits endpoint.

## Crawl Frequency Settings

Projects can have the following crawl frequency settings:

- **Daily**: Audits are scheduled every day
- **Weekly**: Audits are scheduled once per week
- **Monthly**: Audits are scheduled once per month
- **Manual**: Audits are only triggered manually by users

## Environment Variables

The scheduler system requires the following environment variables:

```
SCHEDULER_API_KEY=your-scheduler-api-key
CRON_SECRET=your-cron-secret
```

- `SCHEDULER_API_KEY`: Used to authenticate API calls to the verify-audits endpoint
- `CRON_SECRET`: Used to authenticate the cron job

## Vercel Cron Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

The `schedule` is set to `0 0 * * *`, which means the cron job will run at midnight UTC every day.

## Testing

You can manually test the scheduler by making a GET request to the verify-audits endpoint with the appropriate API key:

```bash
curl -X GET \
  https://your-site.com/api/scheduler/verify-audits \
  -H 'x-api-key: your-scheduler-api-key'
```

## Security

Both endpoints implement security measures:

1. The verify-audits endpoint requires either:
   - A valid `x-api-key` header matching `SCHEDULER_API_KEY`
   - A valid user session

2. The cron job endpoint requires a valid `Authorization: Bearer your-cron-secret` header

## Audit Limits

The scheduler respects user subscription audit limits. If a user has reached their audit limit, no new audits will be scheduled until they upgrade their subscription or the next billing cycle begins.

## Logs

All scheduler activities are logged, making it easy to track:
- When audits were scheduled
- Which projects were included
- Any errors that occurred during the scheduling process 