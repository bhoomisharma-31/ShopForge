import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMinus, HiPlus, HiTrash, HiArrowRight } from 'react-icons/hi2';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();
  const token    = useAuthStore(s=>s.token);
  const [busy, setBusy] = useState(false);

  const subtotal = items.reduce((s,i)=>s+i.price*i.quantity, 0);
  const shipping  = subtotal>=50 ? 0 : 5.99;
  const tax       = subtotal*0.08;
  const total     = subtotal+shipping+tax;

  const handleCheckout = async () => {
    if (!token) { toast.error('Please sign in first'); navigate('/auth'); return; }
    setBusy(true);
    try {
      await api.post('/orders',{ items:items.map(i=>({product_id:i.id,name:i.name,price:i.price,quantity:i.quantity})), total });
      toast.success('Order placed!', { style:{background:'rgba(8,20,44,0.95)',color:'#e8f4ff',border:'1px solid rgba(56,182,255,0.3)',fontFamily:"'JetBrains Mono',monospace"} });
      clearCart(); navigate('/orders');
    } catch(err) { toast.error(err.message||'Checkout failed'); }
    finally { setBusy(false); }
  };

  if (!items.length) return (
    <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', textAlign:'center', padding:'2rem' }}>
      <div style={{ fontSize:'4rem', opacity:0.2 }}>🛒</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', color:'#e8f4ff' }}>CART IS EMPTY</h2>
      <p style={{ color:'rgba(232,244,255,0.38)', fontSize:'0.82rem' }}>Add products to get started</p>
      <Link to="/products" className="btn-primary" style={{ marginTop:'0.5rem' }}>Browse Products <HiArrowRight style={{width:15,height:15}}/></Link>
    </div>
  );

  const rowStyle = { display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'rgba(8,20,44,0.5)', border:'1px solid rgba(56,182,255,0.1)', backdropFilter:'blur(8px)', marginBottom:1 };

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'2.5rem 1.5rem' }}>
      <div style={{ marginBottom:'2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2.5rem', color:'#e8f4ff' }}>CART</h1>
          <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.12em', color:'rgba(56,182,255,0.5)' }}>{items.reduce((s,i)=>s+i.quantity,0)} items queued</p>
        </div>
        <button onClick={clearCart} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', background:'rgba(255,80,80,0.08)', border:'1px solid rgba(255,80,80,0.2)', color:'rgba(255,100,100,0.7)', padding:'0.4rem 0.9rem', borderRadius:2, cursor:'pointer' }}>Clear All</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem' }} className="lg:grid-cols-3">
        <div style={{ gridColumn:'span 2' }}>
          {items.map(item=>{
            const img=item.image||`https://placehold.co/72x72/040d1a/38b6ff?text=${encodeURIComponent(item.name?.[0]||'P')}`;
            return (
              <div key={item.id} style={rowStyle}>
                <img src={img} alt={item.name} style={{ width:64, height:64, objectFit:'cover', flexShrink:0, filter:'brightness(0.9)' }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <Link to={`/products/${item.id}`} style={{ fontWeight:600, fontSize:'0.82rem', color:'#e8f4ff', textDecoration:'none' }}>{item.name}</Link>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.65rem', color:'rgba(56,182,255,0.5)', marginTop:2 }}>${item.price.toFixed(2)} / unit</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', border:'1px solid rgba(56,182,255,0.2)', borderRadius:2, overflow:'hidden' }}>
                  <button onClick={()=>updateQuantity(item.id,item.quantity-1)} style={{ width:28, height:28, background:'transparent', border:'none', color:'rgba(56,182,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><HiMinus style={{width:12,height:12}}/></button>
                  <span style={{ width:32, textAlign:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.75rem', color:'#e8f4ff' }}>{item.quantity}</span>
                  <button onClick={()=>updateQuantity(item.id,item.quantity+1)} style={{ width:28, height:28, background:'transparent', border:'none', color:'rgba(56,182,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><HiPlus style={{width:12,height:12}}/></button>
                </div>
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', minWidth:60, textAlign:'right' }}>${(item.price*item.quantity).toFixed(2)}</span>
                <button onClick={()=>removeItem(item.id)} style={{ background:'transparent', border:'none', color:'rgba(232,244,255,0.2)', cursor:'pointer', transition:'color 0.2s' }}
                  onMouseOver={e=>e.currentTarget.style.color='#ff5555'} onMouseOut={e=>e.currentTarget.style.color='rgba(232,244,255,0.2)'}>
                  <HiTrash style={{width:15,height:15}}/>
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{ background:'rgba(8,20,44,0.7)', border:'1px solid rgba(56,182,255,0.18)', backdropFilter:'blur(16px)', padding:'1.5rem', height:'fit-content', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'70%', height:1, background:'linear-gradient(90deg,transparent,#38b6ff,transparent)' }}/>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.3rem', marginBottom:'1.25rem', color:'#e8f4ff' }}>ORDER SUMMARY</h3>
          {[['Subtotal','$'+subtotal.toFixed(2)],['Shipping',shipping===0?'Free':'$'+shipping.toFixed(2)],['Tax (8%)','$'+tax.toFixed(2)]].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.65rem', fontSize:'0.8rem' }}>
              <span style={{ color:'rgba(232,244,255,0.42)' }}>{l}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:l==='Shipping'&&shipping===0?'#32dc96':'#e8f4ff' }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid rgba(56,182,255,0.12)', paddingTop:'1rem', marginTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span style={{ fontWeight:600, fontSize:'0.85rem' }}>Total</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>${total.toFixed(2)}</span>
          </div>
          {shipping>0&&<p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.58rem', color:'rgba(56,182,255,0.4)', marginTop:'0.5rem' }}>Add ${(50-subtotal).toFixed(2)} more for free shipping</p>}
          <button onClick={handleCheckout} disabled={busy} className="btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'1.25rem' }}>
            {busy?'Processing…':'Checkout'} <HiArrowRight style={{width:14,height:14}}/>
          </button>
          <Link to="/products" style={{ display:'block', textAlign:'center', marginTop:'0.75rem', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', color:'rgba(232,244,255,0.35)', textDecoration:'none', transition:'color 0.2s' }}
            onMouseOver={e=>e.currentTarget.style.color='#38b6ff'} onMouseOut={e=>e.currentTarget.style.color='rgba(232,244,255,0.35)'}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
