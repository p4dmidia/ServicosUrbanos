/**
 * Utilitário para geração de payload PIX (BRCode) estático
 * Versão com Padronização Automática de Chaves
 */

interface PixOptions {
  key: string;
  amount: number;
  description: string;
  name?: string;
  city?: string;
}

export function generatePixPayload({ key, amount, description, name, city }: PixOptions) {
  // 1. Sanitização rigorosa
  const cleanKey = sanitizeKey(key);
  const cleanName = sanitizeText(name || 'URBASHOP').substring(0, 25).toUpperCase();
  const cleanCity = sanitizeText(city || 'SAO PAULO').substring(0, 15).toUpperCase();
  const cleanDesc = sanitizeText(description || 'REPASSE').substring(0, 25).toUpperCase();
  
  const amountStr = Number(amount).toFixed(2);

  const f = (id: string, value: string) => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = 'br.gov.bcb.pix';
  const merchantInfo = f('00', gui) + f('01', cleanKey);
  
  const txid = '***';
  const additionalData = f('05', txid);

  let payload = '';
  payload += f('00', '01');
  payload += f('01', '11');
  payload += f('26', merchantInfo);
  payload += f('52', '0000');
  payload += f('53', '986');
  payload += f('54', amountStr);
  payload += f('58', 'BR');
  payload += f('59', cleanName);
  payload += f('60', cleanCity);
  payload += f('62', additionalData);
  
  payload += '6304';
  const crc = calculateCRC16(payload);
  payload += crc.toUpperCase();

  return payload;
}

function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/gi, '')
    .trim();
}

/**
 * PADRONIZAÇÃO AUTOMÁTICA DE CHAVES PIX
 * Segue as normas do Manual de Padrões para Iniciação do Pix (BACEN)
 */
function sanitizeKey(key: string): string {
  if (!key) return '';
  const val = key.trim();
  
  // 1. E-MAIL: Mantém original mas em minúsculas
  if (val.includes('@')) return val.toLowerCase();
  
  // 2. CHAVE ALEATÓRIA: Mantém o formato UUID (com hífens)
  if (val.length > 30 && val.includes('-')) return val.toLowerCase();

  // 3. TELEFONE, CPF ou CNPJ (apenas números inicialmente)
  const numeric = val.replace(/\D/g, '');
  
  // 4. TELEFONE (Formato E.164 obrigatório: +55...)
  // Se tem 10 ou 11 dígitos, é um celular/fixo do Brasil
  if (numeric.length === 10 || numeric.length === 11) {
    return `+55${numeric}`;
  }
  // Se já tem 55 no início e 12/13 dígitos, adiciona o +
  if ((numeric.length === 12 || numeric.length === 13) && numeric.startsWith('55')) {
    return `+${numeric}`;
  }
  
  // 5. CPF ou CNPJ: Apenas números
  if (numeric.length === 11 || numeric.length === 14) {
    return numeric;
  }
  
  return val; // Fallback
}

function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).padStart(4, '0');
}
