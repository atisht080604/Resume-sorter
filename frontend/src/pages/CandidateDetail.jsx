import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Calendar,
  GraduationCap,
  Briefcase,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import apiService from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import SkillBadge from '../components/SkillBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function CandidateDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'raw_text'

  useEffect(() => {
    setLoading(true);
    apiService.getCandidate(id, sessionId)
      .then((res) => {
        setCandidate(res.candidate);
      })
      .catch((err) => setError(err.message || 'Failed to load candidate details.'))
      .finally(() => setLoading(false));
  }, [id, sessionId]);

  if (loading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (error || !candidate) {
    return (
      <div className="card-surface p-12 text-center text-rose-600">
        <p className="font-semibold">{error || 'Candidate not found.'}</p>
        <Link to="/candidates" className="mt-4 inline-block text-xs font-semibold text-brand-600 underline">
          Back to Results
        </Link>
      </div>
    );
  }

  const screening = candidate.current_screening || {};
  const scores = screening.scores || {};
  const skills = screening.skills_breakdown || {};
  const explanation = screening.explanation || {};
  const contributions = explanation.contributions || {};

  const matchedReq = skills.matched_required || [];
  const matchedPref = skills.matched_preferred || [];
  const partialMatches = skills.partial_matches || [];
  const missingReq = skills.missing_required || [];
  const missingPref = skills.missing_preferred || [];

  const strengths = explanation.strengths || [];
  const gaps = explanation.gaps || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center space-x-3">
        <Link
          to={sessionId ? `/candidates?session_id=${sessionId}` : '/candidates'}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Candidate Profile • {candidate.candidate_uid}
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {candidate.name || 'Candidate Evaluation'}
          </h1>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="card-surface p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">{candidate.name}</h2>
              <ScoreBadge score={screening.composite_score} category={screening.match_category} size="md" />
              {screening.rank && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Rank #{screening.rank}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {candidate.email ? (
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{candidate.email}</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">Email not detected</span>
              )}

              {candidate.phone ? (
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{candidate.phone}</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">Phone not detected</span>
              )}

              <span className="flex items-center space-x-1 font-mono text-slate-500">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidate.filename}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Target Job: <b className="text-slate-800">{screening.job_title || 'Target Job'}</b>
            </p>
          </div>

          {/* Big Score Widget */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white min-w-[200px] text-center shadow-md">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Final Composite Score
            </span>
            <div className="text-4xl font-black tracking-tight text-white mt-1">
              {screening.composite_score || 0}%
            </div>
            <p className="text-[11px] text-brand-300 mt-1 font-medium">
              {screening.match_category || 'Low Match'}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 mt-6 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'analysis'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Explainable NLP Evaluation
          </button>
          <button
            onClick={() => setActiveTab('raw_text')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'raw_text'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Extracted Resume Text
          </button>
        </div>
      </div>

      {activeTab === 'analysis' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Strengths & Gaps + Skill Breakdowns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Strengths and Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="card-surface p-5 border-emerald-200 bg-emerald-50/20">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Candidate Strengths ({strengths.length})</span>
                </h3>
                {strengths.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No exceptional strengths identified above threshold.</p>
                ) : (
                  <ul className="space-y-2">
                    {strengths.map((s, idx) => (
                      <li key={idx} className="text-xs text-emerald-950 flex items-start space-x-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Skill Gaps */}
              <div className="card-surface p-5 border-rose-200 bg-rose-50/20">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Identified Gaps ({gaps.length})</span>
                </h3>
                {gaps.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No critical skill or experience gaps found.</p>
                ) : (
                  <ul className="space-y-2">
                    {gaps.map((g, idx) => (
                      <li key={idx} className="text-xs text-rose-950 flex items-start space-x-2">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Skills Match Details */}
            <div className="card-surface p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Technical Skills Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exact and semantic matches against job requirements
                </p>
              </div>

              {/* Matched Required Skills */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-800 block">
                  Matched Required Skills ({matchedReq.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchedReq.map((skill, i) => (
                    <SkillBadge key={i} skill={skill} type="matched" />
                  ))}
                  {matchedReq.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No required skills matched.</span>
                  )}
                </div>
              </div>

              {/* Inferred / Partial Semantic Matches */}
              {partialMatches.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-amber-800 block">
                    Inferred / Partial Semantic Equivalences ({partialMatches.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {partialMatches.map((p, i) => (
                      <div key={i} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <span className="font-semibold">{p.job_skill}</span>
                        <span className="text-slate-400 mx-1.5">≈</span>
                        <span className="font-semibold text-brand-700">{p.candidate_skill}</span>
                        <span className="text-[10px] text-amber-700 ml-1.5 bg-amber-100 px-1 py-0.5 rounded font-mono">
                          {Math.round(p.similarity * 100)}% sim
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Required Skills */}
              {missingReq.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-rose-800 block">
                    Missing Required Skills ({missingReq.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingReq.map((skill, i) => (
                      <SkillBadge key={i} skill={skill} type="missing" />
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">
                  Matched Preferred Skills ({matchedPref.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchedPref.map((skill, i) => (
                    <SkillBadge key={i} skill={skill} type="matched" />
                  ))}
                  {matchedPref.length === 0 && (
                    <span className="text-xs text-slate-400 italic">None matched</span>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Education & Experience Summary */}
            <div className="card-surface p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Extracted Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Estimated Experience</span>
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {candidate.extracted_experience_years > 0
                      ? `${candidate.extracted_experience_years} Years Detected`
                      : 'Not detected in resume'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Score: <b>{scores.experience}%</b> ({explanation.notes?.experience || ''})
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Academic Degrees</span>
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {candidate.extracted_education?.length > 0
                      ? candidate.extracted_education.join(', ')
                      : 'Not detected in resume'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Score: <b>{scores.education}%</b> ({explanation.notes?.education || ''})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Component Mathematical Breakdown */}
          <div className="space-y-6">
            <div className="card-surface p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Research Formula Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Normalized contributions summing to {screening.composite_score}%
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 1. Semantic Similarity */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Semantic Similarity (40%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.semantic_similarity}% <span className="text-slate-400">({contributions.semantic_similarity} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${scores.semantic_similarity || 0}%` }} />
                  </div>
                </div>

                {/* 2. Required Skills */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Required Skills (25%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.required_skills}% <span className="text-slate-400">({contributions.required_skills} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${scores.required_skills || 0}%` }} />
                  </div>
                </div>

                {/* 3. Preferred Skills */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Preferred Skills (15%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.preferred_skills}% <span className="text-slate-400">({contributions.preferred_skills} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${scores.preferred_skills || 0}%` }} />
                  </div>
                </div>

                {/* 4. Experience Match */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Experience Match (10%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.experience}% <span className="text-slate-400">({contributions.experience} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${scores.experience || 0}%` }} />
                  </div>
                </div>

                {/* 5. Education Match */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Education Match (5%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.education}% <span className="text-slate-400">({contributions.education} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${scores.education || 0}%` }} />
                  </div>
                </div>

                {/* 6. Certification Match */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Certification Match (5%)</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {scores.certification}% <span className="text-slate-400">({contributions.certification} pts)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${scores.certification || 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Traditional Baselines for research comparison */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Traditional NLP Baselines
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Jaccard Overlap</span>
                    <span className="font-bold text-slate-800 text-sm">{scores.keyword_jaccard || 0}%</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">TF-IDF Cosine</span>
                    <span className="font-bold text-slate-800 text-sm">{scores.tfidf_cosine || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Raw Text Tab */
        <div className="card-surface p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Extracted Document Text</h3>
          <p className="text-xs text-slate-500">
            Raw text normalized and extracted by PyMuPDF / python-docx
          </p>
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-[600px] leading-relaxed whitespace-pre-wrap">
            {candidate.raw_text || 'No text extracted.'}
          </pre>
        </div>
      )}
    </div>
  );
}
