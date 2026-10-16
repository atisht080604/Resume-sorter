import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import apiService from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function ResearchEvaluation() {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);
  const [k, setK] = useState(3);

  const runEvaluation = async (targetK = k) => {
    try {
      setEvaluating(true);
      setError(null);
      const res = await apiService.getBenchmark(targetK);
      setBenchmark(res.benchmark || null);
    } catch (err) {
      setError(err.message || 'Benchmark evaluation failed.');
    } finally {
      setEvaluating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation(3);
  }, []);

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  const summary = benchmark?.summary || {};
  const metadata = benchmark?.metadata || {};
  const queryResults = benchmark?.query_results || [];

  const methodsData = [
    {
      metric: 'Precision@K',
      'Keyword Overlap': summary.keyword_overlap?.mean_precision_at_k || 0,
      'TF-IDF Cosine': summary.tfidf_cosine?.mean_precision_at_k || 0,
      'Sentence-BERT (Ours)': summary.sentence_bert?.mean_precision_at_k || 0,
    },
    {
      metric: 'Recall@K',
      'Keyword Overlap': summary.keyword_overlap?.mean_recall_at_k || 0,
      'TF-IDF Cosine': summary.tfidf_cosine?.mean_recall_at_k || 0,
      'Sentence-BERT (Ours)': summary.sentence_bert?.mean_recall_at_k || 0,
    },
    {
      metric: 'F1-Score@K',
      'Keyword Overlap': summary.keyword_overlap?.mean_f1_at_k || 0,
      'TF-IDF Cosine': summary.tfidf_cosine?.mean_f1_at_k || 0,
      'Sentence-BERT (Ours)': summary.sentence_bert?.mean_f1_at_k || 0,
    },
    {
      metric: 'MRR',
      'Keyword Overlap': summary.keyword_overlap?.mean_mrr || 0,
      'TF-IDF Cosine': summary.tfidf_cosine?.mean_mrr || 0,
      'Sentence-BERT (Ours)': summary.sentence_bert?.mean_mrr || 0,
    },
    {
      metric: 'NDCG@K',
      'Keyword Overlap': summary.keyword_overlap?.mean_ndcg_at_k || 0,
      'TF-IDF Cosine': summary.tfidf_cosine?.mean_ndcg_at_k || 0,
      'Sentence-BERT (Ours)': summary.sentence_bert?.mean_ndcg_at_k || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 6: Scientific Benchmark
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Rank K = {k}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Research Evaluation & NLP Model Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical comparative analysis of Keyword Overlap, TF-IDF Cosine Similarity, and Sentence-BERT
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span>Cutoff K:</span>
            <select
              value={k}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setK(val);
                runEvaluation(val);
              }}
              className="p-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="2">K = 2</option>
              <option value="3">K = 3</option>
              <option value="5">K = 5</option>
            </select>
          </div>

          <button
            onClick={() => runEvaluation(k)}
            disabled={evaluating}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{evaluating ? 'Evaluating...' : 'Re-Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset & Protocol Context Card */}
      <div className="card-surface p-5 bg-slate-900 text-white rounded-2xl space-y-2">
        <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
          <FlaskConical className="w-4 h-4" />
          <span>Experimental Dataset & Evaluation Protocol</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <b>Dataset:</b> {metadata.name} ({metadata.version}). Standardized technical job specifications with expert ground-truth graded relevance labels (0 = Irrelevant, 1 = Partially Relevant, 2 = Highly Qualified). Evaluates actual information retrieval ranking effectiveness without random seeds or hardcoded outputs.
        </p>
      </div>

      {/* Comparative Visual Chart */}
      <div className="card-surface p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2">
          Comparative Ranking Metrics (Precision@K, Recall@K, F1@K, MRR, NDCG@K)
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={methodsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis domain={[0, 1.0]} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Keyword Overlap" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TF-IDF Cosine" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sentence-BERT (Ours)" fill="#0284C7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aggregate Metric Table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
          Aggregated Experimental Results
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4">Baseline: Keyword Overlap</th>
                <th className="py-3 px-4">Baseline: TF-IDF Cosine</th>
                <th className="py-3 px-4 text-brand-700 font-bold">Proposed: Sentence-BERT</th>
                <th className="py-3 px-4 text-right">Relative Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Mean Precision@{k}</td>
                <td className="py-3 px-4">{summary.keyword_overlap?.mean_precision_at_k}</td>
                <td className="py-3 px-4">{summary.tfidf_cosine?.mean_precision_at_k}</td>
                <td className="py-3 px-4 font-bold text-brand-700">{summary.sentence_bert?.mean_precision_at_k}</td>
                <td className="py-3 px-4 text-right font-sans font-semibold text-emerald-600">
                  +{Math.round(((summary.sentence_bert?.mean_precision_at_k - summary.keyword_overlap?.mean_precision_at_k) / (summary.keyword_overlap?.mean_precision_at_k || 1)) * 100)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Mean Recall@{k}</td>
                <td className="py-3 px-4">{summary.keyword_overlap?.mean_recall_at_k}</td>
                <td className="py-3 px-4">{summary.tfidf_cosine?.mean_recall_at_k}</td>
                <td className="py-3 px-4 font-bold text-brand-700">{summary.sentence_bert?.mean_recall_at_k}</td>
                <td className="py-3 px-4 text-right font-sans font-semibold text-emerald-600">
                  +{Math.round(((summary.sentence_bert?.mean_recall_at_k - summary.keyword_overlap?.mean_recall_at_k) / (summary.keyword_overlap?.mean_recall_at_k || 1)) * 100)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Mean F1-Score@{k}</td>
                <td className="py-3 px-4">{summary.keyword_overlap?.mean_f1_at_k}</td>
                <td className="py-3 px-4">{summary.tfidf_cosine?.mean_f1_at_k}</td>
                <td className="py-3 px-4 font-bold text-brand-700">{summary.sentence_bert?.mean_f1_at_k}</td>
                <td className="py-3 px-4 text-right font-sans font-semibold text-emerald-600">
                  +{Math.round(((summary.sentence_bert?.mean_f1_at_k - summary.keyword_overlap?.mean_f1_at_k) / (summary.keyword_overlap?.mean_f1_at_k || 1)) * 100)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Mean Reciprocal Rank (MRR)</td>
                <td className="py-3 px-4">{summary.keyword_overlap?.mean_mrr}</td>
                <td className="py-3 px-4">{summary.tfidf_cosine?.mean_mrr}</td>
                <td className="py-3 px-4 font-bold text-brand-700">{summary.sentence_bert?.mean_mrr}</td>
                <td className="py-3 px-4 text-right font-sans font-semibold text-emerald-600">Top-Rank Optimized</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Mean NDCG@{k}</td>
                <td className="py-3 px-4">{summary.keyword_overlap?.mean_ndcg_at_k}</td>
                <td className="py-3 px-4">{summary.tfidf_cosine?.mean_ndcg_at_k}</td>
                <td className="py-3 px-4 font-bold text-brand-700">{summary.sentence_bert?.mean_ndcg_at_k}</td>
                <td className="py-3 px-4 text-right font-sans font-semibold text-emerald-600">
                  +{Math.round(((summary.sentence_bert?.mean_ndcg_at_k - summary.keyword_overlap?.mean_ndcg_at_k) / (summary.keyword_overlap?.mean_ndcg_at_k || 1)) * 100)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Level Detailed Trace */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Query-by-Query Ranking Audit
        </h2>
        {queryResults.map((qr) => (
          <div key={qr.query_id} className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">
                {qr.query_id}: {qr.title}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                S-BERT NDCG@{k}: <b className="text-brand-600">{qr.methods?.sentence_bert?.ndcg_at_k}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {['keyword_overlap', 'tfidf_cosine', 'sentence_bert'].map((m) => {
                const methodInfo = qr.methods?.[m] || {};
                const mLabel = m === 'sentence_bert' ? 'Sentence-BERT (Ours)' : m === 'tfidf_cosine' ? 'TF-IDF Cosine' : 'Keyword Overlap';
                const isOurs = m === 'sentence_bert';

                return (
                  <div key={m} className={`p-3 rounded-xl border ${isOurs ? 'bg-brand-50/40 border-brand-200' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[11px] font-bold block ${isOurs ? 'text-brand-800' : 'text-slate-700'}`}>
                      {mLabel}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      P@{k}: {methodInfo.precision_at_k} | NDCG: {methodInfo.ndcg_at_k}
                    </p>
                    <ol className="mt-2 space-y-1">
                      {(methodInfo.ranking || []).map((cand, rIdx) => (
                        <li key={rIdx} className="flex items-center justify-between text-[11px]">
                          <span className="truncate max-w-[140px] text-slate-700">
                            {rIdx + 1}. {cand.name}
                          </span>
                          <span className="font-mono text-slate-500">
                            {cand.score}% {cand.relevance === 2 ? '★★' : cand.relevance === 1 ? '★' : ''}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
