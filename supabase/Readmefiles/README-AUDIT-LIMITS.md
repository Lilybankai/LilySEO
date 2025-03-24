# Audit Limits Feature Implementation

This document outlines the implementation of the audit limits feature in LilySEO, which restricts the number of audits a user can perform based on their subscription plan.

## Overview

The audit limits feature ensures that users stay within the allocated audit quota for their subscription plan. Free users are limited to 10 audits per month, while paid plans have higher limits.

## Components Implemented

1. **Database Changes**
   - Added `audit_usage` JSONB field to the `subscriptions` table to track audit usage
   - Updated the `plans` table to include `auditsPerMonth` in the features field
   - Created triggers to automatically increment usage and reset it at the start of a new billing period

2. **Backend API**
   - Created `/api/users/me/audit-limits` endpoint to check current audit limits
   - Updated audit creation endpoints to check limits before creating new audits
   - Added quick audit endpoint for one-click audits with default settings

3. **Frontend Components**
   - Added audit limit warnings in the audit creation page
   - Implemented status badges to show audit progress
   - Created real-time audit status display component
   - Added toast notifications for limit-related messages

4. **User Experience**
   - Added both quick and custom audit options
   - Implemented clear warnings when approaching limits
   - Disabled audit creation when limits are reached
   - Added upgrade prompts for users who reach their limits

## Usage

Users can initiate audits in two ways:

1. **Quick Audit**: One-click audit with default settings from the project page
2. **Custom Audit**: Detailed configuration page for customized audits

Both methods check the user's remaining audit quota before proceeding.

## Subscription Tiers

The audit limits are set according to the following subscription tiers:

- **Free**: 10 audits per month
- **Pro**: 50 audits per month
- **Business**: 200 audits per month
- **Enterprise**: Unlimited audits

## Technical Implementation

### Database Migration

A new migration file (`20240617_audit_limits.sql`) has been created to:
- Update the plans table with audit limits
- Add audit usage tracking to the subscriptions table
- Create triggers to reset usage at the start of a new billing period
- Create triggers to increment usage when a new audit is created

### API Endpoints

- `GET /api/users/me/audit-limits`: Returns the user's current audit usage and limits
- `POST /api/audits`: Checks limits before creating a new audit
- `GET /api/projects/[id]/quick-audit`: Creates a quick audit with default settings

### Frontend Components

- `AuditStatusDisplay`: Shows real-time audit progress with a progress bar
- `AuditStatusBadge`: Compact badge showing the current status of an audit
- `ToastHandler`: Displays notifications for audit limits and errors

## Future Improvements

1. Add a usage dashboard to show audit consumption over time
2. Implement email notifications when approaching limits
3. Add the ability to purchase additional audits without upgrading the plan
4. Create a grace period for users who slightly exceed their limits 