const alertSoundUrl = '/sounds/alert.wav';

const activeSources = new Set<string>();
let alertAudio: HTMLAudioElement | null = null;
let playBlocked = false;
let listenersAttached = false;

function ensureAudio() {
  if (typeof window === 'undefined' || typeof window.Audio === 'undefined') return null;
  alertAudio ??= new Audio(alertSoundUrl);
  alertAudio.loop = true;
  alertAudio.preload = 'auto';
  alertAudio.volume = 0.85;
  return alertAudio;
}

function pauseAudio() {
  if (!alertAudio) return;
  alertAudio.pause();
  alertAudio.currentTime = 0;
  playBlocked = false;
}

function tryPlay() {
  if (activeSources.size === 0) {
    pauseAudio();
    return;
  }

  const audio = ensureAudio();
  if (!audio || !audio.paused) return;

  void audio.play().then(() => {
    playBlocked = false;
  }).catch(() => {
    playBlocked = true;
  });
}

function resumeAfterInteraction() {
  if (playBlocked && activeSources.size > 0) tryPlay();
}

function attachInteractionListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('pointerdown', resumeAfterInteraction);
  window.addEventListener('keydown', resumeAfterInteraction);
}

export function primeAlertSound() {
  const audio = ensureAudio();
  attachInteractionListeners();
  audio?.load();
}

export function startAlertSound(source: string) {
  activeSources.add(source);
  attachInteractionListeners();
  tryPlay();
}

export function stopAlertSound(source: string) {
  activeSources.delete(source);
  if (activeSources.size === 0) pauseAudio();
}

export function stopAllAlertSounds() {
  activeSources.clear();
  pauseAudio();
}
