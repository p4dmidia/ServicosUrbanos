// =========================================================================
// TYPES OFICIAIS: SEPARAÇÃO PRODUTO A (MICROFRANQUEADO) E PRODUTO B (SEGURO)
// =========================================================================

// =========================================================================
// 1. PRODUTO A: MICROFRANQUEADO (MMN)
// =========================================================================

export type MicrofranqueadoStatus = 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado';
export type LicencaMMNStatus = 'ativa' | 'pendente' | 'expirada' | 'bloqueada_inadimplente' | 'cancelada';
export type ComissaoMMNStatus = 'pendente' | 'liberado_semanal' | 'bloqueado_inadimplencia' | 'pago_semanal' | 'pago_anual' | 'cancelado';
export type TermoMMNTipo = 'termo_adesao_microfranqueado' | 'termo_intermediacao_anexo_xiii';

export interface Microfranqueado {
  id: string;
  profile_id: string;
  status: MicrofranqueadoStatus;
  limit_100_free: boolean;
  registration_fee_amount: number;
  registration_fee_status: 'isento' | 'pendente_dezembro' | 'pago' | 'atrasado';
  cobranca_dezembro: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicencaMMN {
  id: string;
  microfranqueado_id: string;
  profile_id: string;
  status: LicencaMMNStatus;
  validade_meses: number; // 12
  data_inicio: string;
  data_fim: string;
  valor: number;
  gratis_100_primeiros: boolean;
  cobranca_dezembro: boolean;
  ano_referencia: number;
  created_at: string;
  updated_at: string;
}

export interface RedeMMNItem {
  id: string;
  microfranqueado_id: string;
  indicado_profile_id: string;
  nivel: 0 | 1 | 2;
  tipo_indicado: 'afiliado_premium' | 'microfranqueado';
  created_at: string;
  indicado_nome?: string;
  indicado_email?: string;
  indicado_whatsapp?: string;
  indicado_status?: string;
}

export interface ComissaoMMN {
  id: string;
  order_id?: string;
  microfranqueado_id: string;
  origem_profile_id: string;
  nivel: 0 | 1 | 2;
  valor_venda: number;
  percentual_bruto: number; // 23% para G0 (21%+2%), 5% para G1 (3%+2%), 5% para G2 (3%+2%)
  valor_bruto: number;
  valor_semanal_80: number; // Semanal pago na terça-feira (21% G0, 3% G1, 3% G2)
  valor_anual_20: number; // Anual pago em 10 de dezembro (2% G0, 2% G1, 2% G2)
  status: ComissaoMMNStatus;
  semana_inicio?: string;
  semana_fim?: string;
  data_prevista_terca?: string;
  data_prevista_dezembro?: string;
  pago_semanal_em?: string;
  pago_anual_em?: string;
  created_at: string;
}

export interface CashbackMMN {
  id: string;
  microfranqueado_id: string;
  comissao_id?: string;
  tipo: 'semanal_80' | 'anual_20';
  valor: number;
  status: 'acumulado' | 'bloqueado' | 'liberado' | 'pago' | 'zerado_cancelamento';
  data_liberacao?: string;
  created_at: string;
}

export interface InadimplenciaMMN {
  id: string;
  microfranqueado_id: string;
  motivo: string;
  saldo_bloqueado: number;
  data_bloqueio: string;
  data_regularizacao?: string;
  status: 'bloqueado' | 'regularizado' | 'cancelado_zerado';
  created_at: string;
}

export interface AceiteMMN {
  id: string;
  microfranqueado_id: string;
  tipo_termo: TermoMMNTipo;
  versao_documento: string;
  hash_texto: string;
  ip?: string;
  user_agent?: string;
  data_hora: string;
}


// =========================================================================
// 2. PRODUTO B: SEGURO VIDA LIGHT (AFILIADO PREMIUM)
// =========================================================================

export type SeguradoStatus = 'ativo' | 'inadimplente' | 'cancelado';
export type ApoliceStatus = 'ativa' | 'suspensa_inadimplencia' | 'cancelada' | 'expirada';
export type SinistroStatus = 'aberto' | 'em_analise' | 'documentos_pendentes' | 'aprovado' | 'rejeitado' | 'indenizado';
export type TipoSinistro = 'morte_acidental' | 'invalidez_permanente_total' | 'invalidez_permanente_parcial';
export type TipoDocumentoSinistro = 'certidao_obito' | 'laudo_medico' | 'boletim_ocorrencia' | 'documento_identificacao' | 'comprovante_residencia' | 'declaracao_herdeiros' | 'outro';

export interface Segurado {
  id: string;
  profile_id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: 'M' | 'F' | 'Outro';
  email?: string;
  whatsapp?: string;
  status: SeguradoStatus;
  created_at: string;
  updated_at: string;
}

export interface ModalidadePagamento {
  id: string;
  codigo: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  nome: string;
  valor: number; // 5, 15, 30, 48
  meses_vigencia: number; // 1, 3, 6, 12
  quantidade_sorteios: number; // 4, 12, 24, 48
  ativo: boolean;
  created_at: string;
}

export interface Apolice {
  id: string;
  segurado_id: string;
  profile_id: string;
  order_id?: string;
  modalidade_codigo: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  numero_apolice: string; // 11-0982-000058940-0001
  numero_certificado?: string;
  seguradora: string;
  capital_segurado: number; // 5000.00
  premio_pago: number;
  vigencia_inicio: string;
  vigencia_fim: string;
  status: ApoliceStatus;
  created_at: string;
  updated_at: string;
}

export interface NumeroDaSorte {
  id: string;
  segurado_id: string;
  apolice_id: string;
  numero: string;
  serie?: string;
  mes_ano: string;
  status: 'ativo' | 'inativo' | 'premiado';
  created_at: string;
}

export interface Sorteio {
  id: string;
  data_sorteio: string;
  mes_ano: string;
  domingo_ordem: number; // 1 a 4
  numero_sorteado?: string;
  segurado_ganhador_id?: string;
  apolice_ganhadora_id?: string;
  numero_sorte_ganhador?: string;
  valor_premio_bruto: number; // 5000.00
  valor_premio_liquido: number; // 3750.00 (25% IRRF)
  status: 'agendado' | 'apurado' | 'pago' | 'cancelado';
  auditoria_loteria_federal?: string;
  created_at: string;
}

export interface TelemedicinaAcesso {
  id: string;
  segurado_id: string;
  apolice_id: string;
  provedor: string;
  url_acesso: string;
  status: 'ativo' | 'suspenso_inadimplencia' | 'revogado';
  data_ativacao: string;
  data_suspensao?: string;
  created_at: string;
  updated_at: string;
}

export interface Sinistro {
  id: string;
  segurado_id: string;
  apolice_id: string;
  tipo_sinistro: TipoSinistro;
  data_ocorrencia: string;
  descricao: string;
  status: SinistroStatus;
  valor_solicitado: number;
  valor_indenizado?: number;
  observacoes_analise?: string;
  data_abertura: string;
  data_conclusao?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentoSinistro {
  id: string;
  sinistro_id: string;
  tipo_documento: TipoDocumentoSinistro;
  arquivo_url: string;
  nome_arquivo: string;
  status: 'enviado' | 'em_analise' | 'aprovado' | 'rejeitado';
  motivo_rejeicao?: string;
  enviado_em: string;
  avaliado_em?: string;
}

export interface AceiteSeguro {
  id: string;
  segurado_id: string;
  versao_termo: string;
  hash_texto: string;
  ip?: string;
  user_agent?: string;
  data_hora: string;
}
