import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { toast } from 'react-hot-toast';

export default function AdminWaitlist() {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await businessRules.getMerchantWaitlist();
      setWaitlist(data);
    } catch (error) {
      console.error('Erro ao carregar lista de espera:', error);
      toast.error('Erro ao carregar lista de espera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredList = waitlist.filter(item => 
    item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.business_name && item.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = [
    { label: 'Total de Inscritos', value: waitlist.length, icon: Users, color: 'text-blue-500' },
    { label: 'Novos Hoje', value: waitlist.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString()).length, icon: Clock, color: 'text-emerald-500' },
    { label: 'Com Loja Definida', value: waitlist.filter(i => i.business_name).length, icon: Building2, color: 'text-purple-500' },
  ];

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'WhatsApp', 'Loja', 'Data'];
    const rows = filteredList.map(item => [
      item.full_name,
      item.email,
      item.phone,
      item.business_name || 'N/A',
      new Date(item.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lista_espera_lojistas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Lista de Espera" subtitle="Potenciais parceiros aguardando abertura do Marketplace">
      <div className="p-8 lg:p-12 space-y-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0a0e17] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl group">
              <div className="flex items-center justify-between mb-4">
                <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* List Table */}
        <div className="bg-[#0a0e17] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Filter size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Candidatos a Lojista</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base de leads qualificados</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome, email ou loja..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/5 py-3 pl-10 pr-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 w-full sm:w-80"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
              >
                <Download size={16} /> Exportar CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidato</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Negócio</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contato</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Cadastro</th>
                  <th className="py-6 px-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="size-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando lista...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((item, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={item.id} 
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-6 px-8">
                        <div>
                          <p className="text-sm font-black text-white leading-none mb-1 group-hover:text-indigo-400 transition-all">{item.full_name}</p>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail size={12} />
                            <span className="text-[10px] font-bold">{item.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        {item.business_name ? (
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-purple-400" />
                            <span className="text-xs font-black text-white">{item.business_name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-600 uppercase italic">Não informado</span>
                        )}
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Phone size={14} />
                          </div>
                          <span className="text-xs font-black text-white">{item.phone}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <a 
                          href={`https://wa.me/${item.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Chamar <ExternalLink size={12} />
                        </a>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">Nenhum candidato encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
