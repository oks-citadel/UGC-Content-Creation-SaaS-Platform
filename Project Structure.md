# UGC Creator Pro - Project Structure

This document provides a comprehensive overview of the project's directory structure, file organization, and architectural patterns.

## Root Directory Structure

```
ugc-creator-pro/
├── .github/                          # GitHub configuration
│   ├── workflows/                    # CI/CD workflows
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── cd-staging.yml            # Deploy to staging
│   │   ├── cd-production.yml         # Deploy to production
│   │   └── security-scan.yml         # Security scanning
│   ├── ISSUE_TEMPLATE/               # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md      # PR template
│   └── CODEOWNERS                    # Code ownership
├── .vscode/                          # VS Code settings
│   ├── settings.json                 # Workspace settings
│   ├── extensions.json               # Recommended extensions
│   └── launch.json                   # Debug configurations
├── apps/                             # Application packages
├── services/                         # Microservices
├── packages/                         # Shared packages
├── ai/                               # AI/ML components
├── infrastructure/                   # Infrastructure code
├── docs/                             # Documentation
├── tests/                            # Test suites
├── scripts/                          # Utility scripts
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier config
├── .eslintrc.js                      # ESLint config
├── docker-compose.yml                # Local development
├── docker-compose.prod.yml           # Production compose
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
├── tsconfig.base.json                # Base TS config
└── README.md                         # Project README
```

## Applications (`apps/`)

