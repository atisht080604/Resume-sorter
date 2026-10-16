import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export default function SkillBadge({ skill, type = 'matched', similarity = null }) {
  if (type === 'matched') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
        <span>{skill}</span>
      </span>
    );
  }

  if (type === 'partial') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
        <span>{skill}</span>
        {similarity && (
          <span className="text-[10px] text-amber-600 bg-amber-100/70 px-1 rounded">
            ≈ {Math.round(similarity * 100)}%
          </span>
        )}
      </span>
    );
  }

  // Missing
  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
      <X className="w-3 h-3 text-rose-500 flex-shrink-0" />
      <span>{skill}</span>
    </span>
  );
}
