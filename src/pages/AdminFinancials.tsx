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
  const [fiscalSubTab, setFiscalSubTab] = useState<'accounting' | 'general'>('accounting');

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [networkReport, setNetworkReport] = useState<any[]>([]);
  const [resellerReport, setResellerReport] = useState<any[]>([]);

  useEffect(() => {
    loadFiscalData();
  }, [dateRange.start, dateRange.end]);

  async function loadAdminData(silent = false) {
    try {
      if (!silent) setLoading(true);
      const [ordersData, networkData, resellerData, subsData] = await Promise.all([
        businessRules.getAllOrders(),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'network'),
        businessRules.getAffiliateCashbackReport(dateRange.start, `${dateRange.end}T23:59:59`, 'reseller'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setOrders(ordersData || []);
      setNetworkReport(networkData || []);
      setResellerReport(resellerData || []);
      setActiveLivesCount(subsData.count || 0);
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
        toast.error(`Nenhum segurado ativo encontrado para a competência ${referenceDate}.`);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Segurados MBM');

      worksheet.columns = [
        { header: 'Nº', key: 'index', width: 6 },
        { header: 'Nome Completo', key: 'name', width: 35 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Data de Nascimento', key: 'birth_date', width: 20 },
        { header: 'Sexo', key: 'gender', width: 12 },
        { header: 'Plano', key: 'plan', width: 15 },
        { header: 'Valor Seguro (R$)', key: 'coverage_val', width: 18 },
        { header: 'Competência', key: 'competence', width: 15 }
      ];

      activeSubs.forEach((sub: any, idx: number) => {
        const p = sub.profiles || {};
        worksheet.addRow({
          index: idx + 1,
          name: p.full_name || 'Nome Não Cadastrado',
          cpf: p.cpf || 'Não Informado',
          birth_date: p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : 'Não Informado',
          gender: p.gender || 'Não Informado',
          plan: sub.plan_type ? sub.plan_type.toUpperCase() : 'ADESÃO',
          coverage_val: '10.000,00',
          competence: referenceDate
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

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
      toast.success(`Planilha gerada com sucesso! (${activeSubs.length} vidas ativas exportadas)`);
    } catch (err: any) {
      console.error('Erro ao exportar planilha MBM:', err);
      toast.error(err.message || 'Erro ao gerar planilha do seguro MBM.');
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
      const worksheet = workbook.addWorksheet('Relatório INSS Contabilidade');

      worksheet.columns = [
        { header: 'Competência', key: 'competencia', width: 15 },
        { header: 'Nº Nota Fiscal', key: 'invoice_number', width: 18 },
        { header: 'Nome do Prestador / Afiliado', key: 'name', width: 35 },
        { header: 'CPF / CNPJ', key: 'cpf', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 14 },
        { header: 'Valor Bruto da Nota (R$)', key: 'bruto', width: 25 },
        { header: 'INSS Retido (11%) (R$)', key: 'inss', width: 22 },
        { header: 'INSS Patronal (20%) (R$)', key: 'patronal', width: 22 },
        { header: 'Total Guia INSS (R$)', key: 'total_inss', width: 24 },
        { header: 'IRRF Retido (R$)', key: 'irrf', width: 20 },
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
          total_inss: rec.inss + rec.patronal,
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
        anchor.download = `Relatorio_Mensal_Contabilidade_INSS_${month}_${year}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      });
      toast.success('Relatório para Contabilidade exportado com sucesso!');
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
    const completed = orders.filter(o => 
      o.status !== 'Cancelado' && 
      (o.status === 'Pago' || o.status === 'Concluído' || o.status === 'Pago, Aguardando Retirada')
    );
    const grossRevenue = completed.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    
    // Provisão total de bônus MMN (Rede + Revendedores)
    const mmnNet = networkReport.reduce((sum, r) => sum + (r.mensal + r.digital + r.anual), 0);
    const mmnReseller = resellerReport.reduce((sum, r) => sum + (r.mensal + r.digital + r.anual), 0);
    const mmnTotal = mmnNet + mmnReseller;

    // Custo Seguro MBM (R$ 5,00 por vida ativa)
    const mbmCost = activeLivesCount * 5.00;

    // Margem Líquida da Plataforma
    const netProfit = grossRevenue - mmnTotal - mbmCost;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const mmnPercentage = grossRevenue > 0 ? (mmnTotal / grossRevenue) * 100 : 0;
    const mbmPercentage = grossRevenue > 0 ? (mbmCost / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      mmnTotal,
      mmnPercentage,
      mbmCost,
      mbmPercentage,
      netProfit,
      profitMargin,
      totalOrders: completed.length
    };
  }, [orders, networkReport, resellerReport, activeLivesCount]);

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
                setDateRange({
                  start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
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
        {viewType === 'fiscal' && (
          <div className="bg-[#0a0e17] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-indigo-400" />
                  <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight italic">
                    Módulo Fiscal & Tributário
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Apuração de Notas Fiscais Avulsas, retenções na fonte (INSS/IRRF) e relatórios contábeis
                </p>
              </div>

              {/* Sub-abas do Módulo Fiscal */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setFiscalSubTab('accounting')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    fiscalSubTab === 'accounting'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 Relatório Mensal Contabilidade
                </button>
                <button
                  onClick={() => setFiscalSubTab('general')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    fiscalSubTab === 'general'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏛️ Impostos Federais (DARF / DIRF)
                </button>
              </div>
            </div>

            {fiscalSubTab === 'accounting' ? (
              /* SUB-ABA 1: RELATÓRIO MENSAL CONTABILIDADE */
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl shrink-0 mt-0.5 border border-amber-500/30">
                      <AlertCircle size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">
                        Nota Fiscal Avulsa (Prefeitura) x Recolhimento de INSS
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        A prefeitura (ex: Salvador) cobra apenas o ISS municipal (5%) e <strong className="text-white">não desconta nem recolhe o INSS federal</strong> na nota avulsa. Por isso, a Serviços Urbanos efetua a retenção de <strong className="text-amber-300">11% do autônomo</strong> e apura o <strong className="text-indigo-300">INSS patronal (20%)</strong>.
                      </p>
                      <p className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl mt-2.5 inline-block border border-amber-500/20 uppercase tracking-wide">
                        📅 Apuração: <strong>01 a 30 de cada mês</strong> | Envio à Contabilidade: <strong>Até dia 05</strong> (Pagamento dia 10)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={handleExportContabilidade}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      <Download size={14} /> Baixar Relatório (.XLSX)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                </div>

                {/* Cards Consolidados da Guia de INSS (Dark Glass) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Notas Apuradas</p>
                    <p className="text-2xl font-black text-white italic font-mono">
                      {fiscalRecords.length}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1 font-bold">Prestadores no mês</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Faturamento Bruto (NFs)</p>
                    <p className="text-2xl font-black text-white italic font-mono">
                      R$ {fiscalRecords.reduce((sum, r) => sum + r.bruto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1 font-bold">Base de cálculo</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">INSS Retido (11% Prestador)</p>
                    <p className="text-2xl font-black text-amber-400 italic font-mono">
                      R$ {fiscalRecords.reduce((sum, r) => sum + r.inss, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-amber-400/60 mt-1 font-bold">Descontado dos repasses</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">INSS Patronal (20% Empresa)</p>
                    <p className="text-2xl font-black text-indigo-400 italic font-mono">
                      R$ {fiscalRecords.reduce((sum, r) => sum + r.patronal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-indigo-400/60 mt-1 font-bold">Custo patronal empresa</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/60 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/30">
                    <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1">Total Guia INSS a Pagar</p>
                    <p className="text-2xl font-black text-emerald-400 italic font-mono">
                      R$ {fiscalRecords.reduce((sum, r) => sum + r.total_inss_guia, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-300 mt-1 font-bold">Retenção (11%) + Patronal (20%)</p>
                  </div>
                </div>

                {/* Tabela de Prestadores e Guias */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-4">Nº NF</th>
                        <th className="py-4">Prestador / Beneficiário</th>
                        <th className="py-4">CPF</th>
                        <th className="py-4 text-right">Valor Bruto</th>
                        <th className="py-4 text-right">INSS (11%)</th>
                        <th className="py-4 text-right">Patronal (20%)</th>
                        <th className="py-4 text-right">Guia INSS (31%)</th>
                        <th className="py-4 text-right">Líquido Pago</th>
                        <th className="py-4 text-center">Comprovante NF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loadingFiscal ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Carregando apuração da contabilidade...
                          </td>
                        </tr>
                      ) : fiscalRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Nenhum registro fiscal encontrado para esta competência.
                          </td>
                        </tr>
                      ) : (
                        fiscalRecords.map((rec, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 text-xs font-mono font-bold text-slate-300">
                              {rec.invoice_number ? `#${rec.invoice_number}` : (
                                <span className="text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded">Aguardando</span>
                              )}
                            </td>
                            <td className="py-4 text-xs font-bold text-white uppercase">
                              {rec.name}
                            </td>
                            <td className="py-4 text-xs font-mono text-slate-400">
                              {rec.cpf || 'Não cadastrado'}
                            </td>
                            <td className="py-4 text-xs font-bold text-white text-right font-mono">
                              R$ {rec.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-xs font-bold text-amber-400 text-right font-mono">
                              - R$ {rec.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-xs font-bold text-indigo-400 text-right font-mono">
                              + R$ {rec.patronal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-xs font-black text-emerald-400 text-right font-mono bg-emerald-500/5 px-2">
                              R$ {rec.total_inss_guia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-xs font-black text-white text-right font-mono">
                              R$ {rec.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 text-center">
                              {rec.invoice_link || rec.invoice_file_url ? (
                                <a
                                  href={rec.invoice_link || rec.invoice_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline uppercase"
                                >
                                  Ver NF
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-bold">Sem anexo</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* SUB-ABA 2: IMPOSTOS FEDERAIS (DARF / DIRF) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card DARF 0588 */}
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-black text-white uppercase tracking-tight">DARF 0588 (Retenção Federal)</h4>
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase">
                          Guia de Arrecadação
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Guia oficial com cálculo do IRRF retido na fonte das comissões pagas aos autônomos no período.
                      </p>
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
                        title="Exportar dados brutos em Excel"
                      >
                        <Download size={15} /> XLSX
                      </button>
                    </div>
                  </div>

                  {/* Card DIRF / Informe de Rendimentos */}
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-black text-white uppercase tracking-tight">DIRF & Informe de Rendimentos</h4>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                          Cédula C Oficial
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Comprovante Oficial de Rendimentos Pagos e Retenção de IRRF para a declaração de IRPF dos associados.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleGenerateDIRFPDF()}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                      >
                        <FileText size={16} /> Gerar Informes em PDF (Lote)
                      </button>
                      <button
                        onClick={handleExportDIRF}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                        title="Exportar dados brutos em Excel"
                      >
                        <Download size={15} /> XLSX
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-4">Beneficiário</th>
                        <th className="py-4">CPF</th>
                        <th className="py-4 text-right">Rendimento Bruto</th>
                        <th className="py-4 text-right">Dedução INSS (11%)</th>
                        <th className="py-4 text-right">IRRF Retido</th>
                        <th className="py-4 text-right">Valor Líquido</th>
                        <th className="py-4 text-center">Documento Oficial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fiscalRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                            Nenhum registro de imposto retido nesta competência.
                          </td>
                        </tr>
                      ) : (
                        fiscalRecords.map((rec, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 text-xs font-bold text-white uppercase">{rec.name}</td>
                            <td className="py-4 text-xs font-mono text-slate-400">{rec.cpf}</td>
                            <td className="py-4 text-xs font-bold text-white text-right font-mono">R$ {rec.bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-xs font-bold text-amber-400 text-right font-mono">R$ {rec.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-xs font-bold text-emerald-400 text-right font-mono">R$ {rec.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-xs font-black text-white text-right font-mono">R$ {rec.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-center">
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
            )}
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
                  Demonstração contábil do resultado: Faturamento Bruto, Provisões de Rede (52%), Seguro MBM e Lucro Líquido Real
                </p>
              </div>
              <div className="bg-white/5 text-indigo-300 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono font-black uppercase tracking-wider">
                Competência: {dateRange.start.substring(0, 7)}
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
                    2. Provisão MMN (~52%)
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {dreCalculations.mmnPercentage.toFixed(1)}%
                  </span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-amber-400 italic font-mono block">
                  R$ {dreCalculations.mmnTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-1.5 block">
                  Rede G0-G2 + Revendedor Regional
                </span>
              </div>

              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block">
                    3. Seguro MBM (R$ 5/vida)
                  </span>
                  <span className="text-[10px] font-black text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {dreCalculations.mbmPercentage.toFixed(1)}%
                  </span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-blue-400 italic font-mono block">
                  R$ {dreCalculations.mbmCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-1.5 block">
                  {activeLivesCount} vidas ativas na apólice
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/80 via-indigo-950/90 to-purple-950/80 text-white p-6 rounded-3xl shadow-2xl border border-indigo-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest block">
                    4. Margem Líquida (~24%)
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
                    
                    const mmnPerc = dreCalculations.mmnPercentage / 100;
                    const mbmPerc = dreCalculations.mbmPercentage / 100;
                    const profitPerc = Math.max(0, dreCalculations.profitMargin) / 100;

                    const mmnLen = circumference * mmnPerc;
                    const mbmLen = circumference * mbmPerc;
                    const profitLen = circumference * profitPerc;

                    const mmnOffset = 0;
                    const mbmOffset = -mmnLen;
                    const profitOffset = -(mmnLen + mbmLen);

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
                        {/* Segmento 1: Rede MMN (~52%) */}
                        <circle
                          cx="90"
                          cy="90"
                          r={radius}
                          stroke="#f59e0b"
                          strokeWidth="18"
                          strokeDasharray={`${mmnLen} ${circumference}`}
                          strokeDashoffset={mmnOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                        {/* Segmento 2: Seguro MBM */}
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
                        {/* Segmento 3: Margem Líquida (~24%) */}
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
                <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="size-2.5 rounded-full bg-amber-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Rede MMN</span>
                    </div>
                    <span className="text-xs font-black text-white font-mono">{dreCalculations.mmnPercentage.toFixed(1)}%</span>
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
                    Visualização linear de como a receita se decompõe entre comissões, seguro obrigatório e retenção líquida
                  </p>
                </div>

                {/* Barra Empilhada Multicor */}
                <div className="space-y-3">
                  <div className="h-6 w-full bg-white/5 rounded-2xl overflow-hidden p-1 flex gap-1 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(4, dreCalculations.mmnPercentage)}%` }} 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-[9px] font-black text-black"
                      title={`MMN: ${dreCalculations.mmnPercentage.toFixed(1)}%`}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Repasse Rede</span>
                      </div>
                      <span className="text-lg font-black text-amber-400 font-mono block">
                        R$ {((dreCalculations.mmnPercentage / 100) * 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100</span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="size-2 rounded-full bg-blue-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Seguro MBM</span>
                      </div>
                      <span className="text-lg font-black text-blue-400 font-mono block">
                        R$ {((dreCalculations.mbmPercentage / 100) * 100).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">a cada R$ 100</span>
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
                    Split Efetivo: {dreCalculations.mmnPercentage.toFixed(0)} / {dreCalculations.profitMargin.toFixed(0)}
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
                  <span>(-) Provisão de Comissões de Rede MMN (Semanal, Mensal e Anual)</span>
                  <span className="font-black">- R$ {dreCalculations.mmnTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/5 text-blue-400">
                  <span>(-) Custo Operacional da Apólice MBM Seguros (R$ 5,00/membro ativo)</span>
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