### Web Application (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/              # Dashboard routes
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── scripts/              # Script Studio
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── videos/               # Video Generator
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── create/page.tsx
│   │   │   ├── packs/                # Content Packs
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── library/              # Asset Library
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── analytics/            # Analytics
│   │   │   │   ├── page.tsx
│   │   │   │   ├── performance/page.tsx
│   │   │   │   └── insights/page.tsx
│   │   │   ├── calendar/             # Content Calendar
│   │   │   │   └── page.tsx
│   │   │   ├── settings/             # User Settings
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── brand-kits/page.tsx
│   │   │   │   ├── team/page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   └── integrations/page.tsx
│   │   │   └── admin/                # Admin panel
│   │   │       ├── users/page.tsx
│   │   │       └── system/page.tsx
│   │   ├── (marketing)/              # Marketing pages
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   └── blog/page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── webhooks/stripe/route.ts
│   │   │   └── upload/route.ts
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Error boundary
│   │   └── not-found.tsx             # 404 page
│   ├── components/                   # React components
│   │   ├── ui/                       # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   └── index.ts
│   │   ├── forms/                    # Form components
│   │   │   ├── ScriptForm.tsx
│   │   │   ├── VideoForm.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── layouts/                  # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── features/                 # Feature components
│   │   │   ├── script-studio/
│   │   │   │   ├── ScriptEditor.tsx
│   │   │   │   ├── TemplateSelector.tsx
│   │   │   │   ├── ToneSelector.tsx
│   │   │   │   └── HookGenerator.tsx
│   │   │   ├── video-generator/
│   │   │   │   ├── VideoPreview.tsx
│   │   │   │   ├── VoiceSelector.tsx
│   │   │   │   ├── AvatarSelector.tsx
│   │   │   │   └── EditingTools.tsx
│   │   │   ├── library/
│   │   │   │   ├── AssetGrid.tsx
│   │   │   │   ├── AssetFilters.tsx
│   │   │   │   └── RightsManager.tsx
│   │   │   └── analytics/
│   │   │       ├── PerformanceChart.tsx
│   │   │       ├── MetricsCard.tsx
│   │   │       └── InsightsPanel.tsx
│   │   └── providers/                # Context providers
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── QueryProvider.tsx
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useScripts.ts
│   │   ├── useVideos.ts
│   │   ├── useAnalytics.ts
│   │   └── useUpload.ts
│   ├── lib/                          # Utility libraries
│   │   ├── api/                      # API client
│   │   │   ├── client.ts
│   │   │   ├── scripts.ts
│   │   │   ├── videos.ts
│   │   │   └── analytics.ts
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── utils.ts                  # General utilities
│   │   └── constants.ts              # Constants
│   ├── store/                        # State management
│   │   ├── useAuthStore.ts
│   │   ├── useScriptStore.ts
│   │   └── useUIStore.ts
│   ├── styles/                       # Global styles
│   │   └── globals.css
│   └── types/                        # TypeScript types
│       ├── api.ts
│       ├── script.ts
│       ├── video.ts
│       └── user.ts
├── public/                           # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── postcss.config.js                 # PostCSS config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Package manifest
```

### Mobile Application (`apps/mobile/`)

```
apps/mobile/
├── src/
│   ├── screens/                      # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ScriptsScreen.tsx
│   │   │   ├── VideosScreen.tsx
│   │   │   └── LibraryScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── components/                   # Shared components
│   │   ├── ui/
│   │   └── features/
│   ├── navigation/                   # Navigation config
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── DashboardNavigator.tsx
│   ├── hooks/                        # Custom hooks
│   ├── services/                     # API services
│   ├── store/                        # State management
│   ├── utils/                        # Utilities
│   └── types/                        # TypeScript types
├── ios/                              # iOS native code
├── android/                          # Android native code
├── app.json                          # Expo config
├── metro.config.js                   # Metro bundler config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Package manifest
```

### API Gateway (`apps/api/`)

```
apps/api/
├── src/
│   ├── routes/                       # Route handlers
│   │   ├── v1/
│   │   │   ├── scripts.ts
│   │   │   ├── videos.ts
│   │   │   ├── library.ts
│   │   │   ├── analytics.ts
│   │   │   └── users.ts
│   │   └── webhooks/
│   │       ├── stripe.ts
│   │       └── meta.ts
│   ├── middleware/                   # Express middleware
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── services/                     # Service proxies
│   ├── utils/                        # Utilities
│   └── index.ts                      # Entry point
├── Dockerfile                        # Docker build
├── tsconfig.json                     # TypeScript config
└── package.json                      # Package manifest
```

## Microservices (`services/`)

Each service follows a consistent structure:

### Script Studio Service (`services/script-studio/`)

```
services/script-studio/
├── src/
│   ├── controllers/                  # HTTP controllers
│   │   ├── scriptController.ts
│   │   └── templateController.ts
│   ├── services/                     # Business logic
│   │   ├── scriptGenerationService.ts
│   │   ├── hookGenerationService.ts
│   │   └── templateService.ts
│   ├── repositories/                 # Data access
│   │   ├── scriptRepository.ts
│   │   └── templateRepository.ts
│   ├── models/                       # Data models
│   │   ├── Script.ts
│   │   └── Template.ts
│   ├── schemas/                      # Validation schemas
│   │   ├── scriptSchema.ts
│   │   └── templateSchema.ts
│   ├── events/                       # Event handlers
│   │   ├── publishers/
│   │   └── subscribers/
│   ├── utils/                        # Utilities
│   ├── config/                       # Configuration
│   │   ├── index.ts
│   │   └── llm.ts
│   └── index.ts                      # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── tsconfig.json
└── package.json
```

### Video Generator Service (`services/video-generator/`)

```
services/video-generator/
├── src/
│   ├── controllers/
│   │   └── videoController.ts
│   ├── services/
│   │   ├── videoGenerationService.ts
│   │   ├── voiceSynthesisService.ts
│   │   ├── avatarService.ts
│   │   └── editingService.ts
│   ├── processors/                   # Video processors
│   │   ├── captionProcessor.ts
│   │   ├── musicProcessor.ts
│   │   ├── transitionProcessor.ts
│   │   └── exportProcessor.ts
│   ├── pipelines/                    # Processing pipelines
│   │   ├── ugcVideoPipeline.ts
│   │   └── exportPipeline.ts
│   ├── repositories/
│   ├── models/
│   ├── queue/                        # Job queue handlers
│   │   ├── videoJobProcessor.ts
│   │   └── exportJobProcessor.ts
│   └── index.ts
├── tests/
├── Dockerfile
└── package.json
```

### Other Services (Similar Structure)

```
services/
├── content-pack/                     # Content pack builder
├── user-management/                  # Users & subscriptions
├── library/                          # Asset library
├── rights-management/                # Rights & compliance
├── analytics/                        # Analytics & intelligence
├── calendar/                         # Content calendar
├── collaboration/                    # Team collaboration
└── export/                           # Export & distribution
```

## Shared Packages (`packages/`)

### Shared Utilities (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── utils/
│   │   ├── date.ts
│   │   ├── string.ts
│   │   ├── validation.ts
│   │   └── crypto.ts
│   ├── constants/
│   │   ├── errors.ts
│   │   ├── platforms.ts
│   │   └── tones.ts
│   ├── errors/
│   │   ├── AppError.ts
│   │   └── errorCodes.ts
│   └── index.ts
├── tsconfig.json
└── package.json
```

