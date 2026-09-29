// ============================================================
// SOUND SYSTEM (Web Audio API — no external files)
// ============================================================
let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}
function _tone(freq, type, dur, vol = 0.25, delay = 0) {
  try {
    const ctx = _getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch(e) {}
}
function _whoosh(dur = 0.35) {
  try {
    const ctx = _getAudioCtx(); if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 900; flt.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(flt); flt.connect(gain); gain.connect(ctx.destination); src.start();
  } catch(e) {}
}
function soundPackOpen()    { _whoosh(0.4); _tone(300,'sine',0.2,0.18,0.2); _tone(500,'sine',0.2,0.18,0.37); }
function soundCardFlip()    { _tone(680,'square',0.04,0.07); }
function soundLegendary()   { [523,659,784,1047].forEach((f,i) => _tone(f,'sine',0.38,0.28,i*0.13)); _tone(1047,'triangle',0.75,0.22,0.55); }
function soundEpic()        { [440,554,659].forEach((f,i) => _tone(f,'sine',0.28,0.24,i*0.1)); }
function soundCoin()        { _tone(880,'sine',0.12,0.22); _tone(1100,'sine',0.1,0.16,0.1); }
function soundBuy()         { _tone(440,'sine',0.1,0.2); _tone(550,'sine',0.1,0.2,0.1); }
function soundError()       { _tone(160,'sawtooth',0.15,0.2); }
function soundTradeAccept() { [330,415,523,659].forEach((f,i) => _tone(f,'sine',0.25,0.25,i*0.1)); }

// ============================================================
// CONFETTI
// ============================================================
function launchConfetti(dur = 2600) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  const colors = ['#FFD700','#FF6B35','#9B59B6','#3498DB','#00D4AA','#FF2D78','#2ecc71','#fff'];
  const pieces = Array.from({length: 110}, () => ({
    x: Math.random() * canvas.width, y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3 + 2,
    rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 9,
    w: Math.random() * 11 + 6, h: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)], alpha: 1
  }));
  const start = performance.now();
  function frame(now) {
    const el = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fadeAt = dur * 0.55;
    pieces.forEach(p => {
      p.x += p.vx; p.vy += 0.07; p.y += p.vy; p.rot += p.rotV;
      if (el > fadeAt) p.alpha = Math.max(0, 1 - (el - fadeAt) / (dur - fadeAt));
      ctx.save(); ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (el < dur) requestAnimationFrame(frame); else canvas.remove();
  }
  requestAnimationFrame(frame);
}

// ============================================================
// LEGENDARY CELEBRATION
// ============================================================
function showLegendaryCelebration(name) {
  soundLegendary();
  launchConfetti(3000);
  const el = document.createElement('div');
  el.id = 'legendary-flash';
  el.innerHTML = `<div class="legendary-flash-content">
    <div class="legendary-flash-title">🔥 LEGENDARY! 🔥</div>
    <div class="legendary-flash-name">${name}</div>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// ============================================================
// DATA — PLAYER ROSTER (2026/27 season snapshot)
// ============================================================
// Curated real-player card templates for all newly generated cards.
// Club, nation and position were verified against Transfermarkt league and
// club squad pages (saison_id 2026, fetched 2026-09-29); dual-nation players
// use the national team recorded on their Transfermarkt profile. Per-player
// sources: docs/roster-2026-27.md. Goalkeepers are excluded (outfield
// snapshot); stats are authored plausible profiles bound to each player.
// Overall, rarity, emoji and base price derive from the five stats, so a
// stronger player always rates and prices at or above a weaker one.
const ROSTER_SEASON = '2026/27';
const ROSTER_AS_OF = '2026-09-29';

const PLAYER_EMOJIS = ['🧑','👨','👦','🧔','👱','🧑‍🦱','🧑‍🦰','🧑‍🦳'];
// Legacy identity pools kept only as normalization fallbacks for corrupt v1 saves.
const CLUBS = [
  'Manchester City','Arsenal','Liverpool','Chelsea','Manchester United',
  'Tottenham','Newcastle','Aston Villa','Brighton','West Ham',
  'Real Madrid','Barcelona','Bayern Munich','PSG','Juventus',
  'Atletico Madrid','Dortmund','Inter Milan','AC Milan','Ajax'
];
const NATIONS = ['🏴','🇧🇷','🇦🇷','🇫🇷','🇩🇪','🇵🇹','🇳🇱','🇧🇪','🇪🇸','🇮🇹','🇸🇳','🇳🇬','🇺🇾','🇨🇴','🇲🇦'];

const FIRST_NAMES = [
  'Liam','Noah','Oliver','James','Elijah','Lucas','Mason','Ethan','Aiden','Logan',
  'Carlos','Diego','Marco','Rafael','Bruno','Sergio','Antoine','Kylian','Erling','Vinicius',
  'Mohamed','Sadio','Riyad','Kevin','Joshua','Trent','Declan','Jude','Phil','Bukayo',
  'Harry','Marcus','Raheem','Jack','Jordan','Kieran','Luke','Ben','Aaron','Kalvin',
  'Lautaro','Romelu','Tammy','Olivier','Karim','Robert','Thomas','Leon','Leroy','Jamal'
];
const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Martinez','Davis','Wilson','Taylor',
  'Salah','Mane','Mahrez','De Bruyne','Walker','Alexander-Arnold','Rice','Bellingham','Foden','Saka',
  'Kane','Rashford','Sterling','Grealish','Henderson','Trippier','Shaw','White','Ramsdale','Phillips',
  'Martinez','Lukaku','Abraham','Giroud','Benzema','Lewandowski','Muller','Goretzka','Gnabry','Musiala',
  'Silva','Neymar','Mbappe','Griezmann','Pogba','Kante','Varane','Hernandez','Pavard','Dembele'
];

function randName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + ' ' +
         LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

const PLAYER_TEMPLATES = [
  { name: 'Erling Haaland', club: 'Manchester City', nation: '🇳🇴', position: 'ST', pace: 89, shooting: 93, passing: 71, dribbling: 80, defense: 45, },
  { name: 'Phil Foden', club: 'Manchester City', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CAM', pace: 80, shooting: 82, passing: 85, dribbling: 87, defense: 48, },
  { name: 'Jérémy Doku', club: 'Manchester City', nation: '🇧🇪', position: 'LW', pace: 92, shooting: 72, passing: 76, dribbling: 91, defense: 32, },
  { name: 'Rúben Dias', club: 'Manchester City', nation: '🇵🇹', position: 'CB', pace: 76, shooting: 40, passing: 74, dribbling: 68, defense: 88, },
  { name: 'Marc Guéhi', club: 'Manchester City', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 76, shooting: 40, passing: 72, dribbling: 66, defense: 87, },
  { name: 'Rayan Cherki', club: 'Manchester City', nation: '🇫🇷', position: 'CAM', pace: 65, shooting: 71, passing: 73, dribbling: 78, defense: 61, },
  { name: 'Ayyoub Bouaddi', club: 'Manchester City', nation: '🇲🇦', position: 'CDM', pace: 53, shooting: 52, passing: 63, dribbling: 60, defense: 64, },
  { name: 'Enzo Fernández', club: 'Manchester City', nation: '🇦🇷', position: 'CM', pace: 67, shooting: 67, passing: 81, dribbling: 79, defense: 69, },
  { name: 'Bukayo Saka', club: 'Arsenal', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'RW', pace: 88, shooting: 87, passing: 87, dribbling: 92, defense: 52, },
  { name: 'Martin Ødegaard', club: 'Arsenal', nation: '🇳🇴', position: 'CAM', pace: 76, shooting: 82, passing: 93, dribbling: 88, defense: 52, },
  { name: 'Declan Rice', club: 'Arsenal', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CM', pace: 76, shooting: 74, passing: 84, dribbling: 79, defense: 82, },
  { name: 'William Saliba', club: 'Arsenal', nation: '🇫🇷', position: 'CB', pace: 82, shooting: 42, passing: 76, dribbling: 70, defense: 88, },
  { name: 'Gabriel', club: 'Arsenal', nation: '🇧🇷', position: 'CB', pace: 74, shooting: 42, passing: 70, dribbling: 62, defense: 89, },
  { name: 'Martín Zubimendi', club: 'Arsenal', nation: '🇪🇸', position: 'CDM', pace: 66, shooting: 70, passing: 87, dribbling: 80, defense: 85, },
  { name: 'Viktor Gyökeres', club: 'Arsenal', nation: '🇸🇪', position: 'ST', pace: 83, shooting: 75, passing: 66, dribbling: 79, defense: 60, },
  { name: 'Cristhian Mosquera', club: 'Arsenal', nation: '🇪🇸', position: 'CB', pace: 61, shooting: 40, passing: 63, dribbling: 54, defense: 67, },
  { name: 'Myles Lewis-Skelly', club: 'Arsenal', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CDM', pace: 55, shooting: 56, passing: 70, dribbling: 60, defense: 68, },
  { name: 'Max Dowman', club: 'Arsenal', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'RW', pace: 65, shooting: 51, passing: 50, dribbling: 57, defense: 38, },
  { name: 'Florian Wirtz', club: 'Liverpool', nation: '🇩🇪', position: 'CAM', pace: 80, shooting: 84, passing: 91, dribbling: 90, defense: 50, },
  { name: 'Alexander Isak', club: 'Liverpool', nation: '🇸🇪', position: 'ST', pace: 87, shooting: 90, passing: 79, dribbling: 85, defense: 38, },
  { name: 'Virgil van Dijk', club: 'Liverpool', nation: '🇳🇱', position: 'CB', pace: 81, shooting: 59, passing: 84, dribbling: 75, defense: 91, },
  { name: 'Dominik Szoboszlai', club: 'Liverpool', nation: '🇭🇺', position: 'CAM', pace: 77, shooting: 81, passing: 76, dribbling: 83, defense: 62, },
  { name: 'Alexis Mac Allister', club: 'Liverpool', nation: '🇦🇷', position: 'CM', pace: 70, shooting: 78, passing: 86, dribbling: 82, defense: 70, },
  { name: 'Hugo Ekitiké', club: 'Liverpool', nation: '🇫🇷', position: 'ST', pace: 73, shooting: 73, passing: 64, dribbling: 76, defense: 60, },
  { name: 'Conor Bradley', club: 'Liverpool', nation: '🇬🇧', position: 'RB', pace: 66, shooting: 47, passing: 65, dribbling: 65, defense: 75, },
  { name: 'Rio Ngumoha', club: 'Liverpool', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LW', pace: 66, shooting: 59, passing: 57, dribbling: 62, defense: 42, },
  { name: 'Trey Nyoni', club: 'Liverpool', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CM', pace: 53, shooting: 48, passing: 59, dribbling: 61, defense: 55, },
  { name: 'Cole Palmer', club: 'Chelsea', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CAM', pace: 78, shooting: 86, passing: 86, dribbling: 88, defense: 42, },
  { name: 'Moisés Caicedo', club: 'Chelsea', nation: '🇪🇨', position: 'CDM', pace: 70, shooting: 68, passing: 83, dribbling: 78, defense: 86, },
  { name: 'Estêvão', club: 'Chelsea', nation: '🇧🇷', position: 'RW', pace: 86, shooting: 78, passing: 76, dribbling: 88, defense: 30, },
  { name: 'Pedro Neto', club: 'Chelsea', nation: '🇵🇹', position: 'RW', pace: 78, shooting: 70, passing: 62, dribbling: 73, defense: 51, },
  { name: 'Levi Colwill', club: 'Chelsea', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 70, shooting: 46, passing: 69, dribbling: 66, defense: 75, },
  { name: 'Malo Gusto', club: 'Chelsea', nation: '🇫🇷', position: 'RB', pace: 61, shooting: 46, passing: 70, dribbling: 69, defense: 79, },
  { name: 'Josh Acheampong', club: 'Chelsea', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 58, shooting: 41, passing: 67, dribbling: 53, defense: 67, },
  { name: 'Aarón Anselmino', club: 'Chelsea', nation: '🇦🇷', position: 'CB', pace: 58, shooting: 34, passing: 59, dribbling: 55, defense: 62, },
  { name: 'Bruno Fernandes', club: 'Manchester United', nation: '🇵🇹', position: 'CAM', pace: 74, shooting: 83, passing: 89, dribbling: 84, defense: 62, },
  { name: 'Bryan Mbeumo', club: 'Manchester United', nation: '🇨🇲', position: 'RW', pace: 84, shooting: 82, passing: 79, dribbling: 82, defense: 40, },
  { name: 'Matheus Cunha', club: 'Manchester United', nation: '🇧🇷', position: 'ST', pace: 80, shooting: 84, passing: 80, dribbling: 85, defense: 40, },
  { name: 'Benjamin Sesko', club: 'Manchester United', nation: '🇸🇮', position: 'ST', pace: 77, shooting: 71, passing: 60, dribbling: 68, defense: 59, },
  { name: 'Carlos Baleba', club: 'Manchester United', nation: '🇨🇲', position: 'CDM', pace: 65, shooting: 63, passing: 76, dribbling: 69, defense: 77, },
  { name: 'Diogo Dalot', club: 'Manchester United', nation: '🇵🇹', position: 'RB', pace: 66, shooting: 46, passing: 69, dribbling: 65, defense: 79, },
  { name: 'Kobbie Mainoo', club: 'Manchester United', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CM', pace: 64, shooting: 61, passing: 77, dribbling: 71, defense: 65, },
  { name: 'Ayden Heaven', club: 'Manchester United', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 56, shooting: 35, passing: 58, dribbling: 53, defense: 64, },
  { name: 'Harry Amass', club: 'Manchester United', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LB', pace: 57, shooting: 39, passing: 56, dribbling: 56, defense: 65, },
  { name: 'Mohammed Kudus', club: 'Tottenham', nation: '🇬🇭', position: 'RW', pace: 88, shooting: 76, passing: 76, dribbling: 88, defense: 40, },
  { name: 'Xavi Simons', club: 'Tottenham', nation: '🇳🇱', position: 'CAM', pace: 82, shooting: 78, passing: 85, dribbling: 86, defense: 40, },
  { name: 'Micky van de Ven', club: 'Tottenham', nation: '🇳🇱', position: 'CB', pace: 87, shooting: 40, passing: 70, dribbling: 66, defense: 85, },
  { name: 'Pedro Porro', club: 'Tottenham', nation: '🇪🇸', position: 'RB', pace: 72, shooting: 49, passing: 76, dribbling: 69, defense: 77, },
  { name: 'Dominic Solanke', club: 'Tottenham', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ST', pace: 72, shooting: 66, passing: 62, dribbling: 67, defense: 49, },
  { name: 'Lucas Bergvall', club: 'Tottenham', nation: '🇸🇪', position: 'CM', pace: 67, shooting: 67, passing: 74, dribbling: 71, defense: 66, },
  { name: 'Destiny Udogie', club: 'Tottenham', nation: '🇮🇹', position: 'LB', pace: 63, shooting: 51, passing: 73, dribbling: 66, defense: 78, },
  { name: 'Yoane Wissa', club: 'Newcastle', nation: '🇨🇩', position: 'ST', pace: 78, shooting: 77, passing: 71, dribbling: 79, defense: 62, },
  { name: 'Sven Botman', club: 'Newcastle', nation: '🇳🇱', position: 'CB', pace: 72, shooting: 47, passing: 76, dribbling: 67, defense: 73, },
  { name: 'Harvey Barnes', club: 'Newcastle', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LW', pace: 78, shooting: 64, passing: 60, dribbling: 71, defense: 51, },
  { name: 'Lewis Hall', club: 'Newcastle', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LB', pace: 58, shooting: 45, passing: 67, dribbling: 63, defense: 73, },
  { name: 'Lewis Miley', club: 'Newcastle', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CM', pace: 59, shooting: 58, passing: 63, dribbling: 65, defense: 59, },
  { name: 'William Osula', club: 'Newcastle', nation: '🇩🇰', position: 'ST', pace: 64, shooting: 59, passing: 55, dribbling: 64, defense: 47, },
  { name: 'Amadou Onana', club: 'Aston Villa', nation: '🇧🇪', position: 'CDM', pace: 68, shooting: 61, passing: 75, dribbling: 68, defense: 84, },
  { name: 'John McGinn', club: 'Aston Villa', nation: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'CM', pace: 63, shooting: 56, passing: 68, dribbling: 70, defense: 59, },
  { name: 'Pau Torres', club: 'Aston Villa', nation: '🇪🇸', position: 'CB', pace: 67, shooting: 45, passing: 76, dribbling: 63, defense: 76, },
  { name: 'Emiliano Buendía', club: 'Aston Villa', nation: '🇦🇷', position: 'CAM', pace: 56, shooting: 62, passing: 66, dribbling: 68, defense: 48, },
  { name: 'Ian Maatsen', club: 'Aston Villa', nation: '🇳🇱', position: 'LB', pace: 71, shooting: 45, passing: 67, dribbling: 69, defense: 74, },
  { name: 'Matty Cash', club: 'Aston Villa', nation: '🇵🇱', position: 'RB', pace: 62, shooting: 46, passing: 65, dribbling: 63, defense: 70, },
  { name: 'Lamare Bogarde', club: 'Aston Villa', nation: '🇳🇱', position: 'CDM', pace: 56, shooting: 49, passing: 64, dribbling: 56, defense: 65, },
  { name: 'Kaoru Mitoma', club: 'Brighton', nation: '🇯🇵', position: 'LW', pace: 82, shooting: 70, passing: 69, dribbling: 83, defense: 59, },
  { name: 'Yankuba Minteh', club: 'Brighton', nation: '🇬🇲', position: 'RW', pace: 82, shooting: 68, passing: 67, dribbling: 68, defense: 52, },
  { name: 'Georginio Rutter', club: 'Brighton', nation: '🇫🇷', position: 'ST', pace: 64, shooting: 64, passing: 54, dribbling: 67, defense: 48, },
  { name: 'Malick Yalcouyé', club: 'Brighton', nation: '🇨🇮', position: 'CM', pace: 55, shooting: 52, passing: 66, dribbling: 65, defense: 61, },
  { name: 'Charalampos Kostoulas', club: 'Brighton', nation: '🇬🇷', position: 'ST', pace: 62, shooting: 59, passing: 51, dribbling: 58, defense: 41, },
  { name: 'Morgan Gibbs-White', club: 'Nottingham Forest', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CAM', pace: 73, shooting: 73, passing: 75, dribbling: 78, defense: 60, },
  { name: 'Nikola Milenković', club: 'Nottingham Forest', nation: '🇷🇸', position: 'CB', pace: 66, shooting: 49, passing: 69, dribbling: 64, defense: 77, },
  { name: 'Daniel Muñoz', club: 'Nottingham Forest', nation: '🇨🇴', position: 'RB', pace: 73, shooting: 46, passing: 69, dribbling: 66, defense: 75, },
  { name: 'Dan Ndoye', club: 'Nottingham Forest', nation: '🇨🇭', position: 'RW', pace: 75, shooting: 63, passing: 59, dribbling: 59, defense: 48, },
  { name: 'Chris Wood', club: 'Nottingham Forest', nation: '🇳🇿', position: 'ST', pace: 66, shooting: 63, passing: 56, dribbling: 67, defense: 47, },
  { name: 'Nicolò Savona', club: 'Nottingham Forest', nation: '🇮🇹', position: 'RB', pace: 59, shooting: 40, passing: 64, dribbling: 64, defense: 72, },
  { name: 'Kevin Schade', club: 'Brentford', nation: '🇩🇪', position: 'LW', pace: 75, shooting: 68, passing: 62, dribbling: 71, defense: 49, },
  { name: 'Dango Ouattara', club: 'Brentford', nation: '🇧🇫', position: 'RW', pace: 72, shooting: 63, passing: 60, dribbling: 62, defense: 44, },
  { name: 'Nathan Collins', club: 'Brentford', nation: '🇮🇪', position: 'CB', pace: 64, shooting: 41, passing: 67, dribbling: 59, defense: 65, },
  { name: 'Adam Wharton', club: 'Crystal Palace', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CDM', pace: 63, shooting: 63, passing: 74, dribbling: 65, defense: 78, },
  { name: 'Jean-Philippe Mateta', club: 'Crystal Palace', nation: '🇫🇷', position: 'ST', pace: 73, shooting: 69, passing: 62, dribbling: 73, defense: 55, },
  { name: 'Ismaïla Sarr', club: 'Crystal Palace', nation: '🇸🇳', position: 'RW', pace: 69, shooting: 62, passing: 56, dribbling: 68, defense: 44, },
  { name: 'Justin Kluivert', club: 'Bournemouth', nation: '🇳🇱', position: 'CAM', pace: 62, shooting: 65, passing: 66, dribbling: 73, defense: 49, },
  { name: 'Evanilson', club: 'Bournemouth', nation: '🇧🇷', position: 'ST', pace: 68, shooting: 64, passing: 59, dribbling: 61, defense: 51, },
  { name: 'Junior Kroupi', club: 'Bournemouth', nation: '🇫🇷', position: 'ST', pace: 64, shooting: 62, passing: 57, dribbling: 62, defense: 44, },
  { name: 'Tyler Adams', club: 'Bournemouth', nation: '🇺🇸', position: 'CDM', pace: 59, shooting: 55, passing: 66, dribbling: 57, defense: 69, },
  { name: 'Ethan Ampadu', club: 'Leeds', nation: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', position: 'CDM', pace: 55, shooting: 50, passing: 65, dribbling: 59, defense: 72, },
  { name: 'Ao Tanaka', club: 'Leeds', nation: '🇯🇵', position: 'CM', pace: 61, shooting: 56, passing: 67, dribbling: 65, defense: 64, },
  { name: 'Dominic Calvert-Lewin', club: 'Leeds', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ST', pace: 66, shooting: 66, passing: 58, dribbling: 62, defense: 50, },
  { name: 'Granit Xhaka', club: 'Sunderland', nation: '🇨🇭', position: 'CDM', pace: 56, shooting: 58, passing: 74, dribbling: 65, defense: 74, },
  { name: 'Enzo Le Fée', club: 'Sunderland', nation: '🇫🇷', position: 'CM', pace: 60, shooting: 56, passing: 66, dribbling: 67, defense: 64, },
  { name: 'Noah Sadiki', club: 'Sunderland', nation: '🇨🇩', position: 'CM', pace: 59, shooting: 55, passing: 67, dribbling: 63, defense: 60, },
  { name: 'Alex Iwobi', club: 'Fulham', nation: '🇳🇬', position: 'CDM', pace: 56, shooting: 52, passing: 70, dribbling: 64, defense: 67, },
  { name: 'Joachim Andersen', club: 'Fulham', nation: '🇩🇰', position: 'CB', pace: 63, shooting: 42, passing: 68, dribbling: 58, defense: 65, },
  { name: 'Rodrigo Muniz', club: 'Fulham', nation: '🇧🇷', position: 'ST', pace: 67, shooting: 64, passing: 54, dribbling: 63, defense: 47, },
  { name: 'Jack Grealish', club: 'Everton', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LW', pace: 81, shooting: 64, passing: 62, dribbling: 74, defense: 53, },
  { name: 'Jarrad Branthwaite', club: 'Everton', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 66, shooting: 44, passing: 69, dribbling: 65, defense: 75, },
  { name: 'Tyler Dibling', club: 'Everton', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'RW', pace: 67, shooting: 57, passing: 54, dribbling: 68, defense: 40, },
  { name: 'Harrison Armstrong', club: 'Everton', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CM', pace: 52, shooting: 49, passing: 65, dribbling: 64, defense: 53, },
  { name: 'Julio Enciso', club: 'Ipswich', nation: '🇵🇾', position: 'CAM', pace: 61, shooting: 66, passing: 60, dribbling: 69, defense: 49, },
  { name: 'Jack Clarke', club: 'Ipswich', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'LW', pace: 71, shooting: 62, passing: 60, dribbling: 61, defense: 41, },
  { name: 'Sindre Walle Egeli', club: 'Ipswich', nation: '🇳🇴', position: 'RW', pace: 70, shooting: 61, passing: 57, dribbling: 64, defense: 41, },
  { name: 'Jack Rudoni', club: 'Coventry', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CAM', pace: 59, shooting: 62, passing: 62, dribbling: 68, defense: 47, },
  { name: 'Haji Wright', club: 'Coventry', nation: '🇺🇸', position: 'ST', pace: 64, shooting: 63, passing: 52, dribbling: 66, defense: 50, },
  { name: 'Tatsuhiro Sakamoto', club: 'Coventry', nation: '🇯🇵', position: 'RW', pace: 72, shooting: 55, passing: 58, dribbling: 63, defense: 40, },
  { name: 'Mohamed Belloumi', club: 'Hull', nation: '🇩🇿', position: 'RW', pace: 68, shooting: 58, passing: 58, dribbling: 64, defense: 40, },
  { name: 'Oli McBurnie', club: 'Hull', nation: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'ST', pace: 60, shooting: 60, passing: 54, dribbling: 62, defense: 48, },
  { name: 'Joe Gelhardt', club: 'Hull', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ST', pace: 64, shooting: 62, passing: 52, dribbling: 58, defense: 47, },
  { name: 'Milos Kerkez', club: 'Liverpool', nation: '🇭🇺', position: 'LB', pace: 63, shooting: 53, passing: 73, dribbling: 73, defense: 81, },
  { name: 'Jurriën Timber', club: 'Arsenal', nation: '🇳🇱', position: 'RB', pace: 66, shooting: 52, passing: 73, dribbling: 73, defense: 81, },
  { name: 'Alejandro Balde', club: 'Barcelona', nation: '🇪🇸', position: 'LB', pace: 65, shooting: 50, passing: 70, dribbling: 73, defense: 81, },
  { name: 'Álvaro Carreras', club: 'Real Madrid', nation: '🇪🇸', position: 'LB', pace: 68, shooting: 49, passing: 74, dribbling: 68, defense: 82, },
  { name: 'Rayan Aït-Nouri', club: 'Manchester City', nation: '🇩🇿', position: 'LB', pace: 67, shooting: 49, passing: 74, dribbling: 68, defense: 80, },
  { name: 'Pervis Estupiñán', club: 'AC Milan', nation: '🇪🇨', position: 'LB', pace: 66, shooting: 46, passing: 69, dribbling: 67, defense: 78, },
  { name: 'Maximilian Mittelstädt', club: 'Stuttgart', nation: '🇩🇪', position: 'LB', pace: 64, shooting: 44, passing: 65, dribbling: 65, defense: 78, },
  { name: 'Marcos Llorente', club: 'Atlético Madrid', nation: '🇪🇸', position: 'RB', pace: 72, shooting: 47, passing: 71, dribbling: 67, defense: 78, },
  { name: 'Antonee Robinson', club: 'Fulham', nation: '🇺🇸', position: 'LB', pace: 66, shooting: 45, passing: 67, dribbling: 69, defense: 76, },
  { name: 'Kylian Mbappé', club: 'Real Madrid', nation: '🇫🇷', position: 'ST', pace: 96, shooting: 90, passing: 80, dribbling: 92, defense: 36, },
  { name: 'Vinicius Junior', club: 'Real Madrid', nation: '🇧🇷', position: 'LW', pace: 94, shooting: 85, passing: 80, dribbling: 94, defense: 36, },
  { name: 'Jude Bellingham', club: 'Real Madrid', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CAM', pace: 80, shooting: 86, passing: 86, dribbling: 88, defense: 68, },
  { name: 'Federico Valverde', club: 'Real Madrid', nation: '🇺🇾', position: 'CM', pace: 84, shooting: 84, passing: 89, dribbling: 84, defense: 80, },
  { name: 'Trent Alexander-Arnold', club: 'Real Madrid', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'RB', pace: 75, shooting: 61, passing: 78, dribbling: 81, defense: 86, },
  { name: 'Aurélien Tchouaméni', club: 'Real Madrid', nation: '🇫🇷', position: 'CDM', pace: 74, shooting: 68, passing: 82, dribbling: 76, defense: 85, },
  { name: 'Arda Güler', club: 'Real Madrid', nation: '🇹🇷', position: 'CAM', pace: 70, shooting: 80, passing: 87, dribbling: 85, defense: 42, },
  { name: 'Raúl Asencio', club: 'Real Madrid', nation: '🇪🇸', position: 'CB', pace: 64, shooting: 40, passing: 69, dribbling: 57, defense: 72, },
  { name: 'Lamine Yamal', club: 'Barcelona', nation: '🇪🇸', position: 'RW', pace: 88, shooting: 86, passing: 88, dribbling: 95, defense: 32, },
  { name: 'Rodri', club: 'Barcelona', nation: '🇪🇸', position: 'CDM', pace: 62, shooting: 78, passing: 92, dribbling: 84, defense: 93, },
  { name: 'Pedri', club: 'Barcelona', nation: '🇪🇸', position: 'CM', pace: 78, shooting: 84, passing: 96, dribbling: 94, defense: 72, },
  { name: 'Raphinha', club: 'Barcelona', nation: '🇧🇷', position: 'ST', pace: 87, shooting: 89, passing: 85, dribbling: 88, defense: 42, },
  { name: 'Pau Cubarsí', club: 'Barcelona', nation: '🇪🇸', position: 'CB', pace: 75, shooting: 54, passing: 77, dribbling: 67, defense: 81, },
  { name: 'Frenkie de Jong', club: 'Barcelona', nation: '🇳🇱', position: 'CM', pace: 72, shooting: 69, passing: 80, dribbling: 78, defense: 73, },
  { name: 'Julián Alvarez', club: 'Atlético Madrid', nation: '🇦🇷', position: 'ST', pace: 82, shooting: 87, passing: 78, dribbling: 85, defense: 44, },
  { name: 'Álex Baena', club: 'Atlético Madrid', nation: '🇪🇸', position: 'LW', pace: 83, shooting: 72, passing: 69, dribbling: 85, defense: 57, },
  { name: 'Pablo Barrios', club: 'Atlético Madrid', nation: '🇪🇸', position: 'CM', pace: 64, shooting: 64, passing: 72, dribbling: 73, defense: 68, },
  { name: 'Nicolas Pépé', club: 'Villarreal', nation: '🇨🇮', position: 'RW', pace: 73, shooting: 63, passing: 64, dribbling: 68, defense: 49, },
  { name: 'Gerard Moreno', club: 'Villarreal', nation: '🇪🇸', position: 'ST', pace: 66, shooting: 69, passing: 60, dribbling: 65, defense: 50, },
  { name: 'Alberto Moleiro', club: 'Villarreal', nation: '🇪🇸', position: 'LW', pace: 71, shooting: 62, passing: 57, dribbling: 68, defense: 45, },
  { name: 'Nico Williams', club: 'Athletic Bilbao', nation: '🇪🇸', position: 'LW', pace: 89, shooting: 78, passing: 77, dribbling: 76, defense: 64, },
  { name: 'Oihan Sancet', club: 'Athletic Bilbao', nation: '🇪🇸', position: 'CAM', pace: 65, shooting: 69, passing: 75, dribbling: 74, defense: 60, },
  { name: 'Iñaki Williams', club: 'Athletic Bilbao', nation: '🇬🇭', position: 'ST', pace: 69, shooting: 68, passing: 62, dribbling: 68, defense: 52, },
  { name: 'Antony', club: 'Betis', nation: '🇧🇷', position: 'RW', pace: 77, shooting: 62, passing: 62, dribbling: 72, defense: 53, },
  { name: 'Isco', club: 'Betis', nation: '🇪🇸', position: 'CAM', pace: 63, shooting: 69, passing: 68, dribbling: 73, defense: 57, },
  { name: 'Takefusa Kubo', club: 'Real Sociedad', nation: '🇯🇵', position: 'RW', pace: 84, shooting: 80, passing: 83, dribbling: 87, defense: 42, },
  { name: 'Mikel Oyarzabal', club: 'Real Sociedad', nation: '🇪🇸', position: 'ST', pace: 80, shooting: 74, passing: 66, dribbling: 74, defense: 62, },
  { name: 'Lucas Stassin', club: 'Sevilla', nation: '🇧🇪', position: 'ST', pace: 67, shooting: 62, passing: 58, dribbling: 63, defense: 47, },
  { name: 'Borja Iglesias', club: 'Celta Vigo', nation: '🇪🇸', position: 'ST', pace: 59, shooting: 66, passing: 57, dribbling: 60, defense: 50, },
  { name: 'Sergio Camello', club: 'Rayo Vallecano', nation: '🇪🇸', position: 'ST', pace: 64, shooting: 63, passing: 54, dribbling: 65, defense: 45, },
  { name: 'Lautaro Martínez', club: 'Inter', nation: '🇦🇷', position: 'ST', pace: 84, shooting: 91, passing: 80, dribbling: 86, defense: 46, },
  { name: 'Nicolò Barella', club: 'Inter', nation: '🇮🇹', position: 'CM', pace: 79, shooting: 79, passing: 91, dribbling: 84, defense: 79, },
  { name: 'Alessandro Bastoni', club: 'Inter', nation: '🇮🇹', position: 'CB', pace: 76, shooting: 44, passing: 82, dribbling: 72, defense: 87, },
  { name: 'Marcus Thuram', club: 'Inter', nation: '🇫🇷', position: 'ST', pace: 84, shooting: 83, passing: 74, dribbling: 80, defense: 40, },
  { name: 'Hakan Çalhanoğlu', club: 'Inter', nation: '🇹🇷', position: 'CDM', pace: 62, shooting: 78, passing: 90, dribbling: 80, defense: 70, },
  { name: 'Kenan Yıldız', club: 'Juventus', nation: '🇹🇷', position: 'LW', pace: 80, shooting: 80, passing: 83, dribbling: 88, defense: 38, },
  { name: 'Bremer', club: 'Juventus', nation: '🇧🇷', position: 'CB', pace: 73, shooting: 49, passing: 73, dribbling: 67, defense: 80, },
  { name: 'Manuel Locatelli', club: 'Juventus', nation: '🇮🇹', position: 'CDM', pace: 61, shooting: 58, passing: 76, dribbling: 65, defense: 76, },
  { name: 'Francisco Conceição', club: 'Juventus', nation: '🇵🇹', position: 'RW', pace: 81, shooting: 65, passing: 65, dribbling: 72, defense: 49, },
  { name: 'Luka Modrić', club: 'AC Milan', nation: '🇭🇷', position: 'CM', pace: 60, shooting: 74, passing: 92, dribbling: 88, defense: 58, },
  { name: 'Christian Pulisic', club: 'AC Milan', nation: '🇺🇸', position: 'RW', pace: 85, shooting: 80, passing: 80, dribbling: 85, defense: 38, },
  { name: 'Adrien Rabiot', club: 'AC Milan', nation: '🇫🇷', position: 'CM', pace: 74, shooting: 74, passing: 84, dribbling: 80, defense: 74, },
  { name: 'Fikayo Tomori', club: 'AC Milan', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 67, shooting: 49, passing: 71, dribbling: 65, defense: 75, },
  { name: 'Kevin De Bruyne', club: 'Napoli', nation: '🇧🇪', position: 'CAM', pace: 66, shooting: 85, passing: 92, dribbling: 83, defense: 50, },
  { name: 'Scott McTominay', club: 'Napoli', nation: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'CM', pace: 74, shooting: 82, passing: 79, dribbling: 80, defense: 74, },
  { name: 'David Neres', club: 'Napoli', nation: '🇧🇷', position: 'RW', pace: 86, shooting: 78, passing: 79, dribbling: 86, defense: 38, },
  { name: 'Giovanni Di Lorenzo', club: 'Napoli', nation: '🇮🇹', position: 'RB', pace: 69, shooting: 50, passing: 71, dribbling: 69, defense: 82, },
  { name: 'Alessandro Buongiorno', club: 'Napoli', nation: '🇮🇹', position: 'CB', pace: 68, shooting: 48, passing: 72, dribbling: 66, defense: 74, },
  { name: 'Charles De Ketelaere', club: 'Atalanta', nation: '🇧🇪', position: 'CAM', pace: 70, shooting: 75, passing: 76, dribbling: 77, defense: 57, },
  { name: 'Éderson', club: 'Atalanta', nation: '🇧🇷', position: 'CM', pace: 65, shooting: 65, passing: 73, dribbling: 73, defense: 71, },
  { name: 'Paulo Dybala', club: 'Roma', nation: '🇦🇷', position: 'CF', pace: 81, shooting: 71, passing: 71, dribbling: 78, defense: 58, },
  { name: 'Manu Koné', club: 'Roma', nation: '🇫🇷', position: 'CM', pace: 67, shooting: 62, passing: 75, dribbling: 74, defense: 68, },
  { name: 'Nico Paz', club: 'Como', nation: '🇦🇷', position: 'CAM', pace: 65, shooting: 72, passing: 66, dribbling: 79, defense: 56, },
  { name: 'Martin Baturina', club: 'Como', nation: '🇭🇷', position: 'CAM', pace: 60, shooting: 70, passing: 64, dribbling: 76, defense: 52, },
  { name: 'Mattia Zaccagni', club: 'Lazio', nation: '🇮🇹', position: 'LW', pace: 83, shooting: 70, passing: 63, dribbling: 71, defense: 50, },
  { name: 'Riccardo Orsolini', club: 'Bologna', nation: '🇮🇹', position: 'RW', pace: 78, shooting: 64, passing: 66, dribbling: 75, defense: 50, },
  { name: 'Yerry Mina', club: 'Cagliari', nation: '🇨🇴', position: 'CB', pace: 61, shooting: 41, passing: 62, dribbling: 54, defense: 68, },
  { name: 'Harry Kane', club: 'Bayern Munich', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ST', pace: 68, shooting: 95, passing: 88, dribbling: 85, defense: 48, },
  { name: 'Jamal Musiala', club: 'Bayern Munich', nation: '🇩🇪', position: 'CAM', pace: 82, shooting: 79, passing: 84, dribbling: 88, defense: 44, },
  { name: 'Michael Olise', club: 'Bayern Munich', nation: '🇫🇷', position: 'RW', pace: 82, shooting: 83, passing: 84, dribbling: 85, defense: 44, },
  { name: 'Luis Díaz', club: 'Bayern Munich', nation: '🇨🇴', position: 'LW', pace: 88, shooting: 81, passing: 78, dribbling: 89, defense: 36, },
  { name: 'Joshua Kimmich', club: 'Bayern Munich', nation: '🇩🇪', position: 'CDM', pace: 68, shooting: 76, passing: 90, dribbling: 80, defense: 84, },
  { name: 'Serhou Guirassy', club: 'Dortmund', nation: '🇬🇳', position: 'ST', pace: 80, shooting: 77, passing: 67, dribbling: 77, defense: 65, },
  { name: 'Nico Schlotterbeck', club: 'Dortmund', nation: '🇩🇪', position: 'CB', pace: 71, shooting: 47, passing: 73, dribbling: 67, defense: 81, },
  { name: 'Maximilian Beier', club: 'Dortmund', nation: '🇩🇪', position: 'ST', pace: 67, shooting: 64, passing: 53, dribbling: 65, defense: 50, },
  { name: 'Patrik Schick', club: 'Leverkusen', nation: '🇨🇿', position: 'ST', pace: 73, shooting: 70, passing: 66, dribbling: 74, defense: 55, },
  { name: 'Edmond Tapsoba', club: 'Leverkusen', nation: '🇧🇫', position: 'CB', pace: 70, shooting: 43, passing: 74, dribbling: 66, defense: 73, },
  { name: 'Jarell Quansah', club: 'Leverkusen', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'CB', pace: 63, shooting: 41, passing: 70, dribbling: 64, defense: 74, },
  { name: 'David Raum', club: 'Leipzig', nation: '🇩🇪', position: 'LB', pace: 70, shooting: 52, passing: 76, dribbling: 68, defense: 78, },
  { name: 'Antonio Nusa', club: 'Leipzig', nation: '🇳🇴', position: 'LW', pace: 76, shooting: 67, passing: 66, dribbling: 68, defense: 50, },
  { name: 'Jonathan Burkardt', club: 'Frankfurt', nation: '🇩🇪', position: 'ST', pace: 75, shooting: 72, passing: 61, dribbling: 68, defense: 54, },
  { name: 'Ritsu Doan', club: 'Frankfurt', nation: '🇯🇵', position: 'RW', pace: 76, shooting: 62, passing: 62, dribbling: 73, defense: 51, },
  { name: 'Deniz Undav', club: 'Stuttgart', nation: '🇩🇪', position: 'ST', pace: 66, shooting: 65, passing: 54, dribbling: 62, defense: 48, },
  { name: 'Vincenzo Grifo', club: 'Freiburg', nation: '🇮🇹', position: 'LW', pace: 73, shooting: 68, passing: 66, dribbling: 70, defense: 50, },
  { name: 'Tim Kleindienst', club: 'Gladbach', nation: '🇩🇪', position: 'ST', pace: 71, shooting: 65, passing: 55, dribbling: 62, defense: 49, },
  { name: 'Khvicha Kvaratskhelia', club: 'PSG', nation: '🇬🇪', position: 'LW', pace: 89, shooting: 84, passing: 86, dribbling: 92, defense: 38, },
  { name: 'Ousmane Dembélé', club: 'PSG', nation: '🇫🇷', position: 'ST', pace: 90, shooting: 86, passing: 82, dribbling: 92, defense: 36, },
  { name: 'Vitinha', club: 'PSG', nation: '🇵🇹', position: 'CDM', pace: 70, shooting: 76, passing: 91, dribbling: 86, defense: 80, },
  { name: 'Achraf Hakimi', club: 'PSG', nation: '🇲🇦', position: 'RB', pace: 92, shooting: 62, passing: 80, dribbling: 84, defense: 78, },
  { name: 'João Neves', club: 'PSG', nation: '🇵🇹', position: 'CM', pace: 72, shooting: 74, passing: 87, dribbling: 84, defense: 68, },
  { name: 'Désiré Doué', club: 'PSG', nation: '🇫🇷', position: 'RW', pace: 84, shooting: 78, passing: 79, dribbling: 87, defense: 36, },
  { name: 'Amine Gouiri', club: 'Marseille', nation: '🇩🇿', position: 'ST', pace: 75, shooting: 69, passing: 65, dribbling: 72, defense: 59, },
  { name: 'Igor Paixão', club: 'Marseille', nation: '🇧🇷', position: 'LW', pace: 74, shooting: 66, passing: 65, dribbling: 71, defense: 50, },
  { name: 'Mika Biereth', club: 'Monaco', nation: '🇩🇰', position: 'ST', pace: 76, shooting: 69, passing: 64, dribbling: 74, defense: 54, },
  { name: 'Folarin Balogun', club: 'Monaco', nation: '🇺🇸', position: 'ST', pace: 69, shooting: 67, passing: 62, dribbling: 66, defense: 50, },
  { name: 'Loïs Openda', club: 'Lyon', nation: '🇧🇪', position: 'ST', pace: 77, shooting: 70, passing: 64, dribbling: 74, defense: 56, },
  { name: 'Olivier Giroud', club: 'Lille', nation: '🇫🇷', position: 'ST', pace: 59, shooting: 65, passing: 52, dribbling: 62, defense: 46, },
  { name: 'Florian Thauvin', club: 'Lens', nation: '🇫🇷', position: 'RW', pace: 74, shooting: 62, passing: 64, dribbling: 74, defense: 50, },
];

// Position-weighted overall (FUT-style); weights per position sum to 1.
const OVR_WEIGHTS = {
  ST: { shooting: 0.50, pace: 0.22, dribbling: 0.16, passing: 0.08, defense: 0.04 },
  CF: { shooting: 0.38, pace: 0.20, dribbling: 0.24, passing: 0.14, defense: 0.04 },
  LW: { pace: 0.26, dribbling: 0.30, shooting: 0.20, passing: 0.18, defense: 0.06 },
  RW: { pace: 0.26, dribbling: 0.30, shooting: 0.20, passing: 0.18, defense: 0.06 },
  CAM: { passing: 0.32, dribbling: 0.28, shooting: 0.22, pace: 0.12, defense: 0.06 },
  CM: { passing: 0.30, dribbling: 0.24, shooting: 0.16, pace: 0.14, defense: 0.16 },
  CDM: { defense: 0.32, passing: 0.28, dribbling: 0.16, pace: 0.12, shooting: 0.12 },
  CB: { defense: 0.46, pace: 0.20, passing: 0.18, dribbling: 0.10, shooting: 0.06 },
  LB: { defense: 0.30, pace: 0.30, passing: 0.16, dribbling: 0.14, shooting: 0.10 },
  RB: { defense: 0.30, pace: 0.30, passing: 0.16, dribbling: 0.14, shooting: 0.10 }
};

function deriveOverall(stats, position) {
  const weights = OVR_WEIGHTS[position];
  let sum = 0;
  for (const [stat, weight] of Object.entries(weights)) sum += weight * stats[stat];
  return Math.round(sum);
}

function rarityForOverall(overall) {
  if (overall >= 85) return 'legendary';
  if (overall >= 75) return 'epic';
  if (overall >= 65) return 'rare';
  return 'common';
}

// Piecewise-linear monotonic price through the legacy rarity price bands:
// common 50-64 -> 1,000-15,000 | rare 65-74 -> 15,000-80,000 | epic 75-84 -> 80,000-500,000 | legendary 85-99 -> 500,000-2,000,000.
function basePriceFor(overall) {
  const band = (lo, hi, priceLo, priceHi) =>
    Math.round(priceLo + (priceHi - priceLo) * (overall - lo) / (hi - lo));
  if (overall >= 85) return band(85, 99, 500000, 2000000);
  if (overall >= 75) return band(75, 84, 80000, 500000);
  if (overall >= 65) return band(65, 74, 15000, 80000);
  return band(50, 64, 1000, 15000);
}

function templateEmoji(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * 31) | 0;
  return PLAYER_EMOJIS[Math.abs(hash) % PLAYER_EMOJIS.length];
}

const TEMPLATES = PLAYER_TEMPLATES.map((t) => {
  const overall = deriveOverall(t, t.position);
  return {
    ...t,
    overall,
    rarity: rarityForOverall(overall),
    basePrice: basePriceFor(overall),
    emoji: templateEmoji(t.name)
  };
});

// Shuffled deal decks per rarity tier: consecutive draws cover the whole tier
// before repeating, so generated batches stay varied.
const templateDecks = {};
function shuffleTemplates(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function pickTemplate(rarity) {
  let deck = templateDecks[rarity];
  if (!deck || deck.index >= deck.list.length) {
    deck = templateDecks[rarity] = { list: shuffleTemplates(TEMPLATES.filter((t) => t.rarity === rarity)), index: 0 };
  }
  const template = deck.list[deck.index++];
  if (template) return template;
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
}

function generatePlayer(id, rarityOverride) {
  const rarityRoll = Math.random();
  let rarity = rarityOverride;
  if (!rarity) {
    if (rarityRoll < 0.05) rarity = 'legendary';
    else if (rarityRoll < 0.18) rarity = 'epic';
    else if (rarityRoll < 0.42) rarity = 'rare';
    else rarity = 'common';
  }

  const t = pickTemplate(rarity);

  return {
    id,
    name: t.name,
    club: t.club,
    nation: t.nation,
    position: t.position,
    emoji: t.emoji,
    rarity: t.rarity,
    overall: t.overall,
    pace: t.pace, shooting: t.shooting, passing: t.passing, dribbling: t.dribbling, defense: t.defense,
    basePrice: t.basePrice,
    currentPrice: t.basePrice,
    priceHistory: [t.basePrice],
    listed: false,
    listPrice: 0
  };
}

// ============================================================
// GAME STATE
// ============================================================
function createInitialState() {
  return {
    coins: 1000000,
    collection: [],
    market: [],
    nextId: 1,
    bots: [],
    selectedBot: 0,
    yourTradeCards: [],
    botTradeCards: [],
    sellCardId: null,
    collectionFilter: 'all',
    collectionSort: 'overall',
    packsOpened: 0,
    marketBuys: 0,
    tradesAccepted: 0
  };
}

let state = createInitialState();

const SAVE_KEY = 'futcard-save-v1';
const VALID_COLLECTION_FILTERS = new Set(['all', 'legendary', 'epic', 'rare', 'common']);
const VALID_COLLECTION_SORTS = new Set(['overall', 'rarity', 'price']);

let pendingPackCards = [];
let recoveredPackCards = 0;
let storageAvailable;
let storageErrorShown = false;

function hasStorageAccess() {
  if (typeof storageAvailable === 'boolean') return storageAvailable;

  try {
    const testKey = '__futcard_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }

  return storageAvailable;
}

function normalizeCard(card) {
  if (!card || typeof card !== 'object') return null;

  const priceHistory = Array.isArray(card.priceHistory)
    ? card.priceHistory.filter((price) => Number.isFinite(price)).slice(-20)
    : [];
  const basePrice = Number.isFinite(card.basePrice) ? Math.round(card.basePrice) : 1000;
  const currentPrice = Number.isFinite(card.currentPrice) ? Math.round(card.currentPrice) : basePrice;

  return {
    id: Number.isInteger(card.id) ? card.id : 0,
    name: typeof card.name === 'string' ? card.name : randName(),
    club: typeof card.club === 'string' ? card.club : CLUBS[0],
    nation: typeof card.nation === 'string' ? card.nation : NATIONS[0],
    position: typeof card.position === 'string' ? card.position : 'CM',
    emoji: typeof card.emoji === 'string' ? card.emoji : PLAYER_EMOJIS[0],
    rarity: ['legendary', 'epic', 'rare', 'common'].includes(card.rarity) ? card.rarity : 'common',
    overall: Number.isFinite(card.overall) ? Math.round(card.overall) : 50,
    pace: Number.isFinite(card.pace) ? Math.round(card.pace) : 50,
    shooting: Number.isFinite(card.shooting) ? Math.round(card.shooting) : 50,
    passing: Number.isFinite(card.passing) ? Math.round(card.passing) : 50,
    dribbling: Number.isFinite(card.dribbling) ? Math.round(card.dribbling) : 50,
    defense: Number.isFinite(card.defense) ? Math.round(card.defense) : 50,
    basePrice,
    currentPrice,
    priceHistory: priceHistory.length > 0 ? priceHistory : [currentPrice],
    listed: Boolean(card.listed),
    listPrice: Number.isFinite(card.listPrice) ? Math.max(0, Math.round(card.listPrice)) : 0
  };
}

function normalizeBot(bot, index) {
  if (!bot || typeof bot !== 'object') return null;

  return {
    id: Number.isInteger(bot.id) ? bot.id : index,
    name: typeof bot.name === 'string' ? bot.name : `Bot ${index + 1}`,
    emoji: typeof bot.emoji === 'string' ? bot.emoji : '🤖',
    style: ['fair', 'greedy', 'generous', 'elite'].includes(bot.style) ? bot.style : 'fair',
    cards: Array.isArray(bot.cards) ? bot.cards.map(normalizeCard).filter(Boolean) : []
  };
}

function buildSaveData() {
  return {
    version: 1,
    coins: state.coins,
    collection: state.collection,
    market: state.market,
    nextId: state.nextId,
    bots: state.bots,
    selectedBot: state.selectedBot,
    collectionFilter: state.collectionFilter,
    collectionSort: state.collectionSort,
    packsOpened: state.packsOpened || 0,
    marketBuys: state.marketBuys || 0,
    tradesAccepted: state.tradesAccepted || 0,
    pendingPackCards
  };
}

function saveState() {
  if (!hasStorageAccess()) return false;

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
    storageErrorShown = false;
    return true;
  } catch (error) {
    console.error('Failed to save FutCard state.', error);
    if (!storageErrorShown && document.getElementById('toast-container')) {
      showToast('⚠️ Could not save progress in this browser session.', 'warning');
      storageErrorShown = true;
    }
    return false;
  }
}

function loadState() {
  if (!hasStorageAccess()) return false;

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;

    const nextState = createInitialState();
    nextState.coins = Number.isFinite(parsed.coins) ? Math.max(0, Math.round(parsed.coins)) : nextState.coins;
    nextState.collection = Array.isArray(parsed.collection) ? parsed.collection.map(normalizeCard).filter(Boolean) : [];
    nextState.market = Array.isArray(parsed.market) ? parsed.market.map(normalizeCard).filter(Boolean) : [];
    nextState.bots = Array.isArray(parsed.bots) ? parsed.bots.map(normalizeBot).filter(Boolean) : [];
    nextState.nextId = Number.isInteger(parsed.nextId) ? parsed.nextId : nextState.nextId;
    nextState.selectedBot = Number.isInteger(parsed.selectedBot) ? parsed.selectedBot : nextState.selectedBot;
    nextState.collectionFilter = VALID_COLLECTION_FILTERS.has(parsed.collectionFilter)
      ? parsed.collectionFilter
      : nextState.collectionFilter;
    nextState.collectionSort = VALID_COLLECTION_SORTS.has(parsed.collectionSort)
      ? parsed.collectionSort
      : nextState.collectionSort;
    nextState.packsOpened = Number.isFinite(parsed.packsOpened) ? Math.max(0, Math.round(parsed.packsOpened)) : 0;
    nextState.marketBuys = Number.isFinite(parsed.marketBuys) ? Math.max(0, Math.round(parsed.marketBuys)) : 0;
    nextState.tradesAccepted = Number.isFinite(parsed.tradesAccepted) ? Math.max(0, Math.round(parsed.tradesAccepted)) : 0;

    const recovered = Array.isArray(parsed.pendingPackCards)
      ? parsed.pendingPackCards.map(normalizeCard).filter(Boolean)
      : [];

    recoveredPackCards = recovered.length;
    if (recovered.length > 0) {
      nextState.collection.push(...recovered);
    }

    const allCards = [
      ...nextState.collection,
      ...nextState.market,
      ...nextState.bots.flatMap((bot) => bot.cards)
    ];
    const maxCardId = allCards.reduce((maxId, card) => Math.max(maxId, card.id || 0), 0);
    nextState.nextId = Math.max(nextState.nextId, maxCardId + 1);
    nextState.selectedBot = Math.min(nextState.selectedBot, Math.max(0, nextState.bots.length - 1));

    state = nextState;

    if (!Array.isArray(parsed.market)) {
      generateMarket();
    }

    if (!Array.isArray(parsed.bots)) {
      generateBots();
    }

    pendingPackCards = [];
    return true;
  } catch (error) {
    console.error('Failed to load FutCard save.', error);
    return false;
  }
}

function resetGame() {
  document.getElementById('new-game-modal').classList.add('show');
}

function confirmNewGame() {
  if (hasStorageAccess()) {
    window.localStorage.removeItem(SAVE_KEY);
  }
  window.location.reload();
}

function closeNewGameModal() {
  document.getElementById('new-game-modal').classList.remove('show');
}

function generateMarket() {
  const count = 120;
  state.market = [];
  for (let i = 0; i < count; i++) {
    const p = generatePlayer(state.nextId++, null);
    p.listed = true;
    p.listPrice = p.currentPrice;
    state.market.push(p);
  }
}

function generateBots() {
  const botNames = [
    { name: 'TraderBot Alpha', emoji: '🤖', style: 'fair' },
    { name: 'GreedyBot', emoji: '💰', style: 'greedy' },
    { name: 'DealBot', emoji: '🤝', style: 'generous' },
    { name: 'EliteBot', emoji: '👑', style: 'elite' }
  ];
  state.bots = botNames.map((b, i) => {
    const cards = [];
    const rarityPool = b.style === 'elite'
      ? ['legendary','legendary','epic','epic','rare']
      : ['epic','rare','rare','common','common'];
    for (let j = 0; j < 20; j++) {
      const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];
      cards.push(generatePlayer(state.nextId++, rarity));
    }
    return { ...b, id: i, cards };
  });
}

function giveStarterCards() {
  for (let i = 0; i < 10; i++) {
    const rarity = i < 2 ? 'rare' : 'common';
    state.collection.push(generatePlayer(state.nextId++, rarity));
  }
}

// ============================================================
// PRICE FLUCTUATION
// ============================================================
function fluctuatePrices() {
  const fluctuate = (card) => {
    const change = (Math.random() - 0.48) * 0.08;
    card.currentPrice = Math.max(100, Math.round(card.currentPrice * (1 + change)));
    card.priceHistory.push(card.currentPrice);
    if (card.priceHistory.length > 20) card.priceHistory.shift();
    if (card.listed) card.listPrice = card.currentPrice;
  };
  state.market.forEach(fluctuate);
  state.bots.forEach((b) => b.cards.forEach(fluctuate));
  state.collection.forEach(fluctuate);
  renderPriceTicker();
  if (document.getElementById('page-market').classList.contains('active')) renderMarket();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
  saveState();
}

// ============================================================
// RENDER HELPERS
// ============================================================
function formatCoins(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function updateCoinsDisplay() {
  const numEl = document.getElementById('coins-display');
  numEl.textContent = formatCoins(state.coins);
  const parent = numEl.parentElement;
  parent.classList.remove('coins-flash');
  void parent.offsetWidth;
  parent.classList.add('coins-flash');
}

function rarityColor(r) {
  return { legendary: '#FF6B35', epic: '#9B59B6', rare: '#3498DB', common: '#95A5A6' }[r];
}

function buildCardHTML(card, options = {}) {
  const { showBuy, showSell, onClick } = options;
  const priceChange = card.priceHistory.length > 1
    ? card.currentPrice - card.priceHistory[card.priceHistory.length - 2]
    : 0;
  const changeIcon = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '—';
  const changeColor = priceChange > 0 ? '#2ecc71' : priceChange < 0 ? '#e74c3c' : '#888';

  return `
    <div class="card ${card.rarity}" onclick="${onClick || `showCardDetail(${card.id})`}" style="position:relative;">
      <span class="card-rarity-badge">${card.rarity}</span>
      <div class="card-overall">${card.overall}</div>
      <div class="card-position">${card.position}</div>
      <div class="card-avatar" style="background:rgba(255,255,255,0.05);">${card.emoji}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-club">${card.nation} ${card.club}</div>
      <div class="card-stats">
        <div class="stat-item"><span class="stat-label">PAC</span><span class="stat-val">${card.pace}</span></div>
        <div class="stat-item"><span class="stat-label">SHO</span><span class="stat-val">${card.shooting}</span></div>
        <div class="stat-item"><span class="stat-label">PAS</span><span class="stat-val">${card.passing}</span></div>
        <div class="stat-item"><span class="stat-label">DRI</span><span class="stat-val">${card.dribbling}</span></div>
        <div class="stat-item"><span class="stat-label">DEF</span><span class="stat-val">${card.defense}</span></div>
      </div>
      <div class="card-price">
        🪙 ${formatCoins(card.currentPrice)}
        <span style="color:${changeColor};font-size:0.6rem;"> ${changeIcon}</span>
      </div>
      ${showBuy ? `<button class="btn btn-gold btn-sm market-buy-btn" onclick="event.stopPropagation();buyCard(${card.id})">Buy 🪙${formatCoins(card.listPrice)}</button>` : ''}
      ${showSell ? `<button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;" onclick="event.stopPropagation();openSellModal(${card.id})">Sell</button>` : ''}
    </div>`;
}

function buildMiniCard(card, removeCallback) {
  return `
    <div class="mini-card ${card.rarity}" style="position:relative;">
      <button class="mini-card-remove" onclick="${removeCallback}">✕</button>
      <div class="mini-card-overall" style="color:${rarityColor(card.rarity)}">${card.overall}</div>
      <div class="mini-card-name">${card.name.split(' ')[0]}</div>
      <div style="font-size:0.5rem;color:var(--muted)">${card.position}</div>
    </div>`;
}

// ============================================================
// PAGES
// ============================================================
function showPage(name) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const tabs = document.querySelectorAll('.nav-tab');
  const pageMap = { dashboard: 0, collection: 1, packs: 2, market: 3, trade: 4 };
  tabs[pageMap[name]].classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'collection') renderCollection();
  if (name === 'market') renderMarket();
  if (name === 'trade') renderTrade();
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const totalValue = state.collection.reduce((s, c) => s + c.currentPrice, 0);
  const byRarity = { legendary: 0, epic: 0, rare: 0, common: 0 };
  state.collection.forEach((c) => byRarity[c.rarity]++);

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-box">
      <div class="stat-box-val">${state.collection.length}</div>
      <div class="stat-box-label">Total Cards</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--gold);">${formatCoins(totalValue)}</div>
      <div class="stat-box-label">Collection Value</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--legendary);">${byRarity.legendary}</div>
      <div class="stat-box-label">🟠 Legendary</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--epic);">${byRarity.epic}</div>
      <div class="stat-box-label">🟣 Epic</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color:var(--rare);">${byRarity.rare}</div>
      <div class="stat-box-label">🔵 Rare</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val">${byRarity.common}</div>
      <div class="stat-box-label">⚪ Common</div>
    </div>
  `;

  const best = [...state.collection].sort((a, b) => b.overall - a.overall).slice(0, 5);
  const bestGrid = document.getElementById('best-cards-grid');
  if (best.length === 0) {
    bestGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">Open some packs to get started!</div></div>';
  } else {
    bestGrid.innerHTML = best.map((c) => buildCardHTML(c, { showSell: true })).join('');
  }

  const hot = [...state.market].sort((a, b) => b.rarity.localeCompare(a.rarity)).slice(0, 5);
  document.getElementById('hot-listings-grid').innerHTML = hot.map((c) =>
    `<div class="market-card-wrap">${buildCardHTML(c, { showBuy: true })}</div>`
  ).join('');

  // Goals
  const goalsData = [
    { emoji: '🌟', title: 'Legendary Collector', desc: 'legendary cards', current: state.collection.filter(c => c.rarity === 'legendary').length, target: 5 },
    { emoji: '📦', title: 'Pack Addict', desc: 'packs opened', current: state.packsOpened || 0, target: 20 },
    { emoji: '🛒', title: 'Market Hunter', desc: 'market buys', current: state.marketBuys || 0, target: 10 },
    { emoji: '🤝', title: 'Deal Maker', desc: 'trades completed', current: state.tradesAccepted || 0, target: 5 },
  ];
  document.getElementById('dashboard-goals').innerHTML = goalsData.map(g => {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    const done = g.current >= g.target;
    return `<div class="goal-card">
      <div class="goal-card-title">${g.emoji} ${g.title}</div>
      <div class="goal-progress-bar"><div class="goal-progress-fill${done ? ' complete' : ''}" style="width:${pct}%"></div></div>
      <div class="goal-label">${Math.min(g.current, g.target)} / ${g.target} ${g.desc}${done ? ' \u2014 Done!' : ''}</div>
      ${done ? '<div class="goal-complete-badge">\u2705</div>' : ''}
    </div>`;
  }).join('');
}

// ============================================================
// PRICE TICKER
// ============================================================
function renderPriceTicker() {
  const featured = state.market
    .filter((c) => c.rarity === 'legendary' || c.rarity === 'epic')
    .slice(0, 10);
  document.getElementById('price-ticker').innerHTML = featured.map((c) => {
    const prev = c.priceHistory.length > 1 ? c.priceHistory[c.priceHistory.length - 2] : c.currentPrice;
    const change = ((c.currentPrice - prev) / prev * 100).toFixed(1);
    const cls = change > 0 ? 'up' : change < 0 ? 'down' : '';
    return `
      <div class="ticker-item">
        <span class="ticker-name">${c.name.split(' ')[1] || c.name}</span>
        <span class="ticker-price">🪙${formatCoins(c.currentPrice)}</span>
        <span class="ticker-change ${cls}">${change > 0 ? '+' : ''}${change}%</span>
      </div>`;
  }).join('');
}

// ============================================================
// COLLECTION
// ============================================================
function renderCollection() {
  let cards = [...state.collection];

  document.querySelectorAll('.rarity-filter-btn').forEach((button) => {
    button.className = 'rarity-filter-btn';
    if (button.dataset.rarity === state.collectionFilter) {
      button.classList.add('active-' + state.collectionFilter);
    }
  });

  if (state.collectionFilter !== 'all') {
    cards = cards.filter((c) => c.rarity === state.collectionFilter);
  }

  if (state.collectionSort === 'overall') cards.sort((a, b) => b.overall - a.overall);
  else if (state.collectionSort === 'rarity') {
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    cards.sort((a, b) => order[a.rarity] - order[b.rarity]);
  } else if (state.collectionSort === 'price') {
    cards.sort((a, b) => b.currentPrice - a.currentPrice);
  }

  document.getElementById('collection-count-label').textContent =
    `${cards.length} cards shown · Total: ${state.collection.length}`;

  const grid = document.getElementById('collection-grid');
  if (cards.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🃏</div><div class="empty-state-text">No cards here yet!</div></div>';
  } else {
    grid.innerHTML = cards.map((c) => buildCardHTML(c, { showSell: true })).join('');
  }
}

function sortCollection(by) {
  state.collectionSort = by;
  renderCollection();
  saveState();
}

function filterCollection(rarity, btn) {
  state.collectionFilter = rarity;
  document.querySelectorAll('.rarity-filter-btn').forEach((b) => {
    b.className = 'rarity-filter-btn';
  });
  btn.classList.add('active-' + rarity);
  renderCollection();
  saveState();
}

// ============================================================
// PACKS
// ============================================================
const PACK_CONFIG = {
  bronze: {
    cost: 5000, count: 5, name: 'Bronze Pack',
    weights: { common: 75, rare: 20, epic: 5, legendary: 0 }
  },
  silver: {
    cost: 15000, count: 7, name: 'Silver Pack',
    weights: { common: 35, rare: 50, epic: 15, legendary: 0 }
  },
  gold: {
    cost: 35000, count: 8, name: 'Gold Pack',
    weights: { common: 10, rare: 50, epic: 30, legendary: 10 }
  },
  elite: {
    cost: 100000, count: 10, name: 'Elite Pack',
    weights: { common: 0, rare: 15, epic: 50, legendary: 35 }
  },
  ultimate: {
    cost: 250000, count: 12, name: 'Ultimate Pack',
    weights: { common: 0, rare: 10, epic: 45, legendary: 45 }
  }
};

function weightedRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return 'common';
}

