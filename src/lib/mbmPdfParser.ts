import * as pdfjsLib from 'pdfjs-dist';

// Configuração do Worker do PDF.js para Vite / Web
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface MBMCertificateItem {
  pageNumber: number;
  fullName: string;
  cpf: string;
  cleanCpf: string;
  luckyNumber: string;
  certificateNumber: string;
  policyNumber: string;
  birthDate?: string;
  matricula?: string;
  validityStart?: string;
  validityEnd?: string;
  prizeValue?: string;
  matchedProfileId?: string;
  matchedProfileName?: string;
  matchedProfileEmail?: string;
  matchedProfileRole?: string;
  status: 'matched' | 'pj_matched' | 'not_found' | 'invalid_data';
  rawText?: string;
}

/**
 * Limpa e formata CPF para 11 dígitos padronizados, tratando o zero à esquerda inserido pela MBM
 */
export function sanitizeCpf(cpf: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) return digits;
  // Se veio com 12 dígitos (ex: 085668397653 devido a formatação 0856.683.976-53 da MBM com zero extra à esquerda)
  if (digits.length === 12 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // Se veio com 10 dígitos (faltando o zero à esquerda)
  if (digits.length === 10) {
    return digits.padStart(11, '0');
  }
  if (digits.length > 11) {
    return digits.slice(-11);
  }
  return digits;
}

/**
 * Formata CPF para exibição 000.000.000-00
 */
export function formatCpf(cpf: string): string {
  const clean = sanitizeCpf(cpf);
  if (clean.length !== 11) return cpf || '---';
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Normaliza strings para comparação flexível (remove acentos, pontuação, múltiplos espaços)
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai dados estruturados do texto de uma página de Certificado MBM
 */
export function parseMBMPageText(text: string, pageNum: number): MBMCertificateItem {
  const normalizedText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Extração da Linha do Segurado: "NOME_DO_SEGURADO DD/MM/AAAA CPF"
  let fullName = '';
  let birthDate = '';
  let cpf = '';

  const personLineMatch = normalizedText.match(/([A-ZÀ-Ú][A-ZÀ-Ú\s]{3,60}?)\s+(\d{2}\/\d{2}\/\d{4})\s+([0-9.\-]{11,18})/);
  if (personLineMatch) {
    fullName = personLineMatch[1].replace(/^(?:SALVADOR|ITAPUA|CASA \d+|R GUARARAPES|\d{5}-\d{3}|\d{8,11})\s*/i, '').trim();
    birthDate = personLineMatch[2].trim();
    cpf = personLineMatch[3].trim();
  } else {
    const nameMatch = normalizedText.match(/Segurado\s*\.{2,}:?\s*([A-ZÀ-Ú\s]+?)(?=\s*(?:Nome Social|Endereço|Data nasc|CPF|Bairro|Matrícula|\d{2}\/\d{2}\/\d{4}|$))/i);
    if (nameMatch && nameMatch[1]) {
      fullName = nameMatch[1].trim();
    }

    const cpfMatch = normalizedText.match(/CPF\s*:?\s*([0-9.\-]{11,18})/i);
    if (cpfMatch && cpfMatch[1]) {
      cpf = cpfMatch[1].trim();
    }

    const birthMatch = normalizedText.match(/Data\s*nasc\.?\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (birthMatch) {
      birthDate = birthMatch[1];
    }
  }

  // 2. Extração da Matrícula
  let matricula = '';
  const matMatch = normalizedText.match(/Matr[íi]cula\.?\s*:?\s*(\d{8,12})/i);
  if (matMatch) {
    matricula = matMatch[1];
    if (!cpf) cpf = matricula;
  }

  let cleanCpf = sanitizeCpf(cpf);
  if (!cleanCpf && matricula) {
    cleanCpf = sanitizeCpf(matricula);
  }

  // 3. Extração do Número da Sorte
  let luckyNumber = '';
  const luckyBeforePrize = normalizedText.match(/(\d{4,8})\s+valor\s+do\s+sorteio/i);
  if (luckyBeforePrize && luckyBeforePrize[1]) {
    luckyNumber = luckyBeforePrize[1].trim();
  } else {
    const luckyLabelMatch = normalizedText.match(/(?:N[ºo°]\s*da\s*Sorte|N[ºo°]da\s*Sorte|Numero\s*da\s*Sorte)[\s:]*(\d{4,8})/i);
    if (luckyLabelMatch && luckyLabelMatch[1]) {
      luckyNumber = luckyLabelMatch[1].trim();
    }
  }

  // 4. Extração do Número do Certificado e Apólice
  let certificateNumber = '';
  let policyNumber = '11-0982-000058940-0001';

  const contractMatch = normalizedText.match(/([0-9]{2}-[0-9]{4}-[0-9]{8,12}-[0-9]{4})\s+(\d+)\s+LISTAGEM/i);
  if (contractMatch) {
    policyNumber = contractMatch[1];
    certificateNumber = contractMatch[2];
  } else {
    const certMatch = normalizedText.match(/N[ºo°]\s*do\s*Certificado[\s\S]*?(\d{1,8})\s+(?:LISTAGEM|[0-9]{2}h)/i);
    if (certMatch) certificateNumber = certMatch[1].trim();
  }

  // 5. Vigência
  let validityStart = '31/08/2026';
  let validityEnd = '31/08/2027';
  const vigenciaMatch = normalizedText.match(/(?:24h\s+do\s+dia\s+)?(\d{2}\/\d{2}\/\d{4})\s+(?:24h\s+do\s+dia\s+)?(\d{2}\/\d{2}\/\d{4})/i);
  if (vigenciaMatch) {
    validityStart = vigenciaMatch[1];
    validityEnd = vigenciaMatch[2];
  }

  // 6. Valor do Sorteio
  let prizeValue = '5.000,00';
  const prizeMatch = normalizedText.match(/valor\s*do\s*sorteio\s*r\$?\s*([0-9.,]+)/i);
  if (prizeMatch) prizeValue = prizeMatch[1];

  return {
    pageNumber: pageNum,
    fullName,
    cpf,
    cleanCpf,
    luckyNumber,
    certificateNumber,
    policyNumber,
    birthDate,
    matricula,
    validityStart,
    validityEnd,
    prizeValue,
    status: (luckyNumber && (cleanCpf || fullName)) ? 'matched' : 'invalid_data',
    rawText: normalizedText
  };
}

/**
 * Lê um arquivo PDF File/Blob e extrai todos os certificados de todas as páginas
 */
export async function extractMBMCertificatesFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<MBMCertificateItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const results: MBMCertificateItem[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    const parsed = parseMBMPageText(pageText, pageNum);
    results.push(parsed);
  }

  return results;
}
