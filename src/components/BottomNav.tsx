import React from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  Trophy,
  Wallet,
  FileText,
  Mail,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'members'
  | 'hruaitute'
  | 'intihsiakna'
  | 'finance'
  | 'records'
  | 'thurawn'
  | 'settings'
  | 'role_management';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'intihsiakna', label: 'Intihsiak', icon: Trophy },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'thurawn', label: 'Thurawn', icon: Mail },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe shadow-lg">
      <div className="mx-auto flex max-w-xl items-center justify-between px-2 py-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 flex-1 ${
                isActive
                  ? 'text-blue-900 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                    : 'bg-transparent text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="mt-0.5 text-[9px] font-semibold tracking-tight truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
