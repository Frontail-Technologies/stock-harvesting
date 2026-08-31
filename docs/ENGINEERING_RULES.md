# Engineering Rules

Hard repository rules — not style preferences. See
[DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md) for the frontend/backend
trust boundary specifically, and [REGRESSION_RULES.md](./REGRESSION_RULES.md)
for feature-specific invariants. This file is about code hygiene and
responsibility boundaries in general.

## Code hygiene

- **Do not commit commented-out implementations.** Git history is the
  archive — if code is removed, delete it. A commented-out block left "for
  reference" is a maintenance liability, not documentation.
- **Remove unused imports, functions, components, types, and routes** when
  you find them in code you're already touching. Don't leave dead exports
  behind "in case something still uses them" — grep first, then delete.
- **Do not retain dead feature implementations "for later" without an
  active product requirement.** An orphaned route/component that nothing
  imports is not a feature in progress — it's dead code. See
  [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for the ones already found in this
  repo; don't add more without a real plan to finish them.
- **TODO/FIXME comments require a concrete reason.** "TODO: fix this
  later" with no context is worse than no comment. Remove stale
  TODO/FIXME comments you encounter if the thing they reference no longer
  applies.
- **Comments explain WHY, not WHAT.** If a comment restates what the next
  line obviously does, delete the comment. A comment earns its place by
  documenting a non-obvious constraint, a workaround for a specific bug, or
  a decision a future reader would otherwise reverse by "fixing" it back.

## Responsibility

- **React components primarily compose UI and interactions.** Domain/
  business calculations do not belong in a component body — see
  [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md) for exactly what counts
  as "domain calculation" vs. safe display-layer work (sorting/filtering
  already-computed values, formatting, local UI state).
- **API access goes through the existing feature API/hooks layer**
  (`src/features/<name>/api/`, `src/features/<name>/hooks/`) — don't call
  `fetch`/`apiFetch`/`adminApiFetch` directly from a component. See
  [COMPONENT_REGISTRY.md](./COMPONENT_REGISTRY.md) and
  [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) before adding a new one.
- **Do not duplicate the same domain calculation in frontend and backend.**
  One canonical implementation, on the backend (see
  [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md)). If the frontend needs a
  derived value, the backend computes and returns it.
- **Split files that own multiple independent responsibilities.** A
  service file that both fetches provider data and computes a ranking
  metric is two responsibilities; a component that both renders a chart
  and manages watchlist CRUD is two responsibilities.
- **Avoid unnecessary state synchronization / `useEffect` chains.** Prefer
  deriving values during render over mirroring one piece of state into
  another with an effect. If you find yourself writing an effect whose
  only job is "keep state B in sync with state A," ask whether B needs to
  be state at all.

## Types

- **Avoid arbitrary `any`.** Prefer explicit domain/API types.
- **Do not manually duplicate an API response shape** where a shared type
  already exists for it (check `src/features/<name>/types.ts` and the
  backend service's own return type before writing a parallel interface).

## Styling

- Use existing design tokens (`src/components/ui/*`, the CSS custom
  properties they're built on) — do not hardcode a repeated theme color
  when a token already exists for it.
- App UI (Charts, Dashboard, Watchlists, Admin) uses readable sans
  typography. Landing/Login may use display/editorial typography. See
  [REGRESSION_RULES.md](./REGRESSION_RULES.md).

## Error handling

- **Do not silently swallow errors** unless the operation is explicitly
  best-effort (e.g. a non-critical background sync that shouldn't fail
  the request it rode in on). Where an error is genuinely swallowed, say
  so in a one-line comment and why — not as a default habit.
- Best-effort failure handling must be a deliberate, documented choice at
  that specific call site, not a blanket `try {} catch {}` pattern applied
  out of caution.

## Architecture

- **Do not create a second source of truth for an established feature.**
  Reuse established stores/hooks/components/services — check
  [COMPONENT_REGISTRY.md](./COMPONENT_REGISTRY.md) and
  [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) before writing a new one
  that does roughly the same thing.
- **Code comments are not sufficient justification for permanent
  duplication.** A comment saying "this is intentionally separate" is a
  claim, not proof. Before consolidating *or* preserving a duplicate
  implementation, verify the actual current behavior — read both
  implementations, confirm whether they still genuinely differ, and only
  then decide. See [COMPONENT_REGISTRY.md](./COMPONENT_REGISTRY.md)'s
  note on this for the specific cases already found in this repo.
