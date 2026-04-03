interface Tier {
  name: string;
  min: number;
  color: string;       // bg color class for badge
  textColor: string;   // text color class for badge
}

const TIERS: Tier[] = [
  { name: 'Bronze III', min: 0,    color: 'bg-amber-900/60',   textColor: 'text-amber-400' },
  { name: 'Bronze II',  min: 10,   color: 'bg-amber-900/60',   textColor: 'text-amber-400' },
  { name: 'Bronze I',   min: 20,   color: 'bg-amber-900/60',   textColor: 'text-amber-400' },
  { name: 'Silver III', min: 30,   color: 'bg-slate-700/60',   textColor: 'text-slate-300' },
  { name: 'Silver II',  min: 50,   color: 'bg-slate-700/60',   textColor: 'text-slate-300' },
  { name: 'Silver I',   min: 80,   color: 'bg-slate-700/60',   textColor: 'text-slate-300' },
  { name: 'Gold III',   min: 130,  color: 'bg-yellow-900/60',  textColor: 'text-yellow-400' },
  { name: 'Gold II',    min: 210,  color: 'bg-yellow-900/60',  textColor: 'text-yellow-400' },
  { name: 'Gold I',     min: 340,  color: 'bg-yellow-900/60',  textColor: 'text-yellow-400' },
  { name: 'Diamond III',min: 550,  color: 'bg-cyan-900/60',    textColor: 'text-cyan-300' },
  { name: 'Diamond II', min: 890,  color: 'bg-cyan-900/60',    textColor: 'text-cyan-300' },
  { name: 'Diamond I',  min: 1440, color: 'bg-cyan-900/60',    textColor: 'text-cyan-300' },
  { name: 'Legendary',  min: 2330, color: 'bg-violet-900/60',  textColor: 'text-violet-400' },
];

export function getTier(trophies: number): Tier {
  let current = TIERS[0]!;
  for (const tier of TIERS) {
    if (trophies >= tier.min) current = tier;
    else break;
  }
  return current;
}
