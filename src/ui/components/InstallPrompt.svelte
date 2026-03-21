<script lang="ts">
  let show = false
  setTimeout(() => (show = true), 30_000)
</script>

{#if show}
  <div class="banner">📲 Install FutCard as an app</div>
{/if}

<style>
  .banner {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 14px;
    background: var(--bg-panel);
    border: 1px solid #37507e;
    border-radius: 10px;
    padding: 0.6rem 0.9rem;
    z-index: 30;
  }
</style>
