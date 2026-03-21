<script lang="ts">
  import { gameState, markOnboardingDone, setManagerName } from '../../../core/state/game.state.svelte'
  import Button from '../../../ui/components/Button.svelte'

  let step = $state(1)
  let name = $state(gameState.managerName)

  function next() {
    if (step === 2 && name.trim()) setManagerName(name.trim())
    if (step < 4) step += 1
    else markOnboardingDone()
  }
</script>

<section class="onboarding">
  {#if step === 1}<h2>Welcome to FutCard</h2>{/if}
  {#if step === 2}
    <h2>What's your name, Manager?</h2>
    <input bind:value={name} placeholder="Type your manager name" />
  {/if}
  {#if step === 3}<h2>Here's your starter pack!</h2>{/if}
  {#if step === 4}<h2>Collection -> Packs -> Market. You're ready.</h2>{/if}

  <Button onclick={next}>Continue</Button>
</section>

<style>
  .onboarding {
    max-width: 540px;
    margin: 8vh auto;
    background: var(--bg-panel);
    border: 1px solid #2f456f;
    border-radius: 16px;
    padding: 1rem;
    display: grid;
    gap: 0.8rem;
  }

  input {
    background: #0f192d;
    color: var(--text-primary);
    border: 1px solid #2d4267;
    border-radius: 8px;
    padding: 0.55rem;
  }
</style>
