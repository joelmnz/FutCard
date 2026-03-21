<script lang="ts">
  import Toast from './Toast.svelte'
  export let items: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }> = []
</script>

<div class="container">
  {#each items as item (item.id)}
    <Toast message={item.message} type={item.type} />
  {/each}
</div>

<style>
  .container {
    position: fixed;
    right: 14px;
    bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 60;
  }
</style>
