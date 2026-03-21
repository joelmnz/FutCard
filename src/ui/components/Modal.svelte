<script lang="ts">
  import { onMount } from 'svelte'

  let { open = false, onClose, children }: {
    open?: boolean
    onClose: () => void
    children?: import('svelte').Snippet
  } = $props()

  function handleEsc(event: KeyboardEvent) {
    if (open && event.key === 'Escape') onClose()
  }

  onMount(() => {
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  })
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={onClose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 11, 0.82);
    display: grid;
    place-items: center;
    z-index: 200;
    padding: 1rem;
  }

  .modal {
    position: relative;
    width: min(94vw, 700px);
    background: var(--bg-secondary);
    border: 1px solid #2a3857;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    animation: modalIn 0.22s var(--ease-out-quart, ease);
    max-height: 90vh;
    overflow-y: auto;
  }

  .close-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: var(--text-muted);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.12s ease;
  }

  .close-btn:hover {
    background: rgba(255,255,255,0.12);
    color: var(--text-primary);
  }

  @keyframes modalIn {
    from { transform: scale(0.94) translateY(10px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);    opacity: 1; }
  }
</style>
