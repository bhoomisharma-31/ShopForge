export default function LoadingSpinner({ size='md', className='' }) {
  const s = size==='lg'?'2.8rem':size==='sm'?'1rem':'1.6rem';
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div style={{ position:'relative', width:s, height:s }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(56,182,255,0.1)', borderTop:'2px solid #38b6ff', animation:'spin 0.8s linear infinite' }}/>
        <div style={{ position:'absolute', inset:4, borderRadius:'50%', border:'1.5px solid rgba(56,182,255,0.06)', borderBottom:'1.5px solid rgba(0,212,255,0.5)', animation:'spin 1.2s linear infinite reverse' }}/>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
