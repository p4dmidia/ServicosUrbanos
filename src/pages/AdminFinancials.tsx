import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  DollarSign as Money,
  TrendingUp, 
  Wallet, 
  Clock, 
  Percent,
  Loader2,
  Building2,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  QrCode,
  Info,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import FinancialReportTable, { FinancialRecord } from '../components/FinancialReportTable';
import PaymentModal from '../components/PaymentModal';
import ExcelJS from 'exceljs';

export default function AdminFinancials() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [payees, setPayees] = useState<Record<string, any>>({});
  const [matrixPixKey, setMatrixPixKey] = useState('31998007412');
  const [matrixCpf, setMatrixCpf] = useState('123.456.789-00');
  const [dynamicPlatformRate, setDynamicPlatformRate] = useState(18);
  const [loading, setLoading] = useState(true);
  
  // Payment Flow State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<FinancialRecord[]>([]);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  
  // View State
  const [viewType, setViewType] = useState<'merchants' | 'affiliates' | 'insurance' | 'fiscal'>('merchants');
  const [fiscalRecords, setFiscalRecords] = useState<any[]>([]);
  const [loadingFiscal, setLoadingFiscal] = useState(false);

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [affiliateReport, setAffiliateReport] = useState<any[]>([]);

  useEffect(() => {
    if (viewType === 'fiscal') {
      loadFiscalData();
    }
  }, [viewType, dateRange.start]);

  async function loadAdminData(silent = false) {
    try {
      if (!silent) setLoading(true);
      const [ordersData, extrasData, settingsData, affiliateData, marketConfig, branchesRes] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAllOrderExtras(),
        supabase.from('system_settings').select('key, value').in('key', ['matrix_pix_key', 'matrix_cpf']),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`),
        businessRules.getMarketplaceConfig(),
        supabase.from('branches').select('id, name, merchant_id')
      ]);

      if (settingsData.data) {
        const pix = settingsData.data.find(s => s.key === 'matrix_pix_key')?.value;
        const cpf = settingsData.data.find(s => s.key === 'matrix_cpf')?.value || '000.000.000-00';
        setMatrixPixKey(pix || '31998007412');
        setMatrixCpf(cpf);
      }

      const branchesList = branchesRes.data || [];
      setBranches(branchesList);

      // Somente pedidos com repasse pendente
      const pendingOrders = ordersData.filter(o => o.payoutStatus === 'pending');
      
      // Coletar todos os IDs de proprietários de filiais associados a estes pedidos
      const merchantOwnerIds = pendingOrders.map(o => {
        const branch = branchesList.find(b => b.id === o.branchId);
        return branch ? branch.merchant_id : null;
      }).filter(Boolean);
      
      const potentialPayeeIds = [...new Set(merchantOwnerIds)].map(id => String(id));
      
      if (potentialPayeeIds.length > 0) {
        const payeesData = await businessRules.getPayeeDetails(potentialPayeeIds);
        const payeesMap: Record<string, any> = {};
        payeesData.forEach((p: any) => {
          payeesMap[String(p.id)] = p;
        });
        setPayees(payeesMap);
      }

      setOrders(ordersData);
      setExtras(extrasData);
      setAffiliateReport(affiliateData);
      const rateFromDb = marketConfig?.commissionRate || 12; // Mudei para 12 como fallback
      console.log('!!! DEBUG V2 - TAXA DO BANCO:', rateFromDb);
      setDynamicPlatformRate(rateFromDb);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros admin:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile && !authLoading) {
      loadAdminData();
    }
  }, [profile, authLoading, dateRange]);

  const reportData: FinancialRecord[] = useMemo(() => {
    console.log('[DEBUG-FINANCEIRO] Profile Atual:', profile);
    
    const mapped = orders
      .filter(o => o.payoutStatus === 'pending' && o.status !== 'Cancelado')
      .map(o => {
        const extra = extras.find(e => e.id === o.id);
        const saleDate = new Date(o.date || o.created_at);
        
        const payDate = new Date(saleDate);
        payDate.setDate(payDate.getDate() + 1);

        const branch = branches.find(b => b.id === o.branchId);
        const payeeId = branch ? branch.merchant_id : 'matriz';
        const payee = payeeId !== 'matriz' ? payees[String(payeeId)] : null;

        const record = {
          orderId: String(o.id),
          buyerName: o.customerName || 'Cliente',
          payeeName: branch ? branch.name : 'Lojista Matriz',
          orderStatus: o.status === 'Concluído' || o.status === 'Pago' ? 'Pago' : o.status,
          deliveryStatus: (extra?.status as any) || 'Pendente',
          saleDate: saleDate.toLocaleDateString('pt-BR'),
          amount: o.amount,
          repasse: o.amount * (1 - (dynamicPlatformRate / 100)),
          payDate: payDate.toLocaleDateString('pt-BR'),
          payeeId: String(payeeId),
          payeePixKey: payee?.pix_key || (payeeId === 'matriz' ? profile?.pix_key || matrixPixKey || '' : ''),
          payeeCpf: payee?.cpf || (payeeId === 'matriz' ? profile?.cpf || matrixCpf || '' : ''),
          payeeWhatsapp: payee?.whatsapp || (payeeId === 'matriz' ? profile?.whatsapp || '' : ''),
          paymentMethod: o.paymentMethod || 'PIX',
          payoutStatus: o.payoutStatus,
          items: o.items || []
        };
        
        return record;
      });

    console.log('[DEBUG-FINANCEIRO] Dados Mapeados:', mapped);
    return mapped;
  }, [orders, extras, payees, profile, matrixPixKey, matrixCpf, dynamicPlatformRate, branches]);

  // Filtro para mostrar apenas afiliados com saldo pendente e define a data prevista de pagamento (hoje)
  const filteredAffiliateData = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return affiliateReport
      .filter(r => (r.mensal + r.digital + r.anual) > 0.01)
      .map(r => ({
        ...r,
        payDate: todayStr
      }));
  }, [affiliateReport]);

  // Soma dos repasses para lojistas que vencem hoje (payDate === hoje)
  const totalLojistasHoje = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return reportData
      .filter(r => r.payDate === todayStr)
      .reduce((a, b) => a + b.repasse, 0);
  }, [reportData]);

  // Soma dos cashbacks mensais de afiliados a pagar hoje (mensal de todos os afiliados pendentes)
  const totalAfiliadosHoje = useMemo(() => {
    return filteredAffiliateData.reduce((a, b) => a + (b.mensal || 0), 0);
  }, [filteredAffiliateData]);

  const handleGeneratePayments = (selectedItems: any[]) => {
    if (selectedItems.length === 0) {
      toast.error('Nenhum registro selecionado para pagamento.');
      return;
    }

    // Se estiver no modo afiliados, transformamos para o formato que o PaymentModal espera
    if (viewType === 'affiliates') {
      const transformed = selectedItems.map(r => ({
        orderId: `CASH-${r.id.substring(0, 5)}`,
        buyerName: 'Rede MMN',
        payeeName: r.name,
        orderStatus: 'Concluído',
        deliveryStatus: 'Concluído',
        saleDate: new Date().toLocaleDateString('pt-BR'),
        amount: r.mensal,
        repasse: r.mensal, // No modo afiliado, o repasse líquido a pagar é apenas o mensal
        payDate: new Date().toLocaleDateString('pt-BR'),
        payeeId: r.id,
        payeePixKey: r.pix_key,
        payeeCpf: r.cpf,
        payeeWhatsapp: r.whatsapp,
        paymentMethod: 'PIX',
        items: [
          { name: 'Cashback Mensal', price: r.mensal },
          { name: 'Cashback Digital', price: r.digital },
          { name: 'Cashback Anual', price: r.anual }
        ]
      }));
      setSelectedForPayment(transformed);
    } else {
      setSelectedForPayment(selectedItems);
    }
    
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (payeeGroup: any) => {
    try {
      if (viewType === 'merchants') {
        const orderIds = payeeGroup.orders.map((o: any) => o.orderId);
        await businessRules.updateOrderPayoutStatus(orderIds, 'paid');
        
        setOrders(prev => prev.map(o => 
          orderIds.includes(String(o.id)) ? { ...o, payoutStatus: 'paid' } : o
        ));

        // Enviar notificação WhatsApp para lojista
        if (payeeGroup.payeeWhatsapp && payeeGroup.payeeWhatsapp.trim() !== '') {
          try {
            const msg = `Olá, parceiro! O repasse de suas vendas no valor de R$ ${payeeGroup.totalAmount.toFixed(2).replace('.', ',')} foi pago com sucesso em sua chave PIX cadastrada. Obrigado pela parceria!`;
            await businessRules.sendTestWhatsAppMessage(payeeGroup.payeeWhatsapp, msg);
          } catch (whatsappErr) {
            console.error('Erro ao enviar notificação WhatsApp para lojista:', whatsappErr);
          }
        }
      } else {
        // 1. Registramos o histórico na tabela de relatórios
        await businessRules.registerAffiliatePayout({
          profile_id: payeeGroup.payeeId,
          amount: payeeGroup.totalAmount,
          mensal: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Mensal'))?.price || 0,
          digital: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Digital'))?.price || 0,
          anual: payeeGroup.orders[0]?.items?.find((i: any) => i.name.includes('Anual'))?.price || 0,
          pix_key: payeeGroup.payeePixKey
        });

        // 2. Registramos uma transação de saque/saída na tabela transactions para abater do saldo
        const { error: txInsertError } = await supabase
          .from('transactions')
          .insert([{
            profile_id: payeeGroup.payeeId,
            type: 'withdrawal',
            amount: -Math.abs(payeeGroup.totalAmount),
            description: `Pagamento Cashback Mensal - Ref CASH-${payeeGroup.payeeId.substring(0, 5)}`,
            status: 'completed'
          }]);

        if (txInsertError) throw txInsertError;
        
        // 3. Recarrega os dados silenciosamente
        await loadAdminData(true);

        // Enviar notificação WhatsApp para afiliado (Cashback Mensal)
        if (payeeGroup.payeeWhatsapp && payeeGroup.payeeWhatsapp.trim() !== '') {
          try {
            const msg = `Olá! Seu cashback mensal no valor de R$ ${payeeGroup.totalAmount.toFixed(2).replace('.', ',')} foi pago com sucesso em sua chave PIX cadastrada.`;
            await businessRules.sendTestWhatsAppMessage(payeeGroup.payeeWhatsapp, msg);
          } catch (whatsappErr) {
            console.error('Erro ao enviar notificação WhatsApp para afiliado:', whatsappErr);
          }
        }
      }

      // Remove o registro recém-pago da lista de selecionados (fila)
      const orderIdsToRemove = payeeGroup.orders.map((o: any) => o.orderId);
      setSelectedForPayment(prev => {
        const nextList = prev.filter(r => !orderIdsToRemove.includes(r.orderId));
        if (nextList.length === 0) {
          setIsPaymentModalOpen(false);
          setTableRefreshKey(prevKey => prevKey + 1);
          toast.success('Todos os pagamentos foram finalizados com sucesso!');
        } else {
          toast.success(`Pagamento de R$ ${payeeGroup.totalAmount.toFixed(2)} para ${payeeGroup.payeeName} liquidado.`);
        }
        return nextList;
      });
    } catch (error: any) {
      console.error('Erro detalhado ao confirmar pagamento:', error);
      const errorMsg = error.message || error.details || 'Falha ao atualizar status no banco.';
      toast.error(`Erro no Banco: ${errorMsg}`);
    }
  };

  const handleExportMBM = async () => {
    try {
      const toastId = toast.loading('Buscando segurados ativos e preparando planilha...');

      const [year, monthStr] = dateRange.start.split('-');
      const targetMonth = parseInt(monthStr);
      const targetYear = parseInt(year);
      
      const referenceDate = `${monthStr}/${year}`;

      const firstDayOfMonth = new Date(targetYear, targetMonth - 1, 1).toISOString();
      const lastDayOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

      const { data: activeSubs, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          profile_id,
          plan_type,
          amount,
          profiles (
            full_name,
            cpf,
            birth_date,
            gender
          )
        `)
        .eq('status', 'active')
        .lte('start_date', lastDayOfMonth)
        .gte('end_date', firstDayOfMonth);

      if (subsError) throw subsError;

      if (!activeSubs || activeSubs.length === 0) {
        toast.dismiss(toastId);
        toast.error('Nenhum segurado ativo encontrado para a competência selecionada.');
        return;
      }

      const response = await fetch('/templates/modelo_mbm.xlsx');
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet('BASE ATIVA');
      if (!worksheet) {
        throw new Error('Aba "BASE ATIVA" não encontrada no modelo de planilha.');
      }

      // Preencher cabeçalhos
      worksheet.getCell('C13').value = 'Serviços Urbanos';
      worksheet.getCell('F13').value = '1';
      worksheet.getCell('C15').value = referenceDate;
      const todayFormatted = new Date().toLocaleDateString('pt-BR');
      worksheet.getCell('C17').value = `Dados verificados em ${todayFormatted}`;

      // Inserir segurados a partir da linha 18
      let currentRowIndex = 18;
      
      activeSubs.forEach((sub: any) => {
        const prof = sub.profiles;
        if (!prof) return;

        const row = worksheet.getRow(currentRowIndex);
        
        row.getCell(2).value = prof.cpf || '';
        row.getCell(3).value = prof.full_name || '';
        
        let formattedBirthDate = '';
        if (prof.birth_date) {
          const [bYear, bMonth, bDay] = prof.birth_date.split('-');
          formattedBirthDate = `${bDay}/${bMonth}/${bYear}`;
        }
        row.getCell(4).value = formattedBirthDate;
        row.getCell(5).value = prof.gender || '';
        row.getCell(6).value = 5000.00;
        row.getCell(7).value = `Plano ${sub.plan_type.toUpperCase()}`;

        row.commit();
        currentRowIndex++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `MBM_Base_Ativa_${monthStr}_${year}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Planilha de repasse gerada e baixada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao gerar planilha MBM:', err);
      toast.error('Erro ao gerar planilha: ' + (err.message || err));
    }
  };

  const loadFiscalData = async () => {
    try {
      setLoadingFiscal(true);
      const [year, monthStr] = dateRange.start.split('-');
      const targetMonth = parseInt(monthStr);
      const targetYear = parseInt(year);

      const firstDayOfMonth = new Date(targetYear, targetMonth - 1, 1).toISOString();
      const lastDayOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          created_at,
          profile_id,
          profiles (
            full_name,
            cpf
          )
        `)
        .eq('type', 'commission')
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);

      if (error) throw error;

      const grouped: Record<string, any> = {};
      
      (data || []).forEach((tx: any) => {
        const prof = tx.profiles;
        if (!prof) return;
        const pid = tx.profile_id;
        
        if (!grouped[pid]) {
          grouped[pid] = {
            profile_id: pid,
            name: prof.full_name,
            cpf: prof.cpf,
            bruto: 0
          };
        }
        grouped[pid].bruto += Math.abs(tx.amount);
      });

      const records = Object.values(grouped).map((rec: any) => {
        const bruto = rec.bruto;
        
        let inss = 0;
        const faixasInss = [
          { limite: 1621.00, aliquota: 0.075 },
          { limite: 2902.84, aliquota: 0.09 },
          { limite: 4354.27, aliquota: 0.12 },
          { limite: 8475.55, aliquota: 0.14 }
        ];
        for (let i = 0; i < faixasInss.length; i++) {
          const anterior = i === 0 ? 0 : faixasInss[i - 1].limite;
          if (bruto > faixasInss[i].limite) {
            inss += (faixasInss[i].limite - anterior) * faixasInss[i].aliquota;
          } else {
            inss += (bruto - anterior) * faixasInss[i].aliquota;
            break;
          }
        }
        inss = Math.min(inss, 988.09);

        const baseIrrf = bruto - inss;
        let irrf = 0;
        if (baseIrrf > 2259.20) {
          if (baseIrrf <= 2826.65) {
            irrf = (baseIrrf * 0.075) - 169.44;
          } else if (baseIrrf <= 3751.05) {
            irrf = (baseIrrf * 0.15) - 381.44;
          } else if (baseIrrf <= 4664.68) {
            irrf = (baseIrrf * 0.225) - 662.77;
          } else {
            irrf = (baseIrrf * 0.275) - 896.00;
          }
        }

        const patronal = bruto * 0.20;
        const liquido = bruto - inss - irrf;

        return {
          ...rec,
          inss: parseFloat(inss.toFixed(2)),
          irrf: parseFloat(irrf.toFixed(2)),
          patronal: parseFloat(patronal.toFixed(2)),
          liquido: parseFloat(liquido.toFixed(2))
        };
      });

      setFiscalRecords(records);
    } catch (err) {
      console.error('Erro ao calcular dados fiscais:', err);
      toast.error('Erro ao carregar dados fiscais');
    } finally {
      setLoadingFiscal(false);
    }
  };

  const handleExportDARF = () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DARF 0588');

      worksheet.columns = [
        { header: 'Beneficiário', key: 'name', width: 30 },
        { header: 'CPF', key: 'cpf', width: 20 },
        { header: 'Rendimento Bruto (R$)', key: 'bruto', width: 20 },
        { header: 'Dedução INSS (R$)', key: 'inss', width: 20 },
        { header: 'IRRF Retido (R$)', key: 'irrf', width: 20 },
        { header: 'INSS Patronal (R$)', key: 'patronal', width: 20 }
      ];

      fiscalRecords.forEach(rec => {
        worksheet.addRow(rec);
      });

      worksheet.getRow(1).font = { bold: true };

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        const [year, month] = dateRange.start.split('-');
        anchor.download = `Consolidado_DARF_0588_${month}_${year}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      });
      toast.success('DARF 0588 exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar DARF');
    }
  };

  const handleExportDIRF = () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DIRF Anual');

      worksheet.columns = [
        { header: 'CPF do Beneficiário', key: 'cpf', width: 20 },
        { header: 'Nome Completo', key: 'name', width: 35 },
        { header: 'Rendimentos Brutos Acumulados (R$)', key: 'bruto', width: 30 },
        { header: 'Previdência Oficial (INSS) (R$)', key: 'inss', width: 25 },
        { header: 'Imposto Retido na Fonte (IRRF) (R$)', key: 'irrf', width: 25 }
      ];

      fiscalRecords.forEach(rec => {
        worksheet.addRow(rec);
      });

      worksheet.getRow(1).font = { bold: true };

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        const [year] = dateRange.start.split('-');
        anchor.download = `Exportacao_DIRF_Anual_${year}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      });
      toast.success('DIRF Anual exportada com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar DIRF');
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout title="Financeiro Global" subtitle="Sincronizando auditoria...">
        <div className="flex items-center justify-center p-20">
          <div className="flex flex-col">
            <h2 className="text-4xl font-black text-midnight italic uppercase tracking-tighter">Financeiro [Sincronizado]</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestão de Repasses e Auditoria de Fluxo</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Pagamentos PIX [Sincronizado]" subtitle="Auditoria global de repasses para lojistas e parceiros">
      <div className="p-8 lg:p-12 space-y-12">
        
        {/* Toggle de Visualização e Filtros */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setViewType('merchants')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'merchants' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Lojistas
            </button>
            <button
              onClick={() => setViewType('affiliates')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'affiliates' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Afiliados
            </button>
            <button
              onClick={() => setViewType('insurance')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'insurance' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Seguro MBM
            </button>
            <button
              onClick={() => setViewType('fiscal')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewType === 'fiscal' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Módulo Fiscal
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Clock size={16} className="text-indigo-500" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[10px] font-black text-slate-600 outline-none"
              />
              <span className="text-slate-300 text-[10px]">Até</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-[10px] font-black text-slate-600 outline-none"
              />
            </div>
            
            <button 
              onClick={() => {
                const now = new Date();
                setDateRange({
                  start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
              }}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              Este Mês
            </button>
          </div>
        </div>
        
        {/* Banner de Regras */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           <div className="xl:col-span-2 bg-amber-50/50 border border-amber-200/50 p-8 rounded-[2.5rem] flex gap-6 items-start shadow-sm">
              <div className="size-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                 <ShieldCheck size={32} />
              </div>
              <div className="space-y-4">
                 <h4 className="text-lg font-black text-amber-900 italic uppercase tracking-tighter">Regras de Liberação de Valores</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Condição de Repasse</p>
                       <p className="text-xs text-amber-800 leading-relaxed font-medium">
                         Os valores só serão liberados ao lojista quando o status do pedido e status da entrega estiverem <span className="font-black">PAGOS E ENTREGUES</span>.
                       </p>
                    </div>
                    <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
                       <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">Padrão de Liquidação</p>
                        <p className="text-[10px] text-amber-800 font-bold leading-tight uppercase">
                          Repasses automáticos em D+1. <br/> Taxa de Administração: {dynamicPlatformRate}%.
                        </p>
                    </div>
                 </div>
              </div>
           </div>

            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                   <QrCode size={100} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-1">
                    {viewType === 'merchants' ? 'Total a Pagar Lojistas Hoje' : 'Total a Pagar Afiliados Hoje'}
                  </p>
                  <h3 className="text-4xl font-black text-white tracking-tighter italic leading-none">
                     R$ {(viewType === 'merchants' ? totalLojistasHoje : totalAfiliadosHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="mt-4">
                   <span className="text-[9px] text-indigo-100 font-black uppercase tracking-[0.2em] border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm">Sistema PIX Pronto</span>
                </div>
            </div>
        </div>

        {/* Tabela de Relatórios, Seguro MBM ou Módulo Fiscal */}
        {viewType === 'insurance' ? (
          <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-slate-100 space-y-8">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <div className="size-16 bg-blue-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-midnight uppercase tracking-tighter italic">Relatório Mensal de Seguro - MBM</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Gere a planilha de movimentação mensal com os segurados ativos e adimplentes para envio direto à seguradora.
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Mês de Referência (Competência)
                </label>
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200">
                  <Clock size={18} className="text-indigo-600" />
                  <input 
                    type="month" 
                    value={dateRange.start.substring(0, 7)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateRange(prev => ({ 
                        start: `${val}-01`, 
                        end: `${val}-28`
                      }));
                    }}
                    className="bg-transparent text-xs font-bold text-midnight outline-none w-full"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-3 items-start">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-800 font-bold uppercase leading-normal">
                  * Apenas clientes com assinaturas válidas (dentro da vigência do plano Trimestral, Semestral ou Anual) serão exportados na planilha.
                </p>
              </div>

              <button
                onClick={handleExportMBM}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <DollarSign size={16} /> Gerar e Baixar Planilha MBM
              </button>
            </div>

            <div className="max-w-2xl mx-auto border border-slate-100 rounded-3xl p-6 bg-slate-50/30 flex items-center gap-4 justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Rotinas do Administrador</p>
                <p className="text-xs text-midnight font-bold leading-snug">
                  Mantenha a base updated mensalmente todo dia 30 de cada mês enviando o arquivo exportado à MBM Seguradora.
                </p>
              </div>
            </div>
          </div>
        ) : viewType === 'fiscal' ? (
          <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-slate-100 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-50 pb-8">
              <div>
                <h3 className="text-2xl font-black text-midnight uppercase tracking-tighter italic">Escrituração Fiscal e Impostos</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Apuração de INSS, IRRF (DARF 0588) e provisões anuais para DIRF.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleExportDARF}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Exportar DARF 0588
                </button>
                <button
                  onClick={handleExportDIRF}
                  className="bg-midnight hover:bg-indigo-900 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Exportar DIRF
                </button>
              </div>
            </div>

            {/* Cards Consolidados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Rendimento Bruto Total</p>
                <p className="text-2xl font-black text-midnight italic">
                  R$ {fiscalRecords.reduce((sum, r) => sum + r.bruto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total INSS Retido (Contribuintes)</p>
                <p className="text-2xl font-black text-amber-600 italic">
                  R$ {fiscalRecords.reduce((sum, r) => sum + r.inss, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total INSS Patronal (Empresa 20%)</p>
                <p className="text-2xl font-black text-indigo-600 italic">
                  R$ {fiscalRecords.reduce((sum, r) => sum + r.patronal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">IRRF Retido Consolidado (DARF 0588)</p>
                <p className="text-2xl font-black text-emerald-600 italic">
                  R$ {fiscalRecords.reduce((sum, r) => sum + r.irrf, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Listagem de Detalhamento */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Afiliado</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rend. Bruto</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenção INSS</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Retenção IRRF</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">INSS Patronal</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFiscal ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Processando escriturações...
                      </td>
                    </tr>
                  ) : fiscalRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Nenhuma transação de comissão concluída neste mês.
                      </td>
                    </tr>
                  ) : (
                    fiscalRecords.map((rec) => (
                      <tr key={rec.profile_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-xs font-bold text-midnight">{rec.name}</td>
                        <td className="py-4 text-xs font-bold text-slate-500">{rec.cpf || 'Não cadastrado'}</td>
                        <td className="py-4 text-xs font-bold text-midnight text-right">R$ {rec.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-xs font-bold text-amber-600 text-right">R$ {rec.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-xs font-bold text-emerald-600 text-right">R$ {rec.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-xs font-bold text-indigo-600 text-right">R$ {rec.patronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-xs font-black text-midnight text-right">R$ {rec.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div key={`${viewType}-${tableRefreshKey}`} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
              <FinancialReportTable 
                data={viewType === 'merchants' ? reportData : []} 
                affiliateData={viewType === 'affiliates' ? filteredAffiliateData : []}
                title={viewType === 'merchants' ? "Auditoria de Pedidos Pendentes" : "Relatório de Cashbacks por Afiliado"} 
                isAdmin={true} 
                mode={viewType}
                onGeneratePayments={handleGeneratePayments}
                hideReceiptButton={true}
                hidePdfButton={true}
                platformRate={dynamicPlatformRate}
              />
          </div>
        )}

      </div>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            selectedRecords={selectedForPayment}
            onConfirmPayment={handleConfirmPayment}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
