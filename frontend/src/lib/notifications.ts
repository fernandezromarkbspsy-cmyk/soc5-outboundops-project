let notificationAudioContext: AudioContext | null = null;
let notificationAudio: HTMLAudioElement | null = null;
const notificationSoundUrl = '/sounds/alert.wav';

function playNotificationChime(count: number) {
  if (count < 1 || typeof window.AudioContext === 'undefined') return;
  const context = notificationAudioContext ?? new window.AudioContext();
  notificationAudioContext = context;
  void context.resume().then(() => {
    const start = context.currentTime + 0.03;
    for (let item = 0; item < count; item += 1) {
      const offset = item * 0.48;
      for (const [note, frequency] of [[0, 659.25], [0.12, 880]] as const) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset + note);
        gain.gain.exponentialRampToValueAtTime(0.12, start + offset + note + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + note + 0.28);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + offset + note);
        oscillator.stop(start + offset + note + 0.3);
      }
    }
  }).catch(() => undefined);
}

export function unlockNotificationAudio() {
  if (typeof window.Audio !== 'undefined') {
    notificationAudio ??= new Audio(notificationSoundUrl);
    notificationAudio.preload = 'auto';
    notificationAudio.load();
  }
  if (typeof window.AudioContext !== 'undefined') {
    notificationAudioContext ??= new window.AudioContext();
    void notificationAudioContext.resume();
  }
}

export function playNotificationSound(count: number, enabled: boolean) {
  if (!enabled || count < 1) return;
  if (typeof window.Audio === 'undefined') {
    playNotificationChime(count);
    return;
  }
  let failed = false;
  for (let item = 0; item < count; item += 1) {
    window.setTimeout(() => {
      const audio = (notificationAudio?.cloneNode(true) as HTMLAudioElement | null) ?? new Audio(notificationSoundUrl);
      audio.volume = 0.85;
      void audio.play().catch(() => {
        if (!failed) {
          failed = true;
          playNotificationChime(count);
        }
      });
    }, item * 520);
  }
}

export function playAlertTone(enabled: boolean) {
  if (!enabled || typeof window.AudioContext === 'undefined') return;
  const context = notificationAudioContext ?? new window.AudioContext();
  notificationAudioContext = context;
  void context.resume().then(() => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }).catch(() => undefined);
}
