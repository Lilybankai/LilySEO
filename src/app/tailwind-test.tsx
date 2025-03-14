'use client';

export default function TailwindTest() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-500">Tailwind Test</h1>
      <p className="mt-4 text-gray-600">
        This is a test page to see if Tailwind CSS is working correctly.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-red-500 p-4 text-white">Red</div>
        <div className="rounded-lg bg-green-500 p-4 text-white">Green</div>
        <div className="rounded-lg bg-blue-500 p-4 text-white">Blue</div>
      </div>
      <button className="mt-8 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
        Click me
      </button>
    </div>
  );
} 