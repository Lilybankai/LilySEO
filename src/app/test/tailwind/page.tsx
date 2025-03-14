'use client';

import { useState } from 'react';

export default function TailwindTestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-500">Tailwind CSS Test Page</h1>
      <p className="mt-4 text-gray-600">
        This page tests if Tailwind CSS classes are working correctly.
      </p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500 text-white p-4 rounded-lg">Red Box</div>
        <div className="bg-green-500 text-white p-4 rounded-lg">Green Box</div>
        <div className="bg-blue-500 text-white p-4 rounded-lg">Blue Box</div>
      </div>
      
      <div className="mt-8">
        <p className="text-lg font-medium">Counter: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Increment
        </button>
      </div>
      
      <div className="mt-8 border border-gray-200 p-4 rounded-lg">
        <h2 className="text-xl font-semibold">Tailwind Utility Classes</h2>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Text sizes (text-xs, text-sm, text-base, text-lg, text-xl, etc.)
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Colors (text-blue-500, bg-red-500, etc.)
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Spacing (p-4, m-2, gap-4, etc.)
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Flexbox (flex, items-center, justify-between, etc.)
          </li>
          <li className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Grid (grid, grid-cols-3, etc.)
          </li>
        </ul>
      </div>
    </div>
  );
} 