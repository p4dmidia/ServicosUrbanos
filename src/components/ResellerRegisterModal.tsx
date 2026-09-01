import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Users, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Copy, 
  Sparkles, 
  Lock, 
  Smartphone, 
  Mail, 
  Calendar, 
  Check, 
  Loader2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ResellerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resellerUser: any;
  onSuccess?: () => void;
}

const PLANS = [
  { id: 'sub-mensal', plan_type: 'mensal', name: 'Plano Mensal', price: 20, icon: '📅', days: 30 },
  { id: 'sub-trimestral', plan_type: 'trimestral', name: 'Plano Trimestral', price: 30, icon: '🌟', days: 90 },
  { id: 'sub-semestral', plan_type: 'semestral', name: 'Plano Semestral', price: 40, icon: '💼', days: 180 },
  { id: 'sub-anual', plan_type: 'anual', name: 'Plano Anual', price: 60, icon: '🏆', days: 365, popular: true }
];

export default function ResellerRegisterModal({
  isOpen,
  onClose,
  resellerUser,
  onSuccess
}: ResellerRegisterModalProps) {
  // Step 1: Form, Step 2: Payment QR Code
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [loading, setLoading] = useState(false);

  // Sponsor selection
  const [isSelfSponsor, setIsSelfSponsor] = useState(true);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [searchingSponsor, setSearchingSponsor] = useState(false);
  const [foundSponsor, setFoundSponsor] = useState<{ id: string; name: string; cpf?: string; code?: string } | null>(null);

  // New member data
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('M');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[3]); // Default: Anual

  // Created order & payment
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [pixPayload, setPixPayload] = useState('');

  useEffect(() => {
    if (isSelfSponsor && resellerUser) {
      setFoundSponsor({
        id: resellerUser.id,
        name: resellerUser.user_metadata?.full_name || resellerUser.email || 'Revendedor',
        code: resellerUser.user_metadata?.referral_code
      });
    }
  }, [isSelfSponsor, resellerUser]);

  const handleSearchSponsor = async (term: string) => {
    const cleanTerm = term.trim();
    if (cleanTerm.length < 3) {
      setFoundSponsor(null);
      return;
    }

    setSearchingSponsor(true);
    try {
      // Search by referral_code or CPF
      const cleanCpf = cleanTerm.replace(/\D/g, '');
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, referral_code')
        .or(`referral_code.ilike.%${cleanTerm}%,cpf.eq.${cleanCpf || 'none'}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setFoundSponsor({
          id: data.id,
          name: data.full_name,
          cpf: data.cpf,
          code: data.referral_code
        });
      } else {
        setFoundSponsor(null);
      }
    } catch (e) {
      console.error('Erro ao buscar patrocinador:', e);
      setFoundSponsor(null);
    } finally {
      setSearchingSponsor(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !cpf || !whatsapp || !email || !password) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    const sponsorId = isSelfSponsor ? resellerUser.id : foundSponsor?.id;
    if (!sponsorId) {
      toast.error('Informe o patrocinador/indicador do novo membro.');
      return;
    }

    setLoading(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, '');
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cpf: cleanCpf,
            whatsapp: cleanWhatsapp,
            birth_date: birthDate,
            gender: gender,
            role: 'affiliate',
            referred_by: sponsorId,
            reseller_id: resellerUser.id
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado no sistema.');
        }
        throw authError;
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        throw new Error('Não foi possível gerar a conta do usuário.');
      }

      // 2. Garantir atualização no profile
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          cpf: cleanCpf,
          whatsapp: cleanWhatsapp,
          birth_date: birthDate,
          gender: gender,
          role: 'affiliate',
          referred_by: sponsorId,
          reseller_id: resellerUser.id
        })
        .eq('id', newUserId);

      // 3. Criar pedido de assinatura
      const newOrderId = Math.floor(1000 + Math.random() * 9000).toString();
      const orderPayload = {
        id: newOrderId,
        customer_id: newUserId,
        customer_name: fullName,
        reseller_id: resellerUser.id,
        amount: selectedPlan.price,
        status: 'Aguardando Pagamento',
        payment_method: 'PIX',
        shipping_address: 'Licenciamento MMN Digital',
        items: [{
          id: selectedPlan.id,
          name: `Licenciamento MMN - ${selectedPlan.name}`,
          image: selectedPlan.icon,
          price: selectedPlan.price,
          quantity: 1,
          plan_type: selectedPlan.plan_type,
          is_subscription: true
        }]
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload]);

      if (orderError) throw orderError;

      // 4. Gerar payload PIX fictício / padrão BACEN
      const mockPix = `00020126580014br.gov.bcb.pix0136${cleanCpf || 'financeiro@ecosistema.com'}520400005303986540${selectedPlan.price.toFixed(2)}5802BR5913${fullName.substring(0, 13)}6008SALVADOR62070503***6304`;
      
      setCreatedOrder({ ...orderPayload, newUserId });
      setPixPayload(mockPix);
      setStep('payment');
      toast.success('Novo membro cadastrado com sucesso! Efetue o pagamento da adesão.');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro no cadastro do revendedor:', err);
      toast.error(err.message || 'Falha ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentApproval = async () => {
    if (!createdOrder) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Pago' })
        .eq('id', createdOrder.id);

      if (error) throw error;

      toast.success('Plano ativado com sucesso! As comissões foram distribuídas.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro ao aprovar pedido:', err);
      toast.error('Erro ao aprovar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#0a0e17] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {step === 'form' ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
                <Sparkles size={12} />
                Fechamento de Venda Direta
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                Cadastrar Novo Afiliado
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Cadastre o novo membro e vincule o patrocinador para gerar as comissões.
              </p>
            </div>

            {/* Banner do Revendedor */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center font-black">
                  ⭐
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Revendedor Fechador</span>
                  <span className="text-sm font-black text-white">{resellerUser?.user_metadata?.full_name || resellerUser?.email || 'Revendedor Autorizado'}</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wider">
                Ganha Comissão de Revendedor
              </span>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Patrocinador (Indicador) */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Users size={14} /> Quem Indicou o Novo Membro? (Patrocinador MMN)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSelfSponsor(true)}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      isSelfSponsor 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    Eu Mesmo Indiquei (G1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelfSponsor(false);
                      setFoundSponsor(null);
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      !isSelfSponsor 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    Outro Afiliado Indicou
                  </button>
                </div>

                {!isSelfSponsor && (
                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Digite o CPF ou Código de Indicação do patrocinador..."
                        value={sponsorSearch}
                        onChange={(e) => {
                          setSponsorSearch(e.target.value);
                          handleSearchSponsor(e.target.value);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      {searchingSponsor && (
                        <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                      )}
                    </div>

                    {foundSponsor ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold text-white">Indicador: <strong className="font-black text-emerald-400">{foundSponsor.name}</strong></span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{foundSponsor.code || foundSponsor.cpf}</span>
                      </div>
                    ) : sponsorSearch.length >= 3 && !searchingSponsor ? (
                      <p className="text-[10px] text-red-400 font-bold px-1">Nenhum patrocinador encontrado com este código/CPF.</p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Dados do Novo Membro */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Dados do Novo Membro
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome Completo *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Joana da Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">CPF *</label>
                    <input 
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp *</label>
                    <input 
                      type="text"
                      required
                      placeholder="(71) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">E-mail *</label>
                    <input 
                      type="email"
                      required
                      placeholder="joana@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data de Nascimento</label>
                    <input 
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Senha de Acesso *</label>
                    <input 
                      type="password"
                      required
                      placeholder="Mínimo 6 dígitos"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Escolha do Plano */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                  Escolha o Plano de Licenciamento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedPlan.id === plan.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xl">{plan.icon}</span>
                        {selectedPlan.id === plan.id && <Check size={16} className="text-indigo-400" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase block text-slate-300">{plan.name}</span>
                        <span className="text-base font-black text-white">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Cadastrar e Gerar PIX de Adesão
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: PIX Payment Display */
          <div className="space-y-6 text-center py-4">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <QrCode size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                Pagamento de Adesão
              </h3>
              <p className="text-xs text-slate-400">
                Apresente o QR Code para o novo membro <strong className="text-white">{fullName}</strong> pagar e ativar imediatamente o plano.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl max-w-sm mx-auto flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">{selectedPlan.name}</span>
              <span className="text-emerald-400 font-black text-base">R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl max-w-xs mx-auto shadow-2xl">
              <QRCodeSVG value={pixPayload || 'pix'} size={200} />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(pixPayload);
                toast.success('Chave Copia e Cola copiada com sucesso!');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all cursor-pointer"
            >
              <Copy size={14} /> Copiar Código Copia e Cola
            </button>

            <div className="pt-6 border-t border-white/10 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 transition-all"
              >
                Fechar
              </button>
              <button
                onClick={handleSimulatePaymentApproval}
                disabled={loading}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmar / Ativar Manualmente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
