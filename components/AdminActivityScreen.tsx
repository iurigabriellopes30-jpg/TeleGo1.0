
import React, { useState } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface AdminActivityScreenProps {
  deliveries: Delivery[];
}

export const AdminActivityScreen: React.FC<AdminActivityScreenProps> = ({ deliveries }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'FINISHED'>('ALL');

  const filteredDeliveries = deliveries.filter(d => {
    if (filter === 'ACTIVE') return d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED && d.status !== DeliveryStatus.EXPIRED;
    if (filter === 'FINISHED') return d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.CANCELLED;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const stats = {
    total: deliveries.length,
    active: deliveries.filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED && d.status !== DeliveryStatus.EXPIRED).length,
    revenue: deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).reduce((acc, curr) => acc + curr.price, 0)
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING: return 'bg-yellow-100 text-yellow-700';
      case DeliveryStatus.ACCEPTED: return 'bg-blue-100 text-blue-700';
      case DeliveryStatus.PICKED_UP: return 'bg-purple-100 text-purple-700';
      case DeliveryStatus.IN_TRANSIT: return 'bg-indigo-100 text-indigo-700';
      case DeliveryStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case DeliveryStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monitor Global</h2>
        <p className="text-xs font-bold text-slate-400 uppercase">Visão geral da operação</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase">Volume</p>
          <p className="text-xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-center text-white">
          <p className="text-[9px] font-black text-blue-200 uppercase">Ativas</p>
          <p className="text-xl font-black">{stats.active}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase">Movimentado</p>
          <p className="text-sm font-black text-green-600 mt-1">R$ {stats.revenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6">
        <button onClick={() => setFilter('ALL')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Todos</button>
        <button onClick={() => setFilter('ACTIVE')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'ACTIVE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Em Curso</button>
        <button onClick={() => setFilter('FINISHED')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === 'FINISHED' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Finalizados</button>
      </div>

      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <p className="text-4xl mb-2">📡</p>
            <p className="text-sm font-bold text-slate-500">Nenhum registro encontrado.</p>
          </div>
        ) : (
          filteredDeliveries.map(d => (
            <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fadeIn relative overflow-hidden">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(d.status).split(' ')[0].replace('100', '500')}`}></div>
               
               <div className="flex justify-between items-start mb-2 pl-2">
                 <div>
                   <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getStatusColor(d.status)}`}>
                     {d.status}
                   </span>
                   <p className="text-[10px] text-slate-400 font-bold mt-1">
                     {new Date(d.createdAt).toLocaleString()}
                   </p>
                 </div>
                 <p className="font-black text-slate-800">R$ {d.price.toFixed(2)}</p>
               </div>

               <div className="pl-2 space-y-2 mt-3">
                 <div className="flex items-center gap-2">
                   <span className="text-xs">🏪</span>
                   <p className="text-xs font-bold text-slate-700">{d.restaurantName}</p>
                 </div>
                 {d.courierId && (
                   <div className="flex items-center gap-2">
                     <span className="text-xs">🏍️</span>
                     <p className="text-xs font-bold text-slate-700">Motoboy ID: <span className="font-mono text-slate-400">{d.courierId.slice(0,8)}...</span></p>
                   </div>
                 )}
                 <div className="bg-slate-50 p-2 rounded-lg mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rota</p>
                    <p className="text-xs text-slate-600 truncate">{d.pickupAddress} ➝ {d.deliveryAddress}</p>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
