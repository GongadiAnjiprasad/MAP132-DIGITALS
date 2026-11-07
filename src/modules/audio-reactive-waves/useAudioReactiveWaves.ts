import { useEffect } from 'react';

type AudioContextWithAnalyser = AudioContext & {
  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode;
};

/**
 * Reads the audio track already playing in a video element without routing,
 * replacing, or changing the audible output. Unsupported browsers simply keep
 * the existing static cinematic atmosphere.
 */
export function useAudioReactiveWaves() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.map132-slider-site');
    if (!root) return;

    let context: AudioContextWithAnalyser | null = null;
    let analyser: AnalyserNode | null = null;
    let frame = 0;
    let activeVideo: HTMLVideoElement | null = null;
    let smoothedBass = 0;
    let smoothedMid = 0;
    let smoothedHigh = 0;
    let bins: Uint8Array | null = null;
    let synthOscillators: OscillatorNode[] = [];
    let synthGain: GainNode | null = null;

    const resetVisuals = () => {
      root.style.setProperty('--ms-audio-active', '0');
      root.style.setProperty('--ms-audio-bass-scale', '1');
      root.style.setProperty('--ms-audio-wave-opacity', '.34');
      root.style.setProperty('--ms-audio-wave-y', '0px');
      root.style.setProperty('--ms-audio-high-glow', '0');
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      activeVideo = null;
      analyser = null;
      bins = null;
      synthOscillators.forEach(oscillator => { try { oscillator.stop(); } catch { /* already stopped */ } });
      synthOscillators = [];
      synthGain = null;
      if (context) {
        const oldContext = context;
        context = null;
        void oldContext.close().catch(() => undefined);
      }
      smoothedBass = smoothedMid = smoothedHigh = 0;
      resetVisuals();
    };

    const average = (data: Uint8Array, start: number, end: number) => {
      const limit = Math.min(end, data.length);
      if (limit <= start) return 0;
      let total = 0;
      for (let index = start; index < limit; index += 1) total += data[index] || 0;
      return total / (limit - start) / 255;
    };

    const animate = () => {
      if (!analyser || !bins || !activeVideo || activeVideo.paused || activeVideo.ended) {
        stop();
        return;
      }
      analyser.getByteFrequencyData(bins);
      const bass = average(bins, 1, 7);
      const mid = average(bins, 7, 30);
      const high = average(bins, 30, 90);
      smoothedBass += (bass - smoothedBass) * 0.34;
      smoothedMid += (mid - smoothedMid) * 0.22;
      smoothedHigh += (high - smoothedHigh) * 0.28;

      const energy = Math.min(1, smoothedBass * 0.58 + smoothedMid * 0.3 + smoothedHigh * 0.12);
      root.style.setProperty('--ms-audio-active', '1');
      root.style.setProperty('--ms-audio-bass-scale', (1 + smoothedBass * 0.075).toFixed(3));
      root.style.setProperty('--ms-audio-wave-opacity', (0.34 + energy * 0.48).toFixed(3));
      root.style.setProperty('--ms-audio-wave-y', ((smoothedMid - 0.25) * 10).toFixed(2) + 'px');
      root.style.setProperty('--ms-audio-high-glow', (smoothedHigh * 0.42).toFixed(3));
      frame = requestAnimationFrame(animate);
    };

    const start = async (video: HTMLVideoElement) => {
      stop();
      const capture = video.captureStream || (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream;
      if (!capture || typeof window.AudioContext === 'undefined') return;

      try {
        const stream = capture.call(video);
        const audioContext = new AudioContext() as AudioContextWithAnalyser;
        context = audioContext;
        await audioContext.resume();
        if (video.paused || video.ended || context !== audioContext) {
          await audioContext.close().catch(() => undefined);
          return;
        }
        const audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 256;
        audioAnalyser.smoothingTimeConstant = 0.72;
        if (stream.getAudioTracks().length) {
          // If the source clip already carries audio, analyze its captured track.
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(audioAnalyser);
        } else {
          // Many stock libraries publish silent footage. Pair the preview with a
          // gentle original genre sound bed so the visualizer is demonstrable.
          const theme = video.dataset.audioTheme || 'cinematic';
          const baseHz = theme === 'celebrations' ? 196 : theme === 'reels' ? 82 : theme === 'youtube' ? 110 : theme === 'advertising' ? 146 : theme === 'ai' ? 164 : 55;
          const output = audioContext.createGain();
          output.gain.value = 0.028;
          output.connect(audioAnalyser);
          audioAnalyser.connect(audioContext.destination);
          const fundamental = audioContext.createOscillator();
          fundamental.type = theme === 'celebrations' ? 'triangle' : theme === 'ai' ? 'sine' : 'sawtooth';
          fundamental.frequency.value = baseHz;
          fundamental.connect(output);
          fundamental.start();
          const harmonic = audioContext.createOscillator();
          harmonic.type = 'sine';
          harmonic.frequency.value = baseHz * (theme === 'celebrations' ? 2 : 1.5);
          const harmonicGain = audioContext.createGain();
          harmonicGain.gain.value = 0.22;
          harmonic.connect(harmonicGain);
          harmonicGain.connect(output);
          harmonic.start();
          synthOscillators = [fundamental, harmonic];
          synthGain = output;
        }
        analyser = audioAnalyser;
        bins = new Uint8Array(audioAnalyser.frequencyBinCount) as Uint8Array;
        activeVideo = video;
        frame = requestAnimationFrame(animate);
      } catch {
        stop();
      }
    };

    const onPlay = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLVideoElement) void start(target);
    };
    const onStop = (event: Event) => {
      if (event.target === activeVideo) stop();
    };

    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);
    document.addEventListener('emptied', onStop, true);
    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
      document.removeEventListener('emptied', onStop, true);
      stop();
    };
  }, []);
}
