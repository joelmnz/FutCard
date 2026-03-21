<script lang="ts">
  export let show = false
  export let onRefresh: () => void = () => location.reload()
</script>

{#if show}
  <button class="banner" type="button" on:click={onRefresh}>🆕 Update available - click to refresh</button>
{/if}

<style>
  .banner {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: 64px;
    background: #173459;
    border: 1px solid #3d6ca8;
    border-radius: 10px;
    padding: 0.5rem 0.8rem;
    z-index: 30;
    cursor: pointer;
  }
</style>
