<script lang="ts">
  export let message = ''
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info'
</script>

<div class={`toast ${type}`}>{message}</div>

<style>
  .toast {
    padding: 0.7rem 0.8rem;
    border-left: 4px solid #8aa0d6;
    background: var(--bg-panel);
    border-radius: 8px;
    min-width: 220px;
    animation: slideIn 240ms ease;
  }
  .success { border-left-color: var(--success); }
  .error { border-left-color: var(--danger); }
  .warning { border-left-color: var(--warning); }
</style>
