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
  Loader2,
  Ticket,
  UploadCloud,
  RefreshCw,
  Save,
  Check,
  Search,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { 
  extractMBMCertificatesFromPdf, 
  MBMCertificateItem, 
  sanitizeCpf, 
  formatCpf,
  normalizeString
} from '../lib/mbmPdfParser';
import { businessRules, calculateTaxDeductions, calculateSubscriptionRepasseCycle } from '../lib/businessRules';
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
  const [mbmPolicyNumber, setMbmPolicyNumber] = useState(() => {
    const saved = localStorage.getItem('mbm_policy_number');
    return (saved && saved.trim()) ? saved : '58940';
  });
  const [mbmSubGroup, setMbmSubGroup] = useState(() => localStorage.getItem('mbm_sub_group') || '1');
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [allCommissions, setAllCommissions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [mmnRates, setMmnRates] = useState({
    networkRate: 21,
    resellerMensalRate: 10,
    resellerAnualRate: 2,
    resellerRate: 12,
    totalRepasseRate: 33
  });

  const getPlanFinancialOrder = (item: any): number => {
    const p = ((item?.plan_type || item?.name || '') + '').toLowerCase();
    if (p.includes('mensal') || p.includes('30')) return 1;
    if (p.includes('trimestral') || p.includes('90')) return 2;
    if (p.includes('semestral') || p.includes('180')) return 3;
    if (p.includes('anual') || p.includes('ano') || p.includes('365')) return 4;
    return 99;
  };

  const sortedPlans = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return [...plans].sort((a, b) => getPlanFinancialOrder(a) - getPlanFinancialOrder(b));
  }, [plans]);

  const [fiscalFilterType, setFiscalFilterType] = useState<'all' | 'period'>('all');

  // Sub-aba dentro de Seguro de Vida MBM ('export' = gerar XLSX remessa, 'import' = importar PDF certificados)
  const [insuranceSubTab, setInsuranceSubTab] = useState<'export' | 'import'>('export');
  const [extractedCertificates, setExtractedCertificates] = useState<MBMCertificateItem[]>([]);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfParseProgress, setPdfParseProgress] = useState({ current: 0, total: 0 });
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string | null>(null);
  const [selectedPdfIndices, setSelectedPdfIndices] = useState<Set<number>>(new Set());
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [pdfSearchFilter, setPdfSearchFilter] = useState('');
  const [pdfStatusFilter, setPdfStatusFilter] = useState<'all' | 'matched' | 'pj_matched' | 'not_found'>('all');
  const [allProfilesForMatching, setAllProfilesForMatching] = useState<any[]>([]);
  const fileInputPdfRef = React.useRef<HTMLInputElement>(null);

  // Carrega lista de perfis para matching do PDF
  const loadProfilesForMatching = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*');
      setAllProfilesForMatching(data || []);
    } catch (e) {
      console.error('Erro ao carregar perfis para matching:', e);
    }
  };

  useEffect(() => {
    loadProfilesForMatching();
  }, []);

  // Mapas de matching por CPF e Nome
  const { pdfCpfMap, pdfNameMap } = useMemo(() => {
    const cpfMap = new Map<string, any>();
    const nameMap = new Map<string, any>();

    allProfilesForMatching.forEach(p => {
      if (p.cpf) {
        const clean = sanitizeCpf(p.cpf);
        if (clean) cpfMap.set(clean, p);
      }
      if (p.description) {
        const cpfMatch = p.description.match(/CPF Segurado:\s*([0-9.\-]+)/i);
        if (cpfMatch && cpfMatch[1]) {
          const cleanPjCpf = sanitizeCpf(cpfMatch[1]);
          if (cleanPjCpf) cpfMap.set(cleanPjCpf, p);
        }
      }
      if (p.full_name) {
        const norm = p.full_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        nameMap.set(norm, p);
      }
    });

    return { pdfCpfMap: cpfMap, pdfNameMap: nameMap };
  }, [allProfilesForMatching]);

  // Algoritmo Inteligente Multi-Camadas de Matching 100% Automático
  const findBestProfileMatch = (cert: MBMCertificateItem, profilesPool: any[]) => {
    const rawCpf = cert.cpf || '';
    const cleanCpf = sanitizeCpf(rawCpf);
    const matricula = cert.matricula ? sanitizeCpf(cert.matricula) : '';
    const normPdfName = normalizeString(cert.fullName);
    const pdfTokens = normPdfName.split(' ').filter(t => t.length > 2);

    for (const p of profilesPool) {
      const pCleanCpf = sanitizeCpf(p.cpf || '');
      const pCleanPix = sanitizeCpf(p.pix_key || '');
      const normPName = normalizeString(p.full_name || '');
      const pTokens = normPName.split(' ').filter(t => t.length > 2);

      // 1. Match por CPF Exato (11 dígitos ou matrícula)
      if (cleanCpf && pCleanCpf && cleanCpf === pCleanCpf) return p;
      if (matricula && pCleanCpf && matricula === pCleanCpf) return p;

      // 2. Match por CPF na Chave Pix ou na Descrição PJ
      if (cleanCpf && pCleanPix && cleanCpf === pCleanPix) return p;
      if (p.description) {
        const pjCpfMatch = p.description.match(/CPF Segurado:\s*([0-9.\-]+)/i);
        if (pjCpfMatch && sanitizeCpf(pjCpfMatch[1]) === cleanCpf) return p;
      }

      // 3. Match por CPF com ou sem zero inicial (ex: 15141286916 vs 015141286916)
      if (cleanCpf && pCleanCpf) {
        const c1 = cleanCpf.replace(/^0+/, '');
        const c2 = pCleanCpf.replace(/^0+/, '');
        if (c1 && c2 && (c1 === c2 || c1.includes(c2) || c2.includes(c1))) return p;
      }

      // 4. Match por Nome Exato Normalizado
      if (normPdfName && normPName && normPdfName === normPName) return p;

      // 5. Match por Substring de Nome (quando um contém o outro)
      if (normPdfName && normPName) {
        if (normPdfName.includes(normPName) || normPName.includes(normPdfName)) {
          if (normPName.length > 4) return p;
        }
      }

      // 6. Match por Tokens Significativos (Primeiro + Último Nome ou 2+ tokens do nome)
      if (pdfTokens.length >= 2 && pTokens.length >= 2) {
        const firstMatches = pdfTokens[0] === pTokens[0];
        const lastMatches = pdfTokens[pdfTokens.length - 1] === pTokens[pTokens.length - 1];
        if (firstMatches && lastMatches) return p;

        const commonTokens = pdfTokens.filter(t => pTokens.includes(t));
        if (commonTokens.length >= 2) return p;
      }
    }

    return null;
  };

  // Cruzamento do PDF com o banco
  const matchPdfCertificates = (items: MBMCertificateItem[], profilesPool?: any[]) => {
    const pool = profilesPool || allProfilesForMatching;
    const updated = items.map(cert => {
      const cleanCpf = sanitizeCpf(cert.cpf || cert.matricula || '');
      const matched = findBestProfileMatch(cert, pool);

      if (matched) {
        const isPj = !!matched.cnpj || !!matched.description?.includes('[PJ]');
        return {
          ...cert,
          cleanCpf: cleanCpf || sanitizeCpf(matched.cpf || ''),
          matchedProfileId: matched.id,
          matchedProfileName: matched.full_name,
          matchedProfileEmail: matched.email,
          matchedProfileRole: matched.role,
          status: isPj ? ('pj_matched' as const) : ('matched' as const)
        };
      }

      return {
        ...cert,
        cleanCpf,
        status: 'not_found' as const
      };
    });

    setExtractedCertificates(updated);

    const validIndices = new Set<number>();
    updated.forEach((item, index) => {
      if (item.status === 'matched' || item.status === 'pj_matched') {
        validIndices.add(index);
      }
    });
    setSelectedPdfIndices(validIndices);
  };

  // Upload do PDF
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Por favor, selecione um arquivo no formato PDF (.pdf).');
      return;
    }

    setUploadedPdfFileName(file.name);
    setIsParsingPdf(true);
    setPdfParseProgress({ current: 0, total: 0 });

    try {
      // 1. Busca lista atualizada de perfis do Supabase antes de cruzar
      let currentProfiles = allProfilesForMatching;
      try {
        const { data: freshProfiles } = await supabase.from('profiles').select('*');
        if (freshProfiles && freshProfiles.length > 0) {
          currentProfiles = freshProfiles;
          setAllProfilesForMatching(freshProfiles);
        }
      } catch (profErr) {
        console.warn('Erro ao atualizar perfis para matching:', profErr);
      }

      const toastId = toast.loading('Lendo certificados do PDF da MBM...');
      const items = await extractMBMCertificatesFromPdf(file, (current, total) => {
        setPdfParseProgress({ current, total });
      });

      toast.dismiss(toastId);

      if (items.length === 0) {
        toast.error('Nenhum certificado identificado no PDF.');
        return;
      }

      matchPdfCertificates(items, currentProfiles);
      toast.success(`${items.length} certificados extraídos e identificados com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      toast.error('Falha ao processar PDF: ' + (err.message || 'Verifique o arquivo'));
    } finally {
      setIsParsingPdf(false);
    }
  };

  // Gravar números da sorte e certificados no banco
  const handleSavePdfSync = async () => {
    if (selectedPdfIndices.size === 0) {
      toast.error('Selecione ao menos um certificado para vincular.');
      return;
    }

    setIsSavingPdf(true);
    let successCount = 0;
    let failCount = 0;
    const toastId = toast.loading(`Vinculando ${selectedPdfIndices.size} certificados aos afiliados...`);

    try {
      for (const index of Array.from(selectedPdfIndices)) {
        const item = extractedCertificates[index];
        if (!item || !item.matchedProfileId || !item.luckyNumber) continue;

        const userId = item.matchedProfileId;

        try {
          await supabase
            .from('profiles')
            .update({
              lucky_number: item.luckyNumber,
              certificate_number: item.certificateNumber,
              policy_number: item.policyNumber,
            })
            .eq('id', userId);
        } catch (colErr) {
          console.warn('Atualização de coluna profiles em fallback:', colErr);
        }

        try {
          const { data: p } = await supabase.from('profiles').select('description').eq('id', userId).single();
          let desc = p?.description || '';
          
          desc = desc.replace(/\[MBM_LUCKY_NUMBER:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_CERTIFICATE:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_POLICY:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_VALIDITY:[^\]]*\]/g, '');
          desc = desc.replace(/\[MBM_SYNCED_AT:[^\]]*\]/g, '');

          const tags = `[MBM_LUCKY_NUMBER:${item.luckyNumber}] [MBM_CERTIFICATE:${item.certificateNumber}] [MBM_POLICY:${item.policyNumber}] [MBM_VALIDITY:${item.validityStart || '31/08/2026'}-${item.validityEnd || '31/08/2027'}] [MBM_SYNCED_AT:${new Date().toISOString()}]`;
          desc = `${desc.trim()} ${tags}`.trim();

          await supabase.from('profiles').update({ description: desc }).eq('id', userId);
          successCount++;
        } catch (descErr) {
          console.error(`Erro ao salvar tags no perfil ${userId}:`, descErr);
          failCount++;
        }
      }

      toast.dismiss(toastId);

      if (successCount > 0) {
        toast.success(`🎉 ${successCount} Números da Sorte vinculados com sucesso ao Escritório Virtual!`);
        await loadProfilesForMatching();
      }
      if (failCount > 0) {
        toast.error(`${failCount} certificados falharam.`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Erro na sincronização: ' + err.message);
    } finally {
      setIsSavingPdf(false);
    }
  };

  const filteredExtractedCertificates = useMemo(() => {
    return extractedCertificates.filter(item => {
      if (pdfStatusFilter !== 'all' && item.status !== pdfStatusFilter) return false;
      if (pdfSearchFilter) {
        const q = pdfSearchFilter.toLowerCase();
        const matchesName = item.fullName.toLowerCase().includes(q);
        const matchesCpf = item.cleanCpf.includes(q) || item.cpf.includes(q);
        const matchesLucky = item.luckyNumber.includes(q);
        const matchesMatched = item.matchedProfileName?.toLowerCase().includes(q);
        return matchesName || matchesCpf || matchesLucky || matchesMatched;
      }
      return true;
    });
  }, [extractedCertificates, pdfStatusFilter, pdfSearchFilter]);

  useEffect(() => {
    loadFiscalData();
  }, [dateRange.start, dateRange.end, fiscalFilterType]);

  async function loadAdminData(silent = false) {
    try {
      if (!silent) setLoading(true);
      const [ordersData, networkData, resellerData, subsData, mmnConfigRes, mmnLevelsRes, plansRes, commissionsRes] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'network'),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'reseller'),
        supabase
          .from('subscriptions')
          .select('id, profile_id, plan_type, amount, status, start_date, end_date')
          .eq('status', 'active'),
        supabase.from('mmn_config').select('*').single(),
        supabase.from('mmn_levels').select('*'),
        supabase
          .from('products')
          .select('*')
          .eq('is_subscription', true)
          .order('price', { ascending: true }),
        supabase
          .from('transactions')
          .select('*')
          .eq('type', 'commission')
      ]);

      setOrders(ordersData || []);
      setNetworkReport(networkData || []);
      setResellerReport(resellerData || []);
      setPlans(plansRes?.data || []);
      setAllCommissions(commissionsRes?.data || []);

      const rawSubs = subsData?.data || [];
      const filteredSubs = rawSubs.filter(s => {
        if (!s.start_date || !s.end_date) return true;
        const start = s.start_date.substring(0, 10);
        const end = s.end_date.substring(0, 10);
        return start <= dateRange.end && end >= dateRange.start;
      });
      const finalSubs = filteredSubs;
      setActiveSubscriptions(finalSubs);
      setActiveLivesCount(finalSubs.length);

      const mmnCfg = mmnConfigRes?.data;
      const mmnLvls = mmnLevelsRes?.data;

      const netRate = mmnLvls && mmnLvls.length > 0 
        ? mmnLvls.reduce((acc: number, cur: any) => acc + Number(cur.value || 0), 0)
        : 21;
      
      const rMensal = Number(mmnCfg?.commission_regional_mensal ?? 10);
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

      const targetMonthStr = `${year}-${monthStr}`;

      // 1. Buscar assinaturas cadastradas no banco
      const [{ data: activeSubs }, { data: paidOrders }, { data: profilesData }] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('profile_id, plan_type, amount, start_date, end_date, status')
          .eq('status', 'active'),
        supabase
          .from('orders')
          .select('id, customer_id, amount, status, created_at, order_date, items')
          .in('status', ['Pago', 'Concluído', 'Pago, Aguardando Retirada']),
        supabase
          .from('profiles')
          .select('id, full_name, cpf, cnpj, birth_date, gender, description, store_name, status, person_type')
      ]);

      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

      // 2. Consolidar segurados de assinaturas e de pedidos pagos de licenciamento/assinatura
      const candidateMembers: any[] = [];
      const seenProfiles = new Set<string>();

      (activeSubs || []).forEach(s => {
        const p = profileMap.get(s.profile_id);
        if (p && !seenProfiles.has(s.profile_id)) {
          seenProfiles.add(s.profile_id);
          candidateMembers.push({
            profileId: s.profile_id,
            planType: s.plan_type,
            amount: s.amount,
            startDate: s.start_date,
            endDate: s.end_date,
            profiles: p
          });
        }
      });

      (paidOrders || []).forEach(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach(item => {
          if (item.is_subscription) {
            const oDate = o.order_date || o.created_at;
            if (o.customer_id && !seenProfiles.has(o.customer_id)) {
              seenProfiles.add(o.customer_id);
              const p = profileMap.get(o.customer_id);
              if (p) {
                candidateMembers.push({
                  profileId: o.customer_id,
                  planType: item.plan_type || 'anual',
                  amount: item.price || o.amount,
                  startDate: oDate,
                  endDate: null,
                  profiles: p
                });
              }
            }
          }
        });
      });

      // 3. Filtro rigoroso conforme regras oficiais da seguradora MBM:
      // 1. Pessoa Jurídica NÃO entra (apenas pessoas físicas com CPF válido);
      // 2. Usuário não cadastrado NÃO entra (exige nome preenchido e CPF de 11 dígitos);
      // 3. Inativos/Bloqueados NÃO entram (se tiver pedido/assinatura paga e não estiver bloqueado, entra);
      // 4. Ciclo Operacional MBM: vigência válida desde o mês de início até o mês do último repasse contratado.
      const validActiveSubs = candidateMembers.filter((sub: any) => {
        const p = sub.profiles || {};

        // Regra 4: Ciclo MBM (Mês de início ao último repasse do ciclo)
        const cycle = calculateSubscriptionRepasseCycle(sub.startDate, sub.planType, sub.endDate);
        if (targetMonthStr < cycle.startMonthStr || targetMonthStr > cycle.lastRepasseMonthStr) {
          return false;
        }

        // Regra 3: Status bloqueado/inativo explícito
        if (p.status === 'blocked' || p.status === 'inactive' || p.status === 'bloqueado') {
          return false;
        }

        // Regra 2: Usuário não cadastrado
        const name = (p.full_name || '').trim();
        if (!name || name.toUpperCase().includes('NÃO CADASTRADO') || name.toUpperCase().includes('NAO CADASTRADO')) {
          return false;
        }

        const cleanCpfDigits = (p.cpf || '').replace(/\D/g, '');
        if (cleanCpfDigits.length !== 11) {
          return false;
        }

        // Regra 1: Pessoa Jurídica (CNPJ ou person_type PJ)
        if (p.cnpj && p.cnpj.replace(/\D/g, '').length > 0) return false;
        if (isCnpj(p.cpf || '')) return false;
        if (p.person_type === 'PJ') return false;

        return true;
      });

      if (!validActiveSubs || validActiveSubs.length === 0) {
        toast.dismiss(toastId);
        toast.error(`Nenhum segurado ativo e elegível encontrado para a competência ${referenceDate}.`);
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
      cC5.value = (mbmPolicyNumber || '').trim() || '58940';
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
      validActiveSubs.forEach((sub: any) => {
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
      toast.success(`Planilha oficial MBM gerada com sucesso! (${validActiveSubs.length} vidas ativas exportadas)`);
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

  // Carregar dados de apuração fiscal e retenção
  const loadFiscalData = async () => {
    setLoadingFiscal(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, cnpj, role, description, pix_key');

      const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

      const targetRefMonth = dateRange.start.substring(0, 7); // "YYYY-MM"
      const [yearStr, monthStr] = targetRefMonth.split('-');
      const yNum = parseInt(yearStr, 10);
      const mNum = parseInt(monthStr, 10);

      // 1. Busca todos os Recibos de RPA emitidos e quitados
      let allSavedRpas: any[] = [];
      try {
        allSavedRpas = JSON.parse(localStorage.getItem('all_rpa_receipts') || '[]');
      } catch (e) {}
      const rpaReceipts = await businessRules.getAffiliateRPAReceipts();
      
      const allRpasList = [...allSavedRpas, ...(rpaReceipts || [])];

      // 2. Busca Arquivos de Pagamentos Mensais Efetivados / Quitados de todos os meses
      let archivedMonths: string[] = [];
      try {
        archivedMonths = JSON.parse(localStorage.getItem('monthly_payout_archived_months') || '[]');
      } catch (e) {}
      if (!archivedMonths.includes(targetRefMonth)) {
        archivedMonths.push(targetRefMonth);
      }
      
      const monthlyArchivesList: any[] = [];
      for (const m of archivedMonths) {
        const arch = await businessRules.getMonthlyPayoutArchives(m);
        if (arch && arch.length > 0) {
          monthlyArchivesList.push(...arch.map((a: any) => ({ ...a, archive_month: m })));
        }
      }

      // 3. Busca Notas Fiscais anexadas (PJ)
      const invoices = await businessRules.getAffiliateInvoices();

      // 4. Busca Transações de saque / repasse
      let withdrawalsQuery = supabase
        .from('transactions')
        .select('*')
        .in('type', ['withdrawal', 'payout']);
      
      if (fiscalFilterType === 'period') {
        withdrawalsQuery = withdrawalsQuery
          .gte('created_at', `${dateRange.start}T00:00:00`)
          .lte('created_at', `${dateRange.end}T23:59:59`);
      }
      const { data: withdrawalsData } = await withdrawalsQuery;

      const grouped: Record<string, any> = {};

      // A. Adiciona Recibos de RPA (Pessoa Física: Quitado, com Ciência ou Previsto)
      allRpasList.forEach((rpa: any) => {
        const pid = rpa.profile_id || rpa.affiliate?.id;
        if (!pid) return;

        const refMonth = rpa.reference_month || (rpa.created_at ? rpa.created_at.substring(0, 7) : targetRefMonth);
        const [rY, rM] = (refMonth || '').split('-');
        const compFormatted = rY && rM ? `${rM}/${rY}` : (refMonth || 'N/A');

        // Se o filtro for por período estrito, verifica se bate a competência ou data de aceite
        if (fiscalFilterType === 'period') {
          const qMonth = rpa.quitacao_accepted_at ? rpa.quitacao_accepted_at.substring(0, 7) : '';
          const cMonth = rpa.created_at ? rpa.created_at.substring(0, 7) : '';
          const matches = refMonth === targetRefMonth || qMonth === targetRefMonth || cMonth === targetRefMonth || rpa.id?.includes(targetRefMonth);
          if (!matches) return;
        }

        const key = rpa.id || `${pid}_${refMonth}`;
        const prof = profileMap.get(pid);
        const name = rpa.affiliate?.name || prof?.full_name || 'Afiliado Autônomo';
        const doc = rpa.affiliate?.cpf || prof?.cpf || prof?.cnpj || 'Sem Documento';
        const isPJ = isCnpj(doc);
        const bruto = Number(rpa.financial?.bruto_total || 0);

        if (bruto > 0) {
          const inss = Number(rpa.financial?.inss_retido || 0);
          const irrf = Number(rpa.financial?.irrf_retido || 0);
          const liquido = Number(rpa.financial?.liquido_total || bruto);

          grouped[key] = {
            id: key,
            profile_id: pid,
            competencia: compFormatted,
            name,
            cpf: doc,
            is_pj: isPJ,
            bruto,
            inss,
            irrf,
            patronal: 0,
            total_inss_guia: 0,
            liquido,
            invoice_number: rpa.rpa_number || `RPA Nº ${refMonth ? refMonth.replace('-', '') : ''}`,
            invoice_link: rpa.receipt_url || null,
            status: rpa.status || 'quitado',
            has_invoice: !!rpa.receipt_url,
            is_rpa: true,
            rpa_data: rpa
          };
        }
      });

      // B. Adiciona Arquivos de Pagamento Mensal Quitado
      monthlyArchivesList.forEach((arch: any) => {
        const pid = arch.userId;
        if (!pid) return;

        const refMonth = arch.archive_month || targetRefMonth;
        const [rY, rM] = (refMonth || '').split('-');
        const compFormatted = rY && rM ? `${rM}/${rY}` : refMonth;

        if (fiscalFilterType === 'period' && refMonth !== targetRefMonth) {
          return;
        }

        const key = arch.id || `${pid}_${refMonth}`;
        const prof = profileMap.get(pid);
        const name = arch.userName || prof?.full_name || 'Afiliado';
        const doc = arch.userCpf || prof?.cpf || prof?.cnpj || 'Sem Documento';
        const isPJ = arch.isPJ || isCnpj(doc);
        const bruto = Number(arch.totalBruto || 0);

        if (bruto > 0 && !grouped[key]) {
          grouped[key] = {
            id: key,
            profile_id: pid,
            competencia: compFormatted,
            name,
            cpf: doc,
            is_pj: isPJ,
            bruto,
            inss: Number(arch.inss || 0),
            irrf: Number(arch.irrf || 0),
            patronal: 0,
            total_inss_guia: 0,
            liquido: Number(arch.liquido || bruto),
            invoice_number: arch.rpaNumber || arch.invoiceNumber || `RPA Nº ${refMonth.replace('-', '')}`,
            invoice_link: arch.receiptUrl || null,
            status: 'quitado',
            has_invoice: !!arch.receiptUrl,
            is_rpa: !isPJ
          };
        }
      });

      // C. Adiciona Transações de Saque / Payout
      (withdrawalsData || []).forEach((w: any) => {
        const pid = w.profile_id;
        if (!pid) return;
        const prof = profileMap.get(pid);
        const doc = prof?.cpf || prof?.cnpj || 'Sem Documento';
        const isPJ = isCnpj(doc);
        const name = prof?.full_name || 'Afiliado';
        const amt = Math.abs(Number(w.amount || 0));
        const wDate = (w.created_at || '').substring(0, 7);
        const [wY, wM] = (wDate || '').split('-');
        const compFormatted = wY && wM ? `${wM}/${wY}` : (wDate || 'N/A');
        const key = `tx_${w.id}`;

        if (!grouped[key] && amt > 0) {
          const tax = calculateTaxDeductions(amt, isPJ);
          grouped[key] = {
            id: key,
            profile_id: pid,
            competencia: compFormatted,
            name,
            cpf: doc,
            is_pj: isPJ,
            bruto: amt,
            inss: tax.inss,
            irrf: tax.irrf,
            patronal: tax.patronal,
            total_inss_guia: tax.inss + tax.patronal,
            liquido: tax.liquido,
            invoice_number: null,
            invoice_link: null,
            status: w.status,
            has_invoice: false,
            is_rpa: !isPJ
          };
        }
      });

      // D. Adiciona Notas Fiscais anexadas (PJ)
      (invoices || []).forEach((inv: any) => {
        const pid = inv.profile_id;
        if (!pid) return;
        const refMonth = inv.reference_month || (inv.created_at ? inv.created_at.substring(0, 7) : targetRefMonth);
        const [rY, rM] = (refMonth || '').split('-');
        const compFormatted = rY && rM ? `${rM}/${rY}` : refMonth;

        if (fiscalFilterType === 'period' && refMonth !== targetRefMonth) {
          return;
        }

        const key = inv.id || `${pid}_${refMonth}`;
        const prof = profileMap.get(pid);
        const name = prof?.full_name || inv.payee_name || 'Afiliado PJ';
        const doc = prof?.cnpj || prof?.cpf || 'Sem Documento';
        const isPJ = true;
        const bruto = Number(inv.amount_gross || 0);

        if (!grouped[key] && bruto > 0) {
          grouped[key] = {
            id: key,
            profile_id: pid,
            competencia: compFormatted,
            name,
            cpf: doc,
            is_pj: isPJ,
            bruto,
            inss: 0,
            irrf: 0,
            patronal: 0,
            total_inss_guia: 0,
            liquido: bruto,
            invoice_number: inv.invoice_number ? `#${inv.invoice_number}` : 'NF Anexada',
            invoice_link: inv.file_url || inv.invoice_link || null,
            status: 'aprovada',
            has_invoice: true,
            is_rpa: false
          };
        } else if (grouped[key]) {
          grouped[key].invoice_number = inv.invoice_number ? `#${inv.invoice_number}` : grouped[key].invoice_number;
          grouped[key].invoice_link = inv.file_url || inv.invoice_link || grouped[key].invoice_link;
          grouped[key].has_invoice = true;
        }
      });

      // E. Consolida todos os afiliados com demonstrativos apurados na competência
      const { data: monthComms } = await supabase
        .from('transactions')
        .select('profile_id, amount, created_at')
        .eq('type', 'commission');

      const commUserIds = Array.from(new Set((monthComms || []).map(c => c.profile_id).filter(Boolean)));
      for (const uid of commUserIds) {
        const key = `${uid}_${targetRefMonth}`;
        if (!grouped[key]) {
          try {
            const stmt = await businessRules.getConsolidatedFinancialStatement(uid, yNum, mNum);
            if (stmt && stmt.totalBruto > 0) {
              const compFormatted = `${String(mNum).padStart(2, '0')}/${yNum}`;
              grouped[key] = {
                id: key,
                profile_id: uid,
                competencia: compFormatted,
                name: stmt.beneficiaryName,
                cpf: stmt.cpfCnpj,
                is_pj: stmt.isPJ,
                bruto: stmt.totalBruto,
                inss: stmt.inss,
                irrf: stmt.irrf,
                patronal: 0,
                total_inss_guia: 0,
                liquido: stmt.liquido,
                invoice_number: stmt.rpaNumber,
                invoice_link: stmt.receiptUrl || null,
                status: stmt.isPaid ? 'quitado' : 'pendente',
                has_invoice: !!stmt.receiptUrl,
                is_rpa: !stmt.isPJ
              };
            }
          } catch (e) {
            console.error('Erro ao consolidar apuração do usuário:', uid, e);
          }
        }
      }

      const records = Object.values(grouped).map((rec: any) => {
        const bruto = Number(rec.bruto || 0);
        const isPJ = rec.is_pj ?? isCnpj(rec.cpf);
        const tax = calculateTaxDeductions(bruto, isPJ);
        const inss = rec.inss !== undefined ? rec.inss : tax.inss;
        const irrf = rec.irrf !== undefined ? rec.irrf : tax.irrf;
        const patronal = rec.patronal !== undefined ? rec.patronal : tax.patronal;
        const liquido = rec.liquido !== undefined ? rec.liquido : tax.liquido;

        return {
          ...rec,
          is_pj: isPJ,
          inss: parseFloat(Number(inss || 0).toFixed(2)),
          irrf: parseFloat(Number(irrf || 0).toFixed(2)),
          patronal: parseFloat(Number(patronal || 0).toFixed(2)),
          total_inss_guia: parseFloat(Number(inss + patronal || 0).toFixed(2)),
          liquido: parseFloat(Number(liquido || 0).toFixed(2)),
          invoice_number: rec.invoice_number || null,
          invoice_link: rec.invoice_link || null,
          invoice_file_url: rec.invoice_link || null,
          has_invoice: !!rec.has_invoice || !!rec.invoice_link
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
        { header: 'Nº Nota / RPA', key: 'invoice_number', width: 18 },
        { header: 'Nome do Prestador / Afiliado', key: 'name', width: 35 },
        { header: 'CPF / CNPJ', key: 'cpf', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 14 },
        { header: 'Valor Bruto (R$)', key: 'bruto', width: 25 },
        { header: 'INSS Retido (0% Intermediação) (R$)', key: 'inss', width: 25 },
        { header: 'INSS Patronal (0%) (R$)', key: 'patronal', width: 22 },
        { header: 'Imposto de Renda Retido (IRRF) (R$)', key: 'irrf', width: 25 },
        { header: 'Valor Líquido Pago (R$)', key: 'liquido', width: 22 },
        { header: 'Link / Comprovante (NF/RPA)', key: 'link', width: 45 }
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
          { num: '02', desc: 'Contribuição previdenciária oficial (INSS 11% Autônomo PF / Isenção PJ)', val: rec.inss },
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
    
    // Provisão de bônus e repasses contratuais (MMN 21% + Revendedor 12% = 33,00% Total conforme configurado):
    const netRateFrac = (mmnRates?.networkRate || 21) / 100;
    const resRateFrac = (mmnRates?.resellerRate || 12) / 100;

    const networkTotal = grossRevenue * netRateFrac;
    const resellerTotal = grossRevenue * resRateFrac;
    const mmnTotal = networkTotal + resellerTotal;

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

    // Sincronização direta com as apólices do período demonstrado:
    // Prioridade 1: Se há pedidos concluídos/faturados no período, o custo e a contagem MBM
    // são calculados diretamente a partir dos pedidos faturados (mantendo 100% de coerência entre receita e despesas).
    if (completed.length > 0) {
      completed.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        let identified = false;

        items.forEach((it: any) => {
          const plan = (it.plan_type || it.name || it.title || '').toLowerCase();
          const qty = Number(it.quantity || 1);
          if (plan.includes('anual') || plan.includes('ano') || plan.includes('12')) {
            mbmAnualCount += qty;
            mbmCost += 12.00 * qty;
            identified = true;
          } else if (plan.includes('semestral') || plan.includes('6')) {
            mbmSemestralCount += qty;
            mbmCost += 6.00 * qty;
            identified = true;
          } else if (plan.includes('trimestral') || plan.includes('3')) {
            mbmTrimestralCount += qty;
            mbmCost += 3.00 * qty;
            identified = true;
          } else if (plan.includes('mensal') || it.is_subscription) {
            mbmMensalCount += qty;
            mbmCost += 1.00 * qty;
            identified = true;
          }
        });

        // Caso o pedido não tenha itens detalhados no payload, infere pelo valor pago
        if (!identified) {
          const amt = Number(o.amount || 0);
          if (amt >= 50) {
            mbmAnualCount++;
            mbmCost += 12.00;
          } else {
            mbmMensalCount++;
            mbmCost += 1.00;
          }
        }
      });
    } else if (activeSubscriptions.length > 0) {
      // Prioridade 2: Se não houver pedidos no período, mas houver assinaturas ativas na competência
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
    }

    if (mbmCost === 0 && activeLivesCount > 0 && completed.length === 0) {
      mbmCost = activeLivesCount * 1.00;
      mbmMensalCount = activeLivesCount;
    }

    const planBreakdownParts: string[] = [];
    if (mbmAnualCount > 0) planBreakdownParts.push(`${mbmAnualCount}x Anual (R$ ${(mbmAnualCount * 12).toFixed(2).replace('.', ',')})`);
    if (mbmSemestralCount > 0) planBreakdownParts.push(`${mbmSemestralCount}x Semestral (R$ ${(mbmSemestralCount * 6).toFixed(2).replace('.', ',')})`);
    if (mbmTrimestralCount > 0) planBreakdownParts.push(`${mbmTrimestralCount}x Trimestral (R$ ${(mbmTrimestralCount * 3).toFixed(2).replace('.', ',')})`);
    if (mbmMensalCount > 0) planBreakdownParts.push(`${mbmMensalCount}x Mensal (R$ ${(mbmMensalCount * 1).toFixed(2).replace('.', ',')})`);
    const mbmPlanSummary = planBreakdownParts.length > 0 ? planBreakdownParts.join(' • ') : 'R$ 1,00/mês por plano';

    // Despesas adicionais da DRE oficial da planilha:
    // 1. Despesas Administrativas: 3.00% da arrecadação bruta
    const despAdmRate = 3.00;
    const despAdmTotal = grossRevenue > 0 ? (grossRevenue * (despAdmRate / 100)) : 0;

    // 2. Provisão de Impostos: 22.78% da arrecadação bruta (R$ 232.326 / R$ 1.020.000 = 22,78%)
    const impostosRate = 22.7770588;
    const impostosTotal = grossRevenue > 0 ? (grossRevenue * (impostosRate / 100)) : 0;

    // 3. Total de Gastos / Despesas Operacionais (Seguradora + Comissões + Desp Adm + Impostos = ~67,89%)
    const totalExpenses = mbmCost + mmnTotal + despAdmTotal + impostosTotal;
    const totalExpensesPercentage = grossRevenue > 0 ? (totalExpenses / grossRevenue) * 100 : 67.89;

    // 4. Lucro Líquido Real da Plataforma (Margem ~32,11% conforme planilha)
    const netProfit = Math.max(0, grossRevenue - totalExpenses);
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 32.11;
    const annualPlanPrice = Number(
      plans.find(p => (p.plan_type || '').toLowerCase().includes('anual') || (p.name || '').toLowerCase().includes('anual'))?.price || 99
    );
    const totalPolicies = (mbmAnualCount + mbmSemestralCount + mbmTrimestralCount + mbmMensalCount) || completed.length || activeLivesCount || (grossRevenue > 0 ? Math.round(grossRevenue / annualPlanPrice) : 0);
    const profitPerPolicy = totalPolicies > 0 ? (netProfit / totalPolicies) : 0;
    
    const mmnPercentage = grossRevenue > 0 ? (mmnTotal / grossRevenue) * 100 : (mmnRates?.totalRepasseRate || 28.00);
    const networkPercentage = grossRevenue > 0 ? (networkTotal / grossRevenue) * 100 : (mmnRates?.networkRate || 21.00);
    const resellerPercentage = grossRevenue > 0 ? (resellerTotal / grossRevenue) * 100 : (mmnRates?.resellerRate || 7.00);
    const mbmPercentage = grossRevenue > 0 ? (mbmCost / grossRevenue) * 100 : (grossRevenue > 0 ? 0 : 14.12);

    return {
      grossRevenue,
      totalOrders: completed.length,
      totalPolicies,
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
      despAdmRate,
      despAdmTotal,
      impostosRate: 22.78,
      impostosTotal,
      totalExpenses,
      totalExpensesPercentage,
      netProfit,
      profitMargin,
      profitPerPolicy
    };
  }, [orders, allCommissions, networkReport, resellerReport, activeLivesCount, activeSubscriptions, dateRange, mmnRates, plans]);

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
                  Apuração contábil consolidada: intermediação de negócios (isenção de retenção na fonte de INSS 0% e IRRF), Cédula C (DIRF) e comprovantes (RPA/NF).
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
                    Regra Fiscal de Intermediação de Negócios: Isenção de Retenção na Fonte (INSS 0% & IRRF 0%)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    A Serviços Urbanos opera como <strong>plataforma de intermediação de negócios</strong>. Não há retenção obrigatória de 11% de INSS nem recolhimento patronal de 20% pela plataforma. O afiliado autônomo (PF) recebe 100% de seus rendimentos e emite Recibo RPA digital, sendo pessoalmente responsável pelo seu próprio recolhimento previdenciário como segurado contribuinte individual.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 uppercase tracking-wide">
                      📅 Apuração: 01 a 30 de cada mês
                    </span>
                    <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 uppercase tracking-wide">
                      📋 Recibo RPA: Gerado no 1º dia útil
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 uppercase tracking-wide">
                      🏛️ Pagamento PIX: Dia 10 de cada mês
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Consolidados do Mês (Grade Executiva Unificada) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Notas / RPA</p>
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
                <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-1">INSS Retido (0%)</p>
                <p className="text-xl font-black text-amber-400 italic font-mono">
                  R$ {fiscalTotals.totalInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-amber-400/60 mt-0.5 font-bold">Intermediação (Isento)</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest mb-1">IRRF Retido</p>
                <p className="text-xl font-black text-rose-400 italic font-mono">
                  R$ {fiscalTotals.totalIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-rose-400/60 mt-0.5 font-bold">Isenção / Intermediação</p>
              </div>

              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-1">Patronal (0%)</p>
                <p className="text-xl font-black text-indigo-400 italic font-mono">
                  R$ {fiscalTotals.totalPatronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-indigo-400/60 mt-0.5 font-bold">Intermediação</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-500/30 p-5 rounded-2xl shadow-lg">
                <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-1">Total Encargos</p>
                <p className="text-xl font-black text-indigo-200 italic font-mono">
                  R$ {fiscalTotals.totalInssGuia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-indigo-300/60 mt-0.5 font-bold">0% retenção na fonte</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/60 to-teal-900/40 border border-emerald-500/30 p-5 rounded-2xl shadow-lg">
                <p className="text-[9px] text-emerald-300 font-black uppercase tracking-widest mb-1">Líquido Pago</p>
                <p className="text-xl font-black text-emerald-400 italic font-mono">
                  R$ {fiscalTotals.totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[8px] text-emerald-300/60 mt-0.5 font-bold">100% Repasse Líquido</p>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Apuração Consolidada por Beneficiário
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {fiscalRecords.length} registro(s) encontrado(s)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setFiscalFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      fiscalFilterType === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas as Competências
                  </button>
                  <button
                    onClick={() => setFiscalFilterType('period')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      fiscalFilterType === 'period'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Competência Selecionada ({dateRange.start.substring(0, 7)})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-4 px-3">Nº Doc</th>
                      <th className="py-4 px-3 text-center">Competência</th>
                      <th className="py-4 px-3">Beneficiário / Prestador</th>
                      <th className="py-4 px-3">Tipo</th>
                      <th className="py-4 px-3">CPF / CNPJ</th>
                      <th className="py-4 px-3 text-right">Rendimento Bruto</th>
                      <th className="py-4 px-3 text-right">INSS (0%)</th>
                      <th className="py-4 px-3 text-right">Patronal (0%)</th>
                      <th className="py-4 px-3 text-right">Imposto Retido</th>
                      <th className="py-4 px-3 text-right">Valor Líquido</th>
                      <th className="py-4 px-3 text-center">NF / RPA</th>
                      <th className="py-4 px-3 text-center">Cédula C (DIRF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loadingFiscal ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Carregando apuração fiscal e contábil...
                        </td>
                      </tr>
                    ) : fiscalRecords.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Nenhum registro fiscal encontrado para esta competência.
                        </td>
                      </tr>
                    ) : (
                      fiscalRecords.map((rec, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-3 text-xs font-mono font-bold text-slate-300 whitespace-nowrap">
                            {rec.invoice_number ? (
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-amber-300">
                                {rec.invoice_number.startsWith('#') || rec.invoice_number.startsWith('RPA') ? rec.invoice_number : `#${rec.invoice_number}`}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Aguardando</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                              {rec.competencia || '09/2026'}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-white uppercase whitespace-nowrap">
                            {rec.name}
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap">
                            {rec.is_pj ? (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                PJ (NF)
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                PF (RPA)
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
                                {rec.is_pj ? 'Ver NF' : 'Ver Comprovante'}
                              </a>
                            ) : rec.is_rpa || rec.invoice_number?.includes('RPA') ? (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {rec.status === 'quitado' ? 'RPA Quitado' : 'RPA Gerado'}
                              </span>
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
          <div className="space-y-8">
            {/* Seletor de Sub-Abas MBM */}
            <div className="flex items-center justify-center">
              <div className="bg-[#0a0e17] p-1.5 rounded-2xl border border-white/5 flex items-center gap-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => setInsuranceSubTab('export')}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    insuranceSubTab === 'export'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileSpreadsheet size={16} />
                  1. Remessa Mensal (.XLSX / Dia 20)
                </button>
                <button
                  type="button"
                  onClick={() => setInsuranceSubTab('import')}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    insuranceSubTab === 'import'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Ticket size={16} />
                  2. Retorno MBM (Importar PDF & Números da Sorte)
                </button>
              </div>
            </div>

            {/* SUB-ABA 1: REMESSA MENSAL (GERAR XLSX) */}
            {insuranceSubTab === 'export' && (
              <div className="bg-[#0a0e17] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 space-y-8">
                <div className="max-w-3xl mx-auto space-y-4 text-center">
                  <div className="size-16 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-lg">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                      Relatório Mensal de Seguro - MBM (Remessa do Dia 20)
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
                          placeholder="58940"
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

            {/* SUB-ABA 2: RETORNO MBM (IMPORTAR PDF E NÚMEROS DA SORTE) */}
            {insuranceSubTab === 'import' && (
              <div className="space-y-8">
                {/* Zona de Upload */}
                <div className="bg-gradient-to-br from-[#0c1222] to-[#0a0e17] border border-indigo-500/20 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                  <div className="max-w-3xl mx-auto text-center space-y-6">
                    <div className="size-16 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <UploadCloud size={32} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                        Importar Apólices e Certificados da MBM (.PDF)
                      </h2>
                      <p className="text-slate-400 text-xs max-w-xl mx-auto mt-2 leading-relaxed">
                        Faça upload do arquivo PDF retornado pela MBM com as páginas dos certificados individuais. O sistema extrairá automaticamente o <strong>Nome do Segurado</strong>, <strong>CPF</strong>, <strong>Nº do Certificado</strong> e <strong>Nº da Sorte</strong> de cada afiliado.
                      </p>
                    </div>

                    <input
                      ref={fileInputPdfRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputPdfRef.current?.click()}
                        disabled={isParsingPdf}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-3 disabled:opacity-50 group cursor-pointer"
                      >
                        {isParsingPdf ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Lendo Páginas do PDF ({pdfParseProgress.current} / {pdfParseProgress.total})...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            Selecionar Arquivo PDF da MBM
                          </>
                        )}
                      </button>

                      {uploadedPdfFileName && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-300 font-mono">
                          <FileText size={15} className="text-indigo-400" />
                          <span className="truncate max-w-[200px]">{uploadedPdfFileName}</span>
                        </div>
                      )}
                    </div>

                    {isParsingPdf && pdfParseProgress.total > 0 && (
                      <div className="space-y-2 max-w-md mx-auto pt-4">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
                          <span>Processando páginas...</span>
                          <span>{Math.round((pdfParseProgress.current / pdfParseProgress.total) * 100)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(pdfParseProgress.current / pdfParseProgress.total) * 100}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabela de Resultados Extraídos */}
                {extractedCertificates.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0e17] border border-white/5 p-6 rounded-3xl">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2.5">
                          <CheckCircle2 className="text-emerald-400" size={20} />
                          Certificados Identificados ({extractedCertificates.length} páginas)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Confira a correspondência de CPF antes de sincronizar com os Escritórios Virtuais.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set<number>();
                            filteredExtractedCertificates.forEach((item) => {
                              const orig = extractedCertificates.indexOf(item);
                              if (item.status === 'matched' || item.status === 'pj_matched') next.add(orig);
                            });
                            setSelectedPdfIndices(next);
                          }}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
                        >
                          Selecionar Válidos
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPdfIndices(new Set())}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
                        >
                          Desmarcar Todos
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePdfSync}
                          disabled={isSavingPdf || selectedPdfIndices.size === 0}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingPdf ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Gravando...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Vincular {selectedPdfIndices.size} Selecionados ao Painel
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 p-1.5 bg-[#0a0e17] border border-white/5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                        <button
                          onClick={() => setPdfStatusFilter('all')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            pdfStatusFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          Todos ({extractedCertificates.length})
                        </button>
                        <button
                          onClick={() => setPdfStatusFilter('matched')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                            pdfStatusFilter === 'matched' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <span className="size-2 rounded-full bg-emerald-400"></span>
                          Identificados ({extractedCertificates.filter(c => c.status === 'matched').length})
                        </button>
                        <button
                          onClick={() => setPdfStatusFilter('pj_matched')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                            pdfStatusFilter === 'pj_matched' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <span className="size-2 rounded-full bg-purple-400"></span>
                          Titular PJ ({extractedCertificates.filter(c => c.status === 'pj_matched').length})
                        </button>
                        <button
                          onClick={() => setPdfStatusFilter('not_found')}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                            pdfStatusFilter === 'not_found' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <span className="size-2 rounded-full bg-amber-400"></span>
                          Não Localizados ({extractedCertificates.filter(c => c.status === 'not_found').length})
                        </button>
                      </div>

                      <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Buscar por Nome, CPF ou Nº da Sorte..."
                          value={pdfSearchFilter}
                          onChange={(e) => setPdfSearchFilter(e.target.value)}
                          className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Tabela */}
                    <div className="bg-[#0a0e17] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-slate-500">
                              <th className="p-5 w-12 text-center">Sel.</th>
                              <th className="p-5">Pág.</th>
                              <th className="p-5">Segurado no PDF</th>
                              <th className="p-5">CPF Extraído</th>
                              <th className="p-5">Nº da Sorte MBM</th>
                              <th className="p-5">Certificado</th>
                              <th className="p-5">Correspondência no Sistema</th>
                              <th className="p-5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            {filteredExtractedCertificates.map((item) => {
                              const origIndex = extractedCertificates.indexOf(item);
                              const isSelected = selectedPdfIndices.has(origIndex);

                              return (
                                <tr 
                                  key={origIndex}
                                  className={`hover:bg-white/[0.02] transition-colors ${
                                    isSelected ? 'bg-indigo-950/20' : ''
                                  }`}
                                >
                                  <td className="p-5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        const next = new Set(selectedPdfIndices);
                                        if (next.has(origIndex)) next.delete(origIndex);
                                        else next.add(origIndex);
                                        setSelectedPdfIndices(next);
                                      }}
                                      disabled={item.status === 'not_found' || !item.luckyNumber}
                                      className="size-4 rounded accent-indigo-600 bg-white/5 border-white/20 cursor-pointer disabled:opacity-30"
                                    />
                                  </td>

                                  <td className="p-5 font-mono text-slate-400">
                                    #{item.pageNumber}
                                  </td>

                                  <td className="p-5">
                                    <p className="font-bold text-white uppercase tracking-tight">{item.fullName || '---'}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      {item.birthDate ? `Nasc: ${item.birthDate}` : ''} {item.matricula ? `• Matr: ${item.matricula}` : ''}
                                    </p>
                                  </td>

                                  <td className="p-5 font-mono font-medium text-slate-300">
                                    {formatCpf(item.cpf || item.matricula || '')}
                                  </td>

                                  <td className="p-5">
                                    <span className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-mono font-black text-sm tracking-widest">
                                      {item.luckyNumber || 'NÃO IDENTIFICADO'}
                                    </span>
                                  </td>

                                  <td className="p-5">
                                    <p className="font-mono font-bold text-slate-200">Cert: #{item.certificateNumber || '---'}</p>
                                    <p className="text-[10px] font-mono text-slate-500">Apólice: {item.policyNumber}</p>
                                  </td>

                                  <td className="p-5">
                                    {item.matchedProfileName ? (
                                      <div>
                                        <p className="font-bold text-emerald-400">{item.matchedProfileName}</p>
                                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">{item.matchedProfileEmail}</p>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">Nenhum usuário correspondente no sistema</span>
                                    )}
                                  </td>

                                  <td className="p-5">
                                    {item.status === 'matched' && (
                                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                        <Check size={11} /> Pronto
                                      </span>
                                    )}
                                    {item.status === 'pj_matched' && (
                                      <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                        <Sparkles size={11} /> Titular PJ
                                      </span>
                                    )}
                                    {item.status === 'not_found' && (
                                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                        <AlertTriangle size={11} /> Não Localizado
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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

            {/* Demonstrativo Estruturado em Linhas Contábeis (Baseado na Planilha Oficial) */}
            <div className="bg-white/5 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" />
                    Demonstrativo Contábil Detalhado do Período
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Estrutura DRE conforme matriz atuarial de apólices, seguradora, comissões, despesas adm e tributos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Matriz Oficial
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Valores em Reais (BRL)</span>
                </div>
              </div>

              {/* CARD DESTAQUE: BLOCO DE LUCRO (Idêntico ao destaque amarelo da planilha) */}
              <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 border border-amber-500/30 p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center items-center shadow-xl">
                <div className="p-3 bg-black/30 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                    Lucro Líquido Operacional
                  </span>
                  <span className="text-2xl lg:text-3xl font-black text-amber-300 font-mono block">
                    R$ {dreCalculations.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Resultado após todos os custos
                  </span>
                </div>

                <div className="p-3 bg-black/30 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                    Lucro Por Apólice
                  </span>
                  <span className="text-2xl lg:text-3xl font-black text-emerald-300 font-mono block">
                    R$ {dreCalculations.profitPerPolicy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Base: {dreCalculations.totalPolicies} apólices / vidas
                  </span>
                </div>

                <div className="p-3 bg-black/30 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">
                    Margem Líquida Real
                  </span>
                  <span className="text-2xl lg:text-3xl font-black text-indigo-300 font-mono block">
                    {dreCalculations.profitMargin.toFixed(2).replace('.', ',')}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Rentabilidade sobre a arrecadação
                  </span>
                </div>
              </div>

              {/* TABELA DE DEMONSTRATIVO DAS LINHAS CONTÁBEIS / DESPESAS */}
              <div className="space-y-2 font-mono text-xs">
                {/* 1. Arrecadação / Faturamento Bruto */}
                <div className="flex justify-between items-center py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-indigo-400" />
                    <span className="text-slate-200 font-bold text-sm">
                      (+) ARRECADAÇÃO / FATURAMENTO BRUTO
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({dreCalculations.totalPolicies} apólices faturadas)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white text-base block">
                      R$ {dreCalculations.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">100,00%</span>
                  </div>
                </div>

                {/* Subcabeçalho de Despesas */}
                <div className="pt-3 pb-1 px-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5">
                  <span>Rubricas de Despesas Operacionais (DRE)</span>
                  <span>Impacto / % Arrecadação</span>
                </div>

                {/* 2. Seguradora MBM */}
                <div className="flex justify-between items-center py-2.5 px-4 border-b border-white/5 text-blue-400 hover:bg-white/[0.02] rounded-xl transition-colors">
                  <div>
                    <span className="font-bold block">(-) SEGURADORA (MBM Seguro de Vida)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Provisão de apólices ativas ({dreCalculations.mbmPlanSummary})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm block">
                      - R$ {dreCalculations.mbmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold">
                      {dreCalculations.mbmPercentage.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                {/* 3. Comissões (28%) */}
                <div className="flex justify-between items-center py-2.5 px-4 border-b border-white/5 text-amber-400 hover:bg-white/[0.02] rounded-xl transition-colors">
                  <div>
                    <span className="font-bold block">
                      (-) COMISSÕES TOTAIS ({(mmnRates.totalRepasseRate || 33).toFixed(2).replace('.', ',')}%)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Rede MMN ({mmnRates.networkRate}%: G0 a G2) + Revendedores ({mmnRates.resellerRate}%: {mmnRates.resellerMensalRate}% M + {mmnRates.resellerAnualRate}% A)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm block">
                      - R$ {dreCalculations.mmnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {dreCalculations.mmnPercentage.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                {/* 4. Despesas Administrativas (3%) */}
                <div className="flex justify-between items-center py-2.5 px-4 border-b border-white/5 text-purple-400 hover:bg-white/[0.02] rounded-xl transition-colors">
                  <div>
                    <span className="font-bold block">(-) DESP. ADM (3,00%)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Despesas administrativas, tecnológicas e custos operacionais
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm block">
                      - R$ {dreCalculations.despAdmTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">
                      {dreCalculations.despAdmRate.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                {/* 5. Impostos (22,78%) */}
                <div className="flex justify-between items-center py-2.5 px-4 border-b border-white/5 text-rose-400 hover:bg-white/[0.02] rounded-xl transition-colors">
                  <div>
                    <span className="font-bold block">(-) IMPOSTOS (22,78%)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Provisão tributária e impostos incidentes sobre o faturamento
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm block">
                      - R$ {dreCalculations.impostosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold">
                      {dreCalculations.impostosRate.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                {/* 6. Total de Gastos / Despesas */}
                <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300">
                  <div>
                    <span className="font-black uppercase tracking-wider block text-xs">
                      (=) TOTAL DE DESPESAS OPERACIONAIS
                    </span>
                    <span className="text-[10px] text-red-400 font-normal">
                      Soma de Seguradora + Comissões + Desp. Adm + Impostos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm block">
                      - R$ {dreCalculations.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-black text-red-400">
                      PERCENTUAL DE GASTOS: {dreCalculations.totalExpensesPercentage.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>

                {/* 7. Lucro Líquido Final */}
                <div className="flex justify-between items-center py-4 px-5 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-2xl text-emerald-400">
                  <div>
                    <span className="font-black text-sm uppercase tracking-wider block">
                      (=) LUCRO LÍQUIDO OPERACIONAL DA PLATAFORMA
                    </span>
                    <span className="text-[10px] text-emerald-300/80 font-normal">
                      Arrecadação Bruta (-) Total de Despesas e Provisões
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg lg:text-xl font-black text-emerald-300 font-mono block">
                      R$ {dreCalculations.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      MARGEM LÍQUIDA: {dreCalculations.profitMargin.toFixed(2).replace('.', ',')}%
                    </span>
                  </div>
                </div>
              </div>

              {/* TABELA INFERIOR DE REFERÊNCIA DE PREÇO DOS PLANOS (Canto inferior direito da planilha) */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-indigo-400" />
                    Tabela de Preço dos Planos de Apólices (Matriz Referência)
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Preço / Ciclo</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sortedPlans.length > 0 ? (
                    sortedPlans.map((planItem) => {
                      const isAnual = (planItem.plan_type || planItem.name || '').toLowerCase().includes('anual');
                      const duration = planItem.duration_days ? Math.round(planItem.duration_days / 30) : 1;
                      const coverageText = duration === 1 ? '1 mês cobertura' : `${duration} meses cobertura`;
                      const cleanName = (planItem.name || planItem.plan_type || '')
                        .replace(/^Plano\s+/i, '')
                        .trim();

                      return (
                        <div 
                          key={planItem.id}
                          className={`p-3 rounded-2xl text-center transition-all ${
                            isAnual 
                              ? 'bg-amber-500/10 border border-amber-500/20' 
                              : 'bg-white/5 border border-white/5'
                          }`}
                        >
                          <span className={`text-[9px] uppercase tracking-wider block ${
                            isAnual ? 'text-amber-400 font-black' : 'text-slate-400 font-bold'
                          }`}>
                            {cleanName} {isAnual ? '(Base)' : ''}
                          </span>
                          <span className={`text-sm font-black font-mono block mt-0.5 ${
                            isAnual ? 'text-amber-300' : 'text-white'
                          }`}>
                            R$ {Number(planItem.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[8px] font-medium ${
                            isAnual ? 'text-amber-400/80 font-bold' : 'text-slate-500'
                          }`}>
                            {coverageText}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mensal</span>
                        <span className="text-sm font-black text-white font-mono block mt-0.5">R$ 20,00</span>
                        <span className="text-[8px] text-slate-500 font-medium">1 mês cobertura</span>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Trimestral</span>
                        <span className="text-sm font-black text-white font-mono block mt-0.5">R$ 25,00</span>
                        <span className="text-[8px] text-slate-500 font-medium">3 meses cobertura</span>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Semestral</span>
                        <span className="text-sm font-black text-white font-mono block mt-0.5">R$ 45,00</span>
                        <span className="text-[8px] text-slate-500 font-medium">6 meses cobertura</span>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider block">Anual (Base)</span>
                        <span className="text-sm font-black text-amber-300 font-mono block mt-0.5">R$ 99,00</span>
                        <span className="text-[8px] text-amber-400/80 font-bold">12 meses cobertura</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
