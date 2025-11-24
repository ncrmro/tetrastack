# Getting Started with Tetrastack

This guide will walk you through setting up Tetrastack from initial clone to production deployment on Cloudflare with Turso database.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Database Setup (Turso)](#production-database-setup-turso)
3. [Cloudflare Setup](#cloudflare-setup)
4. [Google OAuth Setup (Optional)](#google-oauth-setup-optional)
5. [GitHub Actions Deployment Automation](#github-actions-deployment-automation)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- **Node.js 18+** or **Bun**
- **Docker and Docker Compose** (recommended for development)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-project.git
cd your-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

The default configuration works out of the box for local development:

```env
# Database - defaults to file:./data/local.db if not specified
# For Docker development, this is set in docker-compose.yaml

# Authentication
AUTH_SECRET=txPLQWs8toKE251TIWiGS6abI4dJafPA5Kd/DTxou6q5

# Ports
WEB_PORT=3000
DB_PORT=8080
```

**Note**: The `AUTH_SECRET` in `.env.example` is for development only. Generate a new one for production.

### 4. Start Development Server

**Option A: With Docker (Recommended)**

```bash
make up
```

This command will:

- Start the LibSQL database server
- Run database migrations
- Start the Next.js development server
- Display the server URL (default: http://localhost:3000)

**Option B: Without Docker**

```bash
# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### 5. Development Credentials

For quick testing during development:

- **Admin access**: Password `admin` with any suffix (e.g., `admin-123`, `admin-943`)
- **Regular user**: Password `password` with any suffix (e.g., `password-456`)

**⚠️ IMPORTANT**: These are development-only credentials and should never be used in production.

### 6. Stop Development Server

```bash
make down
```

To completely clean up (including database):

```bash
make destroy
```

---

## Production Database Setup (Turso)

Turso provides a cloud-hosted LibSQL database optimized for edge deployments.

### 1. Install Turso CLI

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Or using Homebrew (macOS/Linux):

```bash
brew install tursodatabase/tap/turso
```

### 2. Sign Up for Turso

```bash
turso auth signup
```

This will open your browser for authentication.

### 3. Create Production Database

```bash
# Create database (replace 'your-app-name' with your app name)
turso db create your-app-name

# Verify creation
turso db list
```

### 4. Get Database Credentials

```bash
# Get database URL
turso db show your-app-name --url

# Create auth token (use 'read-write' for full access)
turso db tokens create your-app-name
```

**Important**: Save both the URL and token - you'll need them for environment variables and GitHub secrets.

Example output:

```
URL: libsql://your-app-name-username.turso.io
Token: eyJhbGc...long-token-string
```

### 5. Configure Production Environment

Create `.env.production` (or update your production environment):

```env
TURSO_DATABASE_URL=libsql://your-app-name-username.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token
```

### 6. Run Migrations to Production

```bash
# Set environment variables
export TURSO_DATABASE_URL=libsql://your-app-name-username.turso.io
export TURSO_AUTH_TOKEN=eyJhbGc...your-token

# Run migrations
npm run db:migrate

# (Optional) Seed production database
npm run db:dataload
```

For more details about Turso integration, see [TURSO_INTEGRATION.md](./TURSO_INTEGRATION.md).

---

## Cloudflare Setup

### 1. Create Cloudflare Account

Sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) if you don't have an account.

### 2. Install Wrangler CLI

Wrangler is Cloudflare's CLI tool:

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 3. Get Cloudflare Account ID

```bash
# List your accounts
wrangler whoami

# Or get it from the dashboard
# Navigate to: Workers & Pages → Overview → Account ID (right sidebar)
```

### 4. Generate Cloudflare API Token

1. Go to [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. Configure permissions:
   - Account → Cloudflare Pages → Edit
   - Account → Workers Scripts → Edit
   - Zone → Workers Routes → Edit (if using custom domains)
5. Click **"Continue to summary"** → **"Create Token"**
6. **Save the token** - you'll need it for GitHub Actions

### 5. Configure wrangler.jsonc

Update `wrangler.jsonc` with your configuration:

> 💡 **Tip**: See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for a complete reference of all public variables and secrets.

```jsonc
{
  "name": "your-app-name", // Change this to your app name
  "compatibility_date": "2025-03-01",

  // Update environment variables
  "vars": {
    "AUTH_EMAIL_FROM": "noreply@yourdomain.com",
    "AUTH_TRUST_HOST": "true",
    "TURSO_DATABASE_URL": "libsql://your-app-name-username.turso.io",
    "AUTH_REDIRECT_PROXY_URL": "https://yourdomain.com/api/auth",
  },
}
```

**Note**: Sensitive values like `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, and `OPENAI_API_KEY` should be set as secrets in Cloudflare (see next section).

### 6. Set Cloudflare Secrets

Secrets are encrypted environment variables. Templates for all secrets are provided in `.env.production.example`.

> 📚 **Reference**: See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for details on all required and optional secrets.

```bash
# Set secrets (you'll be prompted to enter the value)
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put AUTH_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put AUTH_GOOGLE_SECRET  # If using Google OAuth

# Or set from a file
echo "your-secret-value" | wrangler secret put SECRET_NAME
```

**Generate AUTH_SECRET for production**:

```bash
openssl rand -base64 32
```

### 7. Test Deployment Locally

```bash
# Build for Cloudflare
npm run build

# Preview locally with Cloudflare environment
npm run preview
```

---

## Google OAuth Setup (Optional)

If you want to enable Google Sign-In for your application, follow these steps to set up OAuth 2.0 credentials.

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top (next to "Google Cloud")
3. Click **"New Project"**
4. Enter your project name (e.g., "Your App Name")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the project dropdown

### 2. Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen:

1. In the Google Cloud Console, navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public applications) or **Internal** (for Google Workspace organizations)
3. Click **"Create"**

**App Information**:

- **App name**: Your application name (e.g., "Meze")
- **User support email**: Your email address
- **App logo**: (Optional) Upload your app logo
- **Application home page**: Your production URL (e.g., `https://yourdomain.com`)
- **Application privacy policy link**: Your privacy policy URL
- **Application terms of service link**: Your terms of service URL
- **Authorized domains**: Add your production domain (e.g., `yourdomain.com`)
- **Developer contact information**: Your email address

4. Click **"Save and Continue"**

**Scopes**:

- Click **"Add or Remove Scopes"**
- Select these scopes:
  - `userinfo.email`
  - `userinfo.profile`
  - `openid`
- Click **"Update"** → **"Save and Continue"**

**Test Users** (for External apps in testing mode):

- Add email addresses of users who can test your app during development
- Click **"Save and Continue"**

**Summary**:

- Review your settings
- Click **"Back to Dashboard"**

### 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **Application type**: **Web application**
4. **Name**: Give it a descriptive name (e.g., "Web Client Production")

**Authorized JavaScript origins**:

- Add your production URL: `https://yourdomain.com`
- For local testing: `http://localhost:3000`

**Authorized redirect URIs**:

- Production: `https://yourdomain.com/api/auth/callback/google`
- Local development: `http://localhost:3000/api/auth/callback/google`

5. Click **"Create"**
6. **Save your credentials**:
   - **Client ID**: Starts with a long number ending in `.apps.googleusercontent.com`
   - **Client Secret**: A random string

### 4. Configure Environment Variables

**For Local Development** (`.env`):

```env
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
```

**For Production** (Cloudflare Secrets):

```bash
# Set Google OAuth credentials as Cloudflare secrets
echo "your-client-secret" | wrangler secret put AUTH_GOOGLE_SECRET

# Update wrangler.jsonc with the Client ID (non-sensitive)
# Add to the "vars" section:
```

**Update `wrangler.jsonc`**:

```jsonc
{
  "vars": {
    "AUTH_GOOGLE_ID": "your-client-id.apps.googleusercontent.com",
    // ... other vars
  },
}
```

**For GitHub Actions**, add these secrets:

| Secret Name          | Value                     |
| -------------------- | ------------------------- |
| `AUTH_GOOGLE_ID`     | Your Google Client ID     |
| `AUTH_GOOGLE_SECRET` | Your Google Client Secret |

### 5. Verify Configuration

**Check Auth Configuration** (`src/lib/auth.ts`):

Make sure Google provider is configured:

```typescript
import Google from 'next-auth/providers/google';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // ... other providers
  ],
};
```

### 6. Test Google Sign-In

**Local Testing**:

1. Start your dev server: `make up` or `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with Google"
4. Sign in with a Google account
5. Verify successful authentication

**Production Testing**:

1. Deploy your app to Cloudflare
2. Navigate to your production URL
3. Test Google Sign-In with a real user account

### 7. Publishing Your App (Optional)

During development, your OAuth app is in "Testing" mode and only test users can sign in.

**To allow anyone to sign in**:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **"Publish App"**
3. Review the verification requirements
4. Click **"Confirm"**

**Note**: Google may require verification if you request sensitive scopes or have many users. Basic scopes (email, profile) typically don't require verification.

### Troubleshooting Google OAuth

**Problem**: "Error 400: redirect_uri_mismatch"

**Solution**:

- Verify the redirect URI in Google Console exactly matches your callback URL
- Format: `https://yourdomain.com/api/auth/callback/google`
- No trailing slash
- Must include the full path

**Problem**: "Access blocked: This app's request is invalid"

**Solution**:

- Check that you've configured the OAuth consent screen
- Verify your app is published or user is added as a test user
- Ensure all required fields in OAuth consent screen are filled

**Problem**: "The developer hasn't given you access to this app"

**Solution**:

- If app is in Testing mode, add the user's email to Test Users
- Or publish the app to production

---

## GitHub Actions Deployment Automation

Automate deployments to Cloudflare on every push to `main`.

> 📚 **Reference**: See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for the complete list of variables and their purposes.

### 1. Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

**Required Secrets** (click "New repository secret"):

| Secret Name             | Value                          | How to Get                                |
| ----------------------- | ------------------------------ | ----------------------------------------- |
| `TURSO_AUTH_TOKEN`      | Your Turso auth token          | `turso db tokens create your-app-name`    |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token           | From Cloudflare dashboard (API Tokens)    |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID                | `wrangler whoami` or Cloudflare dashboard |
| `AUTH_SECRET`           | Production auth secret         | `openssl rand -base64 32`                 |
| `OPENAI_API_KEY`        | OpenAI API key (optional)      | From OpenAI dashboard                     |
| `AUTH_GOOGLE_SECRET`    | Google OAuth secret (optional) | From Google Cloud Console                 |

**Required Variables** (click "New repository variable"):

| Variable Name        | Value                            |
| -------------------- | -------------------------------- |
| `TURSO_DATABASE_URL` | Your Turso database URL          |
| `AUTH_GOOGLE_ID`     | Your Google Client ID (optional) |

**Why variables vs secrets?**

- **Secrets**: Encrypted, hidden in logs (for sensitive data)
- **Variables**: Visible in logs, easier to debug (for non-sensitive config)

#### Option A: Using GitHub CLI (Recommended)

The GitHub CLI (`gh`) provides a faster way to set secrets and variables from the command line.

**1. Install GitHub CLI**

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows (using winget)
winget install --id GitHub.cli

# Or download from: https://cli.github.com/
```

**2. Authenticate with GitHub**

```bash
gh auth login
```

Follow the prompts to authenticate (choose HTTPS or SSH, and login via browser or token).

**3. Set Secrets**

```bash
# Navigate to your repository directory
cd /path/to/your-project

# Set required secrets (you'll be prompted to enter the value)
gh secret set TURSO_AUTH_TOKEN
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set AUTH_SECRET

# Optional secrets
gh secret set OPENAI_API_KEY
gh secret set AUTH_GOOGLE_SECRET

# Or set from a command output
echo "$(openssl rand -base64 32)" | gh secret set AUTH_SECRET

# Or set from a file
gh secret set TURSO_AUTH_TOKEN < token.txt
```

**4. Set Variables**

```bash
# Set required variables
gh variable set TURSO_DATABASE_URL --body "libsql://your-app-name-username.turso.io"
gh variable set AUTH_GOOGLE_ID --body "your-client-id.apps.googleusercontent.com"
```

**5. Verify Secrets and Variables**

```bash
# List all secrets (values are hidden)
gh secret list

# List all variables
gh variable list
```

**Quick Setup Script**

Here's a complete script to set up all secrets at once:

```bash
#!/bin/bash

# Turso credentials
echo "Enter your Turso auth token:"
gh secret set TURSO_AUTH_TOKEN

echo "Enter your Turso database URL:"
read TURSO_URL
gh variable set TURSO_DATABASE_URL --body "$TURSO_URL"

# Cloudflare credentials
echo "Enter your Cloudflare API token:"
gh secret set CLOUDFLARE_API_TOKEN

echo "Enter your Cloudflare account ID:"
gh secret set CLOUDFLARE_ACCOUNT_ID

# Generate and set AUTH_SECRET
echo "Generating AUTH_SECRET..."
echo "$(openssl rand -base64 32)" | gh secret set AUTH_SECRET

# Optional: OpenAI
read -p "Do you want to set OPENAI_API_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enter your OpenAI API key:"
    gh secret set OPENAI_API_KEY
fi

# Optional: Google OAuth
read -p "Do you want to set Google OAuth credentials? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enter your Google Client ID:"
    read GOOGLE_ID
    gh variable set AUTH_GOOGLE_ID --body "$GOOGLE_ID"

    echo "Enter your Google Client Secret:"
    gh secret set AUTH_GOOGLE_SECRET
fi

echo "✓ All secrets and variables have been set!"
echo ""
echo "Verify with:"
echo "  gh secret list"
echo "  gh variable list"
```

Save this as `setup-github-secrets.sh`, make it executable (`chmod +x setup-github-secrets.sh`), and run it.

#### Option B: Using GitHub Web Interface

Alternatively, you can set secrets manually through the web interface:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each secret
4. Click **"New repository variable"** for each variable
5. Enter the name and value for each

### 2. Verify Workflow Configuration

The deployment workflow at `.github/workflows/deploy.yml` should:

1. Run on push to `main`
2. Run database migrations
3. Deploy to Cloudflare Pages

Example workflow structure:

```yaml
name: Deployment

on:
  push:
    branches:
      - main

jobs:
  deployment:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
      - name: Install dependencies
      - name: Run migrations
        env:
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
          TURSO_DATABASE_URL: ${{ vars.TURSO_DATABASE_URL }}
      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 3. Enable GitHub Actions

1. Go to repository **Settings** → **Actions** → **General**
2. Under "Actions permissions", select **"Allow all actions and reusable workflows"**
3. Click **Save**

### 4. Test the Workflow

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push to main
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

Check the **Actions** tab in your GitHub repository to see the deployment progress.

---

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure:

- ✅ **Turso database** is created and configured
- ✅ **Database migrations** have been run on production database
- ✅ **Cloudflare account** is set up
- ✅ **GitHub secrets** are configured
- ✅ **wrangler.jsonc** is updated with your configuration
- ✅ **Production AUTH_SECRET** is generated and set
- ✅ **All environment variables** are configured

### Manual Deployment

For the first deployment or manual deployments:

```bash
# 1. Build the application
npm run build

# 2. Deploy to Cloudflare
npm run deploy
```

The deployment will:

1. Build your Next.js app with OpenNext adapter
2. Upload to Cloudflare Workers
3. Deploy assets to Cloudflare Pages
4. Display the deployment URL

### Automatic Deployment (via GitHub Actions)

Once configured, every push to `main` will automatically:

1. ✅ Run database migrations
2. ✅ Load seed data (if needed)
3. ✅ Deploy to Cloudflare

Monitor deployments in:

- **GitHub**: Repository → Actions tab
- **Cloudflare**: Dashboard → Workers & Pages → your-app-name

### Post-Deployment Verification

1. **Check deployment URL**: Visit the URL provided by Cloudflare
2. **Test authentication**: Try logging in
3. **Check database connectivity**: Verify data loads correctly
4. **Monitor logs**:
   ```bash
   wrangler tail your-app-name
   ```

### Custom Domain Setup (Optional)

1. Go to Cloudflare dashboard → **Workers & Pages** → your app
2. Click **Custom domains** → **Set up a custom domain**
3. Follow the prompts to add your domain
4. Update `AUTH_REDIRECT_PROXY_URL` in `wrangler.jsonc`:
   ```jsonc
   "vars": {
     "AUTH_REDIRECT_PROXY_URL": "https://yourdomain.com/api/auth"
   }
   ```

---

## Troubleshooting

### Database Connection Issues

**Problem**: "Database connection failed" error

**Solutions**:

1. Verify Turso credentials:
   ```bash
   turso db show your-app-name --url
   ```
2. Check token is valid:
   ```bash
   turso db tokens create your-app-name
   ```
3. Ensure environment variables are set correctly in Cloudflare:
   ```bash
   wrangler secret list
   ```

### Migration Conflicts

**Problem**: Migration conflicts after merging branches

**Solution**:

```bash
make migration-reconcile
```

This will reset migrations from `main` and regenerate them.

### Build Failures

**Problem**: Build fails during deployment

**Solutions**:

1. Check TypeScript errors:
   ```bash
   npm run typecheck
   ```
2. Check linting:
   ```bash
   npm run lint
   ```
3. Verify all dependencies are installed:
   ```bash
   npm ci
   ```

### Authentication Issues

**Problem**: Authentication not working in production

**Solutions**:

1. Verify `AUTH_SECRET` is set in Cloudflare secrets
2. Check `AUTH_TRUST_HOST=true` is set in `wrangler.jsonc`
3. Ensure `AUTH_REDIRECT_PROXY_URL` matches your domain

### GitHub Actions Failures

**Problem**: Deployment workflow fails

**Solutions**:

1. Check secrets are configured:
   - Repository → Settings → Secrets and variables → Actions
2. Verify secret names match workflow file
3. Check workflow logs for specific error messages
4. Ensure you have necessary permissions on Cloudflare account

---

## Additional Resources

- [CLAUDE.md](../CLAUDE.md) - Complete development guide and AI assistant instructions
- [TURSO_INTEGRATION.md](./TURSO_INTEGRATION.md) - Detailed Turso database integration
- [src/lib/db/README.md](../src/lib/db/README.md) - Database architecture and patterns
- [tests/README.md](../tests/README.md) - Testing architecture
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Turso Documentation](https://docs.turso.tech/)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)

---

## Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/your-username/your-project/issues)
- **Cloudflare Community**: [https://community.cloudflare.com/](https://community.cloudflare.com/)
- **Turso Discord**: [https://discord.gg/turso](https://discord.gg/turso)

---

**Next Steps**: After getting your local environment running, explore the [testing documentation](../tests/README.md) to learn about the comprehensive testing setup, or dive into [CLAUDE.md](../CLAUDE.md) to understand the full architecture.