function openPack(type) {
  const config = PACK_CONFIG[type];
  if (state.coins < config.cost) {
    showToast(`❌ Not enough coins! Need 🪙${formatCoins(config.cost)}`, 'error');
    return;
  }
  state.coins -= config.cost;
  state.packsOpened = (state.packsOpened || 0) + 1;
  updateCoinsDisplay();
  soundPackOpen();

  pendingPackCards = [];
  for (let i = 0; i < config.count; i++) {
    const rarity = weightedRarity(config.weights);
    pendingPackCards.push(generatePlayer(state.nextId++, rarity));
  }

  const overlay = document.getElementById('pack-overlay');
  const area = document.getElementById('pack-reveal-area');
  document.getElementById('pack-opening-title').textContent = `✨ ${config.name} Opened!`;
  area.innerHTML = pendingPackCards.map((c) => `
    <div class="pack-reveal-card" id="reveal-${c.id}">
      ${buildCardHTML(c, {})}
    </div>`).join('');

  overlay.classList.add('show');
  saveState();

  pendingPackCards.forEach((c, i) => {
    setTimeout(() => {
      document.getElementById('reveal-' + c.id)?.classList.add('revealed');
      soundCardFlip();
    }, i * 200 + 100);
  });

  const _legCards = pendingPackCards.filter(c => c.rarity === 'legendary');
  const _hasEpic = pendingPackCards.some(c => c.rarity === 'epic');
  const _revealEnd = pendingPackCards.length * 200 + 450;
  if (_legCards.length > 0) {
    setTimeout(() => showLegendaryCelebration(_legCards[0].name), _revealEnd);
  } else if (_hasEpic) {
    setTimeout(() => soundEpic(), _revealEnd);
  }
}

