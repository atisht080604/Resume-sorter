import React from 'react';

export default function LoadingSkeleton({ type = 'table', count = 5 }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200/70 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200/70 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200/70 rounded-xl"></div>
          <div className="h-64 md:col-span-2 bg-slate-200/70 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200/70 rounded w-1/4"></div>
      <div className="space-y-3 pt-2">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