### Shared UI Components (`packages/ui/`)

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── ...
│   ├── hooks/
│   ├── styles/
│   └── index.ts
├── .storybook/                       # Storybook config
├── tsconfig.json
└── package.json
```

### TypeScript Types (`packages/types/`)

```
packages/types/
├── src/
│   ├── api/
│   │   ├── requests.ts
│   │   └── responses.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── script.ts
│   │   ├── video.ts
│   │   ├── asset.ts
│   │   └── analytics.ts
│   ├── enums/
│   │   ├── status.ts
│   │   ├── platform.ts
│   │   └── tone.ts
│   └── index.ts
├── tsconfig.json
└── package.json
```

## AI/ML Components (`ai/`)

### LLM Gateway (`ai/llm-gateway/`)

```
ai/llm-gateway/
├── src/
│   ├── providers/
│   │   ├── claude.ts
│   │   ├── openai.ts
│   │   └── index.ts
│   ├── prompts/
│   │   ├── scriptPrompts.ts
│   │   ├── hookPrompts.ts
│   │   └── variationPrompts.ts
│   ├── orchestration/
│   │   ├── router.ts
│   │   └── fallback.ts
│   ├── cache/
│   │   └── promptCache.ts
│   └── index.ts
├── Dockerfile
└── package.json
```

### Voice Synthesis (`ai/voice-synthesis/`)

```
ai/voice-synthesis/
├── src/
│   ├── providers/
│   │   ├── elevenlabs.ts
│   │   └── azureSpeech.ts
│   ├── voices/
│   │   └── voiceRegistry.ts
│   ├── processing/
│   │   ├── audioNormalization.ts
│   │   └── emotionMapping.ts
│   └── index.ts
├── Dockerfile
└── package.json
```

### Video Pipeline (`ai/video-pipeline/`)

```
ai/video-pipeline/
├── src/
│   ├── generators/
│   │   ├── avatarGenerator.ts
│   │   └── sceneGenerator.ts
│   ├── editors/
│   │   ├── captionOverlay.ts
│   │   ├── musicMixer.ts
│   │   └── transitionApplier.ts
│   ├── exporters/
│   │   ├── tiktokExporter.ts
│   │   ├── instagramExporter.ts
│   │   └── youtubeExporter.ts
│   ├── ffmpeg/
│   │   └── commands.ts
│   └── index.ts
├── Dockerfile
└── package.json
```

### Performance ML (`ai/performance-ml/`)

```
ai/performance-ml/
├── src/
│   ├── models/
│   │   ├── performancePredictor.py
│   │   └── hookScorer.py
│   ├── features/
│   │   ├── textFeatures.py
│   │   └── visualFeatures.py
│   ├── training/
│   │   └── trainer.py
│   ├── inference/
│   │   └── predictor.py
│   └── api/
│       └── server.py
├── requirements.txt
├── Dockerfile
└── README.md
```

## Infrastructure (`infrastructure/`)

### Terraform (`infrastructure/terraform/`)

```
infrastructure/terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── modules/
│   ├── aks/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── storage/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── redis/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── monitoring/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── security/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

### Kubernetes (`infrastructure/kubernetes/`)

```
infrastructure/kubernetes/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── rbac.yaml
├── services/
│   ├── script-studio/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── video-generator/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   └── [other services]/
├── ingress/
│   ├── ingress.yaml
│   └── certificates.yaml
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── alerts/
├── overlays/
│   ├── dev/
│   ├── staging/
│   └── production/
└── kustomization.yaml
```

## Documentation (`docs/`)

```
docs/
├── api/
│   ├── README.md
│   ├── openapi.yaml
│   └── graphql-schema.graphql
├── architecture/
│   ├── ARCHITECTURAL-DIAGRAM.md
│   ├── data-flow.md
│   └── security.md
├── guides/
│   ├── Setup_Guide.md
│   ├── deployment.md
│   └── troubleshooting.md
├── Platform-Requirements.md
├── Platform-Operational-Structure.md
├── EXECUTIVE_SUMMARY.md
└── contributing.md
```

## Tests (`tests/`)

```
tests/
├── unit/
│   ├── services/
│   │   ├── scriptService.test.ts
│   │   └── videoService.test.ts
│   ├── utils/
│   │   └── validation.test.ts
│   └── components/
│       └── Button.test.tsx
├── integration/
│   ├── api/
│   │   ├── scripts.test.ts
│   │   └── videos.test.ts
│   └── services/
│       └── workflow.test.ts
├── e2e/
│   ├── specs/
│   │   ├── auth.spec.ts
│   │   ├── scriptGeneration.spec.ts
│   │   └── videoCreation.spec.ts
│   └── fixtures/
├── fixtures/
│   ├── scripts.json
│   └── videos.json
├── jest.config.js
├── playwright.config.ts
└── README.md
```

## Scripts (`scripts/`)

```
scripts/
├── setup/
│   ├── install-deps.sh
│   ├── setup-env.sh
│   └── init-db.sh
├── deploy/
│   ├── build-images.sh
│   ├── push-images.sh
│   └── deploy-k8s.sh
├── db/
│   ├── migrate.sh
│   ├── seed.sh
│   └── backup.sh
├── dev/
│   ├── start-local.sh
│   ├── test-e2e.sh
│   └── generate-types.sh
└── maintenance/
    ├── cleanup-storage.sh
    └── rotate-secrets.sh
```

## Configuration Files

### Root `package.json` (Monorepo)

```json
{
  "name": "ugc-creator-pro",
  "private": true,
  "workspaces": [
    "apps/*",
    "services/*",
    "packages/*",
    "ai/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "typescript": "^5.2.0"
  }
}
```

### `turbo.json` (Build Pipeline)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

This structure supports a scalable, maintainable, and well-organized codebase that can grow with the platform's needs.
