<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    subtitle?: string
    variant?: 'page' | 'section'
    children?: Snippet
  }

  let { title, subtitle, variant = 'page', children }: Props = $props()
</script>

<div class={`page-header ${variant}`}>
  <div class="page-header-copy">
    {#if variant === 'section'}
      <h3>{title}</h3>
    {:else}
      <h2>{title}</h2>
    {/if}
    {#if subtitle}
      <p class="page-intro">{subtitle}</p>
    {/if}
  </div>

  {#if children}
    <div class="page-header-right">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-header-copy {
    display: grid;
    gap: 0.2rem;
  }

  h2,
  h3 {
    margin: 0;
    font-weight: 900;
    color: var(--text-primary);
  }

  .page-header.page h2 {
    font-size: 1.5rem;
  }

  .page-header.section h3 {
    font-size: 1rem;
    font-weight: 800;
  }

  .page-intro {
    color: var(--text-muted);
    margin: 0;
    font-size: 0.9rem;
  }

  .page-header-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
</style>