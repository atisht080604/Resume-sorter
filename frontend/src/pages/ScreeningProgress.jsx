import React from 'react';
import {
  FileText,
  Search,
  Sparkles,
  Calculator,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function ScreeningProgress({ stage = 1, totalFiles = 1, uploadPercent = 0, jobTitle = '' }) {
  const stages = [
    {
      id: 1,
      title: 'Document Text Extraction',
      description: 'Extracting text from PDF and DOCX documents and normalizing formatting',
      icon: FileText
    },
    {
      id: 2,
      title: 'NLP Technical Skill Extraction',
      description: 'Matching phrase boundaries and canonical skills against skill ontology',
      icon: Search
    },
    {
      id: 3,
      title: 'Sentence-BERT Semantic Matching',
      description: 'Computing 384-dimensional dense embeddings with all-MiniLM-L6-v2',
      icon: Sparkles
    },
    {
      id: 4,
      title: 'Multi-Criteria Explainable Scoring',
      description: 'Calculating composite score using 6-component research formula',
      icon: Calculator
    },
    {
      id: 5,
      title: 'Finalizing Candidate Rankings',
      description: 'Sorting candidates by match suitability and persisting results',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto shadow-sm pulse-glow">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Screening {totalFiles} Candidate Resumes
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Evaluating candidates against target requirements for: <b className="text-slate-800">{jobTitle}</b>
        </p>
      </div>

      {/* Progress Stages Card */}
      <div className="card-surface p-6 space-y-6">
        <div className="space-y-4">
          {stages.map((st) => {
            const Icon = st.icon;
            const isDone = stage > st.id;
            const isCurrent = stage === st.id;
            const isPending = stage < st.id;

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3.5 ${
                  isCurrent
                    ? 'bg-brand-50/60 border-brand-300 shadow-xs'
                    : isDone
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-700'
                    : 'bg-slate-50/40 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : st.id}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-brand-900' : isDone ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {st.title}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-brand-600 bg-brand-100/70 px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {st.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Running real local model inference with Sentence-BERT & PyTorch CPU
        </div>
      </div>
    </div>
  );
}
