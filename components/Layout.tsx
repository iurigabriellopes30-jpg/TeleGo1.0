
import React from 'react';
import { UserRole, AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, role, activeTab, onNavigate, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F3F4F6] relative">
      <header className="bg-white sticky top-0 z-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
           <h1 className="text-xl font-black tracking-tight text-slate-900">TeleGo<span className="text-blue-600">.</span></h1>
        </div>
        
        {role !== UserRole.UNSELECTED && (
          <button 
            onClick={onLogout}
            className="text-xs font-bold text-slate-500 hover:text-red-600"
          >
            SAIR
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {children}
      </main>

      {role !== UserRole.UNSELECTED && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
          <button 
            onClick={() => onNavigate(AppTab.HOME)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.HOME ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold uppercase">Início</span>
          </button>
          
          <button 
            onClick={() => onNavigate(AppTab.HISTORY)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.HISTORY ? 'text-blue-600' : 'text-slate-400'}`}
          >
            {/* Ícone diferente para Admin */}
            <span className="text-xl">{role === UserRole.ADMIN ? '📡' : '📋'}</span>
            <span className="text-[10px] font-bold uppercase">{role === UserRole.ADMIN ? 'Monitor' : 'Histórico'}</span>
          </button>

          <button 
            onClick={() => onNavigate(AppTab.PROFILE)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.PROFILE ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold uppercase">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
};
