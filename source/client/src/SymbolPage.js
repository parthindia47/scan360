// src/SymbolPage.js
import React from 'react';
import { useParams } from 'react-router-dom';

function SymbolPage() {
  const { symbol } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Symbol: {symbol}</h1>
      {/* You can later fetch and show more symbol-specific data here */}
    </div>
  );
}

export default SymbolPage;
