# Deployment Guide - Workout SPA Editor

This document describes how to deploy the Workout SPA Editor to GitHub Pages.

## GitHub Pages Configuration

The application is configured to deploy automatically to GitHub Pages when changes are pushed to the `main` branch.

### Prerequisites

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Repository Permissions**:
   - The workflow requires `pages: write` and `id-token: write` permissions
   - These are automatically granted when using GitHub Actions for Pages deployment

### Automatic Deployment

The deployment workflow (`.github/workflows/deploy-spa-editor.yml`) automatically:

1. Triggers on:
   - Push to `main` branch with changes in `packages/workout-spa-editor/**`
   - Manual workflow dispatch

2. Builds the application with the correct base path for GitHub Pages

3. Deploys to GitHub Pages

### Base Path Configuration

The application automatically configures the base path based on the repository:

- **User/Organization site** (`username.github.io`): Base path is `/`
- **Project site** (`username.github.io/repo-name`): Base path is `/repo-name/`

This is handled automatically via the `VITE_BASE_PATH` environment variable in the workflow.

### Manual Deployment

To manually trigger a deployment:

1. Go to Actions → Deploy Workout SPA Editor to GitHub Pages
2. Click "Run workflow"
3. Select the `main` branch
4. Click "Run workflow"

### Local Testing with Production Base Path

To test the application locally with a GitHub Pages base path:

```bash
# Set the base path (replace 'repo-name' with your repository name)
export VITE_BASE_PATH=/repo-name/

# Build the application
pnpm build

# Preview the production build
pnpm preview
```

### Environment Variables

The following environment variables are used during deployment:

- `VITE_BASE_PATH`: The base path for the application (e.g., `/repo-name/`)
  - Automatically set by the GitHub Actions workflow
  - Defaults to `/` for local development

### Deployment URL

After successful deployment, the application will be available at:

- **User/Organization site**: `https://username.github.io/`
- **Project site**: `https://username.github.io/repo-name/`

The deployment URL is displayed in the workflow run output.

### Troubleshooting

**404 errors on page refresh:**

- GitHub Pages serves a single `index.html` file
- The application uses client-side routing
- Add a `404.html` file that redirects to `index.html` if needed

**Assets not loading:**

- Verify the `VITE_BASE_PATH` is correctly set
- Check browser console for 404 errors
- Ensure all asset paths are relative or use the base path

**Build failures:**

- Check the workflow logs in the Actions tab
- Verify all dependencies are correctly installed
- Ensure TypeScript compilation succeeds locally

### Performance Optimization

The production build includes:

- **Minification**: Using Terser for optimal bundle size
- **Source maps**: Enabled for debugging production issues
- **Code splitting**: Automatic via Vite
- **ES2020 target**: Modern JavaScript for better performance

### Security Considerations

- The application runs entirely in the browser (no backend)
- All data is stored locally in the browser (localStorage/IndexedDB)
- No sensitive data is transmitted to external servers
- HTTPS is automatically enabled by GitHub Pages

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `packages/workout-spa-editor/public/` with your domain
2. Configure DNS records for your domain
3. Enable HTTPS in repository settings

See [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.
