# Patidar Health Frontend (JSX + Vite)

This is a JSX-based migration of the supplied React doctor-management frontend.

## Requirements
- Node.js 20.19+ (recommended current LTS)
- npm

## Install and run
```bash
npm install
```
On Windows PowerShell, copy the env template with `Copy-Item .env.example .env` (on macOS/Linux use `cp .env.example .env`). Then set the backend URL:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```
Start:
```bash
npm run dev
```
Open http://localhost:5173

Production build:
```bash
npm run build
npm run preview
```

## Libraries
The package manifest uses npm's `latest` dist-tag for React, React DOM, React Router, Vite, Axios and the libraries used by the existing screens. `npm install` resolves the current published versions at install time. `.npmrc` enables legacy peer resolution because some older UI packages have not refreshed their React peer dependency declarations.

## Backend dependency
The backend was not included in the supplied export. API routes and response shapes are inherited from the original code, and therefore need to match your backend. Set `VITE_API_BASE_URL` correctly and ensure backend CORS allows `http://localhost:5173`.

## Important
- The uploaded export did not include the actual binary theme CSS, fonts and image files. Replace placeholder/missing visual assets with the original assets.
- The original `src/config.json` included a hardcoded login key. It was not copied. If that key was real, revoke/rotate it. Never put private API secrets in `VITE_*` variables.
- Authentication must be enforced by the backend; localStorage checks in the frontend are only UI navigation guards.
- Run `npm install` on your machine to generate a fresh `package-lock.json` for the latest registry versions.
