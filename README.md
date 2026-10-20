# Forma Studio landing page

A responsive, single-page creative-studio website built with Vite and Three.js. Includes a self-contained autoplay cursor tour and a GitHub Pages deployment workflow.

## Run locally

```bash
npm ci
npm run dev
```

## Build for production

```bash
npm run build
```

Vite writes the deployable site to `dist/`.

## GitHub Pages deployment

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main`, or run **Actions → Deploy Forma Studio to GitHub Pages → Run workflow**.

The workflow at `.github/workflows/deploy.yml` installs dependencies, builds the site and deploys `dist/` to GitHub Pages. The Vite config uses relative asset URLs so it works on a project-site URL as well as a custom domain.