function closePack() {
  pendingPackCards.forEach((c) => state.collection.push(c));
  pendingPackCards = [];
  saveState();
  document.getElementById('pack-overlay').classList.remove('show');
  showToast('✅ Cards added to your collection!', 'success');
  updateCoinsDisplay();
}

// ============================================================
// MARKET
// ============================================================
function renderMarket() {
  const search = document.getElementById('market-search').value.toLowerCase();
  const rarityFilter = document.getElementById('market-rarity-filter').value;
  const sort = document.getElementById('market-sort').value;
  const posFilter = document.getElementById('market-position-filter').value;

  let cards = state.market.filter((c) => c.listed);

  if (search) cards = cards.filter((c) => c.name.toLowerCase().includes(search) || c.club.toLowerCase().includes(search));
  if (rarityFilter !== 'all') cards = cards.filter((c) => c.rarity === rarityFilter);
  if (posFilter !== 'all') cards = cards.filter((c) => c.position === posFilter);

  if (sort === 'price-asc') cards.sort((a, b) => a.listPrice - b.listPrice);
  else if (sort === 'price-desc') cards.sort((a, b) => b.listPrice - a.listPrice);
  else if (sort === 'overall-desc') cards.sort((a, b) => b.overall - a.overall);

  const grid = document.getElementById('market-grid');
  if (cards.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No cards match your filters</div></div>';
  } else {
    grid.innerHTML = cards.map((c) => `
      <div class="market-card-wrap">
        ${buildCardHTML(c, { showBuy: true })}
      </div>`).join('');
  }
}

