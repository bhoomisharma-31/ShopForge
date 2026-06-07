import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem);
  const { id, name, price, image, images, rating=0, reviews_count=0, category } = product;

  const img = image || images?.[0] ||
    `https://placehold.co/400x400/040d1a/38b6ff?text=${encodeURIComponent(name?.[0]||'P')}`;

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    addItem(product);
    toast.success(`${name} added to cart`, {
      style:{ background:'rgba(8,20,44,0.95)', color:'#e8f4ff', border:'1px solid rgba(56,182,255,0.3)', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.75rem' },
      iconTheme:{ primary:'#38b6ff', secondary:'#020810' },
    });
  };

  return (
    <Link to={`/products/${id}`} style={{ display:'block', textDecoration:'none', color:'inherit', background:'rgba(8,20,44,0.4)', border:'1px solid rgba(56,182,255,0.1)', backdropFilter:'blur(8px)', transition:'border-color 0.3s, transform 0.3s, box-shadow 0.3s' }}
      className="group"
      onMouseOver={e=>{ e.currentTarget.style.borderColor='rgba(56,182,255,0.35)'; e.currentTarget.style.boxShadow='0 0 30px rgba(56,182,255,0.08)'; }}
      onMouseOut={e=>{ e.currentTarget.style.borderColor='rgba(56,182,255,0.1)'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Image */}
      <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden', background:'#040d1a' }}>
        <img src={img} alt={name} loading="lazy"
          style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.88) contrast(1.08) saturate(0.9)', transition:'transform 0.5s ease, filter 0.3s' }}
          className="group-hover:scale-105"
          onMouseOver={e=>e.currentTarget.style.filter='brightness(1) contrast(1.1) saturate(1)'}
          onMouseOut={e=>e.currentTarget.style.filter='brightness(0.88) contrast(1.08) saturate(0.9)'}
        />
        {/* Scan-line overlay */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(56,182,255,0.018) 2px,rgba(56,182,255,0.018) 4px)' }}/>

        {category && (
          <span style={{ position:'absolute', top:10, left:10, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', background:'rgba(2,8,16,0.85)', color:'#38b6ff', border:'1px solid rgba(56,182,255,0.35)', padding:'0.2rem 0.55rem', borderRadius:2 }}>
            {category}
          </span>
        )}

        {/* Add overlay */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:12, opacity:0, transition:'opacity 0.3s', background:'linear-gradient(to top,rgba(2,8,16,0.8) 0%,transparent 50%)' }}
          className="group-hover:opacity-100">
          <button onClick={handleAdd} className="btn-primary" style={{ fontSize:'0.6rem', padding:'0.4rem 1rem', letterSpacing:'0.12em' }}>
            + Add to Cart
          </button>
        </div>

        {/* Corner brackets */}
        <div style={{ position:'absolute', top:8, right:8, width:14, height:14, borderTop:'1.5px solid rgba(56,182,255,0.4)', borderRight:'1.5px solid rgba(56,182,255,0.4)', opacity:0, transition:'opacity 0.3s' }} className="group-hover:opacity-100"/>
        <div style={{ position:'absolute', bottom:8, left:8, width:14, height:14, borderBottom:'1.5px solid rgba(56,182,255,0.4)', borderLeft:'1.5px solid rgba(56,182,255,0.4)', opacity:0, transition:'opacity 0.3s' }} className="group-hover:opacity-100"/>
      </div>

      {/* Info */}
      <div style={{ padding:'1rem 1.1rem 1.2rem' }}>
        <h3 style={{ fontSize:'0.83rem', fontWeight:600, color:'#e8f4ff', lineHeight:1.35, marginBottom:'0.5rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{name}</h3>

        <div style={{ display:'flex', gap:2, marginBottom:'0.75rem' }}>
          {[1,2,3,4,5].map(i=>(
            <span key={i} style={{ color:i<=Math.round(rating)?'#38b6ff':'rgba(56,182,255,0.15)', fontSize:'0.62rem' }}>★</span>
          ))}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.58rem', color:'rgba(232,244,255,0.3)', marginLeft:4 }}>({reviews_count})</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.25rem', background:'linear-gradient(135deg,#38b6ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            ${typeof price==='number'?price.toFixed(2):price}
          </span>
          <button onClick={handleAdd}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0.35rem 0.75rem', background:'rgba(56,182,255,0.1)', border:'1px solid rgba(56,182,255,0.3)', color:'#38b6ff', borderRadius:2, cursor:'pointer', transition:'all 0.2s' }}
            onMouseOver={e=>{ e.currentTarget.style.background='rgba(56,182,255,0.2)'; e.currentTarget.style.borderColor='rgba(56,182,255,0.6)'; }}
            onMouseOut={e=>{ e.currentTarget.style.background='rgba(56,182,255,0.1)'; e.currentTarget.style.borderColor='rgba(56,182,255,0.3)'; }}>
            Add
          </button>
        </div>
      </div>
    </Link>
  );
}
