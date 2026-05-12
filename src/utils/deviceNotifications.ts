const KEY = 'pilliox_device_notifications';

function load(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(map: Record<string, boolean>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

/** Returns the device-local enabled state, or false if never set on this device. */
export function getDeviceNotificationEnabled(pillId: string): boolean {
  return load()[pillId] ?? false;
}

/** Persist the enabled state for this pill on this device. */
export function setDeviceNotificationEnabled(pillId: string, enabled: boolean) {
  const map = load();
  map[pillId] = enabled;
  save(map);
}

/** Remove entry when a pill is deleted. */
export function removeDeviceNotification(pillId: string) {
  const map = load();
  delete map[pillId];
  save(map);
}

/** Merge device-local enabled states into a list of pills loaded from the server. */
export function applyDeviceNotifications<T extends { id: string; notificationsEnabled?: boolean }>(
  pills: T[]
): T[] {
  const map = load();
  return pills.map((pill) => ({
    ...pill,
    notificationsEnabled: map[pill.id] ?? false,
  }));
}