function buyCard(id) {
  const card = state.market.find((c) => c.id === id);
  if (!card) return;
  if (state.coins < card.listPrice) {
    showToast(`❌ Not enough coins! Need 🪙${formatCoins(card.listPrice)}`, 'error');
    return;
  }
  state.coins -= card.listPrice;
  state.market = state.market.filter((c) => c.id !== id);
  card.listed = false;
  state.collection.push(card);
  state.marketBuys = (state.marketBuys || 0) + 1;
  updateCoinsDisplay();
  soundBuy();
  showToast(`✅ Bought ${card.name} for 🪙${formatCoins(card.listPrice)}!`, 'success');
  renderMarket();
  const newCard = generatePlayer(state.nextId++, null);
  newCard.listed = true;
  newCard.listPrice = newCard.currentPrice;
  state.market.push(newCard);
  saveState();
}

// ============================================================
// SELL
// ============================================================
function openSellModal(id) {
  const card = state.collection.find((c) => c.id === id);
  if (!card) return;
  state.sellCardId = id;
  document.getElementById('sell-modal-card-info').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:var(--bg);border-radius:10px;">
      <div style="font-size:2rem;">${card.emoji}</div>
      <div>
        <div style="font-weight:800;">${card.name}</div>
        <div style="font-size:0.8rem;color:var(--muted);">${card.position} · ${card.club}</div>
        <div style="font-size:0.8rem;color:${rarityColor(card.rarity)};text-transform:uppercase;font-weight:700;">${card.rarity}</div>
      </div>
      <div style="margin-left:auto;font-size:1.5rem;font-weight:900;color:${rarityColor(card.rarity)}">${card.overall}</div>
    </div>`;
  document.getElementById('sell-suggested-price').textContent =
    `💡 Suggested price: 🪙${formatCoins(card.currentPrice)} (market value)`;
  document.getElementById('sell-price-input').value = card.currentPrice;
  document.getElementById('sell-modal').classList.add('show');
}

function closeSellModal() {
  document.getElementById('sell-modal').classList.remove('show');
  state.sellCardId = null;
}

function confirmSell() {
  const price = parseInt(document.getElementById('sell-price-input').value);
  if (!price || price < 1) {
    showToast('❌ Enter a valid price', 'error');
    return;
  }
  const card = state.collection.find((c) => c.id === state.sellCardId);
  if (!card) return;

  state.collection = state.collection.filter((c) => c.id !== state.sellCardId);
  card.listed = true;
  card.listPrice = price;
  state.market.push(card);
  saveState();

  if (Math.random() < 0.5) {
    setTimeout(() => {
      state.market = state.market.filter((c) => c.id !== card.id);
      state.coins += price;
      saveState();
      updateCoinsDisplay();
      soundCoin();
      showToast(`💰 ${card.name} sold for 🪙${formatCoins(price)}!`, 'success');
      if (document.getElementById('page-market').classList.contains('active')) renderMarket();
    }, 2000 + Math.random() * 3000);
    showToast('📋 Listed! A buyer is interested...', 'warning');
  } else {
    showToast(`📋 ${card.name} listed on market for 🪙${formatCoins(price)}`, 'success');
  }

  closeSellModal();
  if (document.getElementById('page-collection').classList.contains('active')) renderCollection();
  if (document.getElementById('page-market').classList.contains('active')) renderMarket();
}

// ============================================================
// TRADE
// ============================================================
function renderTrade() {
  document.getElementById('bot-select').innerHTML = state.bots.map((b, i) => `
    <div class="bot-chip ${state.selectedBot === i ? 'selected' : ''}" onclick="selectBot(${i})">
      ${b.emoji} ${b.name}
    </div>`).join('');

  renderBotCollection();
  updateTradeSlots();
}

function selectBot(i) {
  state.selectedBot = i;
  state.botTradeCards = [];
  renderTrade();
  saveState();
}

function renderBotCollection() {
  const bot = state.bots[state.selectedBot];
  document.getElementById('bot-collection-title').textContent = `${bot.emoji} ${bot.name}'s Collection`;
  document.getElementById('bot-trade-title').textContent = `${bot.emoji} ${bot.name}'s Offer`;
  document.getElementById('bot-collection-grid').innerHTML = bot.cards.map((c) =>
    buildCardHTML(c, { onClick: `addBotCardToTrade(${c.id})` })
  ).join('');
}

