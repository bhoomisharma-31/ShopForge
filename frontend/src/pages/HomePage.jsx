import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = [
  { name:'Electronics',  sub:'Featured',    count:'128', grad:'linear-gradient(135deg,#001133,#002266,#003399)' },
  { name:'Accessories',  sub:'New Arrivals', count:'74',  grad:'linear-gradient(135deg,#001a2e,#003355,#004477)' },
  { name:'Clothing',     sub:'Trending',     count:'200', grad:'linear-gradient(135deg,#001122,#002244,#003366)' },
  { name:'Home',         sub:'Popular',      count:'93',  grad:'linear-gradient(135deg,#001133,#001e44,#002a55)' },
  { name:'Sports',       sub:'Active',       count:'55',  grad:'linear-gradient(135deg,#000d22,#001a3d,#002655)' },
];

const MARQUEE = ['Electronics','Accessories','Clothing','Home & Living','Kitchen','Sports','Free Shipping Over $50','30-Day Returns','Holographic Commerce'];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const revealRefs = useRef([]);

  useEffect(() => {
    api.get('/products?limit=8')
      .then(d => setFeatured(d.products || d || []))
      .catch(()=> setFeatured(DEMO_PRODUCTS))
      .finally(()=> setLoading(false));
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  const r = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
    <div style={{ background:'#020810' }}>

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', padding:'0 1.5rem', overflow:'hidden' }}>

        {/* Deep space background */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 70% at 60% 40%, rgba(0,102,255,0.08) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 10% 80%, rgba(0,212,255,0.05) 0%, transparent 55%), linear-gradient(170deg,#020810 0%,#040d1a 50%,#060f20 100%)' }}/>

        {/* Grid lines — like the holographic panels in the video */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(56,182,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,182,255,0.04) 1px,transparent 1px)', backgroundSize:'64px 64px', maskImage:'radial-gradient(ellipse 90% 80% at 50% 50%,black,transparent)' }}/>

        {/* Scan-line overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(56,182,255,0.015) 2px,rgba(56,182,255,0.015) 4px)' }}/>

        {/* Floating orbs */}
        <div style={{ position:'absolute', top:'15%', right:'8%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,102,255,0.12) 0%,transparent 70%)', animation:'orbFloat 8s ease-in-out infinite', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'20%', left:'5%',  width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)', animation:'orbFloat 11s ease-in-out infinite reverse', pointerEvents:'none' }}/>

        <style>{`
          @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-24px)} }
          @keyframes lineGrow { from{width:0} to{width:100%} }
          @keyframes heroFadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        `}</style>

        <div style={{ position:'relative', zIndex:1, maxWidth:820, paddingTop:64 }}>

          {/* Eyebrow */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', animation:'heroFadeUp 0.7s ease 0.1s both' }}>
            <div style={{ width:28, height:1, background:'linear-gradient(90deg,transparent,#38b6ff)' }}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', letterSpacing:'0.28em', textTransform:'uppercase', color:'#38b6ff' }}>
              Holographic Commerce Platform
            </span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#38b6ff', display:'inline-block', boxShadow:'0 0 8px #38b6ff', animation:'blink 2s ease infinite' }}/>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(3.5rem,9vw,8.5rem)', lineHeight:0.9, letterSpacing:'-0.01em', marginBottom:'1.5rem', animation:'heroFadeUp 0.8s ease 0.25s both' }}>
            <span style={{ display:'block', color:'#e8f4ff' }}>FORGE YOUR</span>
            <span style={{ display:'block', background:'linear-gradient(135deg,#38b6ff 0%,#00d4ff 40%,#0066ff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              DIGITAL
            </span>
            <span style={{ display:'block', color:'transparent', WebkitTextStroke:'1.5px rgba(56,182,255,0.3)' }}>STOREFRONT</span>
          </h1>

          {/* Desc */}
          <p style={{ fontSize:'1rem', fontWeight:300, lineHeight:1.75, color:'rgba(232,244,255,0.5)', maxWidth:460, marginBottom:'2.5rem', animation:'heroFadeUp 0.7s ease 0.4s both' }}>
            Step into the next generation of commerce. Curated collections, 
            holographic interfaces, and seamless digital experiences — 
            crafted for the future.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', animation:'heroFadeUp 0.7s ease 0.55s both' }}>
            <Link to="/products" className="btn-primary">
              Enter Store <HiArrowRight style={{ width:15, height:15 }}/>
            </Link>
            <Link to="/products" className="btn-secondary">Explore Collections</Link>
          </div>

          {/* Stats row */}
          <div style={{ marginTop:'4rem', display:'flex', gap:'2.5rem', flexWrap:'wrap', animation:'heroFadeUp 0.7s ease 0.7s both' }}>
            {[['12K+','Active Users'],['850+','Products'],['4.9','Avg Rating'],['99%','Uptime']].map(([n,l])=>(
              <div key={l}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.9rem', color:'#38b6ff', lineHeight:1, letterSpacing:'-0.01em' }}>{n}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(232,244,255,0.35)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — holographic UI mockup like video screens */}
        <div style={{ position:'absolute', right:'3%', top:'50%', transform:'translateY(-50%)', width:'36%', maxWidth:520, display:'none', pointerEvents:'none', animation:'heroFadeUp 1s ease 0.6s both' }} className="lg:block">
          <HoloPanel/>
        </div>
      </section>

      {/* ══ MARQUEE ═════════════════════════════════════════ */}
      <div style={{ borderTop:'1px solid rgba(56,182,255,0.1)', borderBottom:'1px solid rgba(56,182,255,0.1)', overflow:'hidden', padding:'0.8rem 0', background:'rgba(4,13,26,0.8)' }}>
        <div style={{ display:'flex', gap:'3rem', animation:'marqueeScroll 28s linear infinite', whiteSpace:'nowrap' }}>
          {[...MARQUEE,...MARQUEE].map((item,i)=>(
            <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(56,182,255,0.35)', display:'flex', alignItems:'center', gap:'1.5rem' }}>
              {item}<span style={{ color:'rgba(56,182,255,0.6)', fontSize:'0.5rem' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ TRUST STRIP ═════════════════════════════════════ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid rgba(56,182,255,0.08)', background:'rgba(4,13,26,0.6)' }}>
        {[
          { icon:'🛸', title:'Free Shipping',   desc:'On all orders over $50' },
          { icon:'🔐', title:'Secure & Private', desc:'End-to-end encrypted checkout' },
          { icon:'↺',  title:'Easy Returns',     desc:'Hassle-free 30-day policy' },
        ].map(({ icon, title, desc }, i) => (
          <div key={title} ref={r} className="reveal"
            style={{ padding:'1.75rem 2.5rem', borderRight:i<2?'1px solid rgba(56,182,255,0.08)':'none', display:'flex', alignItems:'center', gap:'1rem', transitionDelay:`${i*0.1}s` }}>
            <div style={{ width:42, height:42, borderRadius:6, background:'rgba(56,182,255,0.08)', border:'1px solid rgba(56,182,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#e8f4ff', marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:'0.7rem', color:'rgba(232,244,255,0.38)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ FEATURED PRODUCTS ═══════════════════════════════ */}
      <section style={{ padding:'5rem 1.5rem', background:'rgba(4,13,26,0.5)', maxWidth:'none' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div ref={r} className="reveal" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'2.5rem', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <p className="section-label" style={{ marginBottom:'0.6rem' }}>Featured Products</p>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.5rem)', lineHeight:0.95, letterSpacing:'-0.01em' }}>
                HANDPICKED<br/>
                <span style={{ background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>FOR YOU</span>
              </h2>
            </div>
            <Link to="/products" className="btn-secondary" style={{ fontSize:'0.72rem', padding:'0.55rem 1.2rem' }}>View All →</Link>
          </div>

          {loading
            ? <LoadingSpinner size="lg" className="py-24"/>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:1, background:'rgba(56,182,255,0.06)' }}>
                {featured.slice(0,8).map((p,i)=>(
                  <div key={p.id} ref={r} className="reveal" style={{ transitionDelay:`${i*0.06}s`, background:'#020810' }}>
                    <ProductCard product={p}/>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </section>

      {/* ══ CATEGORIES BENTO ════════════════════════════════ */}
      <section style={{ padding:'5rem 1.5rem', background:'#020810' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <p className="section-label" ref={r} style={{ marginBottom:'0.6rem' }}>Browse Collections</p>
          <h2 ref={r} className="reveal" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.5rem)', lineHeight:0.95, marginBottom:'2.5rem' }}>
            SHOP BY <span style={{ background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CATEGORY</span>
          </h2>

          <div ref={r} className="reveal" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gridTemplateRows:'200px 200px', gap:1, background:'rgba(56,182,255,0.06)' }}>
            {CATEGORIES.map(({ name, sub, count, grad }, i) => (
              <Link key={name} to={`/products?category=${name}`}
                style={{
                  gridColumn: i===0?'span 2':i===1?'span 2':'span 1',
                  gridRow:    i===0?'span 2':'span 1',
                  position:'relative', overflow:'hidden', display:'flex', alignItems:'flex-end', padding:'1.25rem',
                  textDecoration:'none', background:'#040d1a',
                  border:'1px solid rgba(56,182,255,0.08)',
                  transition:'border-color 0.3s',
                }}
                className="group"
              >
                {/* bg gradient */}
                <div style={{ position:'absolute', inset:0, background:grad, opacity:0.5 }}/>
                {/* scanlines */}
                <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(56,182,255,0.025) 3px,rgba(56,182,255,0.025) 6px)' }}/>
                {/* glow on bottom */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(2,8,16,0.92) 0%,rgba(2,8,16,0.2) 60%,transparent 100%)' }}/>
                {/* hover glow */}
                <div style={{ position:'absolute', inset:0, background:'rgba(56,182,255,0.04)', opacity:0, transition:'opacity 0.3s' }} className="group-hover:opacity-100"/>

                {/* top-right corner bracket */}
                <div style={{ position:'absolute', top:10, right:10, width:18, height:18, borderTop:'1.5px solid rgba(56,182,255,0.35)', borderRight:'1.5px solid rgba(56,182,255,0.35)' }}/>
                <div style={{ position:'absolute', bottom:10, left:10, width:18, height:18, borderBottom:'1.5px solid rgba(56,182,255,0.35)', borderLeft:'1.5px solid rgba(56,182,255,0.35)' }}/>

                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.55rem', letterSpacing:'0.22em', textTransform:'uppercase', color:'#38b6ff', marginBottom:'0.3rem' }}>{sub}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:'#e8f4ff', lineHeight:1, fontSize:i===0?'2.4rem':'1.4rem' }}>{name}</div>
                  <div style={{ fontSize:'0.62rem', color:'rgba(56,182,255,0.5)', marginTop:'0.3rem', fontFamily:"'JetBrains Mono',monospace" }}>{count} products</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════ */}
      <section style={{ padding:'6rem 1.5rem', background:'rgba(4,13,26,0.8)', borderTop:'1px solid rgba(56,182,255,0.1)', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* top line */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'50%', height:1, background:'linear-gradient(90deg,transparent,#38b6ff,transparent)' }}/>
        {/* glow orb */}
        <div style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:500, height:500, background:'radial-gradient(circle,rgba(0,102,255,0.1) 0%,transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:640, margin:'0 auto' }} ref={r}>
          <p className="section-label reveal" style={{ justifyContent:'center', marginBottom:'0.75rem' }}>Get Started Today</p>
          <h2 className="reveal" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'clamp(2.5rem,6vw,5.5rem)', lineHeight:0.9, marginBottom:'1.25rem' }}>
            JOIN THE<br/>
            <span style={{ background:'linear-gradient(135deg,#38b6ff 0%,#00d4ff 50%,#0066ff 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>FORGE</span>
          </h2>
          <p className="reveal" style={{ fontSize:'0.9rem', color:'rgba(232,244,255,0.42)', maxWidth:400, margin:'0 auto 2rem', lineHeight:1.7 }}>
            Thousands of happy customers. Premium products. The future of commerce, now.
          </p>
          <div className="reveal" style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/auth" className="btn-primary">Create Account <HiArrowRight style={{ width:15, height:15 }}/></Link>
            <Link to="/products" className="btn-secondary">Browse Products</Link>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Holographic UI panel shown on right side of hero ── */
function HoloPanel() {
  return (
    <div style={{ position:'relative', width:'100%', aspectRatio:'4/3' }}>
      <style>{`
        @keyframes dataFlow { 0%{transform:translateY(0)}100%{transform:translateY(-50%)} }
        @keyframes barPulse { 0%,100%{opacity:0.4;transform:scaleY(0.7)} 50%{opacity:1;transform:scaleY(1)} }
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.05);opacity:1} }
      `}</style>
      {/* Outer glass border */}
      <div style={{ position:'absolute', inset:0, border:'1px solid rgba(56,182,255,0.25)', borderRadius:4, background:'rgba(8,20,44,0.4)', backdropFilter:'blur(12px)' }}/>
      {/* Corner brackets */}
      {[['top:0,left:0','borderTop,borderLeft'],['top:0,right:0','borderTop,borderRight'],['bottom:0,left:0','borderBottom,borderLeft'],['bottom:0,right:0','borderBottom,borderRight']].map(([pos],i)=>{
        const positions = [{ top:0,left:0 },{ top:0,right:0 },{ bottom:0,left:0 },{ bottom:0,right:0 }];
        const borders   = [{ borderTop:'2px solid #38b6ff',borderLeft:'2px solid #38b6ff' },{ borderTop:'2px solid #38b6ff',borderRight:'2px solid #38b6ff' },{ borderBottom:'2px solid #38b6ff',borderLeft:'2px solid #38b6ff' },{ borderBottom:'2px solid #38b6ff',borderRight:'2px solid #38b6ff' }];
        return <div key={i} style={{ position:'absolute', width:20, height:20, ...positions[i], ...borders[i] }}/>;
      })}
      {/* Header bar */}
      <div style={{ position:'absolute', top:12, left:12, right:12, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.55rem', letterSpacing:'0.2em', color:'#38b6ff' }}>SHOPFORGE.SYS</span>
        <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(56,182,255,0.4),transparent)' }}/>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#38b6ff', boxShadow:'0 0 6px #38b6ff' }}/>
      </div>
      {/* Waveform */}
      <div style={{ position:'absolute', top:'22%', left:'8%', right:'8%', display:'flex', alignItems:'center', gap:3, height:40 }}>
        {Array.from({length:32}).map((_,i)=>(
          <div key={i} style={{ flex:1, background:'rgba(56,182,255,0.5)', borderRadius:1, animation:`barPulse ${0.5+Math.random()*1}s ease ${Math.random()*0.5}s infinite`, height:`${20+Math.random()*80}%` }}/>
        ))}
      </div>
      {/* Centre ring */}
      <div style={{ position:'absolute', top:'42%', left:'50%', transform:'translate(-50%,-50%)', width:80, height:80 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1.5px solid rgba(56,182,255,0.5)', animation:'ringPulse 2s ease infinite' }}/>
        <div style={{ position:'absolute', inset:10, borderRadius:'50%', border:'1px solid rgba(56,182,255,0.3)', animation:'ringPulse 2s ease 0.3s infinite' }}/>
        <div style={{ position:'absolute', inset:20, borderRadius:'50%', background:'rgba(56,182,255,0.15)', animation:'ringPulse 2s ease 0.6s infinite' }}/>
      </div>
      {/* Bottom data grid */}
      <div style={{ position:'absolute', bottom:12, left:12, right:12, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
        {['ITEMS','ORDERS','USERS'].map((l,i)=>(
          <div key={l} style={{ background:'rgba(56,182,255,0.06)', border:'1px solid rgba(56,182,255,0.15)', borderRadius:3, padding:'0.5rem', textAlign:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#38b6ff' }}>{['850+','12K','4.9★'][i]}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.45rem', letterSpacing:'0.15em', color:'rgba(56,182,255,0.45)' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMO_PRODUCTS = [
  { id:'1', name:'Wireless Headphones Pro', price:149.99, category:'Electronics', rating:4.5, reviews_count:128, image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
  { id:'2', name:'Leather Crossbody Bag',   price:89.00,  category:'Accessories', rating:4.8, reviews_count:64,  image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80' },
  { id:'3', name:'Smart Fitness Watch',     price:199.99, category:'Electronics', rating:4.3, reviews_count:256, image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
  { id:'4', name:'Organic Cotton T-Shirt',  price:34.99,  category:'Clothing',    rating:4.6, reviews_count:92,  image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' },
  { id:'5', name:'Ceramic Pour-Over Set',   price:54.00,  category:'Kitchen',     rating:4.9, reviews_count:48,  image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { id:'6', name:'Minimalist Desk Lamp',    price:79.99,  category:'Home',        rating:4.4, reviews_count:156, image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80' },
  { id:'7', name:'Running Shoes Elite',     price:129.99, category:'Sports',      rating:4.7, reviews_count:312, image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
  { id:'8', name:'Bamboo Sunglasses',       price:45.00,  category:'Accessories', rating:4.2, reviews_count:73,  image:'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=400&q=80' },
];
