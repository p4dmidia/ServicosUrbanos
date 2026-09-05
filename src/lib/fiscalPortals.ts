// Mapeamento e Roteamento de Portais de Emissão de Nota Fiscal (NFS-e / Nota Avulsa)
// Suporte ao Emissor Nacional (MEI) e prefeituras municipais

export interface FiscalPortalInfo {
  cityName: string;
  state: string;
  portalName: string;
  directAvulsaUrl?: string;
  portalUrl: string;
  instructions: string;
}

export const NATIONAL_MEI_PORTAL = {
  name: 'Emissor Nacional da NFS-e (Receita Federal / Gov.br)',
  url: 'https://www.nfse.gov.br/EmissorNacional/',
  appUrl: 'https://play.google.com/store/apps/details?id=br.gov.fazenda.receita.nfse',
  description: 'Obrigatório para todos os MEIs do Brasil desde setembro de 2023, independentemente do município.'
};

// Dicionário com as principais capitais e cidades polo dos afiliados
export const MUNICIPAL_FISCAL_PORTALS: Record<string, FiscalPortalInfo> = {
  'salvador': {
    cityName: 'Salvador',
    state: 'BA',
    portalName: 'Nota Salvador / Sefaz Salvador',
    directAvulsaUrl: 'https://nfse.salvador.ba.gov.br/notaavulsa/default.aspx',
    portalUrl: 'https://nota.salvador.ba.gov.br/',
    instructions: 'Acesse o sistema de Nota Avulsa da Prefeitura de Salvador com sua SenhaWeb e emita a guia ou nota com o CNPJ da Serviços Urbanos.'
  },
  'lauro de freitas': {
    cityName: 'Lauro de Freitas',
    state: 'BA',
    portalName: 'SEFAZ Lauro de Freitas (TributosWeb)',
    directAvulsaUrl: 'https://sefaz.laurodefreitas.ba.gov.br/',
    portalUrl: 'https://sefaz.laurodefreitas.ba.gov.br/',
    instructions: 'Emita a Nota Fiscal de Serviços Avulsa pelo portal oficial da SEFAZ Lauro de Freitas.'
  },
  'camacari': {
    cityName: 'Camaçari',
    state: 'BA',
    portalName: 'SEFAZ Camaçari / TributosWeb',
    portalUrl: 'https://servicos.camacari.ba.gov.br/',
    instructions: 'Acesse o portal da Prefeitura de Camaçari para emissão de Nota Avulsa de Serviços.'
  },
  'feira de santana': {
    cityName: 'Feira de Santana',
    state: 'BA',
    portalName: 'Nota Feirense / SEFAZ Feira',
    portalUrl: 'https://sefaz.feiradesantana.ba.gov.br/',
    instructions: 'Emita a NFS-e ou Nota Avulsa através do portal fazendário de Feira de Santana.'
  },
  'simoes filho': {
    cityName: 'Simões Filho',
    state: 'BA',
    portalName: 'Prefeitura de Simões Filho',
    portalUrl: 'https://simoesfilho.ba.gov.br/',
    instructions: 'Acesse a área de tributos e notas avulsas da Prefeitura de Simões Filho.'
  },
  'sao paulo': {
    cityName: 'São Paulo',
    state: 'SP',
    portalName: 'Nota do Milhão / Nota Paulistana',
    directAvulsaUrl: 'https://nfe.prefeitura.sp.gov.br',
    portalUrl: 'https://nfe.prefeitura.sp.gov.br',
    instructions: 'Acesse a Nota do Milhão com seu CPF/SenhaWeb da Prefeitura de SP.'
  },
  'rio de janeiro': {
    cityName: 'Rio de Janeiro',
    state: 'RJ',
    portalName: 'Nota Carioca',
    directAvulsaUrl: 'https://notacarioca.rio.gov.br/',
    portalUrl: 'https://notacarioca.rio.gov.br/',
    instructions: 'Acesse a Nota Carioca para emissão de serviços no município do Rio de Janeiro.'
  },
  'belo horizonte': {
    cityName: 'Belo Horizonte',
    state: 'MG',
    portalName: 'BHISS Digital',
    portalUrl: 'https://bhissdigital.pbh.gov.br/',
    instructions: 'Acesse o portal BHISS Digital da Prefeitura de Belo Horizonte.'
  },
  'curitiba': {
    cityName: 'Curitiba',
    state: 'PR',
    portalName: 'Nota Curitibana',
    portalUrl: 'https://isscuritiba.curitiba.pr.gov.br/',
    instructions: 'Emita sua nota pelo portal oficial da Nota Curitibana.'
  },
  'brasilia': {
    cityName: 'Brasília',
    state: 'DF',
    portalName: 'Receita DF / Nota Legal',
    portalUrl: 'https://www.receita.fazenda.df.gov.br/',
    instructions: 'Acesse o portal da Receita do Distrito Federal para emissão de documentos fiscais.'
  }
};

/**
 * Normaliza o nome de uma cidade para busca (sem acentos e em minúsculas)
 */
export function normalizeCity(city: string): string {
  if (!city) return '';
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Obtém as informações do portal fiscal da cidade informada, ou gera um link dinâmico oficial
 */
export function getFiscalPortalForCity(cityName?: string, stateName?: string): FiscalPortalInfo {
  const norm = normalizeCity(cityName || '');
  if (norm && MUNICIPAL_FISCAL_PORTALS[norm]) {
    return MUNICIPAL_FISCAL_PORTALS[norm];
  }

  // Fallback inteligente para cidades não catalogadas
  const cleanCity = (cityName || '').trim();
  const cleanState = (stateName || '').trim();

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`emissao nota fiscal avulsa prefeitura ${cleanCity} ${cleanState}`)}`;

  return {
    cityName: cleanCity || 'Outro Município',
    state: cleanState,
    portalName: `Prefeitura Municipal de ${cleanCity || 'seu Município'}`,
    portalUrl: searchUrl,
    directAvulsaUrl: searchUrl,
    instructions: `Acesse o portal de serviços ou tributos da Prefeitura de ${cleanCity || 'seu município'} para emitir a Nota Fiscal Avulsa (NFA-e), ou utilize o Emissor Nacional caso seja MEI.`
  };
}
