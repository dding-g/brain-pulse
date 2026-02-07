/** Analytics event types */
type AnalyticsEvent =
  | { name: 'session_start'; params: { mode: string } }
  | { name: 'session_complete'; params: { mode: string; score: number; duration_ms: number } }
  | { name: 'game_complete'; params: { game_id: string; score: number; difficulty: number } }
  | { name: 'screen_view'; params: { screen: string } }
  | { name: 'share_card'; params: { score: number } };

/** Log an analytics event (placeholder for future integration) */
export function logEvent(event: AnalyticsEvent): void {
  if (__DEV__) {
    console.log('[Analytics]', event.name, event.params);
  }
  // TODO: Integrate with actual analytics provider
}
