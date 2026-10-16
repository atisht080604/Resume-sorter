import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import apiService from '../services/api';

export default function Navbar() {
  const [backendHealthy, setBackendHealthy] = useState(null);

  useEffect(() => {
    apiService.getHealth()
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  AI Resume Screening
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Model Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>all-MiniLM-L6-v2</span>
            </div>

            {/* Health Indicator */}
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              {backendHealthy === null ? (
                <span className="flex items-center text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse mr-1.5"></span>
                  Connecting...
                </span>
              ) : backendHealthy ? (
                <span className="flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  API Online
                </span>
              ) : (
                <span className="flex items-center text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 mr-1" />
                  API Offline
                </span>
              )}
            </div>

            <Link
              to="/screenings/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Screen Resumes</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
