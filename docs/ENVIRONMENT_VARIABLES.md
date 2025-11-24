# Environment Variables Reference

Complete guide to environment variables and secrets configuration across all environments.

## Table of Contents

- [Overview](#overview)
- [Three-Tier Configuration System](#three-tier-configuration-system)
- [Complete Variables Reference](#complete-variables-reference)
- [Quick Reference Commands](#quick-reference-commands)
- [Best Practices](#best-practices)

## Overview

This project uses different environment variable configurations for development, production, and CI/CD:

- **Development**: `.env` file (git-ignored, local only)
- **Production**: `wrangler.jsonc` (public vars) + Cloudflare Secrets (sensitive data)
- **CI/CD**: GitHub Actions secrets and variables

**Key Principle**: Public variables go in `wrangler.jsonc`, secrets use Cloudflare's secrets management.

## Three-Tier Configuration System

### 1. Development Environment

**Location**: `.env` file (local, git-ignored)

```bash
# All variables for local development
DATABASE_URL=file:./local.db
AUTH_SECRET=dev-secret-32-chars-minimum
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

**How to use**:

- Copy `.env.example` to `.env`
- Fill in values for local development
- This file is never committed to git

### 2. Production Environment (Cloudflare Workers)

**Public Variables**: `wrangler.jsonc` → `vars` section

```jsonc
"vars": {
  "AUTH_EMAIL_FROM": "onboarding@tetrastack.example",
  "TURSO_DATABASE_URL": "libsql://...",
  // ... other public variables
}
```

**Secrets**: Set via Cloudflare CLI or dashboard

```bash
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put AUTH_SECRET
```

**Templates**: `.env.production.example` provides templates for all required secrets.

### 3. CI/CD Environment (GitHub Actions)

**Location**: Repository → Settings → Secrets and variables → Actions

Two types:

- **Secrets** (encrypted): Sensitive data like API keys, tokens
- **Variables** (visible): Non-sensitive configuration like URLs

See `.github/workflows/deploy.yml` for usage.

## Complete Variables Reference

### Database

| Variable             | Type   | Location          | Required | Description                                           |
| -------------------- | ------ | ----------------- | -------- | ----------------------------------------------------- |
| `TURSO_DATABASE_URL` | Public | wrangler.jsonc    | Yes      | Turso database connection URL (LibSQL endpoint)       |
| `TURSO_AUTH_TOKEN`   | Secret | Cloudflare Secret | Yes      | Turso authentication token (get from Turso dashboard) |
| `DATABASE_URL`       | Local  | .env              | Dev only | Local SQLite database path for development            |

**Pairing**: `TURSO_DATABASE_URL` (public) pairs with `TURSO_AUTH_TOKEN` (secret)

### Authentication (NextAuth.js)

| Variable                  | Type   | Location          | Required | Description                                                                             |
| ------------------------- | ------ | ----------------- | -------- | --------------------------------------------------------------------------------------- |
| `AUTH_SECRET`             | Secret | Cloudflare Secret | Yes      | NextAuth.js encryption secret (32+ characters, generate with `openssl rand -base64 32`) |
| `AUTH_EMAIL_FROM`         | Public | wrangler.jsonc    | Yes      | Email sender address for authentication emails                                          |
| `AUTH_TRUST_HOST`         | Public | wrangler.jsonc    | Yes      | Must be "true" for edge deployments (Cloudflare Workers)                                |
| `AUTH_REDIRECT_PROXY_URL` | Public | wrangler.jsonc    | Yes      | OAuth callback URL for production (e.g., `https://yourapp.com/api/auth`)                |

**Security Note**: `AUTH_SECRET` must be unique per environment and at least 32 characters.

### OAuth Providers

| Variable             | Type   | Location          | Required   | Description                                            |
| -------------------- | ------ | ----------------- | ---------- | ------------------------------------------------------ |
| `AUTH_GOOGLE_ID`     | Public | wrangler.jsonc    | Optional   | Google OAuth client ID (get from Google Cloud Console) |
| `AUTH_GOOGLE_SECRET` | Secret | Cloudflare Secret | Optional\* | Google OAuth client secret (format: `GOCSPX-...`)      |

**Pairing**: `AUTH_GOOGLE_ID` (public) pairs with `AUTH_GOOGLE_SECRET` (secret)

**Required when**: Using Google sign-in. Both ID and secret must be set together.

### Email Services

| Variable           | Type   | Location          | Required | Description                                                           |
| ------------------ | ------ | ----------------- | -------- | --------------------------------------------------------------------- |
| `AUTH_MAILGUN_KEY` | Secret | Cloudflare Secret | Optional | Mailgun API key for transactional emails (magic links, notifications) |

**Required when**: Sending email notifications or using magic link authentication.

### AI Features

| Variable         | Type   | Location          | Required | Description                                               |
| ---------------- | ------ | ----------------- | -------- | --------------------------------------------------------- |
| `OPENAI_API_KEY` | Secret | Cloudflare Secret | Optional | OpenAI API key for AI-powered features (format: `sk-...`) |

**Required when**: Using AI meal generation, recipe suggestions, or other OpenAI-powered features.

### Analytics

| Variable                  | Type   | Location       | Required | Description                                                |
| ------------------------- | ------ | -------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | wrangler.jsonc | Optional | PostHog project API key (public, safe to expose in client) |

**Required when**: Using PostHog analytics for user behavior tracking.

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

### Development Ports

| Variable        | Type  | Location | Required | Description                              |
| --------------- | ----- | -------- | -------- | ---------------------------------------- |
| `WEB_PORT`      | Local | .env     | Dev only | Development server port (default: 3000)  |
| `DATABASE_PORT` | Local | .env     | Dev only | Database inspection port (default: 8082) |

**Local development only**: These are not used in production (Cloudflare Workers handle routing).

## Quick Reference Commands

### View Current Configuration

```bash
# List all Cloudflare secrets (names only, not values)
wrangler secret list

# View public variables
cat wrangler.jsonc | grep -A 20 '"vars"'
```

### Set Cloudflare Secrets

```bash
# Required secrets
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put AUTH_SECRET

# Optional secrets (when using these features)
wrangler secret put AUTH_GOOGLE_SECRET
wrangler secret put AUTH_MAILGUN_KEY
wrangler secret put OPENAI_API_KEY
```

### Update Public Variables

Edit `wrangler.jsonc` directly:

```jsonc
"vars": {
  "AUTH_EMAIL_FROM": "your-email@example.com",
  // ... other variables
}
```

Commit changes to git:

```bash
git add wrangler.jsonc
git commit -m "chore: update production configuration"
```

### GitHub Actions Setup

Set secrets via GitHub CLI:

```bash
# Required for deployment
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set TURSO_AUTH_TOKEN
gh secret set AUTH_SECRET

# Set public variables
gh variable set TURSO_DATABASE_URL
```

Or use the GitHub web interface:

1. Go to repository Settings
2. Secrets and variables → Actions
3. Add secrets/variables as needed

## Best Practices

### Security

1. **Never commit secrets to git**
   - ✅ Use `.env.production.example` for templates (no real values)
   - ❌ Don't commit `.env` or `.env.production` files
   - ✅ Keep `.env` in `.gitignore`

2. **Use different secrets per environment**
   - Generate unique `AUTH_SECRET` for dev, staging, and production
   - Don't reuse API keys across environments

3. **Rotate secrets regularly**
   - Database tokens
   - API keys
   - OAuth secrets

### Organization

1. **Group related variables**
   - Database: `TURSO_*`
   - Auth: `AUTH_*`
   - Providers: `AUTH_[PROVIDER]_*`

2. **Use consistent naming**
   - Secrets: SCREAMING_SNAKE_CASE
   - Paired variables: Same prefix (e.g., `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`)

3. **Document requirements**
   - Mark variables as required/optional
   - Explain when optional variables are needed
   - Link to where to obtain values

### Validation

Before deploying, ensure:

```bash
# Check wrangler.jsonc syntax
cat wrangler.jsonc | jq .

# Verify all required secrets are set
wrangler secret list

# Test deployment locally
npm run build
```

## Related Documentation

- **Setup Guide**: [docs/GETTING_STARTED.md](./GETTING_STARTED.md) - Step-by-step setup instructions
- **Public Variables**: [wrangler.jsonc](../wrangler.jsonc) - Cloudflare Workers configuration
- **Secret Templates**: [.env.production.example](../.env.production.example) - Templates for all secrets
- **Deployment**: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) - CI/CD configuration
- **Cloudflare Docs**: [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) - Official documentation

## Troubleshooting

### Issue: "Missing environment variable"

**Cause**: Required variable not set in Cloudflare or GitHub Actions

**Solution**:

1. Check if it's a public var → add to `wrangler.jsonc`
2. Check if it's a secret → set with `wrangler secret put`
3. For CI/CD → set in GitHub Actions secrets/variables

### Issue: "Unauthorized" or "Invalid token"

**Cause**: Secret value is incorrect or expired

**Solution**:

1. Regenerate the token/key from the service provider
2. Update the secret: `wrangler secret put VARIABLE_NAME`
3. Redeploy: `npm run deploy`

### Issue: OAuth callback URL mismatch

**Cause**: `AUTH_REDIRECT_PROXY_URL` doesn't match OAuth provider configuration

**Solution**:

1. Check `wrangler.jsonc` value for `AUTH_REDIRECT_PROXY_URL`
2. Update OAuth provider dashboard (Google, GitHub, etc.) with same URL
3. Format should be: `https://your-domain.com/api/auth`

---

**Last Updated**: 2025-11-24
