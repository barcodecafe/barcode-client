/**
 * 🔔 soundNotification.js
 * 
 * Central Utility for:
 * 1. Web Audio API Synthesized Restaurant Kitchen Bell & Rider Alert Chimes
 * 2. Continuous Looping Order Alert (Sound + Mobile Vibration) until Accepted/Rejected
 * 3. Native OS Desktop & Mobile Push Notifications (Windows, Mac, Android)
 */

class SoundNotificationManager {
  constructor() {
    this.audioCtx = null;
    this.alertInterval = null;
    this.isAlerting = false;
    this.hasUnlocked = false;

    // 🚀 Mobile / Browser Interaction Auto-Unlocker
    if (typeof window !== 'undefined') {
      const unlock = () => {
        try {
          const ctx = this.getAudioContext();
          if (ctx) {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            // Play a 1-sample silent buffer to firmly unlock mobile audio pipeline
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          }
        } catch (e) {
          // ignore
        }
        this.hasUnlocked = true;
        ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
          window.removeEventListener(evt, unlock);
        });
      };

      ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) => {
        window.addEventListener(evt, unlock, { passive: true, once: true });
      });
    }
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * 📳 Mobile Vibration Engine (navigator.vibrate)
   */
  vibrate(pattern = [600, 250, 600, 250, 800]) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Vibration API not allowed or supported:', e);
    }
  }

  stopVibration() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * 🔔 Play Resonant Dual-Tone Restaurant Kitchen Order Bell
   */
  playKitchenBellChime() {
    // 1. Try playing custom MP3 first
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1.0;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          this.synthesizeBell();
        });
      }
    } catch {
      this.synthesizeBell();
    }
  }

  /**
   * 🎵 Synthesized Kitchen Bell chime via Web Audio API
   */
  synthesizeBell() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Bell Tone 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Bell Tone 2: 1320Hz (E6 Harmonic chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.45, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.5);

      // Bell Tone 3: 1760Hz (Sparkle overtone)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1760, now + 0.25);
      gain3.gain.setValueAtTime(0.3, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 1.8);
    } catch (e) {
      console.warn('Web Audio chime could not play:', e);
    }
  }

  /**
   * 🚨 START Continuous Loop Order Alert (Sound + Vibration on Mobile)
   * Rings & Vibrates continuously until admin accepts/rejects the order.
   */
  startContinuousOrderAlert() {
    if (this.isAlerting) return;
    this.isAlerting = true;

    // Trigger immediately
    this.playKitchenBellChime();
    this.vibrate([600, 250, 600, 250, 800]);

    // Clear any dangling interval
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }

    // Loop every 3.5 seconds
    this.alertInterval = setInterval(() => {
      if (!this.isAlerting) {
        this.stopContinuousOrderAlert();
        return;
      }
      this.playKitchenBellChime();
      this.vibrate([600, 250, 600, 250, 800]);
    }, 3500);
  }

  /**
   * 🛑 STOP Continuous Loop Order Alert
   */
  stopContinuousOrderAlert() {
    this.isAlerting = false;
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
    this.stopVibration();
  }

  isAlertActive() {
    return this.isAlerting;
  }

  /**
   * 🛵 Play Rider Alert Beep Chime
   */
  playRiderAlertChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [659.25, 880, 1174.66]; // E5, A5, D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.14);
        gain.gain.setValueAtTime(0.35, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.35);
      });
      this.vibrate([300, 150, 300]);
    } catch (e) {
      console.warn('Rider chime could not play:', e);
    }
  }

  /**
   * 🛡️ Request Native Browser Notification Permission
   */
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        return res;
      } catch {
        return Notification.permission;
      }
    }
    return Notification.permission;
  }

  /**
   * 🖥️ Send Native OS / Mobile Notification (Windows, Mac, Android)
   */
  async sendNotification({ title, body, icon = '/icons.png', tag = 'barcode-order', onClick, url }) {
    // 📳 Always trigger mobile vibration directly as well
    this.vibrate([600, 250, 600, 250, 800]);

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    if (Notification.permission === 'granted') {
      const options = {
        body,
        icon,
        badge: '/icons.png',
        tag,
        requireInteraction: true,
        silent: false,
        vibrate: [600, 250, 600, 250, 800],
        data: { url },
      };

      // 1. Prefer Service Worker showNotification on mobile (Android Chrome PWA standard)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && typeof reg.showNotification === 'function') {
            await reg.showNotification(title, options);
            return true;
          }
        } catch (swErr) {
          // Fallback to new Notification below
        }
      }

      // 2. Desktop & standard Notification constructor
      try {
        const notif = new Notification(title, options);

        notif.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (typeof onClick === 'function') {
            onClick();
          } else if (url && window.location.pathname !== url) {
            window.location.href = url;
          }
          notif.close();
        };

        return notif;
      } catch (err) {
        console.warn('Failed to dispatch native notification:', err);
      }
    }
    return null;
  }
}

export const soundNotification = new SoundNotificationManager();
