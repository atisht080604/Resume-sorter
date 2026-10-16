import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  Users,
  GitCompare,
  History,
  FlaskConical,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Screening Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Screen Resumes', path: '/screenings/new', icon: UploadCloud },
    { label: 'Candidate Results', path: '/candidates', icon: Users },
    { label: 'Compare Candidates', path: '/compare', icon: GitCompare },
    { label: 'Screening History', path: '/history', icon: History },
    { label: 'Research Benchmark', path: '/evaluation', icon: FlaskConical },
    { label: 'Settings & Weights', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Recruitment NLP Suite
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-800">MCA Final Review</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Sentence-BERT semantic matching + Explainable 6-component research formula.
          </p>
        </div>
      </div>
    </aside>
  );
}
