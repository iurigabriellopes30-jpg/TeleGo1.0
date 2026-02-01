
import React, { useState, useEffect } from 'react';
import { User, UserRole, Delivery, DeliveryStatus } from '../types';
import { authService } from '../services/authService';

interface AdminDashboardProps {
  currentUser: User;
  deliveries: Delivery[]; // Recebe as entregas para calcular stats
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, deliveries }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  const fetchUsers = async () => {
    try {
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers.filter(u => u.id !== currentUser.id && u.role !== UserRole.ADMIN));
    } catch (e) {
      showToast('Erro ao carregar usuários.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (userId: string) => {
    try {
      await authService.approveUser(userId);
      showToast('Acesso aprovado com sucesso!', 'success');
      await fetchUsers();
    } catch (e) {
      showToast('Erro ao aprovar usuário.', 'error');
    }
  };

  const handleReject = async (userId: string) => {
    const action = filter === 'PENDING' ? 'Rejeitar' : 'Remover';
    if (window.confirm(`Tem certeza que deseja ${action.toLowerCase()} este usuário?`)) {
      try {
        await authService.deleteUser(userId);
        showToast(`Usuário ${action.toLowerCase()} com sucesso.`, 'info');
        await fetchUsers();
        if (selectedUser?.id === userId) setSelectedUser(null);
      } catch (e) {
        showToast('Erro ao processar exclusão.', 'error');
      }
    }
  };

  const pendingCount = users.filter(u => !u.approved).length;
  const approvedCount = users.filter(u => u.approved).length;

  const filteredUsers = users.filter(u =>
    filter === 'PENDING' ? !u.approved : u.approved
  );

  const getUserDeliveries = (user: User) => {
    return deliveries.filter(d =>
      user.role === UserRole.RESTAURANT ?
      ((d as any).restaurant_id === user.id || d.restaurantId === user.id) :
      ((d as any).courier_id === user.id || d.courierId === user.id)
    );
  };

  const getUserStats = (user: User) => {
    const userDels = getUserDeliveries(user);
    const totalValue = userDels.reduce((acc, curr) => acc + curr.price, 0);
    return { count: userDels.length, value: totalValue };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slideDown ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
        }`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <p className="text-xs font-black uppercase tracking-wide">{toast.msg}</p>
        </div>
      )}

      {/* Header com Gradiente */}
      <div className="bg-slate-900 text-white pt-8 pb-12 px-6 rounded-b-[2.5rem] shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8ecbff] opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Painel de Controle</p>
          <h2 className="text-2xl font-black tracking-tight">Gestão de Acessos</h2>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-20 space-y-6">
        {/* Cards de Filtro */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setFilter('PENDING')} className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left shadow-lg group ${filter === 'PENDING' ? 'bg-white border-yellow-400 translate-y-0' : 'bg-slate-100 border-transparent translate-y-1 opacity-80'}`}>
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-3 text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">⏳</div>
            <p className="text-2xl font-black text-slate-800">{pendingCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendentes</p>
          </button>
          <button onClick={() => setFilter('APPROVED')} className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left shadow-lg group ${filter === 'APPROVED' ? 'bg-white border-green-500 translate-y-0' : 'bg-slate-100 border-transparent translate-y-1 opacity-80'}`}>
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">✅</div>
            <p className="text-2xl font-black text-slate-800">{approvedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ativos</p>
          </button>
        </div>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="bg-white p-5 rounded-3xl shadow-sm animate-slideUp border border-slate-50 relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${user.role === UserRole.RESTAURANT ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                <div className="flex justify-between items-center mb-4 pl-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${user.role === UserRole.RESTAURANT ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                      {user.role === UserRole.RESTAURANT ? '🍕' : '🏍️'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{user.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</p>
                    </div>
                  </div>
                  {user.approved && (
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors"
                    >
                      Inspecionar
                    </button>
                  )}
                </div>

                {!user.approved && (
                  <div className="flex gap-2 pl-3">
                    <button
                      onClick={() => handleReject(user.id)}
                      className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-transform"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="flex-[2] py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <span>✓</span> Aprovar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Inspeção de Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn sm:items-center sm:p-4">
          <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slideUp">

            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inspecionando</p>
                <h3 className="text-xl font-black text-slate-800">{selectedUser.name}</h3>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">✕</button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Stats do Usuário */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Operações</p>
                  <p className="text-2xl font-black text-slate-800">{getUserStats(selectedUser).count}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Movimentado</p>
                  <p className="text-2xl font-black text-green-600">R$ {getUserStats(selectedUser).value.toFixed(0)}</p>
                </div>
              </div>

              {/* Lista de Atividades Específicas */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Histórico Recente</h4>
                <div className="space-y-3">
                  {getUserDeliveries(selectedUser).length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-4">Nenhuma atividade registrada.</p>
                  ) : (
                    getUserDeliveries(selectedUser)
                      .sort((a,b) => b.createdAt - a.createdAt)
                      .map(d => (
                        <div key={d.id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                              {selectedUser.role === UserRole.RESTAURANT ? d.deliveryAddress : (d as any).restaurant_name || d.restaurantName}
                            </p>
                          </div>
                          <div className="text-right">
                             <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${d.status === DeliveryStatus.DELIVERED ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                               {d.status}
                             </span>
                             <p className="text-xs font-black text-slate-800 mt-1">R$ {d.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleReject(selectedUser.id)}
                  className="w-full py-4 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase hover:bg-red-100 transition-colors"
                >
                  Remover Usuário do Sistema
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
