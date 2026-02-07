import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ConditionReport, GameMode, GameResult } from '@/games/types';

interface SessionState {
  conditionReport: ConditionReport | null;
  mode: GameMode | null;
  currentGameIndex: number;
  gameResults: GameResult[];
  sessionStartedAt: string | null;
  isActive: boolean;
}

type SessionAction =
  | { type: 'START_SESSION'; mode: GameMode; conditionReport: ConditionReport }
  | { type: 'COMPLETE_GAME'; result: GameResult }
  | { type: 'ADVANCE_GAME' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };

interface SessionContextValue {
  state: SessionState;
  startSession: (mode: GameMode, conditionReport: ConditionReport) => void;
  completeGame: (result: GameResult) => void;
  advanceGame: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

const initialState: SessionState = {
  conditionReport: null,
  mode: null,
  currentGameIndex: 0,
  gameResults: [],
  sessionStartedAt: null,
  isActive: false,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        conditionReport: action.conditionReport,
        mode: action.mode,
        currentGameIndex: 0,
        gameResults: [],
        sessionStartedAt: new Date().toISOString(),
        isActive: true,
      };
    case 'COMPLETE_GAME':
      return {
        ...state,
        gameResults: [...state.gameResults, action.result],
      };
    case 'ADVANCE_GAME':
      return {
        ...state,
        currentGameIndex: state.currentGameIndex + 1,
      };
    case 'FINISH_SESSION':
      return {
        ...state,
        isActive: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const startSession = useCallback((mode: GameMode, conditionReport: ConditionReport) => {
    dispatch({ type: 'START_SESSION', mode, conditionReport });
  }, []);

  const completeGame = useCallback((result: GameResult) => {
    dispatch({ type: 'COMPLETE_GAME', result });
  }, []);

  const advanceGame = useCallback(() => {
    dispatch({ type: 'ADVANCE_GAME' });
  }, []);

  const finishSession = useCallback(() => {
    dispatch({ type: 'FINISH_SESSION' });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({ state, startSession, completeGame, advanceGame, finishSession, resetSession }),
    [state, startSession, completeGame, advanceGame, finishSession, resetSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
