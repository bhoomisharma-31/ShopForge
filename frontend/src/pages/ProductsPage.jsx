import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineFunnel, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATS  = ['All','Electronics','Clothing','Accessories','Home','Kitchen','Sports'];
const SORTS = [{ label:'Newest',value:'newest' },{ label:'Price ↑',value:'asc' },{ label:'Price ↓',value:'desc' },{ label:'Top Rated',value:'rating' }];

export default function ProductsPage() {
  const [sp]                    = useSearchParams();
  const [products,setProducts]  = useState([]);
  const [loading,setLoading]    = useState(true);
  const [search,setSearch]      = useState(sp.get('search')||'');
  const [cat,setCat]            = useState(sp.get('category')||'All');
  const [sort,setSort]          = useState('newest');
  const [page,setPage]          = useState(1);
  const PER = 12;

  useEffect(()=>{ setLoading(true); api.get('/products').then(d=>setProducts(d.products||d||[])).catch(()=>setProducts(DEMO)).finally(()=>setLoading(false)); },[]);

  const filtered = useMemo(()=>{
    let r=[...products];
    if (search.trim()){ const q=search.toLowerCase(); r=r.filter(p=>p.name?.toLowerCase().includes(q)||p.category?.toLowerCase().includes(q)); }
    if (cat!=='All') r=r.filter(p=>p.category===cat);
    if (sort==='asc')    r.sort((a,b)=>a.price-b.price);
    if (sort==='desc')   r.sort((a,b)=>b.price-a.price);
    if (sort==='rating') r.sort((a,b)=>(b.rating||0)-(a.rating||0));
    return r;
  },[products,search,cat,sort]);

  const pages    = Math.ceil(filtered.length/PER);
  const paginated = filtered.slice((page-1)*PER, page*PER);

  const selectStyle = { background:'rgba(8,20,44,0.7)', border:'1px solid rgba(56,182,255,0.15)', color:'#e8f4ff', borderRadius:2, padding:'0.5rem 0.8rem', fontFamily:"'Space Grotesk',sans-serif", fontSize:'0.78rem', cursor:'pointer', outline:'none' };

  return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'2.5rem 1.5rem' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2.5rem', color:'#e8f4ff' }}>PRODUCTS</h1>
        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.12em', color:'rgba(56,182,255,0.45)' }}>{filtered.length} results found</p>
      </div>

      {/* Filters */}
      <div style={{ background:'rgba(8,20,44,0.5)', border:'1px solid rgba(56,182,255,0.1)', padding:'1rem', marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', gap:'0.75rem', alignItems:'center', backdropFilter:'blur(8px)' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <HiOutlineMagnifyingGlass style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'rgba(56,182,255,0.4)', pointerEvents:'none' }}/>
          <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search products…" className="input-field" style={{ paddingLeft:36 }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <HiOutlineFunnel style={{ width:14, height:14, color:'rgba(56,182,255,0.4)' }}/>
          <select value={cat} onChange={e=>{setCat(e.target.value);setPage(1);}} style={selectStyle}>
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={selectStyle}>
          {SORTS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner size="lg" className="py-32"/> :
       !paginated.length ? (
        <div style={{ textAlign:'center', padding:'8rem 1rem' }}>
          <div style={{ fontSize:'3rem', opacity:0.2, marginBottom:'1rem' }}>🔍</div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.6rem', color:'#e8f4ff' }}>NO RESULTS</h3>
          <p style={{ fontSize:'0.75rem', color:'rgba(232,244,255,0.35)', marginTop:'0.4rem' }}>Try different search terms or filters</p>
        </div>
       ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:1, background:'rgba(56,182,255,0.05)' }}>
            {paginated.map(p=><div key={p.id} style={{ background:'#020810' }}><ProductCard product={p}/></div>)}
          </div>
          {pages>1&&(
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'2rem' }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary" style={{ fontSize:'0.65rem', padding:'0.45rem 1rem' }}>Prev</button>
              {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{ width:34, height:34, borderRadius:2, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', background:p===page?'rgba(56,182,255,0.2)':'transparent', color:p===page?'#38b6ff':'rgba(232,244,255,0.45)', border:p===page?'1px solid rgba(56,182,255,0.5)':'1px solid rgba(56,182,255,0.12)', cursor:'pointer', boxShadow:p===page?'0 0 12px rgba(56,182,255,0.2)':'none' }}>{p}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="btn-secondary" style={{ fontSize:'0.65rem', padding:'0.45rem 1rem' }}>Next</button>
            </div>
          )}
        </>
       )
      }
    </div>
  );
}

const DEMO = [
  {id:'1',name:'Wireless Headphones Pro',price:149.99,category:'Electronics',rating:4.5,reviews_count:128,image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'},
  {id:'2',name:'Leather Crossbody Bag',price:89.00,category:'Accessories',rating:4.8,reviews_count:64,image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80'},
  {id:'3',name:'Smart Fitness Watch',price:199.99,category:'Electronics',rating:4.3,reviews_count:256,image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'},
  {id:'4',name:'Organic Cotton T-Shirt',price:34.99,category:'Clothing',rating:4.6,reviews_count:92,image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'},
  {id:'5',name:'Ceramic Pour-Over Set',price:54.00,category:'Kitchen',rating:4.9,reviews_count:48,image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'},
  {id:'6',name:'Minimalist Desk Lamp',price:79.99,category:'Home',rating:4.4,reviews_count:156,image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80'},
  {id:'7',name:'Running Shoes Elite',price:129.99,category:'Sports',rating:4.7,reviews_count:312,image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'},
  {id:'8',name:'Bamboo Sunglasses',price:45.00,category:'Accessories',rating:4.2,reviews_count:73,image:'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=400&q=80'},
  {id:'9',name:'Portable Speaker',price:69.99,category:'Electronics',rating:4.6,reviews_count:189,image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80'},
  {id:'10',name:'Yoga Mat Premium',price:49.99,category:'Sports',rating:4.8,reviews_count:95,image:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80'},
  {id:'11',name:'Insulated Water Bottle',price:29.99,category:'Kitchen',rating:4.5,reviews_count:201,image:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'},
  {id:'12',name:'Classic Denim Jacket',price:119.99,category:'Clothing',rating:4.4,reviews_count:67,image:'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=400&q=80'},
];
