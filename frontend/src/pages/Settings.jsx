import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  Cpu,
  Layers,
  Search
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [taxonomy, setTaxonomy] = useState({});
  const [weights, setWeights] = useState({
    semantic_similarity: 0.40,
    required_skills: 0.25,
    preferred_skills: 0.15,
    experience: 0.10,
    education: 0.05,
    certification: 0.05,
  });
  const [threshold, setThreshold] = useState(0.70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [taxonomySearch, setTaxonomySearch] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settRes, taxRes] = await Promise.all([
        apiService.getSettings(),
        apiService.getTaxonomy()
      ]);
      setSettings(settRes);
      if (settRes.scoring_weights) setWeights(settRes.scoring_weights);
      if (settRes.semantic_threshold) setThreshold(settRes.semantic_threshold);
      setTaxonomy(taxRes.taxonomy || {});
    } catch (err) {
      setError(err.message || 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + parseFloat(b || 0), 0);
  const isValidWeightSum = Math.abs(totalWeight - 1.0) < 0.01;

  const handleWeightChange = (key, val) => {
    const num = parseFloat(val) || 0;
    setWeights((prev) => ({ ...prev, [key]: num }));
  };

  const handleResetDefaults = () => {
    setWeights({
      semantic_similarity: 0.40,
      required_skills: 0.25,
      preferred_skills: 0.15,
      experience: 0.10,
      education: 0.05,
      certification: 0.05,
    });
    setThreshold(0.70);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValidWeightSum) {
      setError(`Weights must sum to 1.00 (100%). Current sum: ${(totalWeight * 100).toFixed(1)}%`);
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await apiService.updateSettings({
        scoring_weights: weights,
        semantic_threshold: threshold
      });
      setMessage('Scoring formula and semantic parameters saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Weights</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure research scoring formula weights, semantic thresholds, and inspect skill ontology
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scoring Formula Weights Configuration */}
      <form onSubmit={handleSave} className="card-surface p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-brand-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Composite Scoring Weights
              </h2>
              <p className="text-xs text-slate-500">
                Adjust the 6-component research formula weights (must sum to 100%)
              </p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isValidWeightSum
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            Sum: {(totalWeight * 100).toFixed(0)}% / 100%
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Semantic Similarity */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Semantic Similarity</label>
              <span className="font-mono text-xs font-bold text-brand-600">
                {Math.round(weights.semantic_similarity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.semantic_similarity}
              onChange={(e) => handleWeightChange('semantic_similarity', e.target.value)}
              className="w-full accent-brand-600"
            />
            <p className="text-[11px] text-slate-500">Sentence-BERT dense contextual similarity</p>
          </div>

          {/* Required Skills */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Required Skills</label>
              <span className="font-mono text-xs font-bold text-emerald-600">
                {Math.round(weights.required_skills * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.required_skills}
              onChange={(e) => handleWeightChange('required_skills', e.target.value)}
              className="w-full accent-emerald-600"
            />
            <p className="text-[11px] text-slate-500">Coverage of must-have technical skills</p>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Preferred Skills</label>
              <span className="font-mono text-xs font-bold text-indigo-600">
                {Math.round(weights.preferred_skills * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.preferred_skills}
              onChange={(e) => handleWeightChange('preferred_skills', e.target.value)}
              className="w-full accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500">Nice-to-have skill bonuses</p>
          </div>

          {/* Experience */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Experience Match</label>
              <span className="font-mono text-xs font-bold text-amber-600">
                {Math.round(weights.experience * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.experience}
              onChange={(e) => handleWeightChange('experience', e.target.value)}
              className="w-full accent-amber-600"
            />
            <p className="text-[11px] text-slate-500">Years of relevant experience comparison</p>
          </div>

          {/* Education */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Education Match</label>
              <span className="font-mono text-xs font-bold text-purple-600">
                {Math.round(weights.education * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.education}
              onChange={(e) => handleWeightChange('education', e.target.value)}
              className="w-full accent-purple-600"
            />
            <p className="text-[11px] text-slate-500">Degree and qualification alignment</p>
          </div>

          {/* Certification */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Certification Match</label>
              <span className="font-mono text-xs font-bold text-teal-600">
                {Math.round(weights.certification * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.certification}
              onChange={(e) => handleWeightChange('certification', e.target.value)}
              className="w-full accent-teal-600"
            />
            <p className="text-[11px] text-slate-500">Industry certs (e.g. AWS, CKA)</p>
          </div>
        </div>

        {/* Semantic Skill Similarity Threshold */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Semantic Skill Equivalence Threshold
              </span>
              <p className="text-[11px] text-slate-500">
                Threshold for considering two related skills partially equivalent (e.g. Flask ≈ FastAPI)
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-brand-600 px-2.5 py-1 bg-white rounded border border-slate-200">
              {threshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        {/* Save & Reset Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={saving || !isValidWeightSum}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Technical Skill Ontology Viewer */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-brand-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Configurable Technical Skills Dictionary
              </h2>
              <p className="text-xs text-slate-500">
                Ontology used for phrase matching, boundary validation, and alias mapping
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search taxonomy..."
              value={taxonomySearch}
              onChange={(e) => setTaxonomySearch(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none bg-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {Object.entries(taxonomy).map(([category, skillsMap]) => {
            const filteredSkills = Object.entries(skillsMap).filter(([canonical, aliases]) => {
              if (!taxonomySearch) return true;
              const q = taxonomySearch.toLowerCase();
              return (
                canonical.toLowerCase().includes(q) ||
                aliases.some((a) => a.toLowerCase().includes(q))
              );
            });

            if (filteredSkills.length === 0) return null;

            return (
              <div key={category} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {category} ({filteredSkills.length})
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {filteredSkills.map(([canonical, aliases]) => (
                    <div
                      key={canonical}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                    >
                      <span className="font-bold text-slate-900">{canonical}</span>
                      {aliases.length > 0 && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Aliases: {aliases.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
