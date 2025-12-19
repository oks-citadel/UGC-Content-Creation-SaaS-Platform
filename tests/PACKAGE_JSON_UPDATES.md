# Package.json Updates for Testing

Add these dependencies and scripts to your root `package.json`:

## Scripts to Add

```json
"test": "vitest run",
"test:unit": "vitest run tests/unit",
"test:integration": "vitest run tests/integration",
"test:watch": "vitest watch",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug": "playwright test --debug",
"test:load": "k6 run tests/load/k6/api-gateway.js",
"test:load:upload": "k6 run tests/load/k6/content-upload.js",
"test:load:concurrent": "k6 run tests/load/k6/concurrent-users.js",
"test:all": "pnpm test && pnpm test:e2e"
```

## Dev Dependencies to Add

```json
"@playwright/test": "^1.40.0",
"@swc/jest": "^0.2.29",
"@testing-library/jest-dom": "^6.1.5",
"@testing-library/react": "^14.1.2",
"@testing-library/user-event": "^14.5.1",
"@types/jest": "^29.5.11",
"@types/supertest": "^6.0.2",
"@vitest/coverage-v8": "^1.0.4",
"@vitest/ui": "^1.0.4",
"dotenv": "^16.3.1",
"jest": "^29.7.0",
"jest-mock-extended": "^3.0.5",
"supertest": "^6.3.3",
"vitest": "^1.0.4"
```

## Installation Command

```bash
pnpm add -D @playwright/test @swc/jest @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest @types/supertest @vitest/coverage-v8 @vitest/ui dotenv jest jest-mock-extended supertest vitest
```

## Playwright Installation

After installing dependencies, run:

```bash
pnpm exec playwright install
```

## K6 Installation

Install k6 for load testing:

- macOS: `brew install k6`
- Windows: `choco install k6`
- Linux: See https://k6.io/docs/getting-started/installation/
