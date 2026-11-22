import { useEffect, useState } from 'react';
import {
  detectIOSDevice,
  detectStandaloneMode,
  getInstallActionMode,
  type PwaInstallActionMode,
} from '../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;

    const syncStandalone = () => {
      setIsInstalled(detectStandaloneMode(standaloneMedia.matches, navStandalone));
    };

    syncStandalone();
    setIsIOS(detectIOSDevice(window.navigator.userAgent, window.navigator.maxTouchPoints));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMedia.addEventListener?.('change', syncStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMedia.removeEventListener?.('change', syncStandalone);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const isInstallable = Boolean(deferredPrompt);
  const actionMode: PwaInstallActionMode = getInstallActionMode({
    isInstalled,
    isInstallable,
    isIOS,
  });

  return {
    isInstallable,
    isInstalled,
    isIOS,
    actionMode,
    install,
  };
}