function addBotCardToTrade(id) {
  const bot = state.bots[state.selectedBot];
  const card = bot.cards.find((c) => c.id === id);
  if (!card) return;
  if (state.botTradeCards.find((c) => c.id === id)) {
    showToast('Already in trade!', 'warning');
    return;
  }
  if (state.botTradeCards.length >= 5) {
    showToast('Max 5 cards per trade', 'warning');
    return;
  }
  state.botTradeCards.push(card);
  updateTradeSlots();
  showToast(`Added ${card.name} to trade request`, 'success');
}

function openTradeSelector(side) {
  const modal = document.getElementById('trade-selector-modal');
  const grid = document.getElementById('trade-selector-grid');
  document.getElementById('trade-selector-title').textContent =
    side === 'yours' ? '📤 Select Your Cards to Offer' : '📥 Select Bot Cards to Request';

  if (side === 'yours') {
    const available = state.collection.filter((c) => !state.yourTradeCards.find((t) => t.id === c.id));
    grid.innerHTML = available.map((c) =>
      `<div onclick="addToTrade('yours',${c.id})">${buildCardHTML(c, {})}</div>`
    ).join('');
  } else {
    const bot = state.bots[state.selectedBot];
    const available = bot.cards.filter((c) => !state.botTradeCards.find((t) => t.id === c.id));
    grid.innerHTML = available.map((c) =>
      `<div onclick="addToTrade('bot',${c.id})">${buildCardHTML(c, {})}</div>`
    ).join('');
  }
  modal.classList.add('show');
}

