// ============================================================
// DATA — REFERENCE POOLS & CONFIG
// ============================================================
// Legacy random-generation identity pools (kept only as normalization
// fallbacks for corrupt v1 saves), position weighting for derived overalls,
// and the nation -> flag-code map. Flag codes are plain ASCII ISO 3166-1
// alpha-2 pairs (or Unicode tag subdivisions for England/Scotland/Wales);
// src/app.js turns them into emoji at render time so no flag glyphs live in
// source. Loaded as a classic script before src/app.js.
const PLAYER_EMOJIS = ['🧑','👨','👦','🧔','👱','🧓','👩','👴'];
const CLUBS = [
  'Manchester City','Arsenal','Liverpool','Chelsea','Manchester United',
  'Tottenham','Newcastle','Aston Villa','Brighton','West Ham',
  'Real Madrid','Barcelona','Bayern Munich','PSG','Juventus',
  'Atletico Madrid','Dortmund','Inter Milan','AC Milan','Ajax'
];
const NATIONS = ['England','Brazil','Argentina','France','Germany','Portugal','Netherlands','Belgium','Spain','Italy','Senegal','Nigeria','Uruguay','Colombia','Morocco'];

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

const NATION_FLAG_CODES = {
  'Algeria': 'DZ',
  'Argentina': 'AR',
  'Belgium': 'BE',
  'Brazil': 'BR',
  'Burkina Faso': 'BF',
  'Cameroon': 'CM',
  'Colombia': 'CO',
  'Cote d\'Ivoire': 'CI',
  'Croatia': 'HR',
  'Czech Republic': 'CZ',
  'Denmark': 'DK',
  'DR Congo': 'CD',
  'Ecuador': 'EC',
  'England': 'gbeng',
  'France': 'FR',
  'Gambia': 'GM',
  'Georgia': 'GE',
  'Germany': 'DE',
  'Ghana': 'GH',
  'Greece': 'GR',
  'Guinea': 'GN',
  'Hungary': 'HU',
  'Ireland': 'IE',
  'Italy': 'IT',
  'Japan': 'JP',
  'Morocco': 'MA',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Nigeria': 'NG',
  'Norway': 'NO',
  'Paraguay': 'PY',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Scotland': 'gbsct',
  'Senegal': 'SN',
  'Serbia': 'RS',
  'Slovenia': 'SI',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Türkiye': 'TR',
  'United States': 'US',
  'Uruguay': 'UY',
  'Wales': 'gbwls',
};
