import type { MiniGameDefinition, GameMode } from './types';
import { SpeedMatchGame } from './speed-match';
import { ColorStroopGame } from './color-stroop';
import { SequenceMemoryGame } from './sequence-memory';
import { QuickMathGame } from './quick-math';

/** Central registry of all available mini-games */
const gameRegistry: MiniGameDefinition[] = [];

/** Register a mini-game. Called by each game module. */
export function registerGame(definition: MiniGameDefinition): void {
  const existing = gameRegistry.find((g) => g.id === definition.id);
  if (existing) {
    throw new Error(`Game "${definition.id}" is already registered`);
  }
  gameRegistry.push(definition);
}

/** Get all registered games */
export function getAllGames(): ReadonlyArray<MiniGameDefinition> {
  return gameRegistry;
}

/** Get games available for a specific mode */
export function getGamesForMode(mode: GameMode): MiniGameDefinition[] {
  return gameRegistry.filter((g) => g.modes.includes(mode));
}

/** Get a specific game by ID */
export function getGameById(id: string): MiniGameDefinition | undefined {
  return gameRegistry.find((g) => g.id === id);
}

/** Select games for a session based on mode */
export function selectSessionGames(mode: GameMode, count: number): MiniGameDefinition[] {
  const available = getGamesForMode(mode);
  // For now, return first N games. Later: shuffle + ensure domain diversity
  return available.slice(0, count);
}

// --- Register all built-in games ---

registerGame({
  id: 'speed-match',
  name: 'Speed Match',
  nameKo: '스피드 매치',
  description: 'Compare shapes — is it the same as the last one?',
  descriptionKo: '이전 도형과 같은지 비교하세요',
  domain: 'processing',
  estimatedDurationSec: 45,
  modes: ['activation'],
  component: SpeedMatchGame,
});

registerGame({
  id: 'color-stroop',
  name: 'Color Stroop',
  nameKo: '컬러 스트룹',
  description: 'Tap the ink color, not the word meaning',
  descriptionKo: '단어가 아닌 글자 색상을 선택하세요',
  domain: 'attention',
  estimatedDurationSec: 45,
  modes: ['activation'],
  component: ColorStroopGame,
});

registerGame({
  id: 'sequence-memory',
  name: 'Sequence Memory',
  nameKo: '순서 기억',
  description: 'Remember and repeat the flashing sequence',
  descriptionKo: '깜빡이는 순서를 기억하고 따라하세요',
  domain: 'memory',
  estimatedDurationSec: 45,
  modes: ['activation'],
  component: SequenceMemoryGame,
});

registerGame({
  id: 'quick-math',
  name: 'Quick Math',
  nameKo: '빠른 계산',
  description: 'Solve arithmetic problems as fast as you can',
  descriptionKo: '수학 문제를 빠르게 풀어보세요',
  domain: 'processing',
  estimatedDurationSec: 45,
  modes: ['activation'],
  component: QuickMathGame,
});
