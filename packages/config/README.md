# @nexus/config

Shared configurations for the NEXUS monorepo.

## Contents

- **eslint-config/** - ESLint configurations
  - `index.js` - Base ESLint config
  - `react.js` - React-specific rules
  - `next.js` - Next.js-specific rules

- **tsconfig/** - TypeScript configurations
  - `base.json` - Base TypeScript config
  - `nextjs.json` - Next.js-specific config
  - `node.json` - Node.js-specific config
  - `react-library.json` - React library config

- **tailwind-config/** - Tailwind CSS configuration
  - `index.js` - Base Tailwind config with NEXUS theme

## Usage

### ESLint

```js
// .eslintrc.js
module.exports = {
  extends: ['@nexus/config/eslint-config'],
};
```

For React projects:
```js
module.exports = {
  extends: ['@nexus/config/eslint-config/react'],
};
```

For Next.js projects:
```js
module.exports = {
  extends: ['@nexus/config/eslint-config/next'],
};
```

### TypeScript

```json
// tsconfig.json
{
  "extends": "@nexus/config/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

For Next.js:
```json
{
  "extends": "@nexus/config/tsconfig/nextjs.json"
}
```

For Node.js:
```json
{
  "extends": "@nexus/config/tsconfig/node.json"
}
```

### Tailwind CSS

```js
// tailwind.config.js
module.exports = {
  ...require('@nexus/config/tailwind-config'),
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
};
```
