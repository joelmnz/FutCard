<script lang="ts">
  let { message = '', type = 'info' }: {
    message?: string
    type?: 'success' | 'error' | 'warning' | 'info'
  } = $props()

  const icons: Record<string, string> = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  }
</script>

<div class="toast {type}">
  <span class="toast-icon">{icons[type]}</span>
  <span class="toast-msg">{message}</span>
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    background: var(--bg-panel);
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255,255,255,0.08);
    border-left: 4px solid #8aa0d6;
    min-width: 220px;
    max-width: 340px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: toastIn 0.28s var(--ease-out-quart, ease);
  }

  .success { border-left-color: var(--success); }
  .error   { border-left-color: var(--danger); }
  .warning { border-left-color: var(--warning); }
  .info    { border-left-color: var(--accent-blue); }

  .toast-icon { font-size: 1rem; flex-shrink: 0; }
  .toast-msg  { flex: 1; }

  @keyframes toastIn {
    from { transform: translateX(120%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
</style>