function addToTrade(side, id) {
  if (side === 'yours') {
    if (state.yourTradeCards.length >= 5) {
      showToast('Max 5 cards', 'warning');
      return;
    }
    const card = state.collection.find((c) => c.id === id);
    if (card) state.yourTradeCards.push(card);
  } else {
    if (state.botTradeCards.length >= 5) {
      showToast('Max 5 cards', 'warning');
      return;
    }
    const card = state.bots[state.selectedBot].cards.find((c) => c.id === id);
    if (card) state.botTradeCards.push(card);
  }
  closeTradeSelector();
  updateTradeSlots();
}

function closeTradeSelector() {
  document.getElementById('trade-selector-modal').classList.remove('show');
}

function removeFromTrade(side, id) {
  if (side === 'yours') state.yourTradeCards = state.yourTradeCards.filter((c) => c.id !== id);
  else state.botTradeCards = state.botTradeCards.filter((c) => c.id !== id);
  updateTradeSlots();
}

function updateTradeSlots() {
  const yourSlot = document.getElementById('your-trade-slot');
  const botSlot = document.getElementById('bot-trade-slot');

  if (state.yourTradeCards.length === 0) {
    yourSlot.innerHTML = '<span>+ Add your cards</span>';
  } else {
    yourSlot.innerHTML = state.yourTradeCards.map((c) =>
      buildMiniCard(c, `removeFromTrade('yours',${c.id})`)
    ).join('') + '<span style="font-size:0.7rem;color:var(--muted)">+ Add more</span>';
  }

  if (state.botTradeCards.length === 0) {
    botSlot.innerHTML = '<span>+ Select bot\'s cards</span>';
  } else {
    botSlot.innerHTML = state.botTradeCards.map((c) =>
      buildMiniCard(c, `removeFromTrade('bot',${c.id})`)
    ).join('') + '<span style="font-size:0.7rem;color:var(--muted)">+ Add more</span>';
  }

  updateTradeValues();
}

