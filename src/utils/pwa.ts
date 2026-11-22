export type PwaInstallActionMode =
  | 'hidden'
  | 'native-prompt'
  | 'ios-guide'
  | 'mobile-guide';

/**
 * Detects iOS / iPadOS devices (including iPadOS Safari reporting Macintosh with touch points).
 */
export function detectIOSDevice(userAgent: string, maxTouchPoints = 0): boolean {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return true;
  }
  return ua.includes('macintosh') && maxTouchPoints > 1;
}

/**
 * Determines whether the app is currently running in installed standalone display mode.
 */
export function detectStandaloneMode(
  matchMediaStandalone: boolean,
  navigatorStandalone?: boolean
): boolean {
  return Boolean(matchMediaStandalone || navigatorStandalone === true);
}

/**
 * Resolves which in-app install UI mode should be rendered.
 * Automatically returns 'hidden' when already running as an installed standalone PWA.
 */
export function getInstallActionMode(params: {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
}): PwaInstallActionMode {
  if (params.isInstalled) return 'hidden';
  if (params.isInstallable) return 'native-prompt';
  if (params.isIOS) return 'ios-guide';
  return 'mobile-guide';
}
