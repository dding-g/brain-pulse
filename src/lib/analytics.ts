/** Analytics event types */
type AnalyticsEvent =
  | { name: 'session_start'; params: { mode: string } }
  | { name: 'session_complete'; params: { mode: string; score: number; duration_ms: number } }
  | { name: 'condition_check_complete'; params: { sleep: number; energy: number; stress: number } }
  | { name: 'game_start'; params: { game_id: string; difficulty: number } }
  | { name: 'game_complete'; params: { game_id: string; score: number; difficulty: number } }
  | { name: 'screen_view'; params: { screen: string } }
  | { name: 'history_view'; params: { session_count: number } }
  | { name: 'share_card'; params: { score: number } }
  | { name: 'data_cleared' };

/** Log an analytics event (placeholder for future integration) */
export function logEvent(event: AnalyticsEvent): void {
  if (__DEV__) {
    console.log('[Analytics]', event.name, 'params' in event ? event.params : '');
  }
  // TODO: Integrate with actual analytics provider
}