function updateTradeValues() {
  const yourVal = state.yourTradeCards.reduce((s, c) => s + c.currentPrice, 0)
    + (parseInt(document.getElementById('your-coin-offer').value) || 0);
  const botVal = state.botTradeCards.reduce((s, c) => s + c.currentPrice, 0);

  document.getElementById('your-trade-value').textContent = `🪙 ${formatCoins(yourVal)}`;
  document.getElementById('bot-trade-value').textContent = `🪙 ${formatCoins(botVal)}`;

  const fairnessBar = document.getElementById('trade-fairness-bar');
  const fairnessText = document.getElementById('fairness-text');

  if (state.yourTradeCards.length > 0 || state.botTradeCards.length > 0) {
    fairnessBar.style.display = 'block';
    const ratio = botVal > 0 ? yourVal / botVal : yourVal > 0 ? 99 : 1;
    if (ratio >= 0.85 && ratio <= 1.15) {
      fairnessText.textContent = '✅ Fair Trade — Bot likely to accept!';
      fairnessText.style.color = '#2ecc71';
    } else if (ratio < 0.85) {
      fairnessText.textContent = `⚠️ Your offer is low (${Math.round(ratio * 100)}% of bot's value) — Bot may reject`;
      fairnessText.style.color = '#e74c3c';
    } else {
      fairnessText.textContent = `🎉 Great deal for you! (${Math.round(ratio * 100)}%) — Bot will likely accept`;
      fairnessText.style.color = '#2ecc71';
    }
  } else {
    fairnessBar.style.display = 'none';
  }
}

