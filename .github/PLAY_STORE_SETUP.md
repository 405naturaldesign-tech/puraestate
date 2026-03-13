# Google Play Store Service Account Setup Guide

This guide provides step-by-step instructions to set up automated deployment to Google Play Console for the PuraEstate Android application.

## Table of Contents
1. [Google Cloud Project Setup](#google-cloud-project-setup)
2. [Service Account Creation](#service-account-creation)
3. [Play Store Console Configuration](#play-store-console-configuration)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Deployment Automation Integration](#deployment-automation-integration)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

---

## Google Cloud Project Setup

### Step 1: Create a Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project selector dropdown at the top
3. Click "New Project"
4. Enter project name: `pura-estate-deployment`
5. Select organization (if applicable)
6. Click "Create"
7. Wait for project creation to complete
8. Select the newly created project

### Step 2: Enable Required APIs

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google Play Developer Publishing API"
3. Click on it and press "Enable"
4. You should see confirmation: "API enabled"

### Step 3: Verify Service Account Access

1. Confirm the project is selected in the top dropdown
2. Note your **Project ID** (you'll need this later)

---

## Service Account Creation

### Step 1: Create Service Account

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Service account name**: `pura-estate-deployer`
   - **Service account ID**: `pura-estate-deployer@[PROJECT_ID].iam.gserviceaccount.com`
   - **Description**: "Automated deployment service account for PuraEstate Android app"
4. Click **Create and Continue**

### Step 2: Grant Required Permissions

In the "Grant roles" section:

1. Select **Editor** role (or the more restrictive **Service Account User** role)
2. Click **Continue**
3. Click **Done**

**Note**: For production deployments, consider using a more restrictive custom role with only Play Store publishing permissions.

### Step 3: Generate JSON Key

1. Click on the newly created service account email
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create**
6. A JSON file will download automatically to your computer
7. **IMPORTANT**: Store this file securely - it contains sensitive credentials

---

## Play Store Console Configuration

### Step 1: Verify Service Account in Play Console

1. Navigate to [Google Play Console](https://play.google.com/console)
2. Click on the **PuraEstate** app (or create it if not already listed)
3. Go to **Settings** > **API access** (or **Users and permissions** > **Service accounts**)
4. Look for the service account email you created
5. If not listed, click **Grant Access** and add the service account with **Admin** role

### Step 2: Accept Play Developer Agreement

1. In Play Console, ensure:
   - Your account is verified and in good standing
   - All agreements have been accepted
   - Payment method is on file
   - App has been created and published (even as internal testing)

### Step 3: Create Internal Test Track (Recommended)

1. Go to **Testing** > **Internal testing**
2. Create a release to test automated deployments
3. Upload a test AAB (Android App Bundle) file
4. This verifies the app is properly configured

---

## GitHub Secrets Configuration

### Step 1: Add Service Account JSON to GitHub Secrets

1. Open the downloaded `service-account-key.json` file in a text editor
2. Copy the entire JSON contents
3. Go to your GitHub repository
4. Navigate to **Settings** > **Secrets and variables** > **Actions**
5. Click **New repository secret**
6. **Name**: `PLAY_STORE_SERVICE_ACCOUNT`
7. **Value**: Paste the entire JSON contents
8. Click **Add secret**

### Step 2: Add Additional Required Secrets

Create these additional secrets in GitHub:

#### PLAY_STORE_TRACK
- **Name**: `PLAY_STORE_TRACK`
- **Value**: `internal` (for testing) or `production` (for release)

#### PLAY_STORE_APP_PACKAGE
- **Name**: `PLAY_STORE_APP_PACKAGE`
- **Value**: `com.pura.estate`

#### EAS_TOKEN (If using EAS CLI)
- **Name**: `EAS_TOKEN`
- **Value**: Your EAS (Expo Application Services) access token
- To get this token:
  1. Run `eas login` locally
  2. Go to Expo account settings
  3. Generate a personal access token
  4. Copy and add to GitHub Secrets

### Step 3: Verify Secrets are Created

```bash
# In your GitHub CLI (gh):
gh secret list
```

You should see:
```
PLAY_STORE_SERVICE_ACCOUNT
PLAY_STORE_TRACK
PLAY_STORE_APP_PACKAGE
EAS_TOKEN
```

---

## Deployment Automation Integration

### Step 1: Review Existing Workflows

The repository already contains CI/CD workflows in `.github/workflows/`

Check for:
- `build-android.yml` - Builds Android app
- `deploy-android.yml` - Deploys to Play Store
- `release.yml` - Creates releases

### Step 2: Ensure Workflow Configuration

Your deployment workflow should include:

```yaml
name: Deploy to Google Play Store

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Allow manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build Android App Bundle
        run: eas build --platform android --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}

      - name: Deploy to Play Store
        run: eas submit --platform android --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
          PLAY_STORE_SERVICE_ACCOUNT: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          PLAY_STORE_TRACK: ${{ secrets.PLAY_STORE_TRACK }}
```

### Step 3: EAS Configuration for Submission

Verify `eas.json` has the submission config:

```json
{
  "submit": {
    "production-android": {
      "android": {
        "serviceAccount": "@file:./credentials.json",
        "track": "production",
        "releaseStatus": "completed",
        "changesNotSentForReview": false
      }
    }
  }
}
```

### Step 4: Store Service Account Credentials

In your GitHub workflow, add a step to write the service account JSON:

```yaml
- name: Setup Play Store credentials
  run: |
    echo '${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}' > credentials.json
```

---

## Verification & Testing

### Step 1: Test with Manual Trigger

1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Select the deployment workflow
4. Click **Run workflow**
5. Select branch (main) and click **Run workflow**

### Step 2: Monitor Build Progress

1. The workflow should start building the AAB file
2. Watch the logs for:
   - Successful build completion
   - Service account authentication
   - Upload to Play Console

### Step 3: Verify in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Testing** > **Internal testing** or **Production** (depending on track)
4. You should see a new build/release uploaded

### Step 4: Test Installation (Optional)

1. In Play Console, invite a test device
2. Download and install the app from the test track
3. Verify app functions correctly

---

## Deployment Automation Integration

### Automated Release Process

Once configured, releases automatically trigger when:

1. **Code is pushed to main branch**
   - Workflow automatically builds and submits

2. **Version is bumped in package.json**
   - Increment version following semantic versioning
   - Commit with message: "chore: bump version to X.Y.Z"
   - Workflow detects version change and deploys

3. **Manual trigger**
   - Go to GitHub Actions
   - Run workflow manually
   - Select track (internal/production)

### Suggested Release Workflow

```bash
# 1. Bump version
npm version patch|minor|major

# 2. Commit
git commit -am "chore: bump version"

# 3. Push to main
git push origin main

# 4. Workflow automatically triggers and deploys
# Monitor in GitHub Actions tab
```

---

## Troubleshooting

### Common Issues

#### Issue: Authentication Failed
```
Error: Failed to authenticate with Google Play
```

**Solution:**
1. Verify service account JSON is valid
2. Confirm service account has Admin access in Play Console
3. Regenerate credentials.json file from GitHub secret

#### Issue: Package Name Mismatch
```
Error: Package name does not match
```

**Solution:**
1. Ensure `app.json` has correct package: `"package": "com.pura.estate"`
2. Verify GitHub secret `PLAY_STORE_APP_PACKAGE` matches
3. Rebuild with `eas build --clean`

#### Issue: Build Fails During Upload
```
Error: Upload failed - version code already exists
```

**Solution:**
1. Increment `versionCode` in `app.json`
2. Each build must have a unique version code
3. Version code should auto-increment with app version bump

#### Issue: Permission Denied
```
Error: Service account does not have permission
```

**Solution:**
1. Verify service account has been granted Admin role in Play Console
2. Go to **Settings** > **API access**
3. Click on your service account
4. Ensure it has **Admin** role
5. Allow up to 5 minutes for permissions to propagate

#### Issue: Expired Credentials
```
Error: Invalid credentials
```

**Solution:**
1. In Google Cloud Console, delete old service account key
2. Create new JSON key
3. Update GitHub secret `PLAY_STORE_SERVICE_ACCOUNT` with new JSON
4. Retry deployment

### Debug Logging

Enable verbose logging in workflows:

```yaml
- name: Deploy to Play Store
  run: eas submit --platform android --non-interactive
  env:
    EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
    DEBUG: "*"  # Enable all debug logging
```

---

## Security Best Practices

1. **Rotate Credentials Regularly**
   - Regenerate service account keys every 90 days
   - Delete old keys from Google Cloud Console

2. **Limit Service Account Permissions**
   - Use custom roles with minimal required permissions
   - Don't use Owner/Editor roles in production

3. **Audit Deployments**
   - Monitor Play Console activity logs
   - Review GitHub Actions workflow logs
   - Set up alerts for failed deployments

4. **Protect Secrets**
   - Never commit credentials.json to repository
   - Use GitHub repository secrets
   - Mask sensitive output in logs

5. **Version Control**
   - Keep eas.json in version control (safe - no credentials)
   - Exclude credentials.json in .gitignore
   - Review changes to build configuration

---

## Additional Resources

- [EAS CLI Documentation](https://docs.expo.dev/eas-cli/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/eas-update/submit-to-app-stores/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Support & Questions

For issues with:
- **EAS CLI/Build**: Check [EAS Documentation](https://docs.expo.dev/)
- **Google Play Console**: Use [Play Console Help](https://support.google.com/googleplay)
- **GitHub Actions**: Review [Actions Documentation](https://docs.github.com/actions)
- **Service Accounts**: Check [Google Cloud IAM Docs](https://cloud.google.com/iam/docs)

---

**Last Updated**: March 2026
**Repository**: PuraEstate Android Deployment
**Package**: com.pura.estate
