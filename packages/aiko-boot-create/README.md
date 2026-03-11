# @ai-partner-x/aiko-boot-create

CLI to create a new aiko-boot scaffold project (monorepo: api, admin, mobile, shared, optionally shared-auth).

## Usage

Run from **ai-frist-framework** repo root (so that `./scaffold` exists as the template source):

```bash
# Interactive: prompts for project name, target dir, and whether to include base system
pnpm run create

# Or run the CLI directly
node packages/aiko-boot-create/dist/cli.js

# With options (non-interactive)
node packages/aiko-boot-create/dist/cli.js my-app -n my-app --no-base-system
node packages/aiko-boot-create/dist/cli.js ./output-dir --name my-app --with-base-system
```

## Options

| Option | Description |
|--------|-------------|
| `[targetDir]` | Target directory for the new project. Default: `<cwd>/<projectName>` |
| `-n, --name <name>` | Project name, used as npm scope (e.g. `my-app` → `@my-app/*`) |
| `--with-base-system` | Include base system: login, shared-auth, user/menu management (later) |
| `--no-base-system` | Bare project without login/auth (default when not specified) |
| `--template-dir <dir>` | Path to scaffold template. Default: `<cwd>/scaffold` |

## Base system vs bare

- **With base system** (`--with-base-system`): Copies full scaffold including `shared-auth`, auth controller/service/dto, user entity/mapper, init-db with `sys_user`, login pages and protected routes in admin/mobile.
- **Bare** (`--no-base-system`): Same monorepo structure (api, admin, mobile, shared) but no `shared-auth`, no auth-related files in api, no login UI or protected routes; shared has no `AUTH_STORAGE_KEY`.

## After generation

1. If the target is inside this repo, add it to `pnpm-workspace.yaml` and run `pnpm install` from repo root.
2. `cd <targetDir>`
3. If base system was included: `pnpm init-db` (first time).
4. `pnpm dev`

## Build

```bash
pnpm build
```
