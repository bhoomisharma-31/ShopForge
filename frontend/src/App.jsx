import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import VideoIntro from './components/VideoIntro';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [introPlayed, setIntroPlayed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Enforce format: intro video -> homepage first.
  // If the user loads or refreshes on another route (like /auth) before the intro finishes,
  // we redirect them to the home page so they must explicitly click Navbar Login to see Nora.
  useEffect(() => {
    if (!introPlayed && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [introPlayed, location.pathname, navigate]);

  return (
    <>
      {/* Cursor */}
      <div id="cursor"/>
      <div id="cursor-ring"/>
      <CursorTracker/>

      {/* City intro video — plays once, no skip */}
      {!introPlayed && <VideoIntro onFinished={() => setIntroPlayed(true)}/>}

      {/* Site — fades in after intro video finishes */}
      <div
        style={{
          opacity:    introPlayed ? 1 : 0,
          transform:  introPlayed ? 'none' : 'scale(0.98) translateY(12px)',
          transition: 'opacity 1.2s ease 0.1s, transform 1.2s ease 0.1s',
          display:    'flex', minHeight:'100vh', flexDirection:'column',
        }}
      >
        <Navbar/>
        <main style={{ flex:1 }}>
          <Routes>
            <Route path="/"             element={<HomePage/>}/>
            <Route path="/products"     element={<ProductsPage/>}/>
            <Route path="/products/:id" element={<ProductDetailPage/>}/>
            <Route path="/cart"         element={<CartPage/>}/>
            <Route path="/auth"         element={<AuthPage/>}/>
            <Route path="/orders"       element={<ProtectedRoute><OrdersPage/></ProtectedRoute>}/>
            <Route path="/admin"        element={<ProtectedRoute adminOnly><AdminDashboard/></ProtectedRoute>}/>
            <Route path="*"             element={<NotFoundPage/>}/>
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{
          background:'rgba(4,13,26,0.9)', borderTop:'1px solid rgba(56,182,255,0.1)',
          padding:'2rem 1.5rem', backdropFilter:'blur(12px)',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.3rem', fontWeight:800, letterSpacing:'0.08em' }}>
              <span style={{ color:'#38b6ff' }}>Shop</span>
              <span style={{ color:'#e8f4ff' }}>Forge</span>
            </div>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', color:'rgba(232,244,255,0.3)', letterSpacing:'0.08em' }}>
              © {new Date().getFullYear()} ShopForge. All rights reserved.
            </p>
            <nav style={{ display:'flex', gap:'1.5rem' }}>
              {['Privacy','Terms','Support'].map(l=>(
                <a key={l} href="#" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(232,244,255,0.3)', textDecoration:'none', transition:'color 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.color='#38b6ff'}
                  onMouseOut={e=>e.currentTarget.style.color='rgba(232,244,255,0.3)'}
                >{l}</a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}

/* Cursor animation in a tiny component to avoid re-renders */
function CursorTracker() {
  if (typeof window === 'undefined') return null;
  let mx=0,my=0,rx=0,ry=0;
  const c  = ()=>document.getElementById('cursor');
  const r  = ()=>document.getElementById('cursor-ring');
  const loop = () => {
    rx+=(mx-rx)*0.14; ry+=(my-ry)*0.14;
    const el=c(), ring=r();
    if(el)  { el.style.left=mx+'px'; el.style.top=my+'px'; }
    if(ring){ ring.style.left=rx+'px'; ring.style.top=ry+'px'; }
    requestAnimationFrame(loop);
  };
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
  loop();
  return null;
}
