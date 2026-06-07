import { useEffect, useRef, useState } from 'react';

/**
 * VideoIntro — plays the video, then at the EXACT moment the woman
 * touches the holographic screen (~6.5s / frame 156), the landing page
 * ripples IN from that touch point — no black screen gap.
 *
 * Transition stages:
 *  1. Video plays normally
 *  2. At touch moment (~6.5s): cyan ripple burst expands from screen-center
 *  3. Glass shards / scan-lines sweep across
 *  4. Landing page fades up through the holographic distortion
 *  5. Video fades out — site is now fully visible
 */
export default function VideoIntro({ onFinished }) {
  const videoRef      = useRef(null);
  const [phase, setPhase] = useState('playing'); 
  // phases: playing → ripple → shatter → done

  const TOUCH_TIME = 6.2; // seconds into video when she touches the screen

  const triggerTransition = () => {
    if (phase !== 'playing') return;
    setPhase('ripple');
    // After ripple animation (0.7s) → shatter / reveal
    setTimeout(() => setPhase('shatter'), 700);
    // After shatter (1.0s) → signal parent to show site
    setTimeout(() => { setPhase('done'); onFinished(); }, 1400);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) { onFinished(); return; }

    // Force autoplay — browsers need muted + programmatic play()
    const tryPlay = async () => {
      try { await v.play(); } catch { /* already playing */ }
    };

    const onCanPlay = () => tryPlay();
    const onTime = () => {
      if (v.currentTime >= TOUCH_TIME) triggerTransition();
    };
    const onEnded = () => triggerTransition();
    const onError = () => setTimeout(onFinished, 300);

    v.addEventListener('canplay',    onCanPlay);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended',      onEnded);
    v.addEventListener('error',      onError);

    // If already ready, play now
    if (v.readyState >= 3) tryPlay();

    // Tap anywhere on the screen to unmute audio automatically (bypassing browser blocks)
    const handleTap = () => {
      if (v) {
        v.muted = false;
        tryPlay();
      }
    };
    window.addEventListener('click', handleTap);
    window.addEventListener('touchstart', handleTap);

    // Safety: if video doesn't start in 10s, skip
    const fallback = setTimeout(() => { if (v.readyState < 2) onFinished(); }, 10000);

    return () => {
      v.removeEventListener('canplay',    onCanPlay);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended',      onEnded);
      v.removeEventListener('error',      onError);
      window.removeEventListener('click', handleTap);
      window.removeEventListener('touchstart', handleTap);
      clearTimeout(fallback);
    };
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        /* ── Video container ── */
        #video-intro {
          position: fixed; inset: 0; z-index: 1000;
          background: #020810;
        }
        #intro-video {
          width: 100%; height: 100%; object-fit: cover;
          filter: contrast(1.1) saturate(1.2) brightness(1.02);
        }

        /* ── Overlays ── */
        .v-top  { position:absolute; top:0; left:0; right:0; height:15%;
                  background:linear-gradient(to bottom,rgba(2,8,16,0.6),transparent);
                  pointer-events:none; }
        .v-bot  { position:absolute; bottom:0; left:0; right:0; height:18%;
                  background:linear-gradient(to bottom,rgba(2,8,16,0.1) 0%,#020810 60%);
                  pointer-events:none; }
        .v-vig  { position:absolute; inset:0;
                  background:radial-gradient(ellipse at center,transparent 40%,rgba(2,8,16,0.65) 100%);
                  pointer-events:none; }
        .v-scan { position:absolute; inset:0; pointer-events:none;
                  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(56,182,255,0.02) 2px,rgba(56,182,255,0.02) 4px); }

        /* ── Skip button ── */
        #v-skip {
          position:absolute; bottom:2rem; right:2rem; z-index:10;
          font-family:'JetBrains Mono',monospace; font-size:0.65rem;
          letter-spacing:0.18em; text-transform:uppercase;
          color:rgba(56,182,255,0.5); cursor:pointer;
          background:rgba(56,182,255,0.06);
          border:1px solid rgba(56,182,255,0.2);
          padding:0.5rem 1rem; border-radius:2px;
          transition:all 0.2s;
        }
        #v-skip:hover { color:#38b6ff; border-color:rgba(56,182,255,0.5); background:rgba(56,182,255,0.12); }

        /* ══ RIPPLE TRANSITION ════════════════════════════ */
        /* 1. Cyan ripple burst from centre */
        #ripple-burst {
          position:absolute; inset:0; z-index:20;
          display:flex; align-items:center; justify-content:center;
          pointer-events:none;
        }
        .ripple-ring {
          position:absolute;
          border-radius:50%;
          border:2px solid rgba(56,182,255,0.9);
          animation:rippleOut 0.7s ease-out forwards;
        }
        .ripple-ring:nth-child(1){ width:0;height:0; animation-delay:0s; }
        .ripple-ring:nth-child(2){ width:0;height:0; animation-delay:0.1s; border-color:rgba(0,212,255,0.6); }
        .ripple-ring:nth-child(3){ width:0;height:0; animation-delay:0.2s; border-color:rgba(56,182,255,0.3); }

        @keyframes rippleOut {
          0%   { width:0;    height:0;    opacity:1; }
          100% { width:300vw;height:300vw;opacity:0; transform:translate(-50%,-50%); }
        }

        /* 2. Glass shatter — horizontal scan sweep */
        #glass-sweep {
          position:absolute; inset:0; z-index:21; pointer-events:none;
          animation:glassSweep 0.9s ease-in-out forwards;
          background:linear-gradient(
            180deg,
            transparent 0%,
            rgba(56,182,255,0.08) 48%,
            rgba(56,182,255,0.25) 50%,
            rgba(56,182,255,0.08) 52%,
            transparent 100%
          );
          background-size:100% 200%;
        }
        @keyframes glassSweep {
          0%   { background-position:0% -100%; opacity:1; }
          60%  { background-position:0%  200%; opacity:1; }
          100% { background-position:0%  200%; opacity:0; }
        }

        /* 3. Holographic grid materialise */
        #holo-grid {
          position:absolute; inset:0; z-index:19; pointer-events:none;
          background-image:
            linear-gradient(rgba(56,182,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,182,255,0.07) 1px, transparent 1px);
          background-size:60px 60px;
          animation:gridFadeIn 0.8s ease forwards;
        }
        @keyframes gridFadeIn {
          0%  { opacity:0; transform:scale(1.05); }
          60% { opacity:1; transform:scale(1); }
          100%{ opacity:0; }
        }

        /* 4. Central flash */
        #centre-flash {
          position:absolute; inset:0; z-index:22; pointer-events:none;
          background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(56,182,255,0.35),transparent 70%);
          animation:centreFlash 0.5s ease-out forwards;
        }
        @keyframes centreFlash {
          0%  { opacity:0; }
          30% { opacity:1; }
          100%{ opacity:0; }
        }

        /* Whole intro fade when done */
        #video-intro.phase-shatter {
          animation:introOut 1.0s ease 0.3s forwards;
        }
        @keyframes introOut {
          to { opacity:0; pointer-events:none; }
        }
      `}</style>

      <div id="video-intro" className={phase !== 'playing' ? 'phase-shatter' : ''}>
        <video ref={videoRef} id="intro-video" autoPlay muted playsInline preload="auto">
          <source src="/shopforgevideo.mp4" type="video/mp4"/>
        </video>

        {/* cinematic overlays */}
        <div className="v-top"/>
        <div className="v-bot"/>
        <div className="v-vig"/>
        <div className="v-scan"/>

        {/* Ripple transition elements (only visible in ripple/shatter phase) */}
        {phase !== 'playing' && (
          <>
            <div id="ripple-burst">
              <div className="ripple-ring"/>
              <div className="ripple-ring"/>
              <div className="ripple-ring"/>
            </div>
            <div id="holo-grid"/>
            <div id="glass-sweep"/>
            <div id="centre-flash"/>
          </>
        )}
      </div>
    </>
  );
}
