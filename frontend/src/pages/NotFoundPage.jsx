import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
      <p className="max-w-md text-gray-500">
        Sorry, we couldn't find the page you're looking for. Perhaps the link is broken or the page moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        <HiArrowLeft className="h-4 w-4" /> Go back home
      </Link>
    </div>
  );
}
