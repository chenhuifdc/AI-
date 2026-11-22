import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectIOSDevice,
  detectStandaloneMode,
  getInstallActionMode,
} from './pwa';

test('detectIOSDevice recognizes iPhone, iPad, iPod, and touch-enabled iPadOS', () => {
  assert.equal(
    detectIOSDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15'),
    true
  );
  assert.equal(
    detectIOSDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'),
    true
  );
  assert.equal(
    detectIOSDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5),
    true
  );
  assert.equal(
    detectIOSDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0),
    false
  );
  assert.equal(
    detectIOSDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)'),
    false
  );
});

test('detectStandaloneMode handles both CSS display-mode and iOS navigator.standalone', () => {
  assert.equal(detectStandaloneMode(true, false), true);
  assert.equal(detectStandaloneMode(false, true), true);
  assert.equal(detectStandaloneMode(false, undefined), false);
});

test('getInstallActionMode suppresses UI when installed and selects right install mode otherwise', () => {
  assert.equal(
    getInstallActionMode({ isInstalled: true, isInstallable: true, isIOS: false }),
    'hidden'
  );
  assert.equal(
    getInstallActionMode({ isInstalled: true, isInstallable: false, isIOS: true }),
    'hidden'
  );
  assert.equal(
    getInstallActionMode({ isInstalled: false, isInstallable: true, isIOS: false }),
    'native-prompt'
  );
  assert.equal(
    getInstallActionMode({ isInstalled: false, isInstallable: false, isIOS: true }),
    'ios-guide'
  );
  assert.equal(
    getInstallActionMode({ isInstalled: false, isInstallable: false, isIOS: false }),
    'mobile-guide'
  );
});
