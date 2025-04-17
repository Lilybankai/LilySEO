# Deploying LilySEO Frontend to Coolify

This guide explains how to deploy the LilySEO frontend application to Coolify for both testing and production environments.

## Prerequisites

1. Coolify server set up and running
2. Git repository for the LilySEO project
3. Access to Coolify dashboard
4. Docker installed locally (for testing)

## Setup Steps

### 1. Configure Coolify

1. Log in to your Coolify dashboard
2. Create a new service by selecting "Create New Resource" > "Application"
3. Select your Git provider (GitHub, GitLab, etc.)
4. Select the LilySEO repository
5. Choose Docker as the deployment method
6. Configure build settings:
   - Dockerfile path: `Dockerfile` (in the root directory)
   - Port: `3000`

### 2. Configure Environment Variables

Add the following environment variables in the Coolify dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
NEXT_PUBLIC_APP_URL=https://your-coolify-app-url
CRON_SECRET=your-cron-secret
NODE_ENV=production
SERPER_API_KEY=your-serper-api-key
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### 3. Setup Multiple Environments

#### Production Environment

1. Create a production resource in Coolify
2. Configure it with production environment variables
3. Set up a domain name (if applicable)

#### Testing Environment

1. Create a separate testing resource in Coolify
2. Configure with testing environment variables
3. Use a different subdomain/port for testing

### 4. Configure Git Integration

#### Automatic Deployments

1. In Coolify, go to the service settings
2. Enable "Auto Deploy"
3. Configure which branches trigger deployments:
   - `main` branch for production
   - `develop` branch for testing

#### Manual Deployments

Use the provided `deploy-coolify.sh` script:

```bash
chmod +x deploy-coolify.sh
./deploy-coolify.sh
```

### 5. Health Checks and Monitoring

1. Set up a health check endpoint at `/api/health`
2. Configure Coolify to monitor this endpoint
3. Set up appropriate restart policies

## Testing Your Deployment

1. Make a small change to the codebase
2. Commit and push to your repository
3. Check the Coolify dashboard for deployment status
4. Verify the change is visible on your deployed application

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Docker build logs in Coolify
   - Ensure Dockerfile is correctly configured
   - Make sure all required dependencies are installed in package.json

2. **Environment Variables**
   - Verify all required environment variables are set
   - Check for typos in variable names

3. **Network Issues**
   - Check if Coolify can access your Git repository
   - Verify port configurations

### Logs

Access logs through the Coolify dashboard to diagnose issues:

1. Go to your service in Coolify
2. Click on "Logs" tab
3. Filter logs by type (build, runtime, etc.)

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/) 