export interface Calendar {
  date: Date;
  week: number;
  home: string;
  away: string;
  world: string;
  ag: number | null;
  hg: number | null;
  competition: string;
  group: number | null;
}

export interface Table {
  club: string;
  w: number;
  d: number;
  l: number;
  ga: number;
  gd: number;
  gf: number;
  pts: number;
  pld: number;
  world: string;
  competition: string;
  group: number | null;
}
