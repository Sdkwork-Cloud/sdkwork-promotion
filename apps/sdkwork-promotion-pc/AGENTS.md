# Application Guidelines

## SDKWORK Soul

Read `../../../sdkwork-specs/SOUL.md` before executing tasks in this application root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Use `../../../sdkwork-specs/README.md` as the task router and `../../../sdkwork-specs/AGENTS_SPEC.md` for this entrypoint. Do not copy global standards into this application. If the relative specs path does not resolve, stop and report the broken workspace layout.

## Application Identity

Read `sdkwork.app.config.json` when changing application behavior, runtime config, SDK wiring, release metadata, packaging, app-owned capabilities, or deployment metadata. Stop if the manifest is missing, empty, or ambiguous.

- Application root: `apps/sdkwork-promotion-pc/`
- Domain: `commerce`
- Capability: `promotion`
- Architecture: `pc-react`

## Local Dictionary Structure

- `AGENTS.md`: application execution rules and standards router.
- `.sdkwork/`: application-local skills, plugins, and workspace metadata.
- `sdkwork.app.config.json`: application identity and release manifest.
- `packages/`: React packages for promotion UI surfaces.
- `specs/`: application-level machine contracts.
- `src/`, `tests/`, `vite.config.ts`, `tsconfig.json`: shell source, tests, and build configuration.

## Spec Resolution Order

Use dynamic progressive loading before reading implementation files. Read this file, the app manifest, and the nearest module `specs/component.spec.json` first. Then use `../../../sdkwork-specs/README.md` to load only the global specs required by the task. Repository-wide work also loads `../../AGENTS.md`. Language-specific specs are on-demand only.

## Required Specs By Task Type

- Agent/workflow changes: `../../../sdkwork-specs/AGENTS_SPEC.md` and `../../../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`.
- TypeScript changes: `../../../sdkwork-specs/CODE_STYLE_SPEC.md`, `../../../sdkwork-specs/NAMING_SPEC.md`, and `../../../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- React UI changes: `../../../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../../../sdkwork-specs/FRONTEND_SPEC.md`, `../../../sdkwork-specs/UI_ARCHITECTURE_SPEC.md`, and `../../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`.
- SDK consumption: `../../../sdkwork-specs/SDK_SPEC.md`, `../../../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`, and `../../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.
- API integration: `../../../sdkwork-specs/API_SPEC.md`; list/search work also loads `../../../sdkwork-specs/PAGINATION_SPEC.md`.
- App identity/release: `../../../sdkwork-specs/APP_MANIFEST_SPEC.md`, `../../../sdkwork-specs/CONFIG_SPEC.md`, and `../../../sdkwork-specs/DEPLOYMENT_SPEC.md`.
- Package scripts: `../../../sdkwork-specs/PNPM_SCRIPT_SPEC.md`.
- Packaging workflows: `../../../sdkwork-specs/GITHUB_WORKFLOW_SPEC.md`, `../../../sdkwork-specs/PNPM_SCRIPT_SPEC.md`, and `../../../sdkwork-specs/DEPLOYMENT_SPEC.md`.

## Code Style Rules

React packages use `@sdkwork/promotion-pc-*` naming. Use `@sdkwork/utils` and public package exports. Consume SDKWork APIs through generated/composed SDK clients and injected service ports; do not create raw HTTP, manual auth headers, private source imports, legacy envelopes, or `requestId` wire fields.

## Build, Test, And Verification

Run the narrowest package typecheck or test first, followed by repository checks when boundaries change:

```bash
node ../../../sdkwork-specs/tools/check-agent-workflow-standard.mjs --root ../../..
node ../../../sdkwork-specs/tools/check-application-layering.mjs --root ../../..
node ../../../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace ../../..
node ../../../sdkwork-specs/tools/check-api-operation-patterns.mjs --workspace ../../..
node ../../../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace ../../..
node ../../../sdkwork-specs/tools/check-pagination.mjs --workspace ../../..
pnpm check
pnpm verify
```

## Agent Execution Rules

Inspect dirty worktree changes before editing and preserve unrelated user work. Never hand-edit generated SDK output or bypass generated/composed SDKs. Stop when the app manifest, owner contract, SDK method, or required relative spec is missing or ambiguous. Record command evidence before claiming completion.

## Task-Specific Standards Routing

- App SDK consumer work loads `APP_SDK_INTEGRATION_SPEC.md`, `SDK_SPEC.md`, and `SDK_WORKSPACE_GENERATION_SPEC.md`, then runs `check-app-sdk-consumer-imports.mjs`.
- HTTP API response work loads `API_SPEC.md`, then runs `check-api-operation-patterns.mjs` and `check-api-response-envelope.mjs`.
- List and search work loads `PAGINATION_SPEC.md` and `API_SPEC.md`, then runs `check-pagination.mjs`.

## Human Review Rules

Request human review before breaking public API/SDK behavior, changing application identity, changing runtime or release metadata, changing security/auth behavior, changing database migrations, changing generated SDK ownership, or performing destructive cleanup.
