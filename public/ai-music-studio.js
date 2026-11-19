(()=> {
  const $ = id => document.getElementById(id);
  const panel = $('aiMusicPanel');
  if (!panel) return;
  const form = $('musicGenerateForm');
  const prompt = $('musicPrompt');
  const durationSelect = $('musicDuration');
  const customDuration = $('musicCustomDuration');
  const formatSelect = $('musicFormat');
  const status = $('musicStatus');
  const generateButton = $('musicGenerateButton');
  const player = $('musicPreview');
  const downloadButton = $('musicDownloadSource');
  const sfxInput = $('musicSfxFile');
  const mainVolume = $('musicMainVolume');
  const sfxVolume = $('musicSfxVolume');
  const fadeIn = $('musicFadeIn');
  const fadeOut = $('musicFadeOut');
  let taskId = '';
  let audioUrl = '';
  let audioBlob = null;
  let sfxBuffer = null;
  let busy = false;

  const presets = {
    epic: 'Original epic Indian cinematic orchestral score, heroic destiny theme, deep strings, powerful brass, Indian percussion, instrumental, no vocals.',
    romance: 'Emotional Indian cinematic romance score, delicate piano, warm strings, bamboo flute, intimate and nostalgic, instrumental, no vocals.',
    villain: 'Dark antagonist theme, ominous low cello, dissonant strings, deep brass, restrained tension, cinematic instrumental, no vocals.',
    war: 'Massive Indian cinematic war score, thunderous orchestral drums, rapid strings, heroic brass, deep male choir texture without words, instrumental.',
    suspense: 'Atmospheric cinematic suspense score, low drones, pulsing strings, subtle heartbeat percussion, gradual tension build, instrumental.'
  };
  panel.addEventListener('click', event => {
    const preset = event.target.closest('[data-music-preset]');
    if (preset) {
      prompt.value = presets[preset.dataset.musicPreset] || '';
      prompt.focus();
    }
  });
  function selectedDuration() {
    if (durationSelect.value !== 'custom') return Number(durationSelect.value);
    return Number(customDuration.value);
  }
  function setStatus(message, kind='info') {
    status.textContent = message;
    status.dataset.state = kind;
  }
  async function api(path, options={}) {
    const response = await fetch(path, {cache:'no-store', ...options, headers:{Accept:'application/json', ...(options.headers||{})}});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || 'Music service request failed.');
    return data;
  }
  function setBusy(value) {
    busy = value;
    generateButton.disabled = value;
    generateButton.textContent = value ? 'Generating…' : 'Generate music';
  }
  async function waitForTask(id) {
    const started = Date.now();
    while (Date.now() - started < 8 * 60 * 1000) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const result = await api('/api/music/status?task_id='+encodeURIComponent(id));
      if (result.status === 2 || result.status === 'failed') throw new Error(result.error || 'Music generation failed.');
      if (result.status === 1 || result.status === 'succeeded') return result;
      setStatus(result.queuePosition ? 'Waiting in GPU queue · position '+result.queuePosition : 'Music is being generated…');
    }
    throw new Error('Generation is taking longer than expected. Please try again later.');
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const seconds = selectedDuration();
    if (!prompt.value.trim()) return setStatus('Enter a music description first.', 'error');
    if (!Number.isFinite(seconds) || seconds < 10 || seconds > 600) return setStatus('Duration must be between 10 and 600 seconds.', 'error');
    setBusy(true);
    try {
      setStatus('Submitting your music request…');
      const task = await api('/api/music/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt.value.trim(),duration:seconds,format:formatSelect.value,instrumental:$('musicInstrumental').checked})});
      taskId = task.taskId;
      setStatus('Request accepted. Waiting for the generation service…');
      const completed = await waitForTask(taskId);
      const path = completed.audioPath;
      if (!path) throw new Error('The provider completed the task but did not return an audio file.');
      setStatus('Downloading generated audio…');
      const audioResponse = await fetch('/api/music/audio?path='+encodeURIComponent(path), {cache:'no-store'});
      if (!audioResponse.ok) {
        const issue = await audioResponse.json().catch(()=>({}));
        throw new Error(issue.error || 'Could not retrieve the generated audio.');
      }
      audioBlob = await audioResponse.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(audioBlob);
      player.src = audioUrl;
      player.load();
      downloadButton.disabled = false;
      downloadButton.href = audioUrl;
      downloadButton.removeAttribute('aria-disabled');
      downloadButton.download = 'MAP132-AI-Music.'+formatSelect.value;
      setStatus('Music generated. Preview it, add your sound effects, then export a Premiere-ready mix.', 'success');
    } catch (error) {
      setStatus(error.message || 'Music generation is unavailable.', 'error');
    } finally {
      setBusy(false);
    }
  });
  durationSelect.addEventListener('change', () => {
    customDuration.hidden = durationSelect.value !== 'custom';
  });
  sfxInput.addEventListener('change', async () => {
    const file = sfxInput.files && sfxInput.files[0];
    sfxBuffer = null;
    if (!file) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtx();
      sfxBuffer = await context.decodeAudioData(await file.arrayBuffer());
      await context.close();
      setStatus('Sound effect loaded for the final mix.');
    } catch {
      setStatus('This sound effect could not be decoded. Try WAV, MP3 or AAC.', 'error');
    }
  });
  function encodeWav24(buffer) {
    const channels = 2, sampleRate = 48000, frames = buffer.length;
    const bytesPerSample = 3, dataSize = frames * channels * bytesPerSample;
    const output = new ArrayBuffer(44 + dataSize);
    const view = new DataView(output);
    const write = (offset, value) => { for (let i=0;i<value.length;i++) view.setUint8(offset+i,value.charCodeAt(i)); };
    write(0,'RIFF'); view.setUint32(4,36+dataSize,true); write(8,'WAVE'); write(12,'fmt ');
    view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels,true);
    view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*channels*bytesPerSample,true);
    view.setUint16(32,channels*bytesPerSample,true); view.setUint16(34,24,true); write(36,'data'); view.setUint32(40,dataSize,true);
    const left=buffer.getChannelData(0), right=buffer.numberOfChannels>1?buffer.getChannelData(1):left;
    let offset=44;
    for(let i=0;i<frames;i++) for(const sample of [left[i],right[i]]) {
      const value=Math.max(-1,Math.min(1,sample));
      let pcm=Math.round(value<0?value*8388608:value*8388607);
      if(pcm<0)pcm+=16777216;
      view.setUint8(offset++,pcm&255); view.setUint8(offset++,(pcm>>8)&255); view.setUint8(offset++,(pcm>>16)&255);
    }
    return new Blob([output],{type:'audio/wav'});
  }
  async function exportMix() {
    if (!audioBlob) return setStatus('Generate or load a music track before exporting.', 'error');
    const seconds = selectedDuration();
    if (!Number.isFinite(seconds) || seconds < 10 || seconds > 600) return setStatus('Choose a valid duration before exporting.', 'error');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const decoder = new AudioCtx();
    try {
      const music = await decoder.decodeAudioData(await audioBlob.arrayBuffer());
      const sampleRate=48000, frames=Math.ceil(seconds*sampleRate);
      const offline=new OfflineAudioContext(2,frames,sampleRate);
      const musicSource=offline.createBufferSource(); musicSource.buffer=music;
      const musicGain=offline.createGain(); musicGain.gain.value=Number(mainVolume.value)/100;
      musicSource.connect(musicGain).connect(offline.destination);
      const inSeconds=Math.min(Number(fadeIn.value)||0,seconds/2), outSeconds=Math.min(Number(fadeOut.value)||0,seconds/2);
      musicGain.gain.setValueAtTime(0,0);
      musicGain.gain.linearRampToValueAtTime(Number(mainVolume.value)/100,Math.max(.01,inSeconds));
      if(outSeconds>0){musicGain.gain.setValueAtTime(Number(mainVolume.value)/100,Math.max(inSeconds,seconds-outSeconds));musicGain.gain.linearRampToValueAtTime(0,seconds);}
      musicSource.start(0,0,Math.min(seconds,music.duration));
      if(sfxBuffer){
        const effect=offline.createBufferSource(); effect.buffer=sfxBuffer;
        const gain=offline.createGain(); gain.gain.value=Number(sfxVolume.value)/100;
        effect.connect(gain).connect(offline.destination);
        effect.start(0,0,Math.min(seconds,sfxBuffer.duration));
      }
      setStatus('Mixing audio and rendering 48 kHz / 24-bit WAV…');
      const rendered=await offline.startRendering();
      const blob=encodeWav24(rendered), url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url; link.download='MAP132-Premiere-Pro-Mix-48kHz-24bit.wav';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      setStatus('Premiere-ready WAV mix exported successfully.', 'success');
    } catch(error) {
      setStatus(error.message || 'Audio mixing failed in this browser.', 'error');
    } finally { await decoder.close().catch(()=>{}); }
  }
  $('musicExportMix').addEventListener('click',exportMix);
  $('musicDownloadSource').addEventListener('click',event=>{if(!audioBlob)event.preventDefault()});
  for (const [input, output] of [['musicMainVolume','musicMainVolumeValue'],['musicSfxVolume','musicSfxVolumeValue']]) $(input).addEventListener('input',()=>$(output).textContent=$(input).value+'%');
  api('/api/music/config').then(config=>{
    if(config.configured) { generateButton.disabled=false; generateButton.textContent='Generate music'; setStatus('Music generation service is connected. Create an original instrumental track.'); }
    else {setStatus('Music Studio is ready, but its external GPU provider is not configured yet. No generation quota or free hosting is assumed.','warning');generateButton.disabled=true;generateButton.textContent='Provider setup required';}
  }).catch(()=>setStatus('Could not check the music generation service.','error'));
})();
