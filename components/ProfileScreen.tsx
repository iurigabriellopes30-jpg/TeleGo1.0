
import React, { useState } from 'react';
import { User, UserRole, AuthSession } from '../types';
import { authService } from '../services/authService';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  stats: { total: number; delivered: number };
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onUpdateUser, stats }) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateUser(user.id, formData);
      onUpdateUser(updatedUser);
      setIsEditingInfo(false);
      alert('Perfil atualizado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert('Senhas não conferem');

    setIsLoading(true);
    try {
      await authService.changePassword(user.id, passData.current, passData.new);
      setIsChangingPass(false);
      alert('Senha alterada com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 space-y-8 animate-fadeIn">
      {/* Header Perfil */}
      <header className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="relative group">
           <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
           <div className="relative w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center text-3xl border border-slate-100">
             {user.role === UserRole.RESTAURANT ? '🍕' : user.role === UserRole.COURIER ? '🏍️' : '🔑'}
           </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${user.role === UserRole.ADMIN ? 'bg-slate-800 text-white' : user.role === UserRole.RESTAURANT ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {user.role}
             </span>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <h3 className="text-xl font-black text-slate-900">{stats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Entregue</p>
          <h3 className="text-xl font-black text-emerald-600">{stats.delivered}</h3>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Minha Conta</p>
          <div className="space-y-1">
            <button
              onClick={() => { setFormData({name: user.name, email: user.email}); setIsEditingInfo(true); }}
              className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                 </div>
                 <span className="text-sm font-bold text-slate-700">Editar Dados Pessoais</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <button
              onClick={() => { setPassData({current:'', new:'', confirm:''}); setIsChangingPass(true); }}
              className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                 </div>
                 <span className="text-sm font-bold text-slate-700">Alterar Senha</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full p-5 bg-red-50 text-red-500 font-black rounded-[2rem] border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          SAIR DA CONTA
        </button>
      </div>

      <div className="text-center opacity-40">
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Membro desde {new Date(user.createdAt).getFullYear()}</p>
      </div>

      {/* --- MODALS --- */}

      {/* Edit Info Modal */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-fadeIn sm:items-center sm:p-4">
          <div className="w-full max-w-[500px] bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atualizar</p>
                <h3 className="text-xl font-black text-slate-900">Dados Pessoais</h3>
              </div>
              <button onClick={() => setIsEditingInfo(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nome de Exibição</label>
                 <input
                   type="text"
                   className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500 focus:bg-white transition-all"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="Seu nome"
                   required
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Endereço de E-mail</label>
                 <input
                   type="email"
                   className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500 focus:bg-white transition-all"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   placeholder="seu@email.com"
                   required
                 />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.8rem] shadow-xl uppercase text-xs flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-fadeIn sm:items-center sm:p-4">
          <div className="w-full max-w-[500px] bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segurança</p>
                <h3 className="text-xl font-black text-slate-900">Alterar Senha</h3>
              </div>
              <button onClick={() => setIsChangingPass(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                placeholder="Senha Atual"
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500 transition-all"
                value={passData.current}
                onChange={e => setPassData({...passData, current: e.target.value})}
                required
              />
              <div className="h-px bg-slate-100 my-2"></div>
              <input
                type="password"
                placeholder="Nova Senha"
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500 transition-all"
                value={passData.new}
                onChange={e => setPassData({...passData, new: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirmar Nova Senha"
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-indigo-500 transition-all"
                value={passData.confirm}
                onChange={e => setPassData({...passData, confirm: e.target.value})}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.8rem] shadow-xl uppercase text-xs flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Atualizar Senha'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
