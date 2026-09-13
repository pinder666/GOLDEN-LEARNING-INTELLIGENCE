/* Coach Voice Service — Pre-generated ElevenLabs audio

   1. Try drill-specific: /audio/drills/<id>-<lang>.mp3 (16MB, 60 files)
   2. Fall back to SoccerMental cache: /tts_cache/<sha1>.mp3 (327MB, 4986 files)
   3. Last resort: device speech
*/

const COACH_EN = 'KgPrBPTt9lFW3IWauARL';
const COACH_ES = 'pMsXgVXv3BLzUgSXRplE';

let currentAudio = null;
let busy = false;

// SHA1 for cache lookup
function sha1hex(str) {
  function rol(n, s) { return (n << s) | (n >>> (32 - s)); }
  function hx(v) { let s = ''; for (let i = 7; i >= 0; i--) s += ((v >>> (i * 4)) & 0x0f).toString(16); return s; }
  const msg = unescape(encodeURIComponent(str));
  const W = new Array(80);
  let H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
  let A, B, C, D, E, temp, i, bs, ml = msg.length, wa = [];
  for (i = 0; i < ml - 3; i += 4) wa.push(msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 | msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3));
  switch (ml % 4) {
    case 0: i = 0x080000000; break;
    case 1: i = msg.charCodeAt(ml - 1) << 24 | 0x0800000; break;
    case 2: i = msg.charCodeAt(ml - 2) << 24 | msg.charCodeAt(ml - 1) << 16 | 0x08000; break;
    case 3: i = msg.charCodeAt(ml - 3) << 24 | msg.charCodeAt(ml - 2) << 16 | msg.charCodeAt(ml - 1) << 8 | 0x80; break;
  }
  wa.push(i);
  while ((wa.length % 16) !== 14) wa.push(0);
  wa.push(ml >>> 29); wa.push((ml << 3) & 0x0ffffffff);
  for (bs = 0; bs < wa.length; bs += 16) {
    for (i = 0; i < 16; i++) W[i] = wa[bs + i];
    for (i = 16; i <= 79; i++) W[i] = rol(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
    A = H0; B = H1; C = H2; D = H3; E = H4;
    for (i = 0; i <= 79; i++) {
      let f, k;
      if (i < 20) { f = (B & C) | (~B & D); k = 0x5A827999; }
      else if (i < 40) { f = B ^ C ^ D; k = 0x6ED9EBA1; }
      else if (i < 60) { f = (B & C) | (B & D) | (C & D); k = 0x8F1BBCDC; }
      else { f = B ^ C ^ D; k = 0xCA62C1D6; }
      temp = (rol(A, 5) + f + E + W[i] + k) & 0x0ffffffff;
      E = D; D = C; C = rol(B, 30); B = A; A = temp;
    }
    H0 = (H0 + A) & 0x0ffffffff; H1 = (H1 + B) & 0x0ffffffff; H2 = (H2 + C) & 0x0ffffffff; H3 = (H3 + D) & 0x0ffffffff; H4 = (H4 + E) & 0x0ffffffff;
  }
  return (hx(H0) + hx(H1) + hx(H2) + hx(H3) + hx(H4)).toLowerCase();
}

function cacheUrl(text, lang = 'en') {
  const vid = lang === 'es' ? COACH_ES : COACH_EN;
  const tt = String(text).trim().slice(0, 2000);
  return '/tts_cache/' + sha1hex(vid + '|' + tt) + '.mp3';
}

// Play audio with fallback chain
function playAudio(url, callbacks, onFail) {
  const audio = new Audio(url);
  currentAudio = audio;

  let handled = false;
  const done = () => {
    if (handled) return;
    handled = true;
    if (currentAudio === audio) currentAudio = null;
    busy = false;
    callbacks.onEnd?.();
  };

  audio.onended = done;
  audio.onerror = () => {
    if (handled) return;
    handled = true;
    if (currentAudio === audio) currentAudio = null;
    onFail?.();
  };

  audio.play()
    .then(() => callbacks.onStart?.())
    .catch(() => {
      if (handled) return;
      handled = true;
      busy = false;
    });
}

// Device speech fallback
function deviceSpeak(text, lang, callbacks) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    busy = false;
    callbacks.onEnd?.();
    return;
  }

  const utt = new SpeechSynthesisUtterance(String(text));
  utt.rate = 1.1;
  utt.lang = lang === 'es' ? 'es-MX' : 'en-US';
  utt.onstart = () => callbacks.onStart?.();
  utt.onend = () => { busy = false; callbacks.onEnd?.(); };
  utt.onerror = () => { busy = false; callbacks.onEnd?.(); };
  speechSynthesis.speak(utt);
}

// Speak drill by ID — tries drill-specific file first
export function speakDrill(drillId, lang = 'en', callbacks = {}) {
  stop();
  busy = true;

  const drillUrl = `/audio/drills/${drillId}-${lang}.mp3`;

  playAudio(drillUrl, callbacks, () => {
    // Drill file not found — try SHA1 cache won't work (different text), go to device
    deviceSpeak(drillId, lang, callbacks);
  });
}

// Speak arbitrary text — tries SHA1 cache
export function speak(text, lang = 'en', callbacks = {}) {
  if (!text) { callbacks.onEnd?.(); return; }

  stop();
  busy = true;

  const url = cacheUrl(text, lang);
  playAudio(url, callbacks, () => deviceSpeak(text, lang, callbacks));
}

export function stop() {
  busy = false;
  if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
  try { window.speechSynthesis?.cancel(); } catch (e) {}
}

export function isSpeaking() {
  return busy || !!(window.speechSynthesis?.speaking || window.speechSynthesis?.pending);
}

export default { speak, speakDrill, stop, isSpeaking };
