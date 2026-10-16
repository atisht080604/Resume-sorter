import React from 'react';
import { Award, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function ScoreBadge({ score, category, showScore = true, size = 'md' }) {
  const numScore = parseFloat(score || 0);

  let cat = category;
  if (!cat) {
    if (numScore >= 75) cat = 'High Match';
    else if (numScore >= 50) cat = 'Medium Match';
    else cat = 'Low Match';
  }

  const isHigh = cat === 'High Match';
  const isMed = cat === 'Medium Match';

  const badgeStyles = isHigh
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isMed
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  const iconStyles = isHigh
    ? 'text-emerald-500'
    : isMed
    ? 'text-amber-500'
    : 'text-rose-500';

  const Icon = isHigh ? CheckCircle : isMed ? AlertTriangle : XCircle;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : size === 'lg'
    ? 'px-3 py-1.5 text-sm'
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center space-x-1.5 font-semibold rounded-md border ${badgeStyles} ${sizeClasses}`}>
      <Icon className={`w-3.5 h-3.5 ${iconStyles}`} />
      <span>{cat}</span>
      {showScore && <span className="font-bold opacity-90">({numScore.toFixed(1)}%)</span>}
    </span>
  );
}
