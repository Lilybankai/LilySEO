import TailwindTest from '../tailwind-test';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a test page to verify routing is working correctly.</p>
      <div className="mt-4">
        <a href="/dashboard" className="text-blue-500 underline">
          Try accessing dashboard
        </a>
      </div>
    </div>
  );
} 