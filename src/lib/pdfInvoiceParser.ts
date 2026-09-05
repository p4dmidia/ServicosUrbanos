// Utilitário Nativo de Leitura e Auditoria de PDF de Nota Fiscal (NFS-e / Nota Avulsa)
// Executa 100% no navegador (Client-Side) utilizando APIs nativas da Web (DecompressionStream) sem necessidade de dependências pesadas

export interface InvoiceAuditResult {
  isValid: boolean;
  extractedAmount: number | null;
  extractedNumber: string | null;
  hasTomadorCnpj: boolean;
  hasPrestadorDocument: boolean;
  isAmountMatching: boolean;
  message: string;
  rawTextPreview?: string;
}

const TOMADOR_CNPJ_CLEAN = '54795377000103';
const TOMADOR_CNPJ_FORMATTED = '54.795.377/0001-03';

/**
 * Converte string de moeda pt-BR (ex: "18.666,68" ou "20,00") para float
 */
export function parseBrazilianCurrency(valStr: string): number {
  if (!valStr) return 0;
  const clean = valStr
    .replace(/[^\d,\.]/g, '')
    .trim();
  
  if (!clean) return 0;

  // Se tiver vírgula e ponto (ex: 18.666,68)
  if (clean.includes(',') && clean.includes('.')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  // Se tiver apenas vírgula (ex: 20,00)
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'));
  }
  return parseFloat(clean);
}

/**
 * Decomprime um fluxo FlateDecode de PDF usando DecompressionStream nativo do navegador
 */
async function decompressFlate(bytes: Uint8Array): Promise<string> {
  try {
    if (typeof DecompressionStream !== 'undefined') {
      // Cria stream de descompressão 'deflate'
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const response = new Response(ds.readable);
      const text = await response.text();
      return text;
    }
  } catch (e) {
    // Alguns PDFs usam raw deflate sem cabeçalho zlib, tenta fallback
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const response = new Response(ds.readable);
        const text = await response.text();
        return text;
      }
    } catch (e2) {}
  }

  // Fallback: decodifica bytes brutos como texto ISO-8859-1
  try {
    const decoder = new TextDecoder('latin1');
    return decoder.decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Extrai o texto contido em objetos PDF (blocos não comprimidos e comprimidos via streams)
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const latinDecoder = new TextDecoder('latin1');
  const rawFileText = latinDecoder.decode(bytes);

  let accumulatedText = '';

  // 1. Tenta extrair texto de streams comprimidos com /FlateDecode
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  // Limite de segurança para não travar o navegador em arquivos gigantes
  let streamCount = 0;
  while ((match = streamRegex.exec(rawFileText)) !== null && streamCount < 30) {
    streamCount++;
    const streamStartPos = match.index + match[0].indexOf('stream') + (match[0].includes('\r\n') ? 8 : 7);
    const streamLen = match[1].length;
    
    // Pega o slice binário exato da stream
    const streamBytes = bytes.slice(streamStartPos, streamStartPos + streamLen);
    const decompressed = await decompressFlate(streamBytes);
    if (decompressed && decompressed.length > 5) {
      accumulatedText += ' ' + decompressed;
    }
  }

  // 2. Concatena com o texto plano fora de streams ou dentro do documento
  accumulatedText += ' ' + rawFileText;

  // 3. Limpa caracteres de escape do formato PDF: \( \) \r \n
  const cleaned = accumulatedText
    .replace(/\\([()\\])/g, '$1')
    .replace(/[\r\n\t]+/g, ' ');

  return cleaned;
}

/**
 * Audita o arquivo de Nota Fiscal enviado confrontando com os valores esperados
 */
export async function auditInvoicePdf(
  file: File,
  expectedGrossAmount: number,
  affiliateDocument?: string
): Promise<InvoiceAuditResult> {
  try {
    const text = await extractTextFromPdf(file);
    const upperText = text.toUpperCase();

    // 1. Checagem do Tomador (Serviços Urbanos Tecnologia Ltda.)
    const cleanDoc = (d: string) => (d || '').replace(/\D/g, '');
    const hasTomadorCnpj = 
      upperText.includes(TOMADOR_CNPJ_CLEAN) || 
      upperText.includes(TOMADOR_CNPJ_FORMATTED) ||
      upperText.includes('SERVICOS URBANOS TECNOLOGIA') ||
      upperText.includes('SERVIÇOS URBANOS TECNOLOGIA');

    // 2. Checagem do Prestador (CPF ou CNPJ do Afiliado)
    let hasPrestadorDocument = true;
    if (affiliateDocument) {
      const affClean = cleanDoc(affiliateDocument);
      if (affClean.length >= 9) {
        hasPrestadorDocument = upperText.includes(affClean) || upperText.includes(affiliateDocument);
      }
    }

    // 3. Extração dos Valores no Documento
    // Padrões comuns em NFS-e:
    // "VALOR TOTAL DA NOTA = R$ 20,00"
    // "VALOR DOS SERVIÇOS: R$ 18.666,68"
    // "VALOR LÍQUIDO: R$ ..."
    // "VALOR TOTAL DA NFS-E: R$ ..."
    const candidates: number[] = [];

    // Regex para buscar valores precedidos de marcadores fiscais
    const fiscalValuePatterns = [
      /(?:VALOR\s+(?:DOS\s+)?SERVI[CÇ]OS?|VALOR\s+TOTAL(?:\s+DA\s+NOTA|\s+DA\s+NFS-E)?|VALOR\s+L[IÍ]QUIDO|TOTAL\s+DA\s+NOTA|VALOR\s+TOTAL\s+R\$)\s*[:=]?\s*(?:R\$\s*)?([\d\.,]{3,14})/gi,
      /(?:R\$\s*)([\d]{1,3}(?:\.[\d]{3})*,\d{2})/g,
      /(?:[\s=:])([\d]{1,3}(?:\.[\d]{3})*,\d{2})/g
    ];

    for (const pat of fiscalValuePatterns) {
      let m: RegExpExecArray | null;
      while ((m = pat.exec(text)) !== null) {
        const val = parseBrazilianCurrency(m[1]);
        if (val > 0 && val < 5000000) {
          candidates.push(val);
        }
      }
    }

    // Procura número da nota
    let extractedNumber: string | null = null;
    const numMatch = /(?:N[ÚU]MERO\s+(?:DA\s+NOTA|DA\s+NFS-E)?|Nº|NOTA\s+N[º°]?)\s*[:=]?\s*(\d{1,9})/i.exec(text);
    if (numMatch) {
      extractedNumber = numMatch[1];
    }

    // Encontra o valor mais plausível ou aquele que mais se aproxima do esperado
    let extractedAmount: number | null = null;
    const expectedRounded = Math.round(expectedGrossAmount * 100) / 100;

    // Se o valor esperado exato foi encontrado nos candidatos fiscais
    const exactMatch = candidates.find(c => Math.abs(c - expectedRounded) < 0.02);

    if (exactMatch !== undefined) {
      extractedAmount = exactMatch;
    } else if (candidates.length > 0) {
      // Se não achou exato, pega o primeiro valor após "VALOR DOS SERVIÇOS" ou o maior valor fiscal
      extractedAmount = candidates[0];
    }

    // Avaliação de correspondência
    const isAmountMatching = extractedAmount !== null && Math.abs(extractedAmount - expectedRounded) < 0.02;

    // Validação geral
    let isValid = isAmountMatching && hasTomadorCnpj;
    let message = '';

    if (!hasTomadorCnpj) {
      isValid = false;
      message = 'Não identificamos o CNPJ da Serviços Urbanos (54.795.377/0001-03) como tomadora dos serviços no documento.';
    } else if (!isAmountMatching) {
      isValid = false;
      if (extractedAmount !== null) {
        message = `Valor divergente! Identificamos R$ ${extractedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no documento, mas o valor apurado a receber é R$ ${expectedRounded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      } else {
        message = `Não foi possível identificar com clareza o valor de R$ ${expectedRounded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no documento anexado.`;
      }
    } else {
      message = `Nota fiscal validada com sucesso! Valor conferido: R$ ${extractedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
    }

    return {
      isValid,
      extractedAmount,
      extractedNumber,
      hasTomadorCnpj,
      hasPrestadorDocument,
      isAmountMatching,
      message,
      rawTextPreview: text.substring(0, 300)
    };
  } catch (err: any) {
    console.error('Erro na auditoria do PDF:', err);
    return {
      isValid: false,
      extractedAmount: null,
      extractedNumber: null,
      hasTomadorCnpj: false,
      hasPrestadorDocument: false,
      isAmountMatching: false,
      message: 'Não foi possível ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.'
    };
  }
}
