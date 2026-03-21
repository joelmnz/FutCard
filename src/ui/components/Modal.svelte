<script lang="ts">
  import { onMount } from 'svelte'
  export let open = false
  export let onClose: () => void = () => {}

  function handleEsc(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose()
  }

  onMount(() => {
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  })
</script>

{#if open}
  <div
    class="backdrop"
    role="button"
    tabindex="0"
    on:click={onClose}
    on:keydown={(event) => event.key === 'Enter' && onClose()}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <slot />
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 11, 0.76);
    display: grid;
    place-items: center;
    z-index: 40;
  }

  .modal {
    width: min(92vw, 700px);
    background: var(--bg-secondary);
    border: 1px solid #2a3857;
    border-radius: 16px;
    padding: 1rem;
    animation: slideIn 180ms ease;
  }
</style>
