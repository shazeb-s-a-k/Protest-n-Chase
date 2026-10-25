export interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'PROTEST' | 'POLICE' | 'EXPLORATION' | 'MASTERY';
}

export const ALL_TROPHIES: Trophy[] = [
  {
    id: 'first_rally',
    title: 'First Step',
    description: 'Complete your first match in Protest-n-Chase',
    icon: '🚩',
    category: 'MASTERY',
  },
  {
    id: 'voice_victory',
    title: 'Voice of the People',
    description: 'Reach 100% viral awareness and lead the protest to victory',
    icon: '📢',
    category: 'PROTEST',
  },
  {
    id: 'iron_perimeter',
    title: 'Perimeter Secured',
    description: 'Detain 8 chanters and maintain order as Police',
    icon: '🛡️',
    category: 'POLICE',
  },
  {
    id: 'viral_sensation',
    title: 'Breaking the Internet',
    description: 'Surpass 10,000 live stream viewers during a single rally',
    icon: '🔥',
    category: 'PROTEST',
  },
  {
    id: 'kafila_commander',
    title: 'Kafila General',
    description: 'Recruit a 4-person protest horde and issue formation commands',
    icon: '👥',
    category: 'PROTEST',
  },
  {
    id: 'jailbreaker',
    title: 'No One Left Behind',
    description: 'Stage a heroic jailbreak and free comrades from the police bus',
    icon: '🔓',
    category: 'PROTEST',
  },
  {
    id: 'paris_liberte',
    title: 'Citoyen de Paris',
    description: 'Rally or secure the perimeter at Place de la Bastille',
    icon: '🗼',
    category: 'EXPLORATION',
  },
  {
    id: 'celestial_mind',
    title: 'Celestial Calm',
    description: 'Meditate inside the Jai Prakash Yantra astronomical sanctuary',
    icon: '🧘',
    category: 'EXPLORATION',
  },
  {
    id: 'chai_lover',
    title: 'Tapri Regular',
    description: 'Fuel up with cutting chai at the Sansad Marg tea stall',
    icon: '☕',
    category: 'EXPLORATION',
  },
  {
    id: 'decoy_master',
    title: 'Paper Storm',
    description: 'Scatter rally leaflets to confound pursuing officers',
    icon: '📄',
    category: 'PROTEST',
  },
];

export interface CareerStats {
  matchesPlayed: number;
  victories: number;
  protestWins: number;
  policeWins: number;
  totalAwarenessGenerated: number;
  totalDetained: number;
  totalFreed: number;
  maxLiveViewers: number;
  maxKafilaRecruited: number;
  unlockedTrophyIds: string[];
}

const STORAGE_KEY = 'pnc_career_stats_v1';

export function getCareerStats(): CareerStats {
  if (typeof window === 'undefined') {
    return getDefaultStats();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStats();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultStats(),
      ...parsed,
      unlockedTrophyIds: Array.isArray(parsed.unlockedTrophyIds) ? parsed.unlockedTrophyIds : [],
    };
  } catch (_) {
    return getDefaultStats();
  }
}

export function saveCareerStats(stats: CareerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (_) {}
}

function getDefaultStats(): CareerStats {
  return {
    matchesPlayed: 0,
    victories: 0,
    protestWins: 0,
    policeWins: 0,
    totalAwarenessGenerated: 0,
    totalDetained: 0,
    totalFreed: 0,
    maxLiveViewers: 0,
    maxKafilaRecruited: 0,
    unlockedTrophyIds: [],
  };
}

export interface MatchOutcomeData {
  winner: 'PROTESTOR' | 'POLICE';
  playerTeam: 'PROTESTOR' | 'POLICE';
  mapId: 'DELHI' | 'PARIS';
  awarenessScore: number;
  detainedScore: number;
  viewerCount: number;
  kafilaRecruits?: number;
  hasJailbroken?: boolean;
  hasVisitedChai?: boolean;
  hasVisitedJaiPrakash?: boolean;
  hasScatteredLeaflets?: boolean;
}

/**
 * Records match results, increments lifetime stats, and unlocks trophies
 * Returns list of newly unlocked trophies from this match
 */
export function recordMatchOutcome(outcome: MatchOutcomeData): Trophy[] {
  const stats = getCareerStats();
  const newlyUnlocked: Trophy[] = [];

  stats.matchesPlayed += 1;
  const isPlayerWinner = outcome.playerTeam === outcome.winner;
  if (isPlayerWinner) {
    stats.victories += 1;
    if (outcome.winner === 'PROTESTOR') stats.protestWins += 1;
    else stats.policeWins += 1;
  }

  stats.totalAwarenessGenerated += Math.round(outcome.awarenessScore);
  stats.totalDetained += outcome.detainedScore;
  if (outcome.viewerCount > stats.maxLiveViewers) {
    stats.maxLiveViewers = outcome.viewerCount;
  }
  if (outcome.kafilaRecruits && outcome.kafilaRecruits > stats.maxKafilaRecruited) {
    stats.maxKafilaRecruited = outcome.kafilaRecruits;
  }

  // Helper to unlock
  const checkUnlock = (trophyId: string) => {
    if (!stats.unlockedTrophyIds.includes(trophyId)) {
      stats.unlockedTrophyIds.push(trophyId);
      const t = ALL_TROPHIES.find((x) => x.id === trophyId);
      if (t) newlyUnlocked.push(t);
    }
  };

  // 1. First Rally
  checkUnlock('first_rally');

  // 2. Voice Victory
  if (isPlayerWinner && outcome.winner === 'PROTESTOR') {
    checkUnlock('voice_victory');
  }

  // 3. Iron Perimeter
  if (isPlayerWinner && outcome.winner === 'POLICE') {
    checkUnlock('iron_perimeter');
  }

  // 4. Breaking the Internet
  if (outcome.viewerCount >= 10000) {
    checkUnlock('viral_sensation');
  }

  // 5. Kafila Commander
  if ((outcome.kafilaRecruits || 0) >= 4) {
    checkUnlock('kafila_commander');
  }

  // 6. Jailbreaker
  if (outcome.hasJailbroken) {
    checkUnlock('jailbreaker');
  }

  // 7. Paris Liberte
  if (outcome.mapId === 'PARIS') {
    checkUnlock('paris_liberte');
  }

  // 8. Celestial Mind
  if (outcome.hasVisitedJaiPrakash) {
    checkUnlock('celestial_mind');
  }

  // 9. Chai Lover
  if (outcome.hasVisitedChai) {
    checkUnlock('chai_lover');
  }

  // 10. Decoy Master
  if (outcome.hasScatteredLeaflets) {
    checkUnlock('decoy_master');
  }

  saveCareerStats(stats);
  return newlyUnlocked;
}
