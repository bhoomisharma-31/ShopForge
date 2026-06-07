import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineStar, HiStar, HiMinus, HiPlus, HiArrowLeft } from 'react-icons/hi2';
import api from '../lib/api';
import useCartStore from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then((data) => setProduct(data))
      .catch(() => {
        // Demo fallback
        setProduct({
          id,
          name: 'Premium Product',
          price: 99.99,
          description:
            'This is a premium product crafted with the finest materials. Experience unmatched quality and design that speaks for itself. Perfect for everyday use and built to last.',
          category: 'General',
          rating: 4.5,
          reviews_count: 42,
          stock: 15,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!product) return <div className="py-32 text-center text-gray-500">Product not found</div>;

  const imgSrc = product.image || product.images?.[0] || `https://placehold.co/600x600/e0e7ff/4f46e5?text=${encodeURIComponent(product.name?.[0] || 'P')}`;

  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(product.rating || 0) ? (
      <HiStar key={i} className="h-5 w-5 text-amber-400" />
    ) : (
      <HiOutlineStar key={i} className="h-5 w-5 text-gray-300" />
    ),
  );

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`Added ${qty}× ${product.name} to cart`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link to="/products" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-600">
        <HiArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl bg-gray-100">
          <img src={imgSrc} alt={product.name} className="h-full w-full object-cover" />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          {product.category && (
            <span className="badge w-fit bg-brand-100 text-brand-700">{product.category}</span>
          )}

          <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">{product.name}</h1>

          <div className="flex items-center gap-2">
            <div className="flex">{stars}</div>
            <span className="text-sm text-gray-500">({product.reviews_count || 0} reviews)</span>
          </div>

          <p className="text-4xl font-extrabold text-gray-900">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </p>

          <p className="leading-relaxed text-gray-600">{product.description}</p>

          {product.stock !== undefined && (
            <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `✓ ${product.stock} in stock` : '✗ Out of stock'}
            </p>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                <HiMinus className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                <HiPlus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1">
              Add to Cart — ${(product.price * qty).toFixed(2)}
            </button>
          </div>

          {/* Meta */}
          <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            <div className="flex justify-between"><span>Free shipping</span><span className="font-medium text-green-600">Orders over $50</span></div>
            <div className="flex justify-between"><span>Delivery</span><span className="font-medium">2–5 business days</span></div>
            <div className="flex justify-between"><span>Returns</span><span className="font-medium">30-day easy returns</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
