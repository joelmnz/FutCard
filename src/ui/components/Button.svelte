<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'gold' | 'danger' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  } = $props()
</script>

<button class={`btn ${variant} ${size}`} {disabled} {onclick}>
  {#if loading}...
  {:else if children}{@render children()}{/if}
</button>

<style>
  .btn {
    border: 0;
    border-radius: 10px;
    padding: 0.55rem 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 140ms ease, opacity 140ms ease;
  }

  .btn:hover { transform: translateY(-1px); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .primary { background: var(--accent-green); color: #07120d; }
  .gold { background: var(--accent-gold); color: #272106; }
  .danger { background: var(--danger); color: #2a0505; }
  .outline { background: transparent; color: var(--text-primary); border: 1px solid #304061; }
  .ghost { background: transparent; color: var(--text-muted); }

  .sm { font-size: 0.78rem; }
  .md { font-size: 0.92rem; }
  .lg { font-size: 1.02rem; padding: 0.7rem 1.1rem; }
</style>
