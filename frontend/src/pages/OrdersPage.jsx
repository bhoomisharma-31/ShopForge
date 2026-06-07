import { useEffect, useState } from 'react';
import { HiOutlineCube } from 'react-icons/hi2';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS = { pending:'status-pending', processing:'status-processing', shipped:'status-shipped', delivered:'status-delivered', cancelled:'status-cancelled' };

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/orders').then(d=>setOrders(d.orders||d||[])).catch(()=>setOrders(DEMO)).finally(()=>setLoading(false));
  },[]);

  if (loading) return <LoadingSpinner size="lg" className="py-32"/>;

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'2.5rem 1.5rem' }}>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2.5rem', color:'#e8f4ff' }}>MY ORDERS</h1>
        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.12em', color:'rgba(56,182,255,0.45)', marginTop:4 }}>{orders.length} order{orders.length!==1&&'s'} on record</p>
      </div>

      {!orders.length ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8rem 1rem', textAlign:'center' }}>
          <HiOutlineCube style={{ width:52, height:52, color:'rgba(56,182,255,0.2)', marginBottom:'1rem' }}/>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.6rem', color:'#e8f4ff' }}>NO ORDERS YET</h3>
          <p style={{ fontSize:'0.75rem', color:'rgba(232,244,255,0.35)', marginTop:'0.4rem' }}>Your order history will appear here</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {orders.map(order=>(
            <div key={order.id} style={{ background:'rgba(8,20,44,0.6)', border:'1px solid rgba(56,182,255,0.12)', backdropFilter:'blur(12px)', padding:'1.5rem', position:'relative' }}>
              {/* Left accent bar */}
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background: order.status==='delivered'?'linear-gradient(to bottom,#38b6ff,#00d4ff)':'rgba(56,182,255,0.2)' }}/>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem', marginBottom:'1rem' }}>
                <div>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', letterSpacing:'0.1em', color:'rgba(56,182,255,0.5)' }}>// ORDER #{order.id?.slice(-8)?.toUpperCase()}</p>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.57rem', color:'rgba(232,244,255,0.25)', marginTop:2 }}>
                    {order.created_at?new Date(order.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):'Recently'}
                  </p>
                </div>
                <span className={`badge ${STATUS[order.status]||'status-pending'}`}>{order.status||'pending'}</span>
              </div>
              <div style={{ marginBottom:'1rem' }}>
                {(order.items||[]).map((item,idx)=>(
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'0.3rem 0', borderBottom:'1px solid rgba(56,182,255,0.06)', fontSize:'0.78rem' }}>
                    <span style={{ color:'rgba(232,244,255,0.55)' }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#e8f4ff' }}>${(item.price*item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(232,244,255,0.38)' }}>Total</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>${(order.total||0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEMO = [
  { id:'ord_demo_001', status:'delivered', created_at:'2026-06-01T10:30:00Z', total:249.98, items:[{name:'Wireless Headphones Pro',quantity:1,price:149.99},{name:'Cotton T-Shirt',quantity:2,price:34.99}] },
  { id:'ord_demo_002', status:'shipped',   created_at:'2026-06-04T14:15:00Z', total:129.99, items:[{name:'Running Shoes Elite',quantity:1,price:129.99}] },
  { id:'ord_demo_003', status:'processing',created_at:'2026-06-06T09:00:00Z', total:54.00,  items:[{name:'Ceramic Pour-Over Set',quantity:1,price:54.00}] },
];
