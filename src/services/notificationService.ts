import { Platform } from 'react-native';

// Phát âm thanh cảnh báo Glitch/Beep bằng Web Audio API
export const playCyborgAlertSound = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth'; // Âm thanh sắc nhọn phong cách Cyberpunk
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nốt A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15); // Rơi tần số về A4

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Không gián đoạn luồng nếu audio context bị hạn chế
  }
};

// Yêu cầu quyền thông báo từ trình duyệt
export const requestBrowserPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Gửi thông báo đẩy
export const triggerCyborgNotification = (title: string, message: string) => {
  playCyborgAlertSound();

  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(`[SYS_ALERT]: ${title}`, {
        body: message,
        silent: true, // Đã có âm thanh riêng từ Web Audio
      });
      return;
    }
  }

  // Fallback nếu quyền thông báo chưa bật
  if (Platform.OS === 'web') {
    console.warn(`[ALERT_DISPATCHED]: ${title} - ${message}`);
  }
};