<script lang="ts">
  interface Props {
    value: string | number
    label: string
    variant?: 'legendary' | 'epic' | 'rare' | 'value'
  }

  let { value, label, variant }: Props = $props()
</script>

<div class={`stat-box ${variant ?? ''}`.trim()}>
  <span class="stat-box-val">{value}</span>
  <span class="stat-box-label">{label}</span>
</div>

<style>
  .stat-box {
    background: var(--bg-panel);
    border: 1px solid #1e3050;
    border-radius: var(--radius-md);
    padding: 1rem;
    text-align: center;
    transition: transform 0.15s ease;
  }

  .stat-box:hover {
    transform: translateY(-2px);
  }

  .stat-box.legendary { border-color: rgba(255, 215, 0, 0.35); background: rgba(255, 215, 0, 0.04); }
  .stat-box.epic { border-color: rgba(206, 147, 216, 0.35); background: rgba(206, 147, 216, 0.04); }
  .stat-box.rare { border-color: rgba(79, 195, 247, 0.35); background: rgba(79, 195, 247, 0.04); }
  .stat-box.value { border-color: rgba(0, 255, 135, 0.3); background: rgba(0, 255, 135, 0.04); }

  .stat-box-val {
    display: block;
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-box.legendary .stat-box-val { color: var(--accent-gold); }
  .stat-box.epic .stat-box-val { color: var(--accent-purple); }
  .stat-box.rare .stat-box-val { color: var(--accent-blue); }
  .stat-box.value .stat-box-val { color: var(--accent-green); font-size: 1.3rem; }

  .stat-box-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
</style>