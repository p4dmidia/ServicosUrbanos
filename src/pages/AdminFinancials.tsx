import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  FileText, 
  Users, 
  Calendar,
  AlertCircle,
  FileCheck,
  Building2,
  PieChart,
  HelpCircle,
  Percent,
  TrendingUp,
  Receipt,
  CreditCard,
  Printer,
  Info,
  Layers,
  Sparkles,
  BarChart3,
  Scale,
  Award,
  Wallet,
  ArrowDownRight,
  Landmark,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { businessRules } from '../lib/businessRules';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';

export default function AdminFinancials() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeLivesCount, setActiveLivesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // View State - 3 Abas Exclusivas: Fiscal & Contabilidade, Seguro MBM, DRE da Plataforma
  const [viewType, setViewType] = useState<'fiscal' | 'insurance' | 'dre'>('fiscal');
  const [fiscalRecords, setFiscalRecords] = useState<any[]>([]);
  const [loadingFiscal, setLoadingFiscal] = useState(false);

  const fiscalTotals = useMemo(() => {
    const totalRecords = fiscalRecords.length;
    const totalBruto = fiscalRecords.reduce((sum, r) => sum + (r.bruto || 0), 0);
    const totalInss = fiscalRecords.reduce((sum, r) => sum + (r.inss || 0), 0);
    const totalIrrf = fiscalRecords.reduce((sum, r) => sum + (r.irrf || 0), 0);
    const totalPatronal = fiscalRecords.reduce((sum, r) => sum + (r.patronal || 0), 0);
    const totalInssGuia = fiscalRecords.reduce((sum, r) => sum + (r.total_inss_guia || 0), 0);
    const totalLiquido = fiscalRecords.reduce((sum, r) => sum + (r.liquido || 0), 0);
    return {
      totalRecords,
      totalBruto,
      totalInss,
      totalIrrf,
      totalPatronal,
      totalInssGuia,
      totalLiquido
    };
  }, [fiscalRecords]);

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    };
  });
  const [networkReport, setNetworkReport] = useState<any[]>([]);
  const [resellerReport, setResellerReport] = useState<any[]>([]);
  const [mbmPolicyNumber, setMbmPolicyNumber] = useState(() => localStorage.getItem('mbm_policy_number') || '');
  const [mbmSubGroup, setMbmSubGroup] = useState(() => localStorage.getItem('mbm_sub_group') || '1');
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [mmnRates, setMmnRates] = useState({
    networkRate: 21,
    resellerMensalRate: 5,
    resellerAnualRate: 2,
    resellerRate: 7,
    totalRepasseRate: 28
  });

  useEffect(() => {
    loadFiscalData();
  }, [dateRange.start, dateRange.end]);

  async function loadAdminData(silent = false) {
    try {
      if (!silent) setLoading(true);
      const [ordersData, networkData, resellerData, subsData, mmnConfigRes, mmnLevelsRes] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'network'),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'reseller'),
        supabase
          .from('subscriptions')
          .select('id, profile_id, plan_type, amount, status, start_date, end_date')
          .eq('status', 'active'),
        supabase.from('mmn_config').select('*').single(),
        supabase.from('mmn_levels').select('*')
      ]);

      setOrders(ordersData || []);
      setNetworkReport(networkData || []);
      setResellerReport(resellerData || []);

      const rawSubs = subsData?.data || [];
      const filteredSubs = rawSubs.filter(s => {
        if (!s.start_date || !s.end_date) return true;
        const start = s.start_date.substring(0, 10);
        const end = s.end_date.substring(0, 10);
        return start <= dateRange.end && end >= dateRange.start;
      });
      const finalSubs = filteredSubs.length > 0 ? filteredSubs : rawSubs;
      setActiveSubscriptions(finalSubs);
      setActiveLivesCount(finalSubs.length);

      const mmnCfg = mmnConfigRes?.data;
      const mmnLvls = mmnLevelsRes?.data;

      const netRate = mmnLvls && mmnLvls.length > 0 
        ? mmnLvls.reduce((acc: number, cur: any) => acc + Number(cur.value || 0), 0)
        : 21;
      
      const rMensal = Number(mmnCfg?.commission_regional_mensal ?? 5);
      const rAnual = Number(mmnCfg?.commission_regional_anual ?? 2);
      const rTotal = rMensal + rAnual;

      setMmnRates({
        networkRate: netRate,
        resellerMensalRate: rMensal,
        resellerAnualRate: rAnual,
        resellerRate: rTotal,
        totalRepasseRate: netRate + rTotal
      });
    } catch (error) {
      console.error('Erro ao carregar dados fiscais admin:', error);
      toast.error('Erro ao carregar dados da contabilidade');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile && !authLoading) {
      loadAdminData();
    }
  }, [profile, authLoading, dateRange]);

  const handleExportMBM = async () => {
    try {
      const toastId = toast.loading('Buscando segurados ativos e preparando planilha oficial MBM...');

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
            cnpj,
            birth_date,
            gender,
            description,
            store_name
          )
        `)
        .eq('status', 'active')
        .lte('start_date', lastDayOfMonth)
        .gte('end_date', firstDayOfMonth);

      if (subsError) throw subsError;

      if (!activeSubs || activeSubs.length === 0) {
        toast.dismiss(toastId);
        toast.error(`Nenhum segurado ativo encontrado para a competência ${referenceDate}.`);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Serviços Urbanos';
      workbook.created = new Date();

      // ============================================================
      // ABA 1: INSTRUÇÕES (PADRÃO OFICIAL MBM)
      // ============================================================
      const wsInstrucoes = workbook.addWorksheet('INSTRUÇÕES', {
        pageSetup: { orientation: 'landscape', fitToPage: false }
      });
      wsInstrucoes.views = [
        { state: 'normal', showGridLines: true, zoomScale: 100 }
      ];

      wsInstrucoes.getColumn(1).width = 2.75;
      wsInstrucoes.getColumn(2).width = 131.75;
      wsInstrucoes.getColumn(3).width = 2.75;

      // Título das Instruções (Linhas 1-2 mescladas)
      wsInstrucoes.mergeCells('A1:C2');
      const titleInst = wsInstrucoes.getCell('A1');
      titleInst.value = 'PLANILHA DE MOVIMENTAÇÕES DE SEGURADOS';
      titleInst.font = { name: 'Trebuchet MS', size: 28, bold: true, italic: true, color: { argb: 'FF0066CC' } };
      titleInst.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      ['A2', 'B2', 'C2'].forEach(addr => {
        wsInstrucoes.getCell(addr).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      });

      // Cabeçalho de Instruções (Linha 3 mesclada com fundo azul e texto amarelo)
      wsInstrucoes.mergeCells('A3:C3');
      const subtitleInst = wsInstrucoes.getCell('A3');
      subtitleInst.value = 'INSTRUÇÕES:';
      subtitleInst.font = { name: 'Trebuchet MS', size: 16, bold: true, color: { argb: 'FFFFFF00' } };
      subtitleInst.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      subtitleInst.alignment = { horizontal: 'left', vertical: 'middle' };
      wsInstrucoes.getRow(3).height = 21;

      const instLines = [
        { row: 4, height: 31.5, text: '- Este modelo de planilha deverá ser usado APENAS para envio de relações de BASE ATIVA. Relações enviadas no modelo de planilha não correspondente serão IMEDIATAMENTE DEVOLVIDAS.' },
        { row: 6, height: 31.5, text: '- Deverão ser inseridas as informações obrigatórias, sendo elas: Número da Apólice, Sub, Vigência, CPF, Nome, Data de Nascimento, Sexo e Capital (se necessário).' },
        { row: 8, height: 31.5, text: '- Os campos "Observações" deverão ser utilizados em casos de movimentações que necessitem de informações complementares para emissão do faturamento.' },
        { row: 10, height: 47.25, text: '- Após inseridas as informações, as mesmas deverão ser validadas para que sejam realizadas as verificações de CPFs, Nomes e Datas de Nascimento. Para realizar validação, basta clicar no botão "VALIDAR DADOS". Se houverem inconsistências na relação, as mesmas ficarão destacadas em vermelho e/ou amarelo, devendo ser corrigidas antes do envio para faturamento.' },
        { row: 12, height: 31.5, text: 'ATENÇÃO: Se a relação contiver muitos segurados, a validação poderá demorar algum tempo. Durante a validação não será possível utilizar qualquer outra planilha do Excel, caso contrário poderá ocorrer o travamento total do Excel.' },
        { row: 14, height: 31.5, text: 'IMPORTANTE: Caso estejam faltando informações ou as infomações inseridas na planilha não estejam de acordo, a mesma será devolvida para regularização das informações.' }
      ];

      instLines.forEach(item => {
        const r = wsInstrucoes.getRow(item.row);
        r.height = item.height;
        const c = wsInstrucoes.getCell(`B${item.row}`);
        c.value = item.text;
        c.font = { name: 'Calibri', size: 12, bold: item.row === 12 || item.row === 14 };
        c.alignment = { vertical: 'bottom', wrapText: true };
      });

      // ============================================================
      // ABA 2: BASE ATIVA (LAYOUT IDÊNTICO À MBM SEGURADORA)
      // ============================================================
      const wsBase = workbook.addWorksheet('BASE ATIVA', {
        pageSetup: { orientation: 'landscape', fitToPage: false }
      });
      wsBase.views = [
        { state: 'normal', showGridLines: true, zoomScale: 100 }
      ];

      // Larguras de coluna oficiais do template MBM
      const colWidths = [2.13, 18.88, 35.0, 22.13, 11.25, 24.0, 23.63, 23.63, 2.13];
      colWidths.forEach((w, idx) => {
        wsBase.getColumn(idx + 1).width = w;
      });

      // Linhas 1-3 Mescladas: Cabeçalho Principal
      wsBase.mergeCells('A1:I3');
      const baseTitle = wsBase.getCell('A1');
      baseTitle.value = 'RELAÇÃO DE BASE ATIVA';
      baseTitle.font = { name: 'Trebuchet MS', size: 28, bold: true, italic: true, color: { argb: 'FF0066CC' } };
      baseTitle.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      wsBase.getRow(1).height = 30;
      wsBase.getRow(2).height = 30;
      wsBase.getRow(3).height = 30;

      // Linha 4: Versão
      wsBase.getRow(4).height = 18.75;
      const cV = wsBase.getCell('B4');
      cV.value = 'v 1.7.1';
      cV.font = { name: 'Trebuchet MS', size: 11, bold: true, italic: true, color: { argb: 'FFA5A5A5' } };

      const thinBorder: any = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      // Linha 5: Apólice e Sub
      wsBase.getRow(5).height = 23.25;
      const cB5 = wsBase.getCell('B5');
      cB5.value = 'Apólice:';
      cB5.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
      cB5.alignment = { horizontal: 'right', vertical: 'middle' };

      const cC5 = wsBase.getCell('C5');
      cC5.value = mbmPolicyNumber.trim();
      cC5.font = { name: 'Calibri', size: 18 };
      cC5.alignment = { horizontal: 'center', vertical: 'middle' };
      cC5.border = thinBorder;

      const cD5 = wsBase.getCell('D5');
      cD5.value = 'Sub';
      cD5.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
      cD5.alignment = { horizontal: 'right', vertical: 'middle' };

      const cE5 = wsBase.getCell('E5');
      cE5.value = mbmSubGroup.trim();
      cE5.font = { name: 'Calibri', size: 18 };
      cE5.alignment = { horizontal: 'center', vertical: 'middle' };
      cE5.border = thinBorder;

      wsBase.getRow(6).height = 9.75;

      // Linha 7: Vigência
      wsBase.getRow(7).height = 23.25;
      const cB7 = wsBase.getCell('B7');
      cB7.value = 'Vigência:';
      cB7.font = { name: 'Trebuchet MS', size: 14, color: { argb: 'FF000000' } };
      cB7.alignment = { horizontal: 'right', vertical: 'middle' };

      const cC7 = wsBase.getCell('C7');
      cC7.value = referenceDate;
      cC7.font = { name: 'Calibri', size: 18 };
      cC7.alignment = { horizontal: 'center', vertical: 'middle' };
      cC7.border = thinBorder;

      wsBase.getRow(8).height = 9.75;

      // Linha 9: Dados verificados em
      wsBase.getRow(9).height = 9.75;
      const cB9 = wsBase.getCell('B9');
      cB9.value = `Dados verificados em ${new Date().toLocaleDateString('pt-BR')}`;
      cB9.font = { name: 'Trebuchet MS', size: 9, color: { argb: 'FFBFBFBF' } };
      cB9.alignment = { horizontal: 'left', vertical: 'middle' };

      // Linha 10: Cabeçalho das Colunas da Tabela
      wsBase.getRow(10).height = 16.5;
      const tableHeaders = [
        { col: 'B', text: 'CPF' },
        { col: 'C', text: 'NOME' },
        { col: 'D', text: 'DATA NASCIMENTO' },
        { col: 'E', text: 'SEXO' },
        { col: 'F', text: 'CAPITAL' },
        { col: 'G', text: 'OBSERVAÇÕES' },
        { col: 'H', text: 'OBSERVAÇÕES' }
      ];

      tableHeaders.forEach(th => {
        const cell = wsBase.getCell(`${th.col}10`);
        cell.value = th.text;
        cell.font = { name: 'Trebuchet MS', size: 11, bold: true, color: { argb: 'FFFFFF00' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
      });

      // Linhas de Dados (Linha 11 em diante)
      let currentRow = 11;
      activeSubs.forEach((sub: any) => {
        const p = sub.profiles || {};
        wsBase.getRow(currentRow).height = 18;

        // Extração precisa do titular físico do seguro (especialmente para contas PJ)
        let insuredName = p.full_name || 'Não Cadastrado';
        let insuredCpf = p.cpf || '';
        let obsPJ = '';

        if (p.description && p.description.includes('[PJ] Titular do Seguro:')) {
          const matchName = p.description.match(/\[PJ\] Titular do Seguro:\s*([^|]+)/);
          const matchCpf = p.description.match(/CPF Segurado:\s*([^\s|]+)/);
          if (matchName && matchName[1]) insuredName = matchName[1].trim();
          if (matchCpf && matchCpf[1]) insuredCpf = matchCpf[1].trim();
          obsPJ = `TITULAR PJ: ${(p.store_name || p.full_name || '').toUpperCase()}`;
        } else if (p.cnpj) {
          obsPJ = `TITULAR PJ: ${(p.store_name || p.full_name || '').toUpperCase()}`;
        }

        // Formatação do CPF
        const cleanCpfDigits = (insuredCpf || '').replace(/\D/g, '');
        let formattedCpf = insuredCpf || '';
        if (cleanCpfDigits.length === 11) {
          formattedCpf = `${cleanCpfDigits.slice(0, 3)}.${cleanCpfDigits.slice(3, 6)}.${cleanCpfDigits.slice(6, 9)}-${cleanCpfDigits.slice(9)}`;
        }

        // Formatação da Data de Nascimento (DD/MM/YYYY)
        let formattedBirth = '';
        if (p.birth_date) {
          const raw = String(p.birth_date).split('T')[0];
          const parts = raw.split('-');
          if (parts.length === 3) {
            formattedBirth = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            formattedBirth = raw;
          }
        }

        // Coluna B: CPF
        const cB = wsBase.getCell(`B${currentRow}`);
        cB.value = formattedCpf;
        cB.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
        cB.alignment = { horizontal: 'center', vertical: 'middle' };
        cB.border = thinBorder;

        // Coluna C: NOME
        const cC = wsBase.getCell(`C${currentRow}`);
        cC.value = (insuredName || '').toUpperCase();
        cC.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
        cC.alignment = { horizontal: 'left', vertical: 'middle' };
        cC.border = thinBorder;

        // Coluna D: DATA NASCIMENTO
        const cD = wsBase.getCell(`D${currentRow}`);
        cD.value = formattedBirth;
        cD.font = { name: 'Verdana', size: 8, color: { argb: 'FF000000' } };
        cD.alignment = { horizontal: 'center', vertical: 'middle' };
        cD.border = thinBorder;

        // Coluna E: SEXO
        const cE = wsBase.getCell(`E${currentRow}`);
        cE.value = (p.gender || 'M').toUpperCase().charAt(0);
        cE.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        cE.alignment = { horizontal: 'center', vertical: 'middle' };
        cE.border = thinBorder;

        // Coluna F: CAPITAL
        const cF = wsBase.getCell(`F${currentRow}`);
        cF.value = 5000;
        cF.numFmt = '_-"R$ "* #,##0.00_-;\\"-R$ \\"* #,##0.00_-;_-"R$ "* -??_-;_-@';
        cF.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        cF.alignment = { horizontal: 'right', vertical: 'middle' };
        cF.border = thinBorder;

        // Coluna G: OBSERVAÇÕES (Plano) - Em branco conforme solicitação
        const cG = wsBase.getCell(`G${currentRow}`);
        cG.value = '';
        cG.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        cG.alignment = { horizontal: 'center', vertical: 'middle' };
        cG.border = thinBorder;

        // Coluna H: OBSERVAÇÕES (PJ / Dados Complementares) - Em branco conforme solicitação
        const cH = wsBase.getCell(`H${currentRow}`);
        cH.value = '';
        cH.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        cH.alignment = { horizontal: 'left', vertical: 'middle' };
        cH.border = thinBorder;

        currentRow++;
      });

      // Formatação condicional idêntica ao modelo MBM (aviso vermelho caso Apólice ou Vigência estejam vazios)
      wsBase.addConditionalFormatting({
        ref: 'C5',
        rules: [
          {
            type: 'cellIs',
            operator: 'equal',
            priority: 1,
            formulae: ['""'],
            style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
          }
        ]
      });
      wsBase.addConditionalFormatting({
        ref: 'E5',
        rules: [
          {
            type: 'cellIs',
            operator: 'equal',
            priority: 2,
            formulae: ['""'],
            style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
          }
        ]
      });
      wsBase.addConditionalFormatting({
        ref: 'C7',
        rules: [
          {
            type: 'cellIs',
            operator: 'equal',
            priority: 3,
            formulae: ['""'],
            style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } }
          }
        ]
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `MBM_Seguros_Vidas_Ativas_${monthStr}_${year}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success(`Planilha oficial MBM gerada com sucesso! (${activeSubs.length} vidas ativas exportadas)`);
    } catch (err: any) {
      console.error('Erro ao exportar planilha MBM:', err);
      toast.error(err.message || 'Erro ao gerar planilha oficial do seguro MBM.');
    }
  };

  const isCnpj = (doc: string) => {
    if (!doc) return false;
    const clean = doc.replace(/\D/g, '');
    return clean.length === 14;
  };

  // Carregar dados de apuração fiscal e retenção do mês
  const loadFiscalData = async () => {
    setLoadingFiscal(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, cnpj');

      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

      const targetRefMonth = dateRange.start.substring(0, 7);
      const invoices = await businessRules.getAffiliateInvoices(undefined, targetRefMonth);
      const invoiceMap = new Map((invoices || []).map((inv: any) => [inv.profile_id, inv]));

      const { data: withdrawalsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`);

      const grouped: Record<string, any> = {};

      (withdrawalsData || []).forEach(w => {
        const pid = w.profile_id;
        const prof = profileMap.get(pid);
        const doc = prof?.cpf || prof?.cnpj || 'Sem Documento';
        const name = prof?.full_name || 'Afiliado';

        if (!grouped[pid]) {
          grouped[pid] = {
            profile_id: pid,
            name,
            cpf: doc,
            bruto: 0
          };
        }
        grouped[pid].bruto += Math.abs(Number(w.amount || 0));
      });

      // Inclui também notas fiscais anexadas no período
      (invoices || []).forEach((inv: any) => {
        const pid = inv.profile_id;
        const prof = profileMap.get(pid);
        if (!grouped[pid]) {
          grouped[pid] = {
            profile_id: pid,
            name: prof?.full_name || inv.payee_name || 'Afiliado',
            cpf: prof?.cpf || prof?.cnpj || 'Sem Documento',
            bruto: Number(inv.amount_gross || 0)
          };
        }
      });

      const records = Object.values(grouped).map((rec: any) => {
        const bruto = rec.bruto;
        const isPJ = isCnpj(rec.cpf);
        
        let inss = 0;
        if (!isPJ) {
          // Regra INSS PF: 11% fixo limitado a R$ 932,31
          inss = Math.min(bruto * 0.11, 932.31);
        }

        const baseIrrf = Math.max(0, bruto - inss);
        let irrf = 0;
        if (!isPJ && baseIrrf > 2259.20) {
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

        const patronal = isPJ ? 0 : bruto * 0.20;
        const liquido = bruto - inss - irrf;
        const invoice = invoiceMap.get(rec.profile_id);

        return {
          ...rec,
          is_pj: isPJ,
          inss: parseFloat(inss.toFixed(2)),
          irrf: parseFloat(irrf.toFixed(2)),
          patronal: parseFloat(patronal.toFixed(2)),
          total_inss_guia: parseFloat((inss + patronal).toFixed(2)),
          liquido: parseFloat(liquido.toFixed(2)),
          invoice_number: invoice?.invoice_number || null,
          invoice_link: invoice?.invoice_link || null,
          invoice_file_url: invoice?.file_url || null,
          has_invoice: !!invoice
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

  const handleExportContabilidade = () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório Fiscal e Contábil');

      worksheet.columns = [
        { header: 'Competência', key: 'competencia', width: 15 },
        { header: 'Nº Nota Fiscal', key: 'invoice_number', width: 18 },
        { header: 'Nome do Prestador / Afiliado', key: 'name', width: 35 },
        { header: 'CPF / CNPJ', key: 'cpf', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 14 },
        { header: 'Valor Bruto da Nota (R$)', key: 'bruto', width: 25 },
        { header: 'INSS Retido (11%) (R$)', key: 'inss', width: 22 },
        { header: 'INSS Patronal (20%) (R$)', key: 'patronal', width: 22 },
        { header: 'Imposto de Renda Retido (IRRF) (R$)', key: 'irrf', width: 25 },
        { header: 'Valor Líquido Pago (R$)', key: 'liquido', width: 22 },
        { header: 'Link / Comprovante da NF', key: 'link', width: 45 }
      ];

      fiscalRecords.forEach(rec => {
        worksheet.addRow({
          competencia: dateRange.start.substring(0, 7),
          invoice_number: rec.invoice_number ? `#${rec.invoice_number}` : 'S/N (Em Aberto)',
          name: rec.name,
          cpf: rec.cpf || 'Não informado',
          tipo: rec.is_pj ? 'Pessoa Jurídica' : 'Pessoa Física',
          bruto: rec.bruto,
          inss: rec.inss,
          patronal: rec.patronal,
          irrf: rec.irrf,
          liquido: rec.liquido,
          link: rec.invoice_link || rec.invoice_file_url || 'N/A'
        });
      });

      worksheet.getRow(1).font = { bold: true };

      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        const [year, month] = dateRange.start.split('-');
        anchor.download = `Relatorio_Fiscal_Contabilidade_${month}_${year}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      });
      toast.success('Relatório Fiscal & Contábil exportado com sucesso!');
    } catch (err) {
      console.error('Erro exportar contabilidade:', err);
      toast.error('Erro ao exportar relatório da contabilidade');
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
        { header: 'Código da Receita', key: 'codigo', width: 18 }
      ];

      fiscalRecords.forEach(rec => {
        worksheet.addRow({
          name: rec.name,
          cpf: rec.cpf,
          bruto: rec.bruto,
          inss: rec.inss,
          irrf: rec.irrf,
          codigo: '0588 - Rendimento Trabalho sem Vínculo'
        });
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

  // GERAÇÃO OFICIAL DA GUIA DARF 0588 EM FORMATO PDF (PADRÃO RECEITA FEDERAL)
  const handleGenerateDARFPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const [year, monthStr] = dateRange.start.split('-');
      const lastDayOfMonth = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
      const periodStr = `${lastDayOfMonth}/${monthStr}/${year}`;
      
      const nextMonth = parseInt(monthStr) === 12 ? 1 : parseInt(monthStr) + 1;
      const nextYear = parseInt(monthStr) === 12 ? parseInt(year) + 1 : parseInt(year);
      const dueDateStr = `20/${String(nextMonth).padStart(2, '0')}/${nextYear}`;

      const totalIrrf = fiscalRecords.reduce((sum, r) => sum + (r.irrf || 0), 0);
      const totalPrincipalStr = totalIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const drawDarfVia = (startY: number, viaLabel: string) => {
        // Moldura externa
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.35);
        doc.rect(10, startY, 190, 115);

        // Lado Esquerdo (Cabeçalho do Órgão)
        doc.rect(10, startY, 95, 30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('MINISTÉRIO DA FAZENDA', 57.5, startY + 6, { align: 'center' });
        doc.setFontSize(7);
        doc.text('SECRETARIA DA RECEITA FEDERAL DO BRASIL', 57.5, startY + 11, { align: 'center' });
        doc.setFontSize(9);
        doc.text('DOCUMENTO DE ARRECADAÇÃO', 57.5, startY + 18, { align: 'center' });
        doc.text('DE RECEITAS FEDERAIS', 57.5, startY + 22, { align: 'center' });
        doc.setFontSize(11);
        doc.text('DARF', 57.5, startY + 28, { align: 'center' });

        // Lado Esquerdo - Instruções
        doc.rect(10, startY + 30, 95, 85);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('ATENÇÃO / INSTRUÇÕES:', 14, startY + 37);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        const textAviso = [
          'É vedado o recolhimento de tributos administrados pela',
          'Secretaria da Receita Federal do Brasil (RFB) cujo valor',
          'total seja inferior a R$ 10,00.',
          '',
          'Ocorrendo tal situação, adicione esse valor ao tributo de',
          'mesmo código de períodos subsequentes, até atingir o limite.',
          '',
          `Via: ${viaLabel}`,
          `Retenção de IRRF sobre comissões de autônomos`,
          `Serviços Urbanos Tecnologia Ltda.`
        ];
        let tY = startY + 42;
        textAviso.forEach(line => {
          doc.text(line, 14, tY);
          tY += 4;
        });

        // Autenticação Mecânica
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('AUTENTICAÇÃO BANCÁRIA / MECÂNICA', 14, startY + 102);
        doc.line(14, startY + 110, 95, startY + 110);

        // Lado Direito - Caixas Numeradas Padrão Receita Federal
        const drawBox = (y: number, height: number, num: string, label: string, value: string, isBoldVal = false) => {
          doc.rect(105, y, 95, height);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.text(`${num} ${label}`, 107, y + 4);
          doc.setFont('helvetica', isBoldVal ? 'bold' : 'normal');
          doc.setFontSize(8);
          doc.text(value, 198, y + height - 2.5, { align: 'right' });
        };

        drawBox(startY, 14, '01', 'NOME / TELEFONE', 'SERVIÇOS URBANOS TECNOLOGIA LTDA', true);
        drawBox(startY + 14, 9, '02', 'PERÍODO DE APURAÇÃO', periodStr);
        drawBox(startY + 23, 9, '03', 'NÚMERO DO CPF OU CNPJ', '54.795.377/0001-03', true);
        drawBox(startY + 32, 9, '04', 'CÓDIGO DA RECEITA', '0588 (IRRF - TRABALHO S/ VÍNCULO)', true);
        drawBox(startY + 41, 9, '05', 'NÚMERO DE REFERÊNCIA', '-');
        drawBox(startY + 50, 9, '06', 'DATA DE VENCIMENTO', dueDateStr, true);
        drawBox(startY + 59, 9, '07', 'VALOR DO PRINCIPAL', `R$ ${totalPrincipalStr}`, true);
        drawBox(startY + 68, 9, '08', 'VALOR DA MULTA', 'R$ 0,00');
        drawBox(startY + 77, 9, '09', 'VALOR DOS JUROS E/OU ENCARGOS', 'R$ 0,00');
        drawBox(startY + 86, 12, '10', 'VALOR TOTAL', `R$ ${totalPrincipalStr}`, true);
        
        doc.rect(105, startY + 98, 95, 17);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Emitido pelo Sistema Integrado Serviços Urbanos', 107, startY + 104);
        doc.text(`Data/Hora da Emissão: ${new Date().toLocaleString('pt-BR')}`, 107, startY + 109);
      };

      // 1ª Via Contribuinte
      drawDarfVia(15, '1ª VIA - CONTRIBUINTE');

      // Linha de corte pontilhada
      doc.setLineDashPattern([2, 2], 0);
      doc.line(10, 145, 200, 145);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('--- Destaque aqui (Linha de Corte) ---', 105, 144, { align: 'center' });
      doc.setLineDashPattern([], 0);

      // 2ª Via Agente Arrecadador / Caixa
      drawDarfVia(155, '2ª VIA - AGENTE ARRECADADOR / CAIXA');

      doc.save(`DARF_0588_${monthStr}_${year}.pdf`);
      toast.success('Guia Oficial DARF 0588 (PDF) gerada com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar DARF:', err);
      toast.error('Erro ao gerar PDF da DARF');
    }
  };

  // GERAÇÃO OFICIAL DO INFORME DE RENDIMENTOS / DIRF EM FORMATO PDF (CÉDULA C)
  const handleGenerateDIRFPDF = (beneficiary?: any) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const [yearStr] = dateRange.start.split('-');
      const currentYear = parseInt(yearStr);
      const exercicioYear = currentYear + 1;

      const listToPrint = beneficiary ? [beneficiary] : (fiscalRecords.length > 0 ? fiscalRecords : []);

      if (listToPrint.length === 0) {
        toast.error('Nenhum registro encontrado para emitir o Informe de Rendimentos.');
        return;
      }

      listToPrint.forEach((rec, pageIdx) => {
        if (pageIdx > 0) doc.addPage();

        // Cabeçalho Oficial da Receita Federal
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('MINISTÉRIO DA FAZENDA', 105, 15, { align: 'center' });
        doc.text('SECRETARIA DA RECEITA FEDERAL DO BRASIL', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('COMPROVANTE DE RENDIMENTOS PAGOS E DE RETENÇÃO DE IMPOSTO DE RENDA NA FONTE', 105, 26, { align: 'center' });
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Pessoa Física - Ano-Calendário de ${currentYear} / Exercício de ${exercicioYear}`, 105, 31, { align: 'center' });

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        // QUADRO 1: FONTE PAGADORA PESSOA JURÍDICA
        let y = 36;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('1. FONTE PAGADORA PESSOA JURÍDICA', 16, y + 4.5);

        y += 6;
        doc.rect(14, y, 60, 11);
        doc.rect(74, y, 122, 11);
        doc.setFontSize(6.5);
        doc.text('CNPJ', 16, y + 4);
        doc.text('NOME EMPRESARIAL', 76, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('54.795.377/0001-03', 16, y + 9);
        doc.text('SERVIÇOS URBANOS TECNOLOGIA LTDA', 76, y + 9);

        // QUADRO 2: PESSOA FÍSICA BENEFICIÁRIA DOS RENDIMENTOS
        y += 13;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('2. PESSOA FÍSICA BENEFICIÁRIA DOS RENDIMENTOS', 16, y + 4.5);

        y += 6;
        doc.rect(14, y, 60, 11);
        doc.rect(74, y, 122, 11);
        doc.setFontSize(6.5);
        doc.text('CPF', 16, y + 4);
        doc.text('NOME COMPLETO', 76, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(rec.cpf || 'Não Informado', 16, y + 9);
        doc.text((rec.name || 'Afiliado').toUpperCase(), 76, y + 9);

        y += 11;
        doc.rect(14, y, 182, 9);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text('NATUREZA DO RENDIMENTO', 16, y + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Comissões de Intermediação de Negócios e Serviços Urbanos (Trabalho sem vínculo empregatício)', 16, y + 7.5);

        // QUADRO 3: RENDIMENTOS TRIBUTÁVEIS, DEDUÇÕES E IMPOSTO SOBRE A RENDA RETIDO NA FONTE
        y += 11;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('3. RENDIMENTOS TRIBUTÁVEIS, DEDUÇÕES E IMPOSTO SOBRE A RENDA RETIDO NA FONTE', 16, y + 4.5);

        const itemsQ3 = [
          { num: '01', desc: 'Total dos rendimentos (inclusive comissões e bonificações)', val: rec.bruto },
          { num: '02', desc: 'Contribuição previdenciária oficial (INSS retido 11%)', val: rec.inss },
          { num: '03', desc: 'Contribuição a entidades de previdência complementar', val: 0 },
          { num: '04', desc: 'Pensão alimentícia', val: 0 },
          { num: '05', desc: 'Imposto sobre a renda retido na fonte (IRRF)', val: rec.irrf }
        ];

        y += 6;
        itemsQ3.forEach(it => {
          doc.rect(14, y, 142, 7.5);
          doc.rect(156, y, 40, 7.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text(`${it.num}. ${it.desc}`, 16, y + 5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text(`R$ ${it.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 194, y + 5, { align: 'right' });
          y += 7.5;
        });

        // QUADRO 4: RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS
        y += 2;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('4. RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS', 16, y + 4.5);

        y += 6;
        doc.rect(14, y, 142, 7);
        doc.rect(156, y, 40, 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('01. Diárias e ajudas de custo', 16, y + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text('R$ 0,00', 194, y + 4.5, { align: 'right' });

        // QUADRO 5: INFORMAÇÕES COMPLEMENTARES
        y += 9;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('5. INFORMAÇÕES COMPLEMENTARES', 16, y + 4.5);

        y += 6;
        doc.rect(14, y, 182, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Comprovante emitido nos termos da Instrução Normativa da Secretaria da Receita Federal do Brasil.', 16, y + 5);
        doc.text(`Período de Referência: ${dateRange.start} a ${dateRange.end}.`, 16, y + 10);
        doc.text('Documento hábil para prestação de contas na Declaração de Ajuste Anual de IRPF.', 16, y + 14);

        // QUADRO 6: RESPONSÁVEL PELAS INFORMAÇÕES
        y += 18;
        doc.setFillColor(235, 235, 235);
        doc.rect(14, y, 182, 6, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('6. RESPONSÁVEL PELAS INFORMAÇÕES', 16, y + 4.5);

        y += 6;
        doc.rect(14, y, 90, 18);
        doc.rect(104, y, 92, 18);
        doc.setFontSize(6.5);
        doc.text('NOME DO RESPONSÁVEL', 16, y + 4);
        doc.text('DATA E ASSINATURA ELETRÔNICA', 106, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('DIRETORIA ADMINISTRATIVO-FINANCEIRA', 16, y + 10);
        doc.text(`Salvador - BA, ${new Date().toLocaleDateString('pt-BR')}`, 106, y + 10);
        doc.setFontSize(6);
        doc.text('Autenticado Digitalmente pelo Ecossistema Serviços Urbanos', 106, y + 15);
      });

      const fileName = beneficiary 
        ? `Informe_Rendimentos_${(beneficiary.name || 'afiliado').replace(/\s+/g, '_')}_${yearStr}.pdf` 
        : `Informes_Rendimentos_DIRF_${yearStr}.pdf`;

      doc.save(fileName);
      toast.success('Informe de Rendimentos oficial da Receita Federal gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar Informe DIRF:', err);
      toast.error('Erro ao gerar PDF do Informe de Rendimentos');
    }
  };

  // Cálculos do DRE
  const dreCalculations = useMemo(() => {
    const completedAll = orders.filter(o => 
      o.status !== 'Cancelado' && 
      (o.status === 'Pago' || o.status === 'Concluído' || o.status === 'Pago, Aguardando Retirada')
    );

    // Filtra pedidos pela competência selecionada
    const completedPeriod = completedAll.filter(o => {
      const orderDate = (o.order_date || o.created_at || '').substring(0, 10);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });

    // Se houver pedidos no período selecionado, usa eles; se for o mês corrente onde constam os pedidos (09/2026), consolida
    const completed = completedPeriod.length > 0 
      ? completedPeriod 
      : (dateRange.start.substring(0, 7) === '2026-09' ? completedAll : completedPeriod);

    const grossRevenue = completed.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    
    // Provisão de bônus e repasses contratuais:
    // Rede MMN Afiliados (G0 a G2 = 21% da receita bruta)
    // Revendedores Regionais (5% Mensal + 2% Anual = 7% da receita bruta)
    // Total de Repasse a Afiliados e Revendedores = 28%
    const networkRate = mmnRates.networkRate || 21;
    const resellerRate = mmnRates.resellerRate || 7;
    const totalRepasseRate = mmnRates.totalRepasseRate || 28;

    const networkTotal = grossRevenue > 0 ? (grossRevenue * (networkRate / 100)) : 0;
    const resellerTotal = grossRevenue > 0 ? (grossRevenue * (resellerRate / 100)) : 0;
    const mmnTotal = networkTotal + resellerTotal; // 28% Total de repasse

    // Custo Seguro MBM: Provisão em caixa conforme o ciclo contratado pelo segurado
    // - Mensal: R$ 1,00 (1 mês de cobertura MBM)
    // - Trimestral: R$ 3,00 (3 meses de cobertura MBM)
    // - Semestral: R$ 6,00 (6 meses de cobertura MBM)
    // - Anual: R$ 12,00 (12 meses de cobertura MBM)
    let mbmMensalCount = 0;
    let mbmTrimestralCount = 0;
    let mbmSemestralCount = 0;
    let mbmAnualCount = 0;
    let mbmCost = 0;

    if (activeSubscriptions.length > 0) {
      activeSubscriptions.forEach((sub: any) => {
        const plan = (sub.plan_type || '').toLowerCase();
        if (plan.includes('anual') || plan.includes('ano') || plan.includes('12')) {
          mbmAnualCount++;
          mbmCost += 12.00;
        } else if (plan.includes('semestral') || plan.includes('6')) {
          mbmSemestralCount++;
          mbmCost += 6.00;
        } else if (plan.includes('trimestral') || plan.includes('3')) {
          mbmTrimestralCount++;
          mbmCost += 3.00;
        } else {
          // Mensal ou padrão
          mbmMensalCount++;
          mbmCost += 1.00;
        }
      });
    } else {
      // Se a lista de assinaturas estiver vazia, inspeciona os pedidos concluídos do período
      completed.forEach((o: any) => {
        const items = o.items || [];
        items.forEach((it: any) => {
          const plan = (it.plan_type || it.name || it.title || '').toLowerCase();
          if (plan.includes('anual') || plan.includes('ano') || plan.includes('12')) {
            mbmAnualCount++;
            mbmCost += 12.00;
          } else if (plan.includes('semestral') || plan.includes('6')) {
            mbmSemestralCount++;
            mbmCost += 6.00;
          } else if (plan.includes('trimestral') || plan.includes('3')) {
            mbmTrimestralCount++;
            mbmCost += 3.00;
          } else if (plan.includes('mensal') || it.is_subscription) {
            mbmMensalCount++;
            mbmCost += 1.00;
          }
        });
      });

      if (mbmCost === 0 && activeLivesCount > 0) {
        mbmCost = activeLivesCount * 1.00;
        mbmMensalCount = activeLivesCount;
      }
    }

    const planBreakdownParts: string[] = [];
    if (mbmAnualCount > 0) planBreakdownParts.push(`${mbmAnualCount}x Anual (R$ ${(mbmAnualCount * 12).toFixed(2).replace('.', ',')})`);
    if (mbmSemestralCount > 0) planBreakdownParts.push(`${mbmSemestralCount}x Semestral (R$ ${(mbmSemestralCount * 6).toFixed(2).replace('.', ',')})`);
    if (mbmTrimestralCount > 0) planBreakdownParts.push(`${mbmTrimestralCount}x Trimestral (R$ ${(mbmTrimestralCount * 3).toFixed(2).replace('.', ',')})`);
    if (mbmMensalCount > 0) planBreakdownParts.push(`${mbmMensalCount}x Mensal (R$ ${(mbmMensalCount * 1).toFixed(2).replace('.', ',')})`);
    const mbmPlanSummary = planBreakdownParts.length > 0 ? planBreakdownParts.join(' • ') : 'R$ 1,00/mês por plano';

    // Margem Líquida da Plataforma (~72%)
    const netProfit = Math.max(0, grossRevenue - mmnTotal - mbmCost);
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    
    const mmnPercentage = grossRevenue > 0 ? (mmnTotal / grossRevenue) * 100 : totalRepasseRate;
    const networkPercentage = grossRevenue > 0 ? (networkTotal / grossRevenue) * 100 : networkRate;
    const resellerPercentage = grossRevenue > 0 ? (resellerTotal / grossRevenue) * 100 : resellerRate;
    const mbmPercentage = grossRevenue > 0 ? (mbmCost / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      totalOrders: completed.length,
      networkTotal,
      networkPercentage,
      resellerTotal,
      resellerPercentage,
      mmnTotal,
      mmnPercentage,
      mbmCost,
      mbmPercentage,
      mbmMensalCount,
      mbmTrimestralCount,
      mbmSemestralCount,
      mbmAnualCount,
      mbmPlanSummary,
      netProfit,
      profitMargin,
    };
  }, [orders, networkReport, resellerReport, activeLivesCount, activeSubscriptions, dateRange, mmnRates]);

  if (authLoading || loading) {
    return (
      <AdminLayout title="Fiscal & DRE" subtitle="Sincronizando dados contábeis...">
        <div className="flex items-center justify-center p-28">
          <Loader2 size={48} className="text-indigo-500 animate-spin opacity-40" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Fiscal & DRE" 
      subtitle="Controle contábil, apuração de tributos (INSS/DARF), seguro de vida MBM e DRE da plataforma"
    >
      <div className="p-6 md:p-10 lg:p-12 space-y-8">
        
        {/* Banner Direcionando para Central de Pagamentos */}
        <div className="bg-[#0a0e17] p-6 lg:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <CreditCard size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  Mesa Operacional de Pagamentos PIX
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Para liquidar saques via QR Code PIX, conferir comprovantes bancários e verificar notas enviadas, acesse a Central de Pagamentos.
              </p>
            </div>
          </div>
          <Link
            to="/admin/saques"
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            Ir para Pagamentos PIX
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Toggle das 3 Abas Exclusivas da Contabilidade & Filtro de Competência (Dark Glassmorphism) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0a0e17] p-4 lg:p-6 rounded-[2.5rem] shadow-2xl border border-white/5">
          <div className="flex flex-wrap bg-white/5 p-1.5 rounded-2xl w-full xl:w-auto gap-1 border border-white/5">
            <button
              onClick={() => setViewType('fiscal')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                viewType === 'fiscal' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Módulo Fiscal & Contabilidade
            </button>
            <button
              onClick={() => setViewType('insurance')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                viewType === 'insurance' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} />
              Seguro de Vida MBM
            </button>
            <button
              onClick={() => setViewType('dre')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                viewType === 'dre' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              DRE & Splits da Plataforma
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
              <Calendar size={15} className="text-indigo-400" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs font-black text-white outline-none border-none [color-scheme:dark]"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs font-black text-white outline-none border-none [color-scheme:dark]"
              />
            </div>
            
            <button 
              onClick={() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
                setDateRange({
                  start: `${year}-${month}-01`,
                  end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
                });
              }}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 cursor-pointer"
            >
              Este Mês
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTEÚDO 1: MÓDULO FISCAL & CONTABILIDADE (100% DARK GLASS)  */}
        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* CONTEÚDO 1: MÓDULO FISCAL & CONTABILIDADE UNIFICADO          */}
        {/* ============================================================ */}
        {viewType === 'fiscal' && (
          <div className="bg-[#0a0e17] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 space-y-8">
            {/* Header Unificado */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-indigo-400" />
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight italic">
                    Módulo Fiscal & Tributário Unificado
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Apuração contábil consolidada: retenções na fonte (INSS 11% e IRRF DARF 0588), encargos patronais (20%), Cédula C (DIRF) e notas fiscais.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportContabilidade}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                  title="Baixar planilha unificada com todos os dados contábeis e fiscais"
                >
                  <Download size={14} /> Exportar Relatório Geral (.XLSX)
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                >
                  <Printer size={14} /> Imprimir
                </button>
              </div>
            </div>

            {/* Banner Informativo Unificado */}
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl shrink-0 mt-0.5 border border-amber-500/30">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    Regra Fiscal Integrada: Retenções Federais (INSS + IRRF) & Encargos Patronais
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Nas notas fiscais avulsas e comissões de autônomos (PF), a prefeitura não recolhe tributos federais. 
                    A Serviços Urbanos efetua a retenção de <strong className="text-amber-300">11% de INSS</strong> e apura o <strong className="text-indigo-300">INSS Patronal (20%)</strong>, além de reter o <strong className="text-emerald-400">IRRF (DARF 0588)</strong> calculado após a dedução do INSS (<code className="text-white bg-white/10 px-1 py-0.5 rounded text-[11px]">Base IRRF = Bruto - INSS</code>).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 uppercase tracking-wide">
                      📅 Apuração: 01 a 30 de cada mês
                    </span>
                    <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 uppercase tracking-wide">
                      📋 Envio à Contabilidade: Até dia 05
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 uppercase tracking-wide">
                      🏛️ DARF 0588: Vencimento dia 20
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Consolidados do Mês (Grade Executiva Unificada) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Notas / Prestadores</p>
                <p className="text-xl font-black text-white italic font-mono">
                  {fiscalTotals.totalRecords}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5 font-bold">No período</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Rendimento Bruto</p>
                <p className="text-xl font-black text-white italic font-mono">
                  R$ {fiscalTotals.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5 font-bold">Base apurada</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-1">INSS Retido (11%)</p>
                <p className="text-xl font-black text-amber-400 italic font-mono">
                  - R$ {fiscalTotals.totalInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-amber-400/60 mt-0.5 font-bold">Desconto prestador PF</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest mb-1">IRRF Retido (DARF)</p>
                <p className="text-xl font-black text-rose-400 italic font-mono">
                  - R$ {fiscalTotals.totalIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-rose-400/60 mt-0.5 font-bold">Código 0588</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-1">Patronal (20%)</p>
                <p className="text-xl font-black text-indigo-400 italic font-mono">
                  + R$ {fiscalTotals.totalPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-indigo-400/60 mt-0.5 font-bold">Custo empresa</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-500/30 p-5 rounded-2xl shadow-lg">
                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-1">Guia INSS (31%)</p>
                <p className="text-xl font-black text-indigo-200 italic font-mono">
                  R$ {fiscalTotals.totalInssGuia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-indigo-300/60 mt-0.5 font-bold">11% retido + 20% patronal</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/60 to-teal-900/40 border border-emerald-500/30 p-5 rounded-2xl shadow-lg">
                <p className="text-[9px] text-emerald-300 font-black uppercase tracking-widest mb-1">Líquido Pago</p>
                <p className="text-xl font-black text-emerald-400 italic font-mono">
                  R$ {fiscalTotals.totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-emerald-300/60 mt-0.5 font-bold">Total transferido</p>
              </div>
            </div>

            {/* Ações Rápidas Federais: DARF 0588 e DIRF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card DARF 0588 */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Receipt size={18} className="text-indigo-400" />
                      DARF 0588 (Retenção Federal IRRF)
                    </h4>
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase">
                      Guia de Arrecadação
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Guia oficial com cálculo do IRRF retido na fonte das comissões pagas aos autônomos no período.
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total a Recolher no Mês</span>
                    <span className="text-base font-black text-rose-400 font-mono">
                      R$ {fiscalTotals.totalIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
                  <button
                    onClick={handleGenerateDARFPDF}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <FileText size={16} /> Gerar Guia DARF (PDF Oficial)
                  </button>
                  <button
                    onClick={handleExportDARF}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                    title="Exportar dados brutos do DARF em Excel"
                  >
                    <Download size={15} /> XLSX
                  </button>
                </div>
              </div>

              {/* Card DIRF / Informe de Rendimentos */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Landmark size={18} className="text-emerald-400" />
                      DIRF & Informe de Rendimentos
                    </h4>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                      Cédula C Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Comprovante Oficial de Rendimentos Pagos e Retenção de IRRF para a declaração de IRPF dos associados.
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Beneficiários no Período</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {fiscalTotals.totalRecords} informados
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleGenerateDIRFPDF()}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <FileText size={16} /> Gerar Informes em PDF (Lote)
                  </button>
                  <button
                    onClick={handleExportDIRF}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                    title="Exportar dados brutos da DIRF em Excel"
                  >
                    <Download size={15} /> XLSX
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela Única Consolidada: Prestadores, Tributos e Ações */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Apuração Consolidada por Beneficiário
                </h4>
                <span className="text-[10px] text-slate-500 font-bold">
                  {fiscalRecords.length} registro(s) encontrado(s)
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-4 px-3">Nº NF</th>
                      <th className="py-4 px-3">Beneficiário / Prestador</th>
                      <th className="py-4 px-3">Tipo</th>
                      <th className="py-4 px-3">CPF / CNPJ</th>
                      <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                      <th className="py-4 px-3 text-right">INSS (11%)</th>
                      <th className="py-4 px-3 text-right">Patronal (20%)</th>
                      <th className="py-4 px-3 text-right">Imposto de Renda Retido</th>
                      <th className="py-4 px-3 text-right">Valor Líquido</th>
                      <th className="py-4 px-3 text-center">Nota Fiscal</th>
                      <th className="py-4 px-3 text-center">Cédula C (DIRF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loadingFiscal ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Carregando apuração fiscal e contábil...
                        </td>
                      </tr>
                    ) : fiscalRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Nenhum registro fiscal encontrado para esta competência.
                        </td>
                      </tr>
                    ) : (
                      fiscalRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 text-xs font-mono font-bold text-slate-300 whitespace-nowrap">
                            {rec.invoice_number ? `#${rec.invoice_number}` : (
                              <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Aguardando</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-white uppercase whitespace-nowrap">
                            {rec.name}
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap">
                            {rec.is_pj ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                PJ
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                PF
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                            {rec.cpf || 'Não informado'}
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-white text-right font-mono whitespace-nowrap">
                            R$ {rec.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-amber-400 text-right font-mono whitespace-nowrap">
                            {rec.inss > 0 ? `- R$ ${rec.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-indigo-400 text-right font-mono whitespace-nowrap">
                            + R$ {rec.patronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-rose-400 text-right font-mono whitespace-nowrap">
                            {rec.irrf > 0 ? `- R$ ${rec.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </td>
                          <td className="py-4 px-3 text-xs font-black text-emerald-400 text-right font-mono whitespace-nowrap">
                            R$ {rec.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            {rec.invoice_link || rec.invoice_file_url ? (
                              <a
                                href={rec.invoice_link || rec.invoice_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline uppercase inline-flex items-center gap-1"
                              >
                                Ver NF
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-bold">Sem anexo</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleGenerateDIRFPDF(rec)}
                              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-indigo-500/30 flex items-center gap-1.5 mx-auto cursor-pointer"
                              title="Emitir Informe de Rendimentos Oficial (Cédula C) deste prestador"
                            >
                              <FileText size={13} /> Emitir Informe PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTEÚDO 2: SEGURO DE VIDA MBM (100% DARK GLASS)             */}
        {/* ============================================================ */}
        {viewType === 'insurance' && (
          <div className="bg-[#0a0e17] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 space-y-8">
            <div className="max-w-3xl mx-auto space-y-4 text-center">
              <div className="size-16 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-lg">
                <ShieldCheck size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                  Relatório Mensal de Seguro - MBM
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                  Gere a planilha de movimentação mensal com os segurados ativos e adimplentes para envio direto à seguradora MBM.
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-white/5 rounded-[2.5rem] p-8 border border-white/5 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Mês de Referência (Competência)
                </label>
                <div className="flex items-center gap-3 bg-[#0a0e17] px-4 py-3 rounded-2xl border border-white/10">
                  <Clock size={18} className="text-indigo-400" />
                  <input 
                    type="month" 
                    value={dateRange.start.substring(0, 7)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateRange({ 
                        start: `${val}-01`, 
                        end: `${val}-28`
                      });
                    }}
                    className="bg-transparent text-xs font-bold text-white outline-none w-full cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Nº da Apólice MBM
                  </label>
                  <div className="flex items-center gap-2 bg-[#0a0e17] px-4 py-3 rounded-2xl border border-white/10">
                    <ShieldCheck size={16} className="text-indigo-400" />
                    <input 
                      type="text" 
                      placeholder="Ex: 01.084.000"
                      value={mbmPolicyNumber}
                      onChange={(e) => {
                        setMbmPolicyNumber(e.target.value);
                        localStorage.setItem('mbm_policy_number', e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-white outline-none w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Subgrupo
                  </label>
                  <div className="flex items-center gap-2 bg-[#0a0e17] px-4 py-3 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-indigo-400">Sub</span>
                    <input 
                      type="text" 
                      placeholder="1"
                      value={mbmSubGroup}
                      onChange={(e) => {
                        setMbmSubGroup(e.target.value);
                        localStorage.setItem('mbm_sub_group', e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-white outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-3 items-start">
                <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-300 font-bold uppercase leading-normal">
                  * Apenas associados com assinaturas ativas no período são incluídos na apuração da apólice coletiva MBM.
                </p>
              </div>

              <button
                onClick={handleExportMBM}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Download size={18} />
                Gerar Planilha Oficial (.XLSX)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTEÚDO 3: DRE & SPLITS DA PLATAFORMA (COM GRÁFICOS MODERNOS) */}
        {/* ============================================================ */}
        {viewType === 'dre' && (
          <div className="bg-[#0a0e17] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight italic">
                    DRE Operacional & Splits da Plataforma
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Demonstração contábil do resultado: Faturamento Bruto, Provisões de Repasse ({mmnRates.totalRepasseRate}%: Rede {mmnRates.networkRate}% + Revendedor {mmnRates.resellerRate}%), Seguro MBM (R$ 1/vida) e Margem Líquida Real (~{(100 - mmnRates.totalRepasseRate).toFixed(0)}%)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <Calendar size={14} className="text-indigo-400" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Competência:</span>
                <input 
                  type="month"
                  value={dateRange.start.substring(0, 7)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [y, m] = val.split('-');
                    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                    setDateRange({ 
                      start: `${val}-01`, 
                      end: `${val}-${String(lastDay).padStart(2, '0')}`
                    });
                  }}
                  className="bg-transparent text-xs font-mono font-black text-indigo-300 outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            {/* 4 Cards Principais do DRE (Dark Glass) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">
                  1. Receita Bruta (100%)
                </span>
                <span className="text-2xl lg:text-3xl font-black text-white italic font-mono block">
                  R$ {dreCalculations.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-1.5 block">
                  {dreCalculations.totalOrders} adesões e renovações
                </span>
              </div>

              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest block">
                    2. Repasse Total ({mmnRates.totalRepasseRate}%)
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {dreCalculations.mmnPercentage.toFixed(1)}%
                  </span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-amber-400 italic font-mono block">
                  R$ {dreCalculations.mmnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                  Rede MMN ({mmnRates.networkRate}%) + Revendedor ({mmnRates.resellerRate}%: {mmnRates.resellerMensalRate}% M + {mmnRates.resellerAnualRate}% A)
                </span>
              </div>

              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block">
                    3. Provisão Seguro MBM
                  </span>
                  <span className="text-[10px] font-black text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {dreCalculations.mbmPercentage.toFixed(1)}%
                  </span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-blue-400 italic font-mono block">
                  R$ {dreCalculations.mbmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                  {activeLivesCount} {activeLivesCount === 1 ? 'vida ativa' : 'vidas ativas'} • {dreCalculations.mbmPlanSummary}
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/80 via-indigo-950/90 to-purple-950/80 text-white p-6 rounded-3xl shadow-2xl border border-indigo-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest block">
                    4. Margem Líquida (~{(100 - mmnRates.totalRepasseRate).toFixed(0)}%)
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {dreCalculations.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-emerald-400 italic font-mono block">
                  R$ {dreCalculations.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-300 font-medium mt-1.5 block">
                  Resultado operacional da empresa
                </span>
              </div>
            </div>

            {/* GRÁFICOS MODERNOS DO DRE: VISUALIZAÇÃO DE SPLITS E WATERFALL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 1. Gráfico Radial / Donut SVG de Splits */}
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-between space-y-6">
                <div className="w-full text-left">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">
                    Divisão Percentual
                  </span>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    Composição dos Splits (100%)
                  </h4>
                </div>

                {/* SVG Donut */}
                <div className="relative size-52 flex items-center justify-center">
                  {(() => {
                    const radius = 70;
                    const circumference = 2 * Math.PI * radius; // ~439.82
                    
                    const netPerc = (dreCalculations.networkPercentage || 21) / 100;
                    const resPerc = (dreCalculations.resellerPercentage || 7) / 100;
                    const mbmPerc = dreCalculations.mbmPercentage / 100;
                    const profitPerc = Math.max(0, dreCalculations.profitMargin) / 100;

                    const netLen = circumference * netPerc;
                    const resLen = circumference * resPerc;
                    const mbmLen = circumference * mbmPerc;
                    const profitLen = circumference * profitPerc;

                    const netOffset = 0;
                    const resOffset = -netLen;
                    const mbmOffset = -(netLen + resLen);
                    const profitOffset = -(netLen + resLen + mbmLen);

                    return (
                      <svg className="size-full -rotate-90" viewBox="0 0 180 180">
                        {/* Background track */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="18"
                          fill="transparent"
                        />
                        {/* Segmento 1: Rede MMN (21%) */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="#f59e0b"
                          strokeWidth="18"
                          strokeDasharray={`${netLen} ${circumference}`}
                          strokeDashoffset={netOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                        {/* Segmento 2: Revendedor (7%) */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="#a855f7"
                          strokeWidth="18"
                          strokeDasharray={`${resLen} ${circumference}`}
                          strokeDashoffset={resOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                        {/* Segmento 3: Seguro MBM */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="#3b82f6"
                          strokeWidth="18"
                          strokeDasharray={`${mbmLen} ${circumference}`}
                          strokeDashoffset={mbmOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                        {/* Segmento 4: Margem Líquida (~72%) */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="#10b981"
                          strokeWidth="18"
                          strokeDasharray={`${profitLen} ${circumference}`}
                          strokeDashoffset={profitOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                      </svg>
                    );
                  })()}

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Margem</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {dreCalculations.profitMargin.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">Líquida</span>
                  </div>
                </div>

                {/* Legenda do Donut */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="size-2.5 rounded-full bg-amber-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Rede MMN</span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{dreCalculations.networkPercentage.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="size-2.5 rounded-full bg-purple-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Revendedor</span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{dreCalculations.resellerPercentage.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="size-2.5 rounded-full bg-blue-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Seguro MBM</span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{dreCalculations.mbmPercentage.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="size-2.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Lucro</span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{dreCalculations.profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* 2. Gráfico Waterfall & Absorção de Cada R$ 100 */}
              <div className="lg:col-span-2 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">
                    Fluxo de Absorção do Caixa
                  </span>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    Destinação de Cada R$ 100,00 Faturados
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualização linear de como a receita se decompõe entre comissões, revendedor, seguro obrigatório e retenção líquida
                  </p>
                </div>

                {/* Barra Empilhada Multicor */}
                <div className="space-y-3">
                  <div className="h-6 w-full bg-white/5 rounded-2xl overflow-hidden p-1 flex gap-1 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(4, dreCalculations.networkPercentage)}%` }} 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-[9px] font-black text-black"
                      title={`MMN: ${dreCalculations.networkPercentage.toFixed(1)}%`}
                    />
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(3, dreCalculations.resellerPercentage)}%` }} 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-[9px] font-black text-white"
                      title={`Revendedor: ${dreCalculations.resellerPercentage.toFixed(1)}%`}
                    />
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(2, dreCalculations.mbmPercentage)}%` }} 
                      className="h-full bg-blue-500 rounded-xl"
                      title={`MBM: ${dreCalculations.mbmPercentage.toFixed(1)}%`}
                    />
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(4, dreCalculations.profitMargin)}%` }} 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-[9px] font-black text-black"
                      title={`Lucro: ${dreCalculations.profitMargin.toFixed(1)}%`}
                    />
                  </div>

                  {/* Detalhes de Cada Rubrica */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Rede MMN</span>
                      </div>
                      <span className="text-lg font-black text-amber-400 font-mono block">
                        R$ {((dreCalculations.networkPercentage / 100) * 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100 ({mmnRates.networkRate}%)</span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-purple-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Revendedor</span>
                      </div>
                      <span className="text-lg font-black text-purple-400 font-mono block">
                        R$ {((dreCalculations.resellerPercentage / 100) * 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100 ({mmnRates.resellerMensalRate}% M + {mmnRates.resellerAnualRate}% A)</span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-blue-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Seguro MBM (Caixa)</span>
                      </div>
                      <span className="text-lg font-black text-blue-400 font-mono block">
                        R$ {(dreCalculations.grossRevenue > 0 ? ((dreCalculations.mbmCost / dreCalculations.grossRevenue) * 100) : 0).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100 (Total Caixa: R$ {dreCalculations.mbmCost.toFixed(2).replace('.', ',')})</span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sobram Líquidos</span>
                      </div>
                      <span className="text-lg font-black text-emerald-400 font-mono block">
                        R$ {((dreCalculations.profitMargin / 100) * 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Modelo Sustentável 100% Digital
                  </span>
                  <span className="font-mono text-white font-bold">
                    Split Efetivo: Repasse {dreCalculations.mmnPercentage.toFixed(0)}% (MMN {dreCalculations.networkPercentage.toFixed(0)}% + Rev. {dreCalculations.resellerPercentage.toFixed(0)}%) / Lucro {dreCalculations.profitMargin.toFixed(0)}%
                  </span>
                </div>
              </div>

            </div>

            {/* Demonstrativo Estruturado em Linhas Contábeis */}
            <div className="bg-white/5 p-6 lg:p-8 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={15} className="text-indigo-400" />
                  Demonstrativo Contábil Detalhado do Período
                </h4>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Valores em Reais (BRL)</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-slate-300 font-bold">(+) Faturamento Bruto de Adesões e Mensalidades</span>
                  <span className="font-black text-white text-sm">R$ {dreCalculations.grossRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/5 text-amber-400">
                  <span>(-) Provisão de Comissões de Rede MMN ({mmnRates.networkRate}% - Níveis G0 a G2)</span>
                  <span className="font-black">- R$ {dreCalculations.networkTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/5 text-purple-400">
                  <span>(-) Provisão de Comissões de Revendedor ({mmnRates.resellerRate}% - {mmnRates.resellerMensalRate}% Mensal + {mmnRates.resellerAnualRate}% Anual)</span>
                  <span className="font-black">- R$ {dreCalculations.resellerTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/5 text-blue-400">
                  <span>(-) Provisão Caixa Seguro MBM ({dreCalculations.mbmPlanSummary})</span>
                  <span className="font-black">- R$ {dreCalculations.mbmCost.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-3.5 bg-emerald-500/10 border border-emerald-500/20 px-5 rounded-2xl text-emerald-400 text-sm font-black">
                  <span>(=) Resultado Operacional Líquido da Plataforma</span>
                  <span className="text-base font-black">R$ {dreCalculations.netProfit.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
