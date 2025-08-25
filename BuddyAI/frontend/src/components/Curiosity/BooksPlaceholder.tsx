import React from 'react';

const BooksPlaceholder: React.FC = () => {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="px-8 py-6">
          <div className="border rounded-xl p-8 text-center text-gray-700">Books coming soon…</div>
        </div>
      </div>
    </div>
  );
};

export default BooksPlaceholder;


