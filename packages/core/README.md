# Shared Core foundation

This package is the required feature-neutral foundation for the private master repository and its approved distributions. It is not an independently published npm package and has no optional release checkbox.

- `lib/BaseTest.ts`: automatic profile setup, validation and restoration through `createProfileTest`.
- `lib/common-funcs.ts`: shared CSV, annotation, time and system utilities.
- `utils/report-properties.ts`: generic execution metadata.

Core imports no Web, API, Mobile, database, premium reporter, integration or Internal coordinator implementation. Configuration stays in `config/global/` and `config/project-profiles/`.

`createProfileTest({ optional: false })` keeps Master profiles required. `optional: true` permits an initially absent profile for the minimal shared/Web fixture. Both paths reject invalid names and existing malformed or undecryptable files. An optional `beforeProfile` callback allows the Commercial composition to activate its integrations without Core importing them.

Browser fixtures extend this foundation in `packages/web`. Fixture extensions for premium capabilities are composed in the `commercial` package, which ships only with the Commercial edition. Tests import each capability directly from its owning package (for example `@packages/web/lib/web-actions`). The only file left in `core/lib/` is the Master `BaseTest.ts` composition, which is moved in a later step.
