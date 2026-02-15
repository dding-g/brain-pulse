import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync as _impactAsync,
  notificationAsync as _notificationAsync,
  selectionAsync as _selectionAsync,
} from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType };

export async function impactAsync(
  style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium,
): Promise<void> {
  try {
    await _impactAsync(style);
  } catch {}
}

export async function notificationAsync(
  type: NotificationFeedbackType = NotificationFeedbackType.Success,
): Promise<void> {
  try {
    await _notificationAsync(type);
  } catch {}
}

export async function selectionAsync(): Promise<void> {
  try {
    await _selectionAsync();
  } catch {}
}
