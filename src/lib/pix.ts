/**
 * Utilitário para geração de payload PIX (BRCode) estático
 * Versão com Padronização Automática e Conforme Normas do BACEN
 */

export interface PixOptions {
  key: string;
  amount: number;
  description: string;
  name?: string;
  city?: string;
  keyType?: string;
}

export function generatePixPayload({ key, amount, description, name, city, keyType }: PixOptions) {
  // 1. Sanitização rigorosa
  const cleanKey = sanitizeKey(key, keyType);
  const cleanName = sanitizeText(name || 'URBASHOP').substring(0, 25).toUpperCase();
  const cleanCity = sanitizeText(city || 'SALVADOR').substring(0, 15).toUpperCase();
  const cleanDesc = sanitizeText(description || 'REPASSE').substring(0, 25).toUpperCase();
  
  const amountStr = Number(amount).toFixed(2);

  const f = (id: string, value: string) => {
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = 'br.gov.bcb.pix';
  const merchantInfo = f('00', gui) + f('01', cleanKey);
  
  const rawTxid = (description || 'PAG')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 25);
  const txid = rawTxid.length > 0 ? rawTxid : 'PAG';
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
export function sanitizeKey(key: string, keyType?: string): string {
  if (!key) return '';
  const val = key.trim();
  
  // 1. E-MAIL: Mantém original mas em minúsculas
  if (val.includes('@') || keyType?.toLowerCase() === 'email') return val.toLowerCase();
  
  // 2. CHAVE ALEATÓRIA: Mantém o formato UUID (com hífens)
  if (val.length > 30 && val.includes('-')) return val.toLowerCase();

  const numeric = val.replace(/\D/g, '');
  const kt = (keyType || '').toLowerCase();

  // 3. Se explicitamente informado o tipo
  if (kt === 'cpf' || kt.includes('cpf')) {
    return numeric;
  }
  if (kt === 'cnpj' || kt.includes('cnpj') || numeric.length === 14) {
    return numeric;
  }
  if (kt === 'telefone' || kt === 'phone' || kt.includes('tel')) {
    if (numeric.startsWith('55') && (numeric.length === 12 || numeric.length === 13)) {
      return `+${numeric}`;
    }
    return `+55${numeric}`;
  }

  // 4. Se a chave foi digitada com máscara de CPF (000.000.000-00)
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val)) {
    return numeric;
  }

  // 5. Se a chave foi digitada com máscara de CNPJ (00.000.000/0000-00)
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val)) {
    return numeric;
  }

  // 6. Se tem 10 dígitos (DDD + 8 dígitos de fixo)
  if (numeric.length === 10) {
    return `+55${numeric}`;
  }

  // 7. Se tem 11 dígitos:
  // Se veio com máscara explícita de telefone: (XX) 9XXXX-XXXX
  if (/^\(?\d{2}\)?\s*9\d{4}-?\d{4}$/.test(val)) {
    return `+55${numeric}`;
  }

  // Se o 3º dígito NÃO for '9', é obrigatoriamente CPF (pois no Brasil todo celular após o DDD tem 9)
  // Exemplo: 435.608.030-04 -> DDD 43, terceiro dígito 5 -> CPF puro!
  if (numeric.length === 11) {
    return numeric;
  }

  // 8. Se já tem +55 ou começa com 55 e tem 12 ou 13 dígitos
  if (val.startsWith('+55')) {
    return val;
  }
  if ((numeric.length === 12 || numeric.length === 13) && numeric.startsWith('55')) {
    return `+${numeric}`;
  }

  return numeric || val;
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
