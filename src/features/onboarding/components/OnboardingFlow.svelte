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

  const steps = [
    { icon: '⚽', title: 'Welcome to FutCard!', body: 'Build your dream squad, open packs, trade cards, and dominate the transfer market. Are you ready, Manager?' },
    { icon: '🇦�', title: 'What’s your name, Manager?', body: 'Every legend starts with a name…' },
    { icon: '📦', title: 'Your Starter Pack!', body: 'You receive 5 free cards to kick off your journey. Open packs to get better players. Rare, Epic, and Legendary cards are out there!' },
    { icon: '🏆', title: 'You’re Ready!', body: '🃏 Cards → your squad   📦 Packs → open for new players   🏦 Market → buy & sell cards   ⚽ Match → play vs AI. Good luck!' },
  ]

  const current = $derived(steps[step - 1])
</script>

<div class="onboarding-overlay">
  <div class="onboarding-card">
    <div class="step-icon">{current.icon}</div>
    <h2 class="step-title">{current.title}</h2>

    {#if step === 2}
      <p class="step-body">{current.body}</p>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="name-input"
        bind:value={name}
        placeholder="e.g. Gareth, Mo, Kylian..."
        onkeydown={(e) => e.key === 'Enter' && next()}
        autofocus
      />
    {:else}
      <p class="step-body">{current.body}</p>
    {/if}

    <div class="step-dots">
      {#each steps as _, i}
        <span class="dot" class:active={i + 1 === step}></span>
      {/each}
    </div>

    <Button onclick={next}>
      {step === 4 ? '⚽ Let’s Go!' : 'Continue →'}
    </Button>
  </div>
</div>

<style>
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(800px 600px at 50% 30%, #0f2a1a 0%, transparent 70%),
      var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .onboarding-card {
    max-width: 480px;
    width: 100%;
    background: var(--bg-panel);
    border: 2px solid rgba(0, 255, 135, 0.2);
    border-radius: var(--radius-lg);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 135, 0.08);
    animation: slideIn 0.4s ease;
  }

  .step-icon {
    font-size: 4rem;
    line-height: 1;
    animation: float 3s ease-in-out infinite;
  }

  .step-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--accent-green);
    letter-spacing: -0.02em;
  }

  .step-body {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 360px;
    white-space: pre-line;
  }

  .name-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    color: var(--text-primary);
    border: 2px solid rgba(0, 255, 135, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1rem;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    transition: border-color 0.15s ease;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--accent-green);
    box-shadow: 0 0 16px rgba(0, 255, 135, 0.2);
  }

  .name-input::placeholder { color: var(--text-muted); }

  .step-dots {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2a3a5a;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .dot.active {
    background: var(--accent-green);
    transform: scale(1.3);
    box-shadow: 0 0 8px rgba(0, 255, 135, 0.6);
  }

  @keyframes slideIn {
    from { transform: translateY(20px) scale(0.97); opacity: 0; }
    to   { transform: translateY(0)     scale(1);    opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
</style>