function proposeTrade() {
  if (state.yourTradeCards.length === 0 && state.botTradeCards.length === 0) {
    showToast('❌ Add cards to trade first!', 'error');
    return;
  }

  const bot = state.bots[state.selectedBot];
  const yourVal = state.yourTradeCards.reduce((s, c) => s + c.currentPrice, 0)
    + (parseInt(document.getElementById('your-coin-offer').value) || 0);
  const botVal = state.botTradeCards.reduce((s, c) => s + c.currentPrice, 0);
  const coinOffer = parseInt(document.getElementById('your-coin-offer').value) || 0;

  if (coinOffer > state.coins) {
    showToast('❌ Not enough coins!', 'error');
    return;
  }

  const ratio = botVal > 0 ? yourVal / botVal : 1;
  const acceptThreshold = { fair: 0.85, greedy: 1.05, generous: 0.7, elite: 0.9 }[bot.style];
  const accepted = ratio >= acceptThreshold;

  setTimeout(() => {
    if (accepted) {
      state.yourTradeCards.forEach((c) => {
        state.collection = state.collection.filter((x) => x.id !== c.id);
        bot.cards.push(c);
      });
      state.botTradeCards.forEach((c) => {
        bot.cards = bot.cards.filter((x) => x.id !== c.id);
        state.collection.push(c);
      });
      state.coins -= coinOffer;
      state.tradesAccepted = (state.tradesAccepted || 0) + 1;
      saveState();
      updateCoinsDisplay();
      soundTradeAccept();
      launchConfetti(2000);
      showToast(`✅ ${bot.emoji} ${bot.name} accepted the trade!`, 'success');
      clearTrade();
      renderTrade();
    } else {
      showToast(`❌ ${bot.emoji} ${bot.name} rejected! Try offering ${Math.round((1 / ratio) * 100 - 100)}% more value.`, 'error');
    }
  }, 1200);

  showToast(`⏳ ${bot.emoji} ${bot.name} is considering your offer...`, 'warning');
}

function clearTrade() {
  state.yourTradeCards = [];
  state.botTradeCards = [];
  document.getElementById('your-coin-offer').value = '';
  updateTradeSlots();
}

// ============================================================
// CARD DETAIL MODAL
// ============================================================
function showCardDetail(id) {
  const card =
    state.collection.find((c) => c.id === id) ||
    state.market.find((c) => c.id === id) ||
    state.bots.flatMap((b) => b.cards).find((c) => c.id === id);
  if (!card) return;

  const inCollection = state.collection.find((c) => c.id === id);
  const inMarket = state.market.find((c) => c.id === id);

  document.getElementById('card-modal-content').innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;">
      <div>${buildCardHTML(card, {})}</div>
      <div style="flex:1;min-width:200px;">
        <div style="font-size:1.3rem;font-weight:900;margin-bottom:4px;">${card.name}</div>
        <div style="color:${rarityColor(card.rarity)};font-weight:700;text-transform:uppercase;margin-bottom:8px;">${card.rarity}</div>
        <div style="color:var(--muted);font-size:0.85rem;margin-bottom:16px;">${card.nation} ${card.club} · ${card.position}</div>

        <div style="display:grid;gap:8px;margin-bottom:20px;">
          ${[['⚡ Pace', card.pace],['🎯 Shooting', card.shooting],['🎪 Passing', card.passing],['🌀 Dribbling', card.dribbling],['🛡️ Defense', card.defense]].map(([label, val]) => `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:0.8rem;width:100px;">${label}</span>
              <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:8px;">
                <div style="width:${val}%;background:${rarityColor(card.rarity)};height:100%;border-radius:4px;"></div>
              </div>
              <span style="font-weight:700;font-size:0.9rem;width:30px;text-align:right;">${val}</span>
            </div>`).join('')}
        </div>

        <div style="font-size:1rem;font-weight:700;color:var(--gold);margin-bottom:16px;">
          Market Value: 🪙${formatCoins(card.currentPrice)}
        </div>

        ${inCollection ? `<button class="btn btn-gold" onclick="closeCardModal();openSellModal(${card.id})">💰 Sell This Card</button>` : ''}
        ${inMarket ? `<button class="btn btn-primary" onclick="closeCardModal();buyCard(${card.id})">🛒 Buy for 🪙${formatCoins(card.listPrice)}</button>` : ''}
      </div>
    </div>`;

  document.getElementById('card-modal').classList.add('show');
}

function closeCardModal() {
  document.getElementById('card-modal').classList.remove('show');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// ============================================================
// PWA UPDATE FLOW
// ============================================================
let serviceWorkerRegistration = null;
let updatePromptVisible = false;
let waitingForUpdateReload = false;

function hideUpdatePrompt() {
  const prompt = document.getElementById('pwa-update-prompt');
  if (prompt) prompt.remove();
  updatePromptVisible = false;
}

function showUpdatePrompt() {
  if (updatePromptVisible || document.getElementById('pwa-update-prompt')) return;

  const prompt = document.createElement('div');
  prompt.id = 'pwa-update-prompt';
  prompt.style.cssText = [
    'position:fixed',
    'left:16px',
    'right:16px',
    'bottom:16px',
    'z-index:2000',
    'display:flex',
    'justify-content:center',
    'pointer-events:none'
  ].join(';');

  prompt.innerHTML = `
    <div style="pointer-events:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;width:min(760px,100%);padding:16px 18px;border:1px solid rgba(0,255,135,0.35);border-radius:18px;background:rgba(8,12,20,0.96);box-shadow:0 24px 60px rgba(0,0,0,0.45);backdrop-filter:blur(16px);">
      <div style="min-width:220px;flex:1;">
        <div style="font-weight:900;font-size:1rem;margin-bottom:4px;">New FutCard version ready</div>
        <div style="font-size:0.85rem;color:var(--muted);">Reload to get the latest game code, fixes, and card data.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" id="pwa-update-reload">Reload now</button>
        <button class="btn btn-outline btn-sm" id="pwa-update-later">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(prompt);
  updatePromptVisible = true;

  prompt.querySelector('#pwa-update-reload').addEventListener('click', async () => {
    waitingForUpdateReload = true;
    hideUpdatePrompt();

    if (serviceWorkerRegistration?.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    window.location.reload();
  });

  prompt.querySelector('#pwa-update-later').addEventListener('click', hideUpdatePrompt);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });

    if (serviceWorkerRegistration.waiting && navigator.serviceWorker.controller) {
      showUpdatePrompt();
    }

    serviceWorkerRegistration.addEventListener('updatefound', () => {
      const installingWorker = serviceWorkerRegistration?.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdatePrompt();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (waitingForUpdateReload) {
        window.location.reload();
      }
    });
  } catch (error) {
    console.warn('FutCard service worker registration failed.', error);
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  const loaded = loadState();
  if (!loaded) {
    generateMarket();
    generateBots();
    giveStarterCards();
    saveState();
  }

  updateCoinsDisplay();
  renderDashboard();
  renderPriceTicker();
  renderCollection();
  registerServiceWorker();

  setInterval(fluctuatePrices, 8000);
  window.addEventListener('beforeunload', saveState);

  document.getElementById('card-modal').addEventListener('click', function(e) {
    if (e.target === this) closeCardModal();
  });
  document.getElementById('sell-modal').addEventListener('click', function(e) {
    if (e.target === this) closeSellModal();
  });
  document.getElementById('trade-selector-modal').addEventListener('click', function(e) {
    if (e.target === this) closeTradeSelector();
  });

  if (loaded) {
    showToast('💾 Saved progress loaded.', 'success');
    if (recoveredPackCards > 0) {
      showToast(`📦 Recovered ${recoveredPackCards} unopened pack card${recoveredPackCards === 1 ? '' : 's'}.`, 'warning');
    }
  } else {
    showToast('🎉 Welcome to FutCard! You start with 🪙1,000,000 coins!', 'success');
  }
}

// Test seam: game.test.js loads this file with stubbed browser globals and
// captures internals through this hook. Inert in the browser (hook unset).
if (typeof globalThis.__FUTCARD_TEST_HOOK__ === 'function') {
  globalThis.__FUTCARD_TEST_HOOK__({
    get state() { return state; },
    generatePlayer,
    generateMarket,
    generateBots,
    giveStarterCards,
    openPack,
    closePack,
    buyCard,
    loadState,
    saveState,
    buildSaveData,
    normalizeCard,
    weightedRarity,
    PACK_CONFIG,
    PLAYER_TEMPLATES,
    TEMPLATES,
    OVR_WEIGHTS,
    deriveOverall,
    rarityForOverall,
    basePriceFor,
    templateEmoji,
    pickTemplate,
    randName,
    PLAYER_EMOJIS,
    ROSTER_SEASON,
    ROSTER_AS_OF
  });
}

init();
