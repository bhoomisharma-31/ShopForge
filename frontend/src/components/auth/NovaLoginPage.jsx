import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
} from 'react-icons/hi2';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

/**
 * NovaLoginPage
 *
 * One simple page. Video is always the background.
 *
 * 1. Nova video autoplays fullscreen
 * 2. At TAP_TIME (when Nova taps the holographic panel) → login form fades in
 * 3. Video keeps playing, then freezes on last frame → static background
 * 4. Login form is fully functional the moment it appears
 *
 * ── Adjust TAP_TIME below to match the exact moment Nova taps ──
 */

// Seconds into the video when Nova taps the holographic panel.
// Change this to match your video. Watch it and note the exact second.
const TAP_TIME = 5.0;

export default function NovaLoginPage() {
  const videoRef = useRef(null);
  const [showForm, setShowForm] = useState(false);

  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const navigate              = useNavigate();
  const { login, register }   = useAuthStore();

  // ── Video: autoplay + reveal form at TAP_TIME ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v) { setShowForm(true); return; }

    // Force autoplay (browsers need muted + programmatic play)
    const tryPlay = async () => {
      try { await v.play(); } catch { /* already playing or blocked */ }
    };

    const onCanPlay = () => tryPlay();
    const onTime = () => {
      if (v.currentTime >= TAP_TIME) {
        setShowForm(true);
      }
    };

    // When video ends, just pause — it stays frozen on last frame naturally
    const onEnded = () => {
      v.pause();
      setShowForm(true);
    };
    const onError = () => setShowForm(true);

    v.addEventListener('canplay',    onCanPlay);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended',      onEnded);
    v.addEventListener('error',      onError);

    if (v.readyState >= 3) tryPlay();

    // Safety fallback
    const bail = setTimeout(() => setShowForm(true), 20000);

    return () => {
      v.removeEventListener('canplay',    onCanPlay);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended',      onEnded);
      v.removeEventListener('error',      onError);
      clearTimeout(bail);
    };
  }, []);

  // ── Form helpers ──
  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Authentication failed', {
        style: {
          background: 'rgba(8,14,30,0.96)',
          color: '#e0eeff',
          border: '1px solid rgba(255,80,80,0.3)',
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.8rem',
          borderRadius: '10px',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Root: fixed fullscreen ── */
        .nova-root {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: #050a16;
          overflow: hidden;
        }

        /* ── Video: always the background ── */
        .nova-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 70% center;
          display: block;
          /* Display-level enhancements without transcoding/filters */
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          color-rendering: optimizeQuality;
          will-change: transform;
        }



        /* ── Left-side frosted dark panel so form is readable ── */
        .nova-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 50%;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(to left,
            transparent 0%,
            rgba(5,10,22,0.6) 15%,
            rgba(5,10,22,0.85) 50%,
            rgba(5,10,22,0.92) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .nova-overlay.visible { opacity: 1; }

        /* ── Form wrapper: LEFT side, vertically centered ── */
        .nova-form-wrap {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 3%;
          z-index: 10;
          box-sizing: border-box;
        }
        .nova-form-inner {
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
        }
        /* Hide scrollbar but keep scrollable */
        .nova-form-inner::-webkit-scrollbar { width: 0; }

        /* ── Glass card ── */
        .nova-glass {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 20px;
          padding: 2.5rem 2.25rem 2.25rem;
          backdrop-filter: blur(42px) saturate(180%);
          -webkit-backdrop-filter: blur(42px) saturate(180%);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 28px 80px rgba(0,0,0,0.6),
            0 0 60px rgba(0,140,255,0.06);
          position: relative;
          overflow: hidden;
        }
        /* Shimmer line */
        .nova-glass::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg,
            transparent,
            rgba(160,215,255,0.45) 30%,
            rgba(255,255,255,0.55) 50%,
            rgba(160,215,255,0.45) 70%,
            transparent);
        }
        /* Inner glow */
        .nova-glass::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: 18px;
          background: radial-gradient(ellipse 70% 35% at 50% 0%, rgba(80,185,255,0.06), transparent 55%);
          pointer-events: none;
        }

        /* ── Typography ── */
        .nova-brand {
          text-align: center;
          margin-bottom: 1.6rem;
          position: relative; z-index: 1;
        }
        .nova-logo {
          font-family: 'Syne', 'Inter', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          letter-spacing: 0.05em;
          margin-bottom: 0.6rem;
        }
        .nova-logo-s { color: rgba(80,195,255,0.9); }
        .nova-logo-f { color: rgba(225,240,255,0.95); }
        .nova-h1 {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-size: 1.7rem;
          color: rgba(225,240,255,0.95);
          margin: 0 0 0.25rem;
        }
        .nova-sub {
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: rgba(160,200,255,0.35);
          margin: 0;
        }

        /* ── Tabs ── */
        .nova-tabs {
          display: flex; gap: 2px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 1.3rem;
          position: relative; z-index: 1;
        }
        .nova-tab {
          flex: 1;
          padding: 0.55rem 0;
          border-radius: 7px;
          border: 1px solid transparent;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }
        .nova-tab.on {
          background: rgba(80,185,255,0.13);
          border-color: rgba(80,185,255,0.25);
          color: rgba(160,225,255,0.95);
          box-shadow: 0 1px 8px rgba(40,160,255,0.08);
        }
        .nova-tab.off { color: rgba(200,220,255,0.25); }
        .nova-tab.off:hover { color: rgba(200,220,255,0.5); }

        /* ── Fields ── */
        .nova-fields {
          display: flex; flex-direction: column; gap: 0.8rem;
          position: relative; z-index: 1;
        }
        .nova-field { display: flex; flex-direction: column; gap: 0.28rem; }
        .nova-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem; font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(130,195,255,0.45);
        }
        .nova-iw { position: relative; }
        .nova-ic {
          position: absolute; left: 11px; top: 50%;
          transform: translateY(-50%);
          width: 14px; height: 14px;
          color: rgba(80,185,255,0.3);
          pointer-events: none;
        }
        .nova-input {
          width: 100%;
          padding: 0.82rem 1rem 0.82rem 2.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(225,240,255,0.95);
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .nova-input::placeholder { color: rgba(160,200,255,0.16); }
        .nova-input:focus {
          border-color: rgba(80,185,255,0.4);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(80,185,255,0.08);
        }

        /* ── Submit ── */
        .nova-submit {
          width: 100%;
          padding: 0.88rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(80,185,255,0.28);
          background: linear-gradient(135deg, rgba(40,155,255,0.2), rgba(80,185,255,0.12));
          color: rgba(210,235,255,0.95);
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 18px rgba(40,155,255,0.07);
          margin-top: 0.25rem;
        }
        .nova-submit:hover:not(:disabled) {
          border-color: rgba(80,185,255,0.5);
          background: linear-gradient(135deg, rgba(40,155,255,0.28), rgba(80,185,255,0.18));
          color: #fff;
          transform: translateY(-1px);
        }
        .nova-submit:active:not(:disabled) { transform: translateY(0); }
        .nova-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Footer ── */
        .nova-div {
          height: 1px;
          background: rgba(255,255,255,0.055);
          margin: 1.25rem 0 0.9rem;
        }
        .nova-ft {
          font-family: 'Inter', sans-serif;
          font-size: 0.71rem;
          color: rgba(160,200,255,0.28);
          text-align: center;
          margin: 0;
          position: relative; z-index: 1;
        }
        .nova-link {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.71rem; font-weight: 500;
          color: rgba(80,185,255,0.5);
          transition: color 0.18s;
        }
        .nova-link:hover { color: rgba(80,185,255,0.9); }

        /* ── Mobile ── */
        @media (max-width: 860px) {
          .nova-overlay { width: 100%; background: rgba(5,10,22,0.75); left: 0; }
          .nova-bg-video { object-position: center center; }

          .nova-form-wrap {
            width: 100%;
            padding: 1.5rem 4%;
          }
          .nova-form-inner { max-width: 440px; }
          .nova-glass { padding: 2rem 1.5rem 1.75rem; }
        }
      `}</style>

      <div className="nova-root">

        {/* ── VIDEO: always the background, freezes on last frame ── */}
        <video
          ref={videoRef}
          className="nova-bg-video"
          autoPlay
          muted
          playsInline
          preload="auto"
        >
          <source src="/videos/nova-login-intro.mp4" type="video/mp4" />
        </video>



        {/* ── Dark overlay — fades in when form appears so text is readable ── */}
        <div className={`nova-overlay ${showForm ? 'visible' : ''}`} />

        {/* ── LOGIN FORM — fades in at the moment Nova taps ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              className="nova-form-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="nova-form-inner"
                initial={{ scale: 0.96, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
              <div className="nova-glass">

                {/* Brand */}
                <motion.div
                  className="nova-brand"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <div className="nova-logo">
                    <span className="nova-logo-s">Shop</span>
                    <span className="nova-logo-f">Forge</span>
                  </div>
                  <h1 className="nova-h1">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="nova-sub">
                    {mode === 'login'
                      ? 'Sign in to continue to ShopForge'
                      : 'Join ShopForge today'}
                  </p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                  className="nova-tabs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                >
                  {['login', 'register'].map((m) => (
                    <button
                      key={m}
                      className={`nova-tab ${mode === m ? 'on' : 'off'}`}
                      onClick={() => setMode(m)}
                    >
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="nova-fields">

                    {/* Name (register only) */}
                    <AnimatePresence initial={false}>
                      {mode === 'register' && (
                        <motion.div
                          key="name"
                          className="nova-field"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <label className="nova-label">Full Name</label>
                          <div className="nova-iw">
                            <HiOutlineUser className="nova-ic" />
                            <input
                              type="text" required
                              value={form.name}
                              onChange={update('name')}
                              placeholder="Your name"
                              className="nova-input"
                              autoComplete="name"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <motion.div
                      className="nova-field"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32, duration: 0.4 }}
                    >
                      <label className="nova-label">Email</label>
                      <div className="nova-iw">
                        <HiOutlineEnvelope className="nova-ic" />
                        <input
                          type="email" required
                          value={form.email}
                          onChange={update('email')}
                          placeholder="you@example.com"
                          className="nova-input"
                          autoComplete="email"
                        />
                      </div>
                    </motion.div>

                    {/* Password */}
                    <motion.div
                      className="nova-field"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42, duration: 0.4 }}
                    >
                      <label className="nova-label">Password</label>
                      <div className="nova-iw">
                        <HiOutlineLockClosed className="nova-ic" />
                        <input
                          type="password" required minLength={6}
                          value={form.password}
                          onChange={update('password')}
                          placeholder="••••••••"
                          className="nova-input"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                      </div>
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.52, duration: 0.4 }}
                    >
                      <button
                        type="submit"
                        disabled={loading}
                        className="nova-submit"
                      >
                        {loading
                          ? <><span>Authenticating</span><Dots /></>
                          : <span>{mode === 'login' ? 'Sign In  →' : 'Create Account  →'}</span>
                        }
                      </button>
                    </motion.div>
                  </div>
                </form>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.35 }}
                >
                  <div className="nova-div" />
                  <p className="nova-ft">
                    {mode === 'login' ? (
                      <>No account?{' '}
                        <button className="nova-link" onClick={() => setMode('register')}>Sign up</button>
                      </>
                    ) : (
                      <>Already registered?{' '}
                        <button className="nova-link" onClick={() => setMode('login')}>Sign in</button>
                      </>
                    )}
                  </p>
                </motion.div>

              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ── Loading dots ── */
function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 3 }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <span key={i} style={{
          width: 3.5, height: 3.5, borderRadius: '50%',
          background: 'rgba(80,185,255,0.85)',
          animation: `novaDots 0.9s ${d}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`
        @keyframes novaDots {
          0%,100% { opacity:.3; transform:scale(.8) }
          50%     { opacity:1;  transform:scale(1.3) }
        }
      `}</style>
    </span>
  );
}
