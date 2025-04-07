// Simplified page for Docker build

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found (Simplified)</h1>
      <p className="text-lg mb-6">The page you requested could not be found (Build Version).</p>
      <a 
        href="/"
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
      >
        Go Home
      </a>
    </div>
  );
} 