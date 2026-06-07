import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingCart, HiOutlineMagnifyingGlass, HiBars3, HiXMark } from 'react-icons/hi2';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch]         = useState('');
  const navigate                    = useNavigate();
  const { user, token, logout }     = useAuthStore();
  const items                       = useCartStore((s) => s.items);
  const cartCount                   = items.reduce((s,i)=>s+i.quantity,0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); setMobileOpen(false); }
  };

  const linkStyle = { fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(232,244,255,0.5)', textDecoration:'none', padding:'0.4rem 0.75rem', borderRadius:2, transition:'color 0.2s, background 0.2s' };

  return (
    <header style={{ position:'sticky', top:0, zIndex:500, borderBottom:'1px solid rgba(56,182,255,0.12)', background:'rgba(2,8,16,0.82)', backdropFilter:'blur(20px)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', padding:'0 1.5rem' }}>

        {/* Logo */}
        <Link to="/" style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.5rem', fontWeight:800, letterSpacing:'0.06em', textDecoration:'none', flexShrink:0, display:'flex', alignItems:'center', gap:'0.05em' }}>
          <span style={{ color:'#38b6ff' }}>Shop</span>
          <span style={{ color:'#e8f4ff' }}>Forge</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex:1, maxWidth:380, display:'none' }} className="md:block">
          <div style={{ position:'relative' }}>
            <HiOutlineMagnifyingGlass style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'rgba(56,182,255,0.4)', pointerEvents:'none' }}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" className="input-field" style={{ paddingLeft:36 }}/>
          </div>
        </form>

        {/* Right */}
        <nav style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <Link to="/products" style={linkStyle} className="hidden sm:block"
            onMouseOver={e=>{e.currentTarget.style.color='#38b6ff';e.currentTarget.style.background='rgba(56,182,255,0.08)';}}
            onMouseOut={e=>{e.currentTarget.style.color='rgba(232,244,255,0.5)';e.currentTarget.style.background='transparent';}}>
            Products
          </Link>

          {/* Cart */}
          <Link to="/cart" style={{ position:'relative', padding:'0.4rem', borderRadius:4, color:'rgba(232,244,255,0.5)', transition:'color 0.2s' }}
            onMouseOver={e=>e.currentTarget.style.color='#38b6ff'}
            onMouseOut={e=>e.currentTarget.style.color='rgba(232,244,255,0.5)'}>
            <HiOutlineShoppingCart style={{ width:20, height:20 }}/>
            {cartCount>0&&(
              <span style={{ position:'absolute', top:-2, right:-2, width:16, height:16, borderRadius:'50%', background:'#38b6ff', color:'#020810', fontSize:'9px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 8px rgba(56,182,255,0.6)' }}>
                {cartCount>9?'9+':cartCount}
              </span>
            )}
          </Link>

          {token ? (
            <div className="hidden sm:flex items-center gap-1">
              {user?.role==='admin'&&<Link to="/admin" style={{...linkStyle,color:'#38b6ff'}} onMouseOver={e=>e.currentTarget.style.background='rgba(56,182,255,0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>Dashboard</Link>}
              <Link to="/orders" style={linkStyle} onMouseOver={e=>{e.currentTarget.style.color='#38b6ff';}} onMouseOut={e=>{e.currentTarget.style.color='rgba(232,244,255,0.5)';}}>Orders</Link>
              <button onClick={logout} style={{...linkStyle,border:'none',cursor:'pointer',background:'transparent'}} onMouseOver={e=>e.currentTarget.style.color='#38b6ff'} onMouseOut={e=>e.currentTarget.style.color='rgba(232,244,255,0.5)'}>Logout</button>
              <div style={{ width:32,height:32,borderRadius:4,background:'rgba(56,182,255,0.15)',border:'1px solid rgba(56,182,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',fontWeight:700,color:'#38b6ff',marginLeft:4 }}>
                {user?.name?.[0]?.toUpperCase()||'U'}
              </div>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:block"><button className="btn-primary py-1.5 px-4 text-xs">Sign In</button></Link>
          )}

          <button onClick={()=>setMobileOpen(!mobileOpen)} className="sm:hidden" style={{ padding:'0.4rem', background:'transparent', border:'none', color:'rgba(232,244,255,0.5)', cursor:'pointer' }}>
            {mobileOpen?<HiXMark style={{width:20,height:20}}/>:<HiBars3 style={{width:20,height:20}}/>}
          </button>
        </nav>
      </div>

      {mobileOpen&&(
        <div style={{ borderTop:'1px solid rgba(56,182,255,0.1)', padding:'1rem 1.5rem', background:'rgba(2,8,16,0.95)' }}>
          <form onSubmit={handleSearch} style={{ marginBottom:'0.75rem' }}>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="input-field"/>
          </form>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <Link to="/products" onClick={()=>setMobileOpen(false)} style={linkStyle}>Products</Link>
            {token?(
              <>
                <Link to="/orders" onClick={()=>setMobileOpen(false)} style={linkStyle}>Orders</Link>
                {user?.role==='admin'&&<Link to="/admin" onClick={()=>setMobileOpen(false)} style={{...linkStyle,color:'#38b6ff'}}>Dashboard</Link>}
                <button onClick={()=>{logout();setMobileOpen(false);}} style={{...linkStyle,border:'none',cursor:'pointer',background:'transparent',textAlign:'left'}}>Logout</button>
              </>
            ):(
              <Link to="/auth" onClick={()=>setMobileOpen(false)} style={{...linkStyle,color:'#38b6ff'}}>Sign In</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
