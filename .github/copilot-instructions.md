# Project Guidelines

## Code Style
- Use TypeScript with strict typing and avoid `any`.
- Follow existing Svelte 5 runes patterns used in `*.svelte.ts` state modules under `src/core/state/`.
- Keep business logic in feature services/engines (`src/features/**`) and keep UI components focused on presentation/composition.
- Co-locate tests with feature logic using `*.test.ts` naming.

## Architecture
- App bootstrap flow: hydrate persisted state, start autosave, then mount the app (see `src/main.ts`).
- Core platform layer lives in `src/core/`:
  - `db/` for IndexedDB schema/helpers.
  - `persistence/` for hydrate/autosave.
  - `state/` for shared global runes state.
  - `types/` for domain contracts.
- Domain logic lives in `src/features/` (packs, market, match, trade, upgrades, cards).
- Shared UI primitives live in `src/ui/components/`; global styling tokens/patterns live in `src/ui/styles/`.

## Build and Test
- Install deps: `bun install`
- Dev server: `bun run dev`
- Project checks: `bun run check`
- Tests: `bun test`
- Production build: `bun run build`
- Preferred validation before finishing work: `bun run check && bun test && bun run build`

## Conventions
- Use Bun-first workflows. Tests rely on Bun preload config in `bunfig.toml` (`tests/setup.ts` sets up runes shims).
- Keep feature engines/services deterministic when possible; inject randomness via function parameters for testability.
- Persistence currently uses debounced snapshot saves across stores (`src/core/persistence/autosave.svelte.ts`), so avoid introducing high-frequency state churn without considering save cost.
- Deployment config currently assumes Vite `base: "/futcard/"` and `strictPort: true` (5177). Update if hosting/port requirements change.

## 🚀 Svelte 5 (Runes) Mandate

**CRITICAL**: This project uses Svelte 5. **Do NOT use Svelte 4 syntax.**

| Feature | ✅ Svelte 5 (Do this) | ❌ Svelte 4 (Legacy - STOP) |
| :--- | :--- | :--- |
| **State** | `let count = $state(0)` | `let count = 0` |
| **Props** | `let { data } = $props()` | `export let data` |
| **Props (Typed)** | `let { data }: { data: string } = $props()` | `export let data: string` |
| **Props (Generic)** | See "Generic Props" below | N/A |
| **Computed** | `let double = $derived(x * 2)` | `$: double = x * 2` |
| **Effects** | `$effect(() => { ... })` | `$: { ... }` |
| **Events** | `<button onclick={fn}>` | `<button on:click={fn}>` |
| **Inputs** | `<input bind:value={val}>` | Same (bind syntax unchanged) |
| **Component** | `<Comp />` | Same |

**Generic Props**: Use the `generics` attribute in the `<script>` tag to create type-safe generic components:

```svelte
<script lang="ts" generics="Item extends { text: string }">
	interface Props {
		items: Item[];
		select(item: Item): void;
	}

	let { items, select }: Props = $props();
</script>

{#each items as item}
	<button onclick={() => select(item)}>
		{item.text}
	</button>
{/each}
```

-   **Key Points**:
    -   Use `generics="TypeName"` or `generics="T extends ConstraintType"` in the `<script>` tag.
    -   Define an interface for your props using the generic type.
    -   Destructure props from `$props()` with the typed interface.
    -   Common use case: Lists/tables with typed items and callbacks.

**Common Svelte 5 Pitfalls:**
-   **State from Props**: `$state(prop)` only captures the *initial* value.
    -   *Fix*: Use `$effect(() => { local = prop })` to sync, or use `$derived` if read-only.
-   **Init from props (recommended)**: For one-time initialization from props, prefer `untrack`.
    -   Example: `let local = $state(untrack(() => prop ?? ''))`
-   **$derived style in this repo**: Prefer expression form `const x = $derived(expr)` for consistency with current tooling/type inference in this codebase.
    -   Avoid switching to getter-form `$derived(() => expr)` unless the target file already uses it and `bun run check` remains clean.
-   **$props typing**: Always type destructured `$props()` (prevents `unknown`/nullability check noise).
    -   Example: `let { data }: { data: PageData } = $props()`
-   **Class Directive**: Use `class:active={isActive}` (unchanged).
-   **Event Modifiers**: `onclick|preventDefault` is **GONE**. Use `e.preventDefault()` inside the handler.

## Docs
- Product and system specification: `docs/SPEC.md`
- Implementation notes and setup caveats: `docs/INITIAL_IMPLEMENTATION.md`
- Visual prototype reference: `docs/futcard-singlepage-poc.html`
- Keep this file minimal and link to docs for detailed behavior/rules instead of copying them.
