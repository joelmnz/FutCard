declare global {
	// Minimal runes shim for Bun unit tests outside the Svelte compiler runtime.
	var $state: <T>(value: T) => T
	var $effect: (fn: () => void) => void
}

if (!globalThis.$state) {
	globalThis.$state = <T>(value: T) => value
}

if (!globalThis.$effect) {
	globalThis.$effect = (fn: () => void) => {
		fn()
	}
}

export {}
