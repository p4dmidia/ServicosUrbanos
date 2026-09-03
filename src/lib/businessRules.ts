import { supabase } from './supabase';

// Interfaces
export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface MerchantUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'affiliate' | 'customer';
  branchId?: string;
  merchantId?: string;
  commissionRate: number;
  referralCode?: string;
  rank?: string;
  storeName?: string;
  cnpj?: string;
  whatsapp?: string;
  cpf?: string;
  description?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  stockAddress?: string;
  stockNumber?: string;
  stockNeighborhood?: string;
  stockCity?: string;
  stockState?: string;
  stockZipCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
  avatarUrl?: string;
}

export interface MerchantProduct {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  stock: number;
  sales: number;
  cashback: number;
  status: 'Ativo' | 'Inativo';
  image: string;
  mainImage?: string;
  gallery?: string[];
  branchId: string;
  merchantId: string;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  description?: string;
  branchStocks?: { branch_id: string, stock: number }[];
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  merchantId: string;
}

export interface ShippingMethod {
  id: string;
  merchantId: string;
  name: string;
  type: 'fixed' | 'calculated';
  fee: number;
  deadline: string;
  active: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerInitial: string;
  amount: number;
  status: 'Pendente' | 'Processando' | 'Enviado' | 'Concluído' | 'Cancelado';
  items: any;
  branchId: string;
  cashbackAmount: number;
  date: string;
}

export interface OrderWithCode {
  id: string;
  withdrawalCode: string;
  status: string;
}

export interface FinancialConfig {
  minWithdrawalAmount: number;
  withdrawalFee: number;
  payoutSchedule: string;
}

export interface MarketplaceConfig {
  commissionRate: number;
}

// Funções Auxiliares Fiscais (INSS 11% para PF limitado a R$ 932,31 / 0% para PJ)
export function isCnpj(documentOrCpf?: string | null, pixType?: string | null): boolean {
  if (pixType === 'cnpj') return true;
  if (!documentOrCpf) return false;
  const digits = documentOrCpf.replace(/\D/g, '');
  return digits.length > 11;
}

export function calculateTaxDeductions(bruto: number, isPjUser: boolean = false) {
  const safeBruto = Math.max(0, bruto || 0);
  if (isPjUser || safeBruto <= 0) {
    return {
      bruto: parseFloat(safeBruto.toFixed(2)),
      inss: 0,
      inssRate: 0,
      inssMax: 932.31,
      liquido: parseFloat(safeBruto.toFixed(2)),
      isPJ: true,
      patronal: 0
    };
  }

  // Regra PF solicitada:
  // INSS: 11% fixo, limitado a R$ 932,31
  const inssRate = 0.11;
  const inssMax = 932.31;
  const rawInss = safeBruto * inssRate;
  const inss = Math.min(rawInss, inssMax);
  const liquido = Math.max(0, safeBruto - inss);
  
  // INSS Patronal (Encargo da empresa): 20% sobre o bruto
  const patronal = safeBruto * 0.20;

  return {
    bruto: parseFloat(safeBruto.toFixed(2)),
    inss: parseFloat(inss.toFixed(2)),
    inssRate,
    inssMax,
    liquido: parseFloat(liquido.toFixed(2)),
    isPJ: false,
    patronal: parseFloat(patronal.toFixed(2))
  };
}

export const businessRules = {
  // Usuário Atual
  getCurrentUser: async (): Promise<MerchantUser | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.full_name || 'Usuário',
      email: user.email || profile.email || '',
      role: profile.role,
      commissionRate: profile.commission_rate || 0,
      storeName: profile.store_name,
      cnpj: profile.cnpj,
      whatsapp: profile.whatsapp,
      cpf: profile.cpf,
      description: profile.description,
      address: profile.address,
      number: profile.number,
      neighborhood: profile.neighborhood,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zip_code,
      stockAddress: profile.stock_address,
      stockNumber: profile.stock_number,
      stockNeighborhood: profile.stock_neighborhood,
      stockCity: profile.stock_city,
      stockState: profile.stock_state,
      stockZipCode: profile.stock_zip_code,
      bankName: profile.bank_name,
      bankAgency: profile.bank_agency,
      bankAccount: profile.bank_account,
      pixKey: profile.pix_key,
      avatarUrl: profile.avatar_url,
      branchId: profile.branch_id
    };
  },

  // Busca o ID do lojista (dono) a partir de um usuário (gerente ou dono)
  getMerchantId: async (userId: string): Promise<string | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, branch_id, merchant_id')
      .eq('id', userId)
      .single();

    if (!profile) return null;
    if (profile.role === 'owner') return profile.id;

    if (profile.role === 'manager') {
      if (profile.merchant_id) return profile.merchant_id;
      
      if (profile.branch_id) {
        const { data: branch } = await supabase
          .from('branches')
          .select('merchant_id')
          .eq('id', profile.branch_id)
          .maybeSingle();
        
        return branch?.merchant_id || null;
      }
    }

    return null;
  },

  // Verifica se o usuário tem permissão temporária de acesso à área de lojista
  checkMerchantAccess: async (userId: string, userEmail?: string): Promise<boolean> => {
    let emailNormalized = userEmail?.trim().toLowerCase();
    
    // Buscar perfil do usuário atual
    const profile = await businessRules.getProfileById(userId);
    if (!profile) return false;

    // Se for gerente, verifica se a filial dele está suspensa (inactive)
    if (profile.role === 'manager' && profile.branchId) {
      const { data: branch } = await supabase
        .from('branches')
        .select('status')
        .eq('id', profile.branchId)
        .maybeSingle();

      if (branch && branch.status === 'inactive') {
        console.warn('Acesso bloqueado: filial suspensa.');
        return false;
      }
    }

    // Se for dono (owner), verifica se ele possui pelo menos uma filial ativa
    if (profile.role === 'owner') {
      const { data: branches } = await supabase
        .from('branches')
        .select('status')
        .eq('merchant_id', profile.id);

      // Se tiver filiais cadastradas mas todas estiverem suspensas, bloqueia o acesso
      if (branches && branches.length > 0 && branches.every(b => b.status === 'inactive')) {
        console.warn('Acesso bloqueado: todas as filiais do lojista estão suspensas.');
        return false;
      }
    }

    if (!emailNormalized) {
      emailNormalized = profile.email?.trim().toLowerCase();
    }

    if (emailNormalized === 'xipsdapraia23@gmail.com') {
      return true;
    }

    // Se for gerente, verifica se o dono da filial é o lojista autorizado
    if (profile.role === 'manager') {
      const ownerId = await businessRules.getMerchantId(userId);
      if (ownerId) {
        const ownerProfile = await businessRules.getProfileById(ownerId);
        if (ownerProfile && ownerProfile.email?.trim().toLowerCase() === 'xipsdapraia23@gmail.com') {
          return true;
        }
      }
    }

    return false;
  },

  // Ativa o lado lojista de uma conta já existente (Afiliado -> Lojista)
  activateMerchantAccount: async (userId: string, data: { storeName: string; cnpj: string }) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'owner',
        store_name: data.storeName,
        cnpj: data.cnpj,
        status: 'active'
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // Busca perfil por ID
  getProfileById: async (userId: string): Promise<MerchantUser | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.full_name || 'Usuário',
      email: profile.email || '',
      role: profile.role,
      commissionRate: profile.commission_rate || 0,
      storeName: profile.store_name,
      cnpj: profile.cnpj,
      whatsapp: profile.whatsapp,
      cpf: profile.cpf,
      description: profile.description,
      address: profile.address,
      number: profile.number,
      neighborhood: profile.neighborhood,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zip_code,
      stockAddress: profile.stock_address,
      stockNumber: profile.stock_number,
      stockNeighborhood: profile.stock_neighborhood,
      stockCity: profile.stock_city,
      stockState: profile.stock_state,
      stockZipCode: profile.stock_zip_code,
      bankName: profile.bank_name,
      bankAgency: profile.bank_agency,
      bankAccount: profile.bank_account,
      pixKey: profile.pix_key,
      avatarUrl: profile.avatar_url,
      branchId: profile.branch_id
    };
  },

  // Lojas (Branches)
  getBranches: async (merchantId?: string): Promise<Branch[]> => {
    let query = supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
    
    return data.map(b => ({
      id: b.id,
      name: b.name,
      address: b.address,
      city: b.city,
      state: b.state,
      zipCode: b.zip_code
    }));
  },

  addBranch: async (branch: Omit<Branch, 'id'> & { merchantId: string }) => {
    const { data, error } = await supabase
      .from('branches')
      .insert([{
        merchant_id: branch.merchantId,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        zip_code: branch.zipCode,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteBranch: async (branchId: string) => {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);
    
    if (error) throw error;
  },

  getAvailableManagers: async (): Promise<MerchantUser[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email || '', 
      role: p.role,
      branchId: p.branch_id,
      commissionRate: p.commission_rate
    }));
  },

  searchProfileByCpf: async (cpf: string) => {
    const { data, error } = await supabase.rpc('search_profile_by_cpf', { search_cpf: cpf });
    if (error) throw error;
    return data?.[0] || null;
  },

  getMerchantTeam: async (branchIds: string[]): Promise<MerchantUser[]> => {
    if (branchIds.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('branch_id', branchIds)
      .order('full_name');

    if (error) {
      console.error('Error fetching merchant team:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email || '',
      role: p.role,
      branchId: p.branch_id,
      commissionRate: p.commission_rate
    }));
  },

  // Usuários / Perfis
  getProfiles: async (): Promise<MerchantUser[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.full_name,
      email: '', 
      role: p.role,
      branchId: p.branch_id,
      commissionRate: p.commission_rate,
      storeName: p.store_name,
      cnpj: p.cnpj,
      stockAddress: p.stock_address,
      stockNumber: p.stock_number,
      stockNeighborhood: p.stock_neighborhood,
      stockCity: p.stock_city,
      stockState: p.stock_state,
      stockZipCode: p.stock_zip_code
    }));
  },

  updateUserCommission: async (userId: string, rate: number) => {
    const { error } = await supabase
      .from('profiles')
      .update({ commission_rate: rate })
      .eq('id', userId);
    
    if (error) throw error;
  },

  assignUserToBranch: async (userId: string, branchId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        branch_id: branchId,
        role: 'manager' // Importante: Garante que o usuário se torne gerente ao ser vinculado
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  updateProfile: async (userId: string, updates: any) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
  },

  addMerchantMember: async (member: { 
    name: string, 
    email: string, 
    cpf: string, 
    password?: string, 
    branchId: string, 
    commissionRate: number,
    userId?: string,
    merchantId: string,
    mode: 'create' | 'link'
  }) => {
    // Chamada para a Edge Function que lida com a criação segura de usuários
    const { data, error } = await supabase.functions.invoke('manage-merchant-team', {
      body: {
        mode: member.mode,
        cpf: member.cpf,
        email: member.email,
        name: member.name,
        password: member.password,
        branchId: member.branchId,
        commissionRate: member.commissionRate,
        userId: member.userId,
        merchantId: member.merchantId
      }
    });

    if (error) {
      console.error('Error managing team member:', error);
      throw new Error(error.message || 'Erro ao processar solicitação de equipe.');
    }
    
    return data;
  },

  updateMerchantMember: async (member: {
    userId: string,
    name: string,
    email?: string,
    password?: string,
    branchId: string,
    commissionRate: number,
    merchantId: string
  }) => {
    const { data, error } = await supabase.functions.invoke('manage-merchant-team', {
      body: {
        mode: 'update',
        userId: member.userId,
        name: member.name,
        email: member.email,
        password: member.password,
        branchId: member.branchId,
        commissionRate: member.commissionRate,
        merchantId: member.merchantId
      }
    });

    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(error.message || 'Erro ao atualizar gerente.');
    }
    return data;
  },

  removeMerchantMember: async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('manage-merchant-team', {
      body: {
        mode: 'unlink',
        userId: userId
      }
    });

    if (error) throw new Error(error.message || 'Erro ao remover gerente.');
    return data;
  },

  uploadAvatar: async (userId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  uploadProductImage: async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('marketplace') // Usando um bucket genérico 'marketplace' ou criamos um novo
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('marketplace')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Pedidos
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map(o => ({
      id: o.id,
      customerName: o.customer_name,
      customerInitial: o.customer_initial,
      amount: o.amount,
      status: o.status,
      items: o.items,
      branchId: o.branch_id,
      cashbackAmount: o.cashback_amount,
      date: new Date(o.order_date).toLocaleDateString('pt-BR')
    }));
  },

  // Métodos de Entrega (Shipping)
  getShippingMethods: async (merchantId: string): Promise<ShippingMethod[]> => {
    const { data, error } = await supabase
      .from('merchant_shipping')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at');

    if (error) {
      console.error('Error fetching shipping methods:', error);
      return [];
    }

    return data.map(s => ({
      id: s.id,
      merchantId: s.merchant_id,
      name: s.name,
      type: s.type,
      fee: Number(s.fee),
      deadline: s.deadline,
      active: s.active
    }));
  },

  addShippingMethod: async (method: Omit<ShippingMethod, 'id' | 'active'>) => {
    const { data, error } = await supabase
      .from('merchant_shipping')
      .insert([{
        merchant_id: method.merchantId,
        name: method.name,
        type: method.type,
        fee: method.fee,
        deadline: method.deadline
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  decrementStock: async (productId: string, quantity: number, branchId?: string | null) => {
    const { error } = await supabase.rpc('decrement_stock', {
      p_product_id: productId,
      p_quantity: quantity,
      p_branch_id: branchId || null
    });

    if (error) {
      console.error('ERRO CRÍTICO AO ATUALIZAR ESTOQUE VIA RPC:', error.message, error.details);
      throw new Error(`Erro ao atualizar estoque: ${error.message}`);
    } else {
      console.log(`Estoque decrementado via RPC com sucesso para o produto ${productId}.`);
    }
  },

  getProductStocks: async (productId: string): Promise<{ branch_id: string, stock: number }[]> => {
    const { data, error } = await supabase
      .from('product_stocks')
      .select('branch_id, stock')
      .eq('product_id', productId);

    if (error) {
      console.error('Erro ao buscar estoques por filial:', error.message);
      return [];
    }
    return data || [];
  },

  saveProductStocks: async (productId: string, stocks: { branchId: string, stock: number }[]) => {
    // 1. Limpar estoques anteriores para este produto
    const { error: deleteError } = await supabase
      .from('product_stocks')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Erro ao limpar estoques anteriores:', deleteError.message);
      throw deleteError;
    }

    if (stocks.length === 0) return;

    // 2. Inserir os novos estoques
    const inserts = stocks.map(s => ({
      product_id: productId,
      branch_id: s.branchId,
      stock: s.stock
    }));

    const { error: insertError } = await supabase
      .from('product_stocks')
      .insert(inserts);

    if (insertError) {
      console.error('Erro ao salvar estoques por filial:', insertError.message);
      throw insertError;
    }
  },

  updateShippingMethod: async (id: string, updates: Partial<ShippingMethod>) => {
    const { error } = await supabase
      .from('merchant_shipping')
      .update({
        name: updates.name,
        fee: updates.fee,
        deadline: updates.deadline,
        active: updates.active
      })
      .eq('id', id);

    if (error) throw error;
  },

  deleteShippingMethod: async (id: string) => {
    const { error } = await supabase
      .from('merchant_shipping')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Pedidos Extra (Códigos de Retirada)
  getOrderExtra: async (orderId: string): Promise<OrderWithCode | null> => {
    const { data, error } = await supabase
      .from('order_extras')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) return null;
    return {
      id: data.id,
      withdrawalCode: data.withdrawal_code,
      status: data.status
    };
  },

  saveOrderExtra: async (orderId: string, extra: Partial<OrderWithCode>) => {
    const { error } = await supabase
      .from('order_extras')
      .upsert({
        id: orderId,
        withdrawal_code: extra.withdrawalCode || `${orderId}/${Array.from({ length: 3 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
        status: extra.status || 'Pendente'
      });

    if (error) throw error;
  },

  // MMN Config
  getMMNConfig: async () => {
    const { data, error } = await supabase
      .from('mmn_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    
    if (error || !data) {
      if (error) {
        console.error('ERRO AO BUSCAR MMN_CONFIG NO BANCO:', error);
      }
      // Retorna um padrão inicial seguro para não quebrar a tela, mas permite salvar por cima
      return { 
        depth: 6, 
        paymentType: 'percent' as const,
        cashbackMensal: 2.75,
        cashbackDigital: 1.00,
        cashbackAnual: 0.75,
        commissionRegionalSemanal: 2.00,
        commissionRegionalMensal: 2.00,
        commissionRegionalAnual: 2.00
      };
    }
    
    return {
      depth: data.depth,
      paymentType: data.payment_type as 'percent' | 'fixed',
      cashbackMensal: Number(data.cashback_mensal),
      cashbackDigital: Number(data.cashback_digital),
      cashbackAnual: Number(data.cashback_anual),
      commissionRegionalSemanal: Number(data.commission_regional_semanal ?? 2.00),
      commissionRegionalMensal: Number(data.commission_regional_mensal ?? 2.00),
      commissionRegionalAnual: Number(data.commission_regional_anual ?? 2.00)
    };
  },

  getMMNLevels: async () => {
    const { data, error } = await supabase
      .from('mmn_levels')
      .select('*')
      .order('level');
    
    if (error) {
      console.error('Error fetching MMN levels:', error);
      return [];
    }
    
    return data.map(l => ({ level: l.level, value: l.value }));
  },

  saveMMNConfig: async (config: { 
    depth: number; 
    paymentType: 'percent' | 'fixed';
    cashbackMensal: number;
    cashbackDigital: number;
    cashbackAnual: number;
    commissionRegionalSemanal: number;
    commissionRegionalMensal: number;
    commissionRegionalAnual: number;
  }) => {
    const { error } = await supabase
      .from('mmn_config')
      .upsert({ 
        id: 1, 
        depth: config.depth, 
        payment_type: config.paymentType,
        cashback_mensal: config.cashbackMensal,
        cashback_digital: config.cashbackDigital,
        cashback_anual: config.cashbackAnual,
        commission_regional_semanal: config.commissionRegionalSemanal,
        commission_regional_mensal: config.commissionRegionalMensal,
        commission_regional_anual: config.commissionRegionalAnual,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  },

  saveMMNLevels: async (levels: { level: number; value: number }[]) => {
    // Primeiro limpamos os níveis antigos para evitar conflitos se a profundidade diminuiu
    // Embora o ideal fosse um delete + insert ou upsert inteligente
    const { error: deleteError } = await supabase
      .from('mmn_levels')
      .delete()
      .neq('level', 0); // Deleta todos

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('mmn_levels')
      .insert(levels.map(l => ({ level: l.level, value: l.value })));
    
    if (insertError) throw insertError;
  },

  // Financial Config
  getFinancialConfig: async (): Promise<FinancialConfig> => {
    const { data, error } = await supabase
      .from('finance_config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching financial config:', error);
      return { 
        minWithdrawalAmount: 50, 
        withdrawalFee: 4.90, 
        payoutSchedule: 'Padrão (D+15)' 
      };
    }
    
    return {
      minWithdrawalAmount: data.min_withdrawal_amount,
      withdrawalFee: data.withdrawal_fee,
      payoutSchedule: data.payout_schedule
    };
  },

  saveFinancialConfig: async (config: FinancialConfig) => {
    const { error } = await supabase
      .from('finance_config')
      .upsert({ 
        id: 1, 
        min_withdrawal_amount: config.minWithdrawalAmount, 
        withdrawal_fee: config.withdrawalFee, 
        payout_schedule: config.payoutSchedule,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  },
  // Cálculos de Rede e Nível
  getNetworkSummary: async (userId: string) => {
    try {
      // 1. Buscar profundidade real no banco
      // No modelo MMN (G0 ao G2), o banco armazena depth = 3 representando as faixas comissionadas (G0, G1 e G2),
      // e o gatilho SQL percorre v_current_level < v_depth (isto é, 2 níveis de indicados: G1 diretos e G2 indiretos).
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const rawDepth = config?.depth || 3;
      const depth = Math.min(rawDepth > 2 ? rawDepth - 1 : rawDepth, 2);

      // 2. Buscar todos os níveis dinamicamente
      const levels: { [key: string]: number } = {};
      const allSeenIds = new Set([userId]); // Começamos com o usuário logado
      let currentParentIds = [userId];
      let total = 0;

      // Inicializar todos os níveis com 0
      for (let i = 1; i <= depth; i++) {
        levels[`g${i}`] = 0;
      }

      for (let i = 1; i <= depth; i++) {
        if (currentParentIds.length === 0) break;

        const { data: levelMembers, error: levelError } = await supabase
          .from('profiles')
          .select('id, full_name, referred_by')
          .in('referred_by', currentParentIds);

        if (levelError || !levelMembers || levelMembers.length === 0) {
          currentParentIds = [];
          continue;
        }

        // Filtrar apenas quem NUNCA vimos antes
        const newIds: string[] = [];
        const newNames: string[] = [];
        levelMembers.forEach(p => {
          if (!allSeenIds.has(p.id)) {
            newIds.push(p.id);
            newNames.push(p.full_name || 'Sem Nome');
            allSeenIds.add(p.id);
          }
        });

        levels[`g${i}`] = newIds.length;
        total += newIds.length;
        
        // Os "pais" do próximo nível são apenas os "filhos" NOVOS deste nível
        currentParentIds = newIds;
      }

      // Cálculo de Rank (Mantendo por compatibilidade, mas pode ser ajustado)
      let rank = 'Afiliado';
      if (total >= 500) rank = 'Diamante';
      else if (total >= 300) rank = 'Ouro';
      else if (total >= 150) rank = 'Prata';
      else if (total >= 50) rank = 'Bronze';

      return {
        ...levels,
        total,
        rank
      };
    } catch (error) {
      console.error("Error calculating dynamic network summary:", error);
      return { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, total: 0, rank: 'Afiliado' };
    }
  },

  getAffiliateStats: async (userId: string) => {
    try {
      if (!userId || userId === 'user123') {
        throw new Error('ID de usuário inválido.');
      }

      const [tResult, nSummary, oResult, allOrdersResult] = await Promise.all([
        supabase.from('transactions').select('amount, type, description, status, order_id').eq('profile_id', userId),
        businessRules.getNetworkSummary(userId),
        supabase.from('orders').select('id').eq('customer_id', userId).in('status', ['Pago, Aguardando Retirada', 'Concluído']),
        supabase.from('orders').select('id, status')
      ]);

      const ordersMap = new Map(allOrdersResult.data?.map(o => [o.id, o.status]) || []);
      const transactions = (tResult.data || []).filter(t => ordersMap.get(t.order_id) !== 'Cancelado');
      const consumptionCount = oResult.data?.length || 0;

      const isResellerTx = (t: any) => 
        t.description?.includes('Revendedor') || 
        t.description?.includes('Regional') ||
        t.description?.includes('(REG)');

      // Cálculo Real baseado no PRD (Divisão Tripla) exclusivo da REDE MMN
      // Carteira Semanal (CD): soma de todas as comissões de rede semanais (pending, completed ou pago)
      const walletBonus = transactions
        .filter(t => t.type === 'commission' && 
                !isResellerTx(t) &&
                (t.description?.includes('Digital') || t.description?.includes('(CD)') || t.description?.includes('Semanal')) && 
                (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      // Cashback Mensal e Anual da Rede: soma de todas as comissões de rede (pending, completed ou pago)
      const monthlyBonus = transactions
        .filter(t => t.type === 'commission' && 
                !isResellerTx(t) &&
                t.description?.includes('Mensal') && 
                (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const annualBonus = transactions
        .filter(t => t.type === 'commission' && 
                !isResellerTx(t) &&
                t.description?.includes('Anual') && 
                (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      // totalEarnings da Rede MMN: soma de todas as comissões da rede (ganhos históricos acumulados)
      const totalEarnings = monthlyBonus + annualBonus + walletBonus;
      
      // O Saldo Disponível conforme o PRD é o da Carteira Digital (CD) da rede
      const totalWithdrawn = transactions
        .filter(t => t.type === 'withdrawal' && 
                 !isResellerTx(t) &&
                 !t.description?.includes('Mensal') && 
                 !t.description?.includes('Anual') &&
                 (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

      const availableBalance = walletBonus - totalWithdrawn;

      // Buscar assinatura ativa ou última assinatura
      const { data: lastSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', userId)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const SIC_COMERCIO_ID = '194e5265-cdb6-431f-9f77-8888b1ee74ae';
      const isSicComercio = userId === SIC_COMERCIO_ID;

      let hasActiveSub = isSicComercio || (lastSub && lastSub.status === 'active' && new Date(lastSub.end_date) > new Date());
      let activeSubData = isSicComercio ? {
        id: 'sic-empresa-vitalicio',
        planType: 'Empresa (Vitalício)',
        amount: 0,
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2099-12-31',
        isActive: true
      } : (lastSub ? {
        id: lastSub.id,
        planType: lastSub.plan_type,
        amount: Number(lastSub.amount),
        status: lastSub.status,
        startDate: lastSub.start_date,
        endDate: lastSub.end_date,
        isActive: hasActiveSub
      } : null);

      // Fallback para LocalStorage se não houver assinatura ativa no Supabase
      if (!hasActiveSub) {
        try {
          const savedMock = localStorage.getItem(`mock_subscription_${userId}`);
          if (savedMock) {
            const mockData = JSON.parse(savedMock);
            if (new Date(mockData.endDate) > new Date() && mockData.status === 'active') {
              hasActiveSub = true;
              activeSubData = {
                id: mockData.id,
                planType: mockData.planType,
                amount: Number(mockData.amount),
                status: mockData.status,
                startDate: mockData.startDate,
                endDate: mockData.endDate,
                isActive: true
              };
            }
          }
        } catch (e) {
          console.error("Erro ao carregar mock_subscription:", e);
        }
      }

      return {
        monthlyBonus,
        annualBonus,
        walletBonus,
        walletBalance: availableBalance,
        maintenanceFee: 0,
        totalEarnings,
        availableBalance,
        cashbackBalance: 0,
        consumptionCount,
        isEligible: !!hasActiveSub,
        activeSubscription: activeSubData,
        networkSummary: nSummary,
        rank: nSummary.rank
      };
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      return {
        monthlyBonus: 0, annualBonus: 0, walletBonus: 0, maintenanceFee: 0,
        totalEarnings: 0, availableBalance: 0, cashbackBalance: 0,
        consumptionCount: 0, isEligible: false,
        activeSubscription: null,
        networkSummary: { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, total: 0, rank: 'Afiliado' },
        rank: 'Afiliado'
      };
    }
  },

  paySubscription: async (userId: string, planType: 'mensal' | 'trimestral' | 'semestral' | 'anual') => {
    let days = 30;
    let amount = 20;
    if (planType === 'trimestral') {
      days = 90;
      amount = 30;
    } else if (planType === 'semestral') {
      days = 180;
      amount = 40;
    } else if (planType === 'anual') {
      days = 365;
      amount = 60;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          profile_id: userId,
          plan_type: planType,
          amount: amount,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (dbError: any) {
      console.warn("DB subscription insert failed, saving to localStorage fallback:", dbError.message);
      // Fallback para LocalStorage
      const mockData = {
        id: `mock-${Date.now()}`,
        profileId: userId,
        planType: planType,
        amount: amount,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      localStorage.setItem(`mock_subscription_${userId}`, JSON.stringify(mockData));
      return mockData;
    }
  },

  getAffiliateNetwork: async (userId: string) => {
    try {
      if (!userId || userId === 'user123') return [];

      // 1. Buscar profundidade (Rede MMN G0 ao G2 -> descendentes G1 e G2)
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const rawDepth = config?.depth || 3;
      const depth = Math.min(rawDepth > 2 ? rawDepth - 1 : rawDepth, 2);

      const fullNetwork: any[] = [];
      let currentParentIds = [userId];
      let allSeenIds = new Set([userId]);

      for (let i = 1; i <= depth; i++) {
        if (currentParentIds.length === 0) break;

        const { data: members } = await supabase
          .from('profiles')
          .select('id, full_name, created_at, role, referral_code, whatsapp, referred_by')
          .in('referred_by', currentParentIds);

        if (!members || members.length === 0) break;

        const newIds: string[] = [];
        members.forEach(p => {
          if (!allSeenIds.has(p.id)) {
            fullNetwork.push({
              id: p.id,
              name: p.full_name,
              referralCode: p.referral_code,
              whatsapp: p.whatsapp,
              level: i, // Nível real na rede (G1, G2...)
              joinedDate: new Date(p.created_at).toLocaleDateString('pt-BR'),
              status: 'Ativo',
              earnings: 0,
              spillover: false
            });
            newIds.push(p.id);
            allSeenIds.add(p.id);
          }
        });

        currentParentIds = newIds;
      }

      return fullNetwork;
    } catch (error) {
      console.error("Network Fetch Error:", error);
      return [];
    }
  },

  getEcosystemActivity: async (userId: string) => {
    try {
      if (!userId || userId === 'user123') return [];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!transactions || transactions.length === 0) return [];

      // Extrair IDs de pedidos das descrições para buscar nomes dos compradores
      const orderIds = transactions
        .map(t => {
          const match = t.description?.match(/Pedido #([A-Z0-9-]+)/i);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      // 1. Buscar informações dos pedidos (nomes dos compradores)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id, 
          customer_name, 
          status, 
          customer_id,
          profiles:customer_id (
            full_name
          )
        `)
        .in('id', [...new Set(orderIds)]);

      const ordersMap = new Map(orders?.map(o => [o.id, {
        ...o,
        buyer_name: (o.profiles as any)?.full_name || o.customer_name || 'Desconhecido'
      }]) || []);

      // 2. Buscar rede para cálculo de níveis (Fallback seguro para evitar erro 500)
      const levelMap = new Map();
      try {
        const { data: allProfiles } = await supabase.from('profiles').select('id, referred_by').limit(5000);
        if (allProfiles) {
          const childrenMap = new Map();
          allProfiles.forEach(p => {
            if (p.referred_by) {
              const children = childrenMap.get(p.referred_by) || [];
              children.push(p.id);
              childrenMap.set(p.referred_by, children);
            }
          });

          const buildLevelsRecursive = (parentId: string, currentLevel: number, visited: Set<string>) => {
            if (currentLevel > 10 || visited.has(parentId)) return;
            visited.add(parentId);
            const children = childrenMap.get(parentId) || [];
            children.forEach((childId: string) => {
              levelMap.set(childId, currentLevel);
              buildLevelsRecursive(childId, currentLevel + 1, visited);
            });
          };
          buildLevelsRecursive(userId, 1, new Set());
        }
      } catch (err) {
        console.error("Erro no cálculo de níveis:", err);
      }

      const activity = transactions.map(t => {
        const orderMatch = t.description?.match(/Pedido\s*#\s*([A-Z0-9-]+)/i);
        const orderId = orderMatch ? orderMatch[1].trim() : null;
        const order = orderId ? ordersMap.get(orderId) : null;

        const desc = t.description || '';
        const isReseller = desc.includes('Revendedor') || desc.includes('Regional');

        // Classificar saques e comissões como 'Semanal', 'Mensal' ou 'Anual' baseado na descrição
        let cashbackType = 'Outros';
        const typeMatch = desc.match(/(Mensal|Anual|Semanal|Digital|CD)/i);
        if (typeMatch) {
          const matched = typeMatch[1].toLowerCase();
          if (matched === 'mensal') cashbackType = isReseller ? 'Mensal (REG)' : 'Mensal';
          else if (matched === 'anual') cashbackType = isReseller ? 'Anual (REG)' : 'Anual';
          else cashbackType = isReseller ? 'Semanal (REG)' : 'Semanal';
        } else {
          cashbackType = t.type === 'withdrawal' ? 'Semanal' : 'Outros';
        }

        // Determinar o nível com precisão (G0, G1, G2 ou REG)
        let level = '---';
        if (isReseller) {
          level = 'REG';
        } else if (desc.includes('G0') || desc.includes('Titular')) {
          level = '0';
        } else if (desc.includes('G1')) {
          level = '1';
        } else if (desc.includes('G2')) {
          level = '2';
        } else {
          const levelMatch = desc.match(/\(N[íi]vel\s*(\d+)\)/i);
          if (levelMatch) {
            level = levelMatch[1];
          } else if (order?.customer_id) {
            if (order.customer_id === userId) {
              level = '0';
            } else if (levelMap.has(order.customer_id)) {
              level = String(levelMap.get(order.customer_id));
            }
          } else {
            const todosNumeros = desc.match(/\d+/g) || [];
            const nivelEncontrado = todosNumeros.find(n => n !== orderId && n.length < 3);
            level = nivelEncontrado ? String(parseInt(nivelEncontrado, 10)) : (t.type === 'commission' ? '0' : '---');
          }
        }

        let mappedDescription = t.description || '';
        mappedDescription = mappedDescription
          .replace(/Comiss[aã]o MMN\s*\(Mensal\)/gi, 'Cashback Mensal')
          .replace(/Comiss[aã]o MMN\s*\(Anual\)/gi, 'Cashback Anual')
          .replace(/Comiss[aã]o MMN\s*\(CD\)/gi, 'Cashback Semanal')
          .replace(/Comiss[aã]o MMN\s*\(Semanal\)/gi, 'Cashback Semanal')
          .replace(/Cashback Digital/gi, 'Cashback Semanal')
          .replace(/Comiss[aã]o Semanal/gi, 'Cashback Semanal')
          .replace(/Comiss[aã]o Mensal/gi, 'Cashback Mensal')
          .replace(/Comiss[aã]o Anual/gi, 'Cashback Anual');

        let displayStatus = 'Pendente';
        const rawStatus = order?.status || (t.status === 'completed' ? 'Pago' : 'Pendente');
        if (rawStatus === 'Pago, Aguardando Retirada' || rawStatus === 'Pago' || rawStatus === 'Concluído' || rawStatus === 'completed') {
          displayStatus = 'Pago';
        } else if (rawStatus === 'Cancelado') {
          displayStatus = 'Cancelado';
        } else {
          displayStatus = 'Pendente';
        }

        let displayName = order?.buyer_name || (t.type === 'withdrawal' ? 'Resgate' : 'Sistema');
        if (isReseller && order?.buyer_name) {
          displayName = `${order.buyer_name} (Regional)`;
        } else if (level === '0' && order?.buyer_name) {
          displayName = `${order.buyer_name} (Você)`;
        }

        return {
          id: t.id,
          orderId: orderId || '---',
          affiliateName: displayName,
          level: level,
          category: isReseller ? 'reseller' : (t.type === 'commission' ? 'network' : 'withdrawal'),
          isReseller: isReseller,
          cashbackType: cashbackType,
          date: new Date(t.created_at).toLocaleDateString('pt-BR'),
          amount: t.amount,
          status: displayStatus,
          originalType: t.type,
          description: mappedDescription
        };
      });

      // Filtrar comissões de afiliados que não pertencem à rede (não mapeadas)
      return activity.filter(item => {
        if (item.originalType === 'commission' && item.orderId !== '---') {
          if (item.level === '---') return false;
        }
        return true;
      });
    } catch (error) {
      console.error("Activity Fetch Error:", error);
      return [];
    }
  },

  getAffiliateTree: async (userId: string) => {
    try {
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const rawDepth = config?.depth || 3;
      const depth = Math.min(rawDepth > 2 ? rawDepth - 1 : rawDepth, 2);

      // Buscar todos os perfis da rede de uma vez para construir a árvore na memória
      // (Mais eficiente do que múltiplas chamadas recursivas ao banco)
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code, whatsapp, referred_by');

      if (!allMembers) return null;

      const buildTree = (currentId: string, currentLevel: number): any => {
        const profile = allMembers.find(p => p.id === currentId);
        if (!profile || currentLevel > depth) return null; // Limita o nível da árvore ao depth (5)

        const children = allMembers
          .filter(p => p.referred_by === currentId)
          .map(c => buildTree(c.id, currentLevel + 1))
          .filter(Boolean);

        return {
          id: profile.id,
          name: profile.full_name,
          referralCode: profile.referral_code,
          whatsapp: profile.whatsapp,
          level: currentLevel,
          children
        };
      };

      return buildTree(userId, 0);
    } catch (error) {
      console.error("Tree Build Error:", error);
      return null;
    }
  },

  getAffiliateLinks: (codeOrId: string) => {
    const baseUrl = window.location.origin + '/invite/';
    return [
      { id: 'l1', name: 'Link Geral', url: baseUrl + codeOrId, description: 'Convidar novos usuários' },
    ];
  },

  getAdminUsers: async (options: { page: number, search?: string, status?: string }) => {
    const pageSize = 10;
    const start = (options.page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,cpf.ilike.%${options.search}%`);
    }

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      users: data.map(p => ({
        id: p.id,
        name: p.full_name,
        email: p.email || '--',
        role: p.role,
        status: p.status || 'active',
        joinedAt: new Date(p.created_at).toLocaleDateString('pt-BR'),
        location: p.city ? `${p.city}, ${p.state}` : 'Não informado',
        cpf: p.cpf,
        whatsapp: p.whatsapp,
        address: p.address,
        number: p.number,
        neighborhood: p.neighborhood,
        city: p.city,
        state: p.state,
        zipCode: p.zip_code
      })),
      total: count || 0
    };
  },

  updateUserByAdmin: async (userId: string, data: any) => {
    // Atualiza os dados na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.name,
        cpf: data.cpf,
        whatsapp: data.whatsapp,
        address: data.address,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Se tiver e-mail ou senha, chama a RPC admin_update_user_auth
    if (data.email || data.password) {
      const authUpdates = { 
        p_user_id: userId,
        p_email: data.email || null,
        p_password: data.password || null
      };

      const { error: authError } = await supabase.rpc('admin_update_user_auth', authUpdates);
      if (authError) {
        console.error('Error updating auth:', authError);
        throw new Error('Erro ao atualizar e-mail ou senha: ' + authError.message);
      }
    }
  },

  updateUserStatus: async (userId: string, status: 'active' | 'blocked') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) throw error;
  },

  getAdminGlobalStats: async () => {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      { data: currentRevenue },
      { data: lastRevenue },
      { count: totalUserCount },
      { count: currentMonthUserCount },
      { count: lastMonthUserCount },
      { count: totalBranchCount },
      { count: currentMonthBranchCount },
      { data: currentCommissions },
      { data: lastCommissions },
      { count: blockedUserCount },
      { count: pendingWithdrawalCount },
      { count: resellerCount },
      { count: subscriberCount }
    ] = await Promise.all([
      // Revenue
      supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).gte('order_date', firstDayCurrentMonth.toISOString()),
      supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString()),
      
      // Users
      supabase.from('profiles').select('*', { count: 'exact', head: true }), // Total
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayCurrentMonth.toISOString()), // Novos este mês
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()), // Novos mês passado
      
      // Lojistas
      supabase.from('branches').select('*', { count: 'exact', head: true }), // Total
      supabase.from('branches').select('*', { count: 'exact', head: true }).gte('created_at', firstDayCurrentMonth.toISOString()), // Novos este mês
      
      // Commissions
      supabase.from('transactions').select('amount, description, order_id').eq('type', 'commission').gte('created_at', firstDayCurrentMonth.toISOString()),
      supabase.from('transactions').select('amount, description, order_id').eq('type', 'commission').gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),

      // Blocked Users
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),

      // Pending Withdrawals
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending'),

      // Resellers
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'regional_reseller'),

      // Active Subscriptions
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('end_date', now.toISOString())
    ]);

    // Totais Atuais (Gerais)
    const { data: allOrders } = await supabase.from('orders').select('id, amount, status');
    const ordersMap = new Map(allOrders?.map(o => [o.id, o.status]) || []);
    
    const currentTotalRevenue = currentRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastTotalRevenue = lastRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;

    const { data: allCommissions } = await supabase.from('transactions').select('amount, description').eq('type', 'commission');
    const currentTotalCommissions = currentCommissions
      ?.filter(t => !t.description?.includes('Estorno') && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lastTotalCommissions = lastCommissions
      ?.filter(t => !t.description?.includes('Estorno') && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    const currentNetworkCommissions = currentCommissions
      ?.filter(t => !t.description?.includes('Estorno') && !t.description?.includes('Revendedor') && !t.description?.includes('Regional') && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    const currentResellerCommissions = currentCommissions
      ?.filter(t => !t.description?.includes('Estorno') && (t.description?.includes('Revendedor') || t.description?.includes('Regional')) && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    // Cálculos de Tendência
    const calculateTrend = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    const usersCurrent = totalUserCount || 0;
    const usersLast = (totalUserCount || 0) - (currentMonthUserCount || 0);

    const branchesCurrent = totalBranchCount || 0;
    const branchesLast = (totalBranchCount || 0) - (currentMonthBranchCount || 0);

    return {
      revenueTotal: currentTotalRevenue,
      revenueTrend: calculateTrend(currentTotalRevenue, lastTotalRevenue),
      userCount: totalUserCount || 0,
      userTrend: calculateTrend(usersCurrent, usersLast),
      branchCount: totalBranchCount || 0,
      branchTrend: calculateTrend(branchesCurrent, branchesLast),
      commissionTotal: currentTotalCommissions,
      commissionTrend: calculateTrend(currentTotalCommissions, lastTotalCommissions),
      networkCommissions: currentNetworkCommissions,
      resellerCommissions: currentResellerCommissions,
      blockedUserCount: blockedUserCount || 0,
      pendingWithdrawals: pendingWithdrawalCount || 0,
      resellerCount: resellerCount || 0,
      subscriberCount: subscriberCount || 0
    };
  },

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data.map(o => ({
      id: o.id,
      customerName: o.customer_name || o.customerName,
      customerInitial: o.customer_initial || o.customerInitial,
      date: o.order_date || o.date || o.created_at,
      amount: Number(o.total_amount || o.amount || 0),
      status: o.status,
      branchId: o.branch_id || o.branchId,
      userId: o.user_id || o.userId,
      affiliateId: o.affiliate_id || o.affiliateId,
      payoutStatus: o.payout_status || o.payoutStatus || 'pending',
      payoutDate: o.payout_date || o.payoutDate,
      payoutReceiptUrl: o.payout_receipt_url || o.payoutReceiptUrl,
      paymentMethod: o.payment_method || o.paymentMethod || 'PIX',
      completedAt: o.completed_at,
      items: o.items || []
    }));
  },
  async updateOrderPayoutStatus(orderIds: string[], status: string) {
    // Converter IDs para números e garantir que são strings para o JSONB se necessário
    const numericIds = orderIds.map(id => parseInt(id.replace(/\D/g, ''))).filter(id => !isNaN(id));
    
    if (numericIds.length === 0) return;

    const { error } = await supabase.rpc('update_order_payout', {
      payload: {
        order_ids: numericIds,
        new_status: status
      }
    });
    
    if (error) throw error;
  },

  async getPayeeDetails(userIds: string[]) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, pix_key, cpf, whatsapp, commission_rate')
      .in('id', userIds);
    
    if (error) throw error;
    return data;
  },

  async getAllOrderExtras() {
    const { data, error } = await supabase
      .from('order_extras')
      .select('*');

    if (error) throw error;
    return data.map(e => ({
      id: e.id,
      withdrawalCode: e.withdrawal_code,
      status: e.status
    }));
  },

  getAdminSystemLogs: async (limit: number = 8) => {
    try {
      const fetchLimit = Math.max(limit, 10);
      const [
        { data: profiles },
        { data: orders },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, created_at').order('created_at', { ascending: false }).limit(fetchLimit),
        supabase.from('orders').select('customer_name, amount, status, order_date').order('order_date', { ascending: false }).limit(fetchLimit),
        supabase.from('transactions').select('description, amount, type, created_at').order('created_at', { ascending: false }).limit(fetchLimit)
      ]);

      const logs: any[] = [];

      profiles?.forEach(p => {
        logs.push({
          type: 'Info',
          text: `Novo usuário registrado: ${p.full_name}`,
          time: new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(p.created_at)
        });
      });

      orders?.forEach(o => {
        if (o.status === 'Concluído') {
          logs.push({
            type: 'Success',
            text: `Venda concluída: R$ ${Number(o.amount).toFixed(2)} (${o.customer_name})`,
            time: new Date(o.order_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(o.order_date)
          });
        }
      });

      transactions?.forEach(t => {
        if (t.type === 'commission') {
          let mappedDesc = t.description || '';
          mappedDesc = mappedDesc
            .replace(/Comiss[aã]o MMN\s*\(Mensal\)/gi, 'Cashback Mensal')
            .replace(/Comiss[aã]o MMN\s*\(Anual\)/gi, 'Cashback Anual')
            .replace(/Comiss[aã]o MMN\s*\(CD\)/gi, 'Cashback Semanal');

          logs.push({
            type: 'Success',
            text: `Cashback gerado: R$ ${Number(t.amount).toFixed(2)} - ${mappedDesc.split(' - ')[0]}`,
            time: new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(t.created_at)
          });
        } else if (t.type === 'withdrawal') {
          logs.push({
            type: 'Warning',
            text: `Solicitação de saque: R$ ${Math.abs(Number(t.amount)).toFixed(2)}`,
            time: new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(t.created_at)
          });
        }
      });

      return logs
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      return [];
    }
  },

  getAdminPlatformsData: async () => {
    try {
      const [
        { count: userCount },
        { data: orders }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído'])
      ]);

      const totalRevenue = orders?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
      const formattedRevenue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue);
      const formattedUsers = userCount?.toLocaleString('pt-BR') || '0';

      return [
        { 
          id: '1', 
          name: 'UrbaShop', 
          slug: 'marketplace', 
          status: 'online', 
          users: formattedUsers, 
          revenue: formattedRevenue, 
          uptime: '99.9%', 
          lastUpdate: 'há pouco',
          iconColor: 'bg-indigo-500'
        },
        { 
          id: '2', 
          name: 'UrbaFood', 
          slug: 'delivery', 
          status: 'coming_soon', 
          users: '--', 
          revenue: '--', 
          uptime: '0%', 
          lastUpdate: 'N/A',
          iconColor: 'bg-orange-500'
        },
        { 
          id: '3', 
          name: 'UrbaService', 
          slug: 'services', 
          status: 'coming_soon', 
          users: '--', 
          revenue: '--', 
          uptime: '0%', 
          lastUpdate: 'N/A',
          iconColor: 'bg-red-500'
        },
        { 
          id: '4', 
          name: 'UrbaPay', 
          slug: 'fintech', 
          status: 'coming_soon', 
          users: '--', 
          revenue: '--', 
          uptime: '0%', 
          lastUpdate: 'N/A',
          iconColor: 'bg-emerald-500'
        },
      ];
    } catch (error) {
      console.error('Error fetching platforms data:', error);
      return [];
    }
  },

  // Marketplace Admin
  getAdminMarketplaceStats: async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { data: currentSales },
      { data: lastSales },
      { count: activeMerchants },
      { count: activeProducts }
    ] = await Promise.all([
      supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).gte('order_date', thirtyDaysAgo.toISOString()),
      supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).lt('order_date', thirtyDaysAgo.toISOString()).gte('order_date', new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('branches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Ativo')
    ]);

    const currentGMV = currentSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastGMV = lastSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    
    const calculateTrend = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    const avgTicket = currentSales && currentSales.length > 0 ? currentGMV / currentSales.length : 0;

    return {
      gmv: { value: currentGMV, trend: calculateTrend(currentGMV, lastGMV) },
      merchants: { value: activeMerchants || 0, trend: 0 }, // Simplificado
      products: { value: activeProducts || 0, trend: 0 }, // Simplificado
      avgTicket: { value: avgTicket, trend: 0 }
    };
  },

  getAdminMerchants: async () => {
    const { data: merchants, error } = await supabase
      .from('branches')
      .select(`
        *,
        products:products!products_branch_id_fkey(count),
        orders:orders(amount, status)
      `);

    if (error) throw error;

    return merchants.map(m => {
      const successfulOrders = m.orders?.filter((o: any) => ['Pago, Aguardando Retirada', 'Concluído'].includes(o.status)) || [];
      const totalSales = successfulOrders.reduce((acc: number, o: any) => acc + Number(o.amount), 0);
      
      return {
        id: m.id,
        name: m.name,
        category: m.category || 'Geral',
        products: m.products?.[0]?.count || 0,
        sales: totalSales,
        status: m.status || 'active',
        rating: Number(m.rating) || 0,
        featured: m.featured || false
      };
    });
  },

  updateMerchantStatus: async (merchantId: string, status: string) => {
    const { error } = await supabase
      .from('branches')
      .update({ status })
      .eq('id', merchantId);
    
    if (error) throw error;
  },

  getMarketplaceConfig: async () => {
    const { data, error } = await supabase
      .from('marketplace_config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) return { commissionRate: 12 };
    return { commissionRate: data.commission_rate };
  },

  updateMarketplaceConfig: async (updates: { commissionRate: number }) => {
    const { error } = await supabase
      .from('marketplace_config')
      .upsert({ id: 1, commission_rate: updates.commissionRate, updated_at: new Date().toISOString() });
    
    if (error) throw error;
  },

  getAdminReportsData: async (range: string, customStartDate?: string, customEndDate?: string) => {
    const now = new Date();
    let days = 30;
    let groupBy: 'day' | 'month' = 'day';
    let startDate = new Date();
    let endDate = new Date();
    let previousStartDate = new Date();

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Garantir o final do dia selecionado
      endDate.setHours(23, 59, 59, 999);
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      previousStartDate = new Date(startDate.getTime() - diffTime);
      
      if (days > 45) {
        groupBy = 'month';
      } else {
        groupBy = 'day';
      }
    } else {
      switch (range) {
        case '7 dias':
          days = 7;
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
          break;
        case '15 dias':
          days = 15;
          startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 15 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
          break;
        case '30 dias':
          days = 30;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
          break;
        case '6 meses':
          days = 180;
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          groupBy = 'month';
          break;
        case '1 ano':
          days = 365;
          startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
          previousStartDate = new Date(now.getFullYear() - 2, now.getMonth() + 1, 1);
          groupBy = 'month';
          break;
        default:
          days = 30;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
      }
    }

    // Queries construídas dinamicamente
    let currentRevenueQuery = supabase.from('orders').select('amount, order_date, created_at').in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']).gte('order_date', startDate.toISOString());
    let lastRevenueQuery = supabase.from('orders').select('amount, order_date, created_at').in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']).gte('order_date', previousStartDate.toISOString()).lt('order_date', startDate.toISOString());
    let currentUserGrowthQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString());
    let lastUserGrowthQuery = supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString());
    let currentCommissionsQuery = supabase.from('transactions').select('amount, description, order_id').eq('type', 'commission').gte('created_at', startDate.toISOString());
    let lastCommissionsQuery = supabase.from('transactions').select('amount, description, order_id').eq('type', 'commission').gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString());
    let chartRawDataQuery = supabase.from('orders').select('amount, order_date, created_at').in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']).gte('order_date', startDate.toISOString());

    if (customStartDate && customEndDate) {
      currentRevenueQuery = currentRevenueQuery.lte('order_date', endDate.toISOString());
      currentUserGrowthQuery = currentUserGrowthQuery.lte('created_at', endDate.toISOString());
      currentCommissionsQuery = currentCommissionsQuery.lte('created_at', endDate.toISOString());
      chartRawDataQuery = chartRawDataQuery.lte('order_date', endDate.toISOString());
    }

    const [
      { data: currentRevenue },
      { data: lastRevenue },
      { count: currentUserGrowth },
      { count: lastUserGrowth },
      { data: currentCommissions },
      { data: lastCommissions },
      { data: config },
      { data: chartRawData },
      allOrdersResult
    ] = await Promise.all([
      currentRevenueQuery,
      lastRevenueQuery,
      currentUserGrowthQuery,
      lastUserGrowthQuery,
      currentCommissionsQuery,
      lastCommissionsQuery,
      supabase.from('marketplace_config').select('commission_rate').eq('id', 1).single(),
      chartRawDataQuery,
      supabase.from('orders').select('id, status')
    ]);

    const ordersMap = new Map(allOrdersResult.data?.map(o => [o.id, o.status]) || []);

    const platformRate = config?.commission_rate || 12;
    const currentGMVTotal = currentRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastGMVTotal = lastRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const currentPayout = currentCommissions
      ?.filter(t => !t.description?.includes('Estorno') && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lastPayout = lastCommissions
      ?.filter(t => !t.description?.includes('Estorno') && ordersMap.get(t.order_id) !== 'Cancelado')
      ?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    const calculateTrend = (current: number, last: number) => {
      if (last <= 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    // Advanced Chart Logic
    const labels: string[] = [];
    const values: number[] = [];
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const targetEnd = customEndDate ? new Date(customEndDate) : now;

    if (groupBy === 'day') {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(targetEnd.getTime() - i * 24 * 60 * 60 * 1000);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        labels.push(label);
        
        const dayTotal = chartRawData?.filter(o => {
          const od = new Date(o.order_date || o.created_at);
          return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        }).reduce((acc, o) => acc + Number(o.amount), 0) || 0;
        
        values.push(dayTotal);
      }
    } else {
      const numMonths = range === '6 meses' ? 6 : range === '1 ano' ? 12 : Math.max(1, Math.ceil(days / 30));
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(targetEnd.getFullYear(), targetEnd.getMonth() - i, 1);
        labels.push(monthsNames[d.getMonth()]);

        const monthTotal = chartRawData?.filter(o => {
          const od = new Date(o.order_date || o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        }).reduce((acc, o) => acc + Number(o.amount), 0) || 0;

        values.push(monthTotal);
      }
    }

    return {
      gmv: { value: currentGMVTotal, trend: calculateTrend(currentGMVTotal, lastGMVTotal) },
      platformRevenue: { value: currentGMVTotal * (platformRate / 100), trend: calculateTrend(currentGMVTotal, lastGMVTotal) },
      userGrowth: { value: currentUserGrowth || 0, trend: calculateTrend(currentUserGrowth || 0, lastUserGrowth || 0) },
      payoutMMN: { value: currentPayout, trend: calculateTrend(currentPayout, lastPayout) },
      cashback: {
        monthly: currentGMVTotal * 0.0275,
        yearly: currentGMVTotal * 0.0075, // Yearly contribution for this period
        digitalTotal: currentGMVTotal * 0.01
      },
      chart: {
        values: values,
        labels: labels
      },
      payoutRate: platformRate
    };
  },

  getAffiliateCashbackReport: async (
    startDate: string, 
    endDate: string, 
    filterCategory: 'all' | 'network' | 'reseller' = 'all'
  ) => {
    try {
      // 1. Busca as comissões e saques/pagamentos do período
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, profile_id, order_id, amount, created_at, status, type, description')
        .in('status', ['completed', 'pago', 'pending'])
        .in('type', ['commission', 'withdrawal'])
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (txError) throw txError;
      if (!transactions || transactions.length === 0) return [];

      // Filtra transações conforme a categoria solicitada
      const filteredTransactions = transactions.filter(t => {
        const desc = t.description || '';
        const isResellerTx = desc.includes('Revendedor') || desc.includes('Regional');
        if (filterCategory === 'network') return !isResellerTx;
        if (filterCategory === 'reseller') return isResellerTx;
        return true;
      });

      if (filteredTransactions.length === 0) return [];

      // 2. Coleta IDs únicos de afiliados
      const affiliateIds = [...new Set(filteredTransactions.map(t => t.profile_id).filter(Boolean))];

      // 3. Busca perfis, assinaturas e pedidos pagos para apurar status ativo/inativo
      const [{ data: profiles, error: profError }, { data: subsData }, { data: ordersData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, pix_key, pix_type, cpf, whatsapp, role, city, state')
          .in('id', affiliateIds),
        supabase
          .from('subscriptions')
          .select('profile_id, status, end_date, plan_type')
          .in('profile_id', affiliateIds),
        supabase
          .from('orders')
          .select('id, customer_id, status, created_at, order_date, items')
          .in('customer_id', affiliateIds)
          .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído'])
      ]);

      if (profError) {
        console.error('Error fetching user_profiles for report:', profError);
      }

      const now = new Date();
      const profilesMap: Record<string, any> = {};
      profiles?.forEach(p => {
        const userSubs = subsData?.filter(s => s.profile_id === p.id) || [];
        const userOrders = ordersData?.filter(o => o.customer_id === p.id) || [];

        const hasActiveSub = userSubs.some(s => s.status === 'active' && new Date(s.end_date) >= now);

        let hasPaidSubOrder = false;
        let planName = '';
        userOrders.forEach(o => {
          const items = Array.isArray(o.items) ? o.items : [];
          items.forEach(item => {
            if (item.is_subscription) {
              const oDate = new Date(o.order_date || o.created_at);
              let days = 365;
              if (item.plan_type === 'mensal') days = 30;
              else if (item.plan_type === 'trimestral') days = 90;
              else if (item.plan_type === 'semestral') days = 180;
              const expDate = new Date(oDate.getTime() + days * 24 * 60 * 60 * 1000);
              if (expDate >= now) {
                hasPaidSubOrder = true;
                planName = item.name || `Plano ${item.plan_type}`;
              }
            }
          });
        });

        const isRegional = p.role === 'regional_reseller';
        const isActive = hasActiveSub || hasPaidSubOrder || isRegional;

        let displayPlan = planName;
        if (!displayPlan) {
          if (filterCategory === 'network') {
            displayPlan = (hasActiveSub || hasPaidSubOrder) ? 'Plano Ativo' : (isRegional ? 'Afiliado Rede' : 'Inativo / Sem Plano');
          } else if (filterCategory === 'reseller') {
            displayPlan = 'Líder Regional';
          } else {
            displayPlan = isRegional ? 'Líder Regional' : (isActive ? 'Plano Ativo' : 'Inativo / Sem Plano');
          }
        }

        profilesMap[String(p.id)] = {
          ...p,
          is_active: isActive,
          plan_name: displayPlan,
          polo: p.city ? `${p.city}${p.state ? ` - ${p.state}` : ''}` : ''
        };
      });

      // 4. Agrupa e une os dados
      const report: Record<string, any> = {};

      filteredTransactions.forEach(t => {
        const affiliateId = t.profile_id;
        if (!affiliateId) return;

        const profile = profilesMap[String(affiliateId)];
        const desc = t.description || '';

        // Extrai o nível a partir da descrição
        let level = '';
        if (desc.includes('G0') || desc.includes('Titular')) level = 'G0';
        else if (desc.includes('G1')) level = 'G1';
        else if (desc.includes('G2')) level = 'G2';
        else if (desc.includes('Revendedor') || desc.includes('Regional')) level = 'REG';

        // Extrai o número do pedido
        let orderNum = t.order_id ? String(t.order_id) : '';
        if (!orderNum) {
          const match = desc.match(/Pedido #?([a-zA-Z0-9_-]+)/i);
          if (match) orderNum = match[1];
        }

        if (!report[affiliateId]) {
          report[affiliateId] = {
            id: String(affiliateId),
            name: profile?.full_name || 'Desconhecido',
            pix_key: profile?.pix_key || '---',
            pix_type: profile?.pix_type || '---',
            cpf: profile?.cpf || '---',
            whatsapp: profile?.whatsapp || '',
            role: profile?.role || 'affiliate',
            is_active: Boolean(profile?.is_active),
            plan_name: profile?.plan_name || 'Inativo',
            polo: profile?.polo || '',
            level: level || (filterCategory === 'reseller' ? 'REG' : 'G0'),
            levels: level ? [level] : [],
            order_numbers: orderNum ? [orderNum] : [],
            order_number: orderNum || '',
            transactions: [],
            mensal: 0,
            anual: 0,
            digital: 0,
            total: 0
          };
        } else {
          if (level && !report[affiliateId].levels.includes(level)) {
            report[affiliateId].levels.push(level);
            report[affiliateId].level = report[affiliateId].levels.join(', ');
          }
          if (orderNum && !report[affiliateId].order_numbers.includes(orderNum)) {
            report[affiliateId].order_numbers.push(orderNum);
            report[affiliateId].order_number = report[affiliateId].order_numbers.join(', #');
          }
        }

        const amount = Number(t.amount);

        if (t.type === 'commission') {
          let cycleType = 'Semanal';
          if (desc.includes('Mensal')) {
            report[affiliateId].mensal += amount;
            cycleType = 'Mensal';
          } else if (desc.includes('Anual')) {
            report[affiliateId].anual += amount;
            cycleType = 'Anual';
          } else if (desc.includes('Digital') || desc.includes('Semanal') || desc.includes('(CD)')) {
            report[affiliateId].digital += amount;
            cycleType = 'Semanal';
          } else {
            report[affiliateId].digital += amount;
          }

          report[affiliateId].transactions.push({
            id: t.id,
            date: t.created_at,
            orderId: orderNum,
            level: level || (filterCategory === 'reseller' ? 'REG' : 'G0'),
            cycleType,
            description: desc,
            amount: Math.abs(amount),
            status: t.status
          });
        } else if (t.type === 'withdrawal') {
          if (desc.includes('Mensal')) {
            report[affiliateId].mensal += amount; // soma valor negativo (subtrai)
          } else if (desc.includes('Anual')) {
            report[affiliateId].anual += amount;
          } else {
            report[affiliateId].digital += amount;
          }
        }
      });

      // Calcular o total e deduções fiscais (INSS 11% para PF limitado a R$ 932,31 / 0% para PJ)
      Object.values(report).forEach((r: any) => {
        r.mensal = Math.max(0, Math.round(r.mensal * 100) / 100);
        r.anual = Math.max(0, Math.round(r.anual * 100) / 100);
        r.digital = Math.max(0, Math.round(r.digital * 100) / 100);
        r.total = Math.round((r.mensal + r.anual + r.digital) * 100) / 100;

        const isPJ = isCnpj(r.cpf, r.pix_key);
        const taxMensal = calculateTaxDeductions(r.mensal, isPJ);
        const taxAnual = calculateTaxDeductions(r.anual, isPJ);
        const taxDigital = calculateTaxDeductions(r.digital, isPJ);
        const taxTotal = calculateTaxDeductions(r.total, isPJ);

        r.is_pj = isPJ;
        r.inss_mensal = taxMensal.inss;
        r.liquido_mensal = taxMensal.liquido;
        r.inss_anual = taxAnual.inss;
        r.liquido_anual = taxAnual.liquido;
        r.inss_digital = taxDigital.inss;
        r.liquido_digital = taxDigital.liquido;
        r.inss_total = taxTotal.inss;
        r.liquido_total = taxTotal.liquido;

        // O valor a ser pago (liquidação PIX) para o afiliado ativo é o valor Líquido!
        r.payable_amount = r.is_active ? taxMensal.liquido : 0;
      });

      return Object.values(report).sort((a: any, b: any) => b.total - a.total);
    } catch (error) {
      console.error('Error fetching affiliate cashback report:', error);
      return [];
    }
  },

  registerAffiliatePayout: async (payoutData: {
    profile_id: string;
    amount: number;
    mensal: number;
    digital: number;
    anual: number;
    pix_key: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .insert([{
          profile_id: payoutData.profile_id,
          amount: payoutData.amount,
          mensal_amount: payoutData.mensal,
          digital_amount: payoutData.digital,
          anual_amount: payoutData.anual,
          pix_key: payoutData.pix_key,
          status: 'paid'
        }])
        .select();

      if (error) throw error;

      // Opcional: Marcar as transações como processadas no futuro
      return data;
    } catch (error) {
      console.error('Error registering affiliate payout:', error);
      throw error;
    }
  },

  registerTransaction: async (transaction: {
    profile_id: string;
    type: string;
    description: string;
    amount: number;
    status: string;
    order_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering transaction:', error);
      throw error;
    }
  },

  getAffiliatePayouts: async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .select(`
          *,
          profiles:profile_id (full_name, cpf)
        `)
        .order('payout_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching affiliate payouts:', error);
      return [];
    }
  },

  searchEcosystem: async (query: string) => {
    if (!query || query.length < 2) return [];
    
    try {
      const [
        { data: users },
        { data: branches }
      ] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, role')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5),
        supabase.from('branches')
          .select('id, name')
          .ilike('name', `%${query}%`)
          .limit(5)
      ]);

      const results: any[] = [];
      
      users?.forEach(u => results.push({ id: u.id, name: u.full_name, type: 'Usuário', path: '/admin/usuarios', sub: u.role }));
      branches?.forEach(b => results.push({ id: b.id, name: b.name, type: 'Lojista', path: '/admin/marketplace' }));

      return results;
    } catch (error) {
      console.error('Error searching ecosystem:', error);
      return [];
    }
  },

  // Lojista Orders
  getMerchantOrders: async (merchantId: string, branchId?: string) => {
    // 1. Buscar todas as filiais do lojista para garantir isolamento
    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);

    let query = supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      query = query.or(filter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(o => ({
      id: o.id,
      customerName: o.customer_name || 'Cliente Oculto',
      customerInitial: o.customer_initial || (o.customer_name ? o.customer_name.charAt(0) : 'C'),
      amount: Number(o.amount || 0),
      status: o.status,
      items: o.items, // JSON com a lista de produtos
      branchId: o.branch_id,
      cashbackAmount: o.cashback_amount,
      shippingAddress: o.shipping_address || 'Retirada na Loja',
      paymentMethod: o.payment_method || 'Não informado',
      orderDate: o.order_date,
      completedAt: o.completed_at,
      payoutStatus: o.payout_status || 'pending',
      date: new Date(o.order_date).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const updatePayload: any = { status };
    if (status === 'Cancelado') {
      updatePayload.payout_status = 'cancelled';
    }
    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);
    
    if (error) throw error;

    // Também atualiza o status em order_extras se existir
    await supabase
      .from('order_extras')
      .update({ status })
      .eq('id', orderId);
  },

  // Lojista Products
  getBranchProducts: async (branchId?: string) => {
    if (!branchId) return [];

    // 1. Obter o merchant_id da filial para buscar todos os produtos da organização
    const { data: branchData } = await supabase
      .from('branches')
      .select('merchant_id')
      .eq('id', branchId)
      .maybeSingle();

    if (!branchData) return [];
    const merchantId = branchData.merchant_id;

    // 2. Buscar todos os produtos deste merchant
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('name');

    if (productsError) throw productsError;

    // 3. Buscar estoques específicos desta filial
    const { data: stocksData, error: stocksError } = await supabase
      .from('product_stocks')
      .select('product_id, stock')
      .eq('branch_id', branchId);

    if (stocksError) throw stocksError;

    const stocksMap = new Map<string, number>(stocksData?.map(s => [s.product_id, s.stock]) || []);

    return productsData.map(p => {
      let branchStock = 0;
      if (p.branch_id === branchId) {
        branchStock = p.stock || 0;
      } else if (p.branch_id === null) {
        branchStock = stocksMap.get(p.id) || 0;
      }

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        categoryId: p.category_id,
        price: Number(p.price),
        stock: branchStock,
        sales: p.sales || 0,
        cashback: Number(p.cashback),
        status: p.status as 'Ativo' | 'Inativo',
        image: p.image,
        mainImage: p.main_image,
        gallery: p.gallery,
        branchId: p.branch_id,
        weight: Number(p.weight),
        height: Number(p.height),
        width: Number(p.width),
        length: Number(p.length),
        description: p.description
      };
    });
  },

  createProduct: async (product: any) => {
    // Garantir que merchant_id esteja presente para o RLS
    if (!product.merchant_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        product.merchant_id = await businessRules.getMerchantId(user.id);
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Categorias
  getCategories: async (merchantId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('name');
    
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
      merchantId: c.merchant_id
    }));
  },

  getAdminCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
      merchantId: c.merchant_id
    }));
  },

  getGlobalCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('merchant_id', null)
      .order('name');
    
    if (error) throw error;
    return data.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
      merchantId: c.merchant_id
    }));
  },

  addCategory: async (category: Omit<Category, 'id'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: category.name,
        parent_id: category.parentId || null,
        merchant_id: category.merchantId || null
      }])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: updates.name,
        parent_id: updates.parentId === undefined ? undefined : (updates.parentId || null),
        merchant_id: updates.merchantId === undefined ? undefined : (updates.merchantId || null)
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  getMerchantProducts: async (merchantId: string) => {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('name');
    
    if (productsError) throw productsError;

    // Buscar estoques para todos esses produtos de uma vez só
    const productIds = productsData.map(p => p.id);
    if (productIds.length === 0) return [];

    const { data: stocksData, error: stocksError } = await supabase
      .from('product_stocks')
      .select('*')
      .in('product_id', productIds);

    const stocksMap = new Map<string, { branch_id: string, stock: number }[]>();
    if (!stocksError && stocksData) {
      stocksData.forEach(s => {
        const list = stocksMap.get(s.product_id) || [];
        list.push({ branch_id: s.branch_id, stock: s.stock });
        stocksMap.set(s.product_id, list);
      });
    }
    
    return productsData.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      categoryId: p.category_id,
      price: Number(p.price),
      stock: p.stock,
      sales: p.sales,
      cashback: Number(p.cashback),
      status: p.status as 'Ativo' | 'Inativo',
      image: p.image,
      mainImage: p.main_image,
      gallery: p.gallery,
      branchId: p.branch_id,
      weight: Number(p.weight),
      height: Number(p.height),
      width: Number(p.width),
      length: Number(p.length),
      description: p.description,
      branchStocks: stocksMap.get(p.id) || []
    }));
  },

  updateProduct: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Lojista Financials
  getMerchantFinancials: async (profileId: string, role: string, branchId?: string) => {
    // Buscar todas as transações do perfil para calcular saldo disponível
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('amount, type, status')
      .eq('profile_id', profileId);

    if (tError) throw tError;

    const balance = transactions
      ?.filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    // Buscar faturamento bruto e cashback (da filial ou de todas se for owner)
    let ordersQuery = supabase.from('orders').select('amount, cashback_amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']);
    
    if (role !== 'owner' && branchId) {
      ordersQuery = ordersQuery.eq('branch_id', branchId);
    }

    const { data: orders, error: oError } = await ordersQuery;
    if (oError) throw oError;

    const totalBilled = orders?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const totalCashback = orders?.reduce((acc, o) => acc + Number(o.cashback_amount), 0) || 0;

    return {
      balance,
      totalBilled,
      totalCashback
    };
  },

  getMerchantTransactions: async (profileId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      id: `TRX-${t.id.substring(0, 4).toUpperCase()}`,
      type: t.type as any,
      description: t.description,
      amount: Number(t.amount),
      date: new Date(t.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      status: t.status as any
    }));
  },

  requestWithdrawal: async (profileId: string, amount: number) => {
    // 1. Verificar se o afiliado/revendedor está ATIVO e ADIMPLENTE
    const stats = await businessRules.getAffiliateStats(profileId);
    if (!stats.isEligible) {
      throw new Error('Sua conta está inadimplente (plano inativo ou vencido). Regularize sua assinatura para desbloquear saques.');
    }
    if (amount > stats.availableBalance) {
      throw new Error('Saldo insuficiente para realizar este saque.');
    }

    // 2. Criar registro de transação negativa pendente
    const { error } = await supabase
      .from('transactions')
      .insert([{
        profile_id: profileId,
        type: 'withdrawal',
        amount: -Math.abs(amount),
        description: 'Solicitação de Saque (Carteira Digital)',
        status: 'pending'
      }]);

    if (error) throw error;
  },

  getPendingWithdrawals: async () => {
    // Buscar transações de saque pendentes com dados do perfil
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles (
          full_name,
          email,
          whatsapp,
          pix_key,
          bank_name,
          bank_branch,
          bank_account
        )
      `)
      .eq('type', 'withdrawal')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((t: any) => ({
      id: t.id,
      profileId: t.profile_id,
      userName: t.profiles?.full_name || 'N/A',
      userEmail: t.profiles?.email || 'N/A',
      amount: Math.abs(Number(t.amount)),
      description: t.description,
      status: t.status,
      date: new Date(t.created_at).toLocaleString('pt-BR'),
      pixKey: t.profiles?.pix_key || 'Não informado',
      bankDetails: t.profiles?.bank_name ? `${t.profiles.bank_name} / Ag: ${t.profiles.bank_branch} / CC: ${t.profiles.bank_account}` : 'Apenas PIX'
    }));
  },

  getPayableBalances: async (filterCategory: 'all' | 'network' | 'reseller' = 'all') => {
    // 1. Buscar todos os perfis
    const [{ data: profiles, error: pError }, { data: subsData }, { data: ordersData }, { data: transactions, error: tError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, pix_key, bank_name, bank_branch, bank_account, whatsapp, role, city, state, cpf, cnpj'),
      supabase
        .from('subscriptions')
        .select('profile_id, status, end_date, plan_type'),
      supabase
        .from('orders')
        .select('id, customer_id, status, created_at, order_date, items')
        .in('status', ['Pago', 'Pago, Aguardando Retirada', 'Concluído']),
      supabase
        .from('transactions')
        .select('*')
    ]);
    
    if (pError) throw pError;
    if (tError) throw tError;

    const now = new Date();
    const currentRefMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Buscar notas fiscais do mês atual
    const invoices = await businessRules.getAffiliateInvoices(undefined, currentRefMonth);
    const invoiceMap = new Map(invoices.map((inv: any) => [inv.profile_id, inv]));

    // Filtra perfis estritamente pelo tipo solicitado
    const targetProfiles = (profiles || []).filter(p => {
      const isRegional = p.role === 'regional_reseller';
      if (filterCategory === 'network') return !isRegional;
      if (filterCategory === 'reseller') return isRegional;
      return true;
    });

    // 3. Processar saldos e status de adimplência por usuário
    const payableList = targetProfiles.map(profile => {
      // Filtra transações do usuário conforme a categoria solicitada
      const userTransactions = (transactions || []).filter(t => {
        if (t.profile_id !== profile.id) return false;
        const desc = t.description || '';
        const isResellerTx = desc.includes('Revendedor') || desc.includes('Regional') || desc.includes('(REG)');
        if (filterCategory === 'network') return !isResellerTx;
        if (filterCategory === 'reseller') return isResellerTx;
        return true;
      });
      
      const userSubs = (subsData || []).filter(s => s.profile_id === profile.id);
      const userOrders = (ordersData || []).filter(o => o.customer_id === profile.id);

      const hasActiveSub = userSubs.some(s => s.status === 'active' && new Date(s.end_date) >= now);
      let hasPaidSubOrder = false;
      userOrders.forEach(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach(item => {
          if (item.is_subscription) {
            const oDate = new Date(o.order_date || o.created_at);
            let days = 365;
            if (item.plan_type === 'mensal') days = 30;
            else if (item.plan_type === 'trimestral') days = 90;
            else if (item.plan_type === 'semestral') days = 180;
            const expDate = new Date(oDate.getTime() + days * 24 * 60 * 60 * 1000);
            if (expDate >= now) hasPaidSubOrder = true;
          }
        });
      });

      const isEligible = hasActiveSub || hasPaidSubOrder || profile.role === 'regional_reseller';

      // Extrai níveis e pedidos das transações do usuário
      const levels: string[] = [];
      const orderNumbers: string[] = [];
      userTransactions.forEach(t => {
        const desc = t.description || '';
        if (t.type === 'commission') {
          let lvl = '';
          if (desc.includes('G0') || desc.includes('Titular')) lvl = 'G0';
          else if (desc.includes('G1')) lvl = 'G1';
          else if (desc.includes('G2')) lvl = 'G2';
          else if (desc.includes('Revendedor') || desc.includes('Regional') || desc.includes('(REG)')) lvl = 'REG';
          if (lvl && !levels.includes(lvl)) levels.push(lvl);

          let oNum = t.order_id ? String(t.order_id) : '';
          if (!oNum) {
            const m = desc.match(/Pedido #?([a-zA-Z0-9_-]+)/i);
            if (m) oNum = m[1];
          }
          if (oNum && !orderNumbers.includes(oNum)) orderNumbers.push(oNum);
        }
      });

      const monthlyBonus = userTransactions
        .filter(t => t.type === 'commission' && t.description?.includes('Mensal') && (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const annualBonus = userTransactions
        .filter(t => t.type === 'commission' && t.description?.includes('Anual') && (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const walletBonus = userTransactions
        .filter(t => t.type === 'commission' && 
                (t.description?.includes('Digital') || t.description?.includes('(CD)') || t.description?.includes('Semanal')) && 
                (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      // Subtrair pagamentos já realizados
      const monthlyPaid = userTransactions
        .filter(t => t.type === 'withdrawal' && t.description?.includes('Mensal') && (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const annualPaid = userTransactions
        .filter(t => t.type === 'withdrawal' && t.description?.includes('Anual') && (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const totalWithdrawn = userTransactions
        .filter(t => t.type === 'withdrawal' && !t.description?.includes('Mensal') && !t.description?.includes('Anual'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const monthlyPending = Math.max(0, monthlyBonus - monthlyPaid);
      const annualPending = Math.max(0, annualBonus - annualPaid);
      const digitalPending = Math.max(0, walletBonus - totalWithdrawn);

      const isPJ = isCnpj(profile.cpf || profile.cnpj, profile.pix_key);
      const taxMonthly = calculateTaxDeductions(monthlyPending, isPJ);
      const taxAnnual = calculateTaxDeductions(annualPending, isPJ);
      const taxDigital = calculateTaxDeductions(digitalPending, isPJ);
      const taxTotal = calculateTaxDeductions(monthlyPending + annualPending + digitalPending, isPJ);

      // Nota Fiscal Info
      const userInvoice = invoiceMap.get(profile.id);
      const hasInvoice = !!userInvoice;
      const canPayMonthly = isEligible && hasInvoice;

      return {
        profileId: profile.id,
        userName: profile.full_name || 'N/A',
        userEmail: profile.email || 'N/A',
        pixKey: profile.pix_key || 'Não informado',
        bankDetails: profile.bank_name ? `${profile.bank_name} / Ag: ${profile.bank_branch} / CC: ${profile.bank_account}` : 'Apenas PIX',
        whatsapp: profile.whatsapp || '',
        cpf: profile.cpf || profile.cnpj || '',
        isPJ,
        monthlyPending: taxMonthly.bruto,
        monthlyInss: taxMonthly.inss,
        monthlyLiquid: taxMonthly.liquido,
        annualPending: taxAnnual.bruto,
        annualInss: taxAnnual.inss,
        annualLiquid: taxAnnual.liquido,
        digitalPending: taxDigital.bruto,
        digitalInss: taxDigital.inss,
        digitalLiquid: taxDigital.liquido,
        totalPending: taxTotal.bruto,
        totalInss: taxTotal.inss,
        totalLiquid: taxTotal.liquido,
        role: profile.role,
        isEligible,
        statusLabel: isEligible ? 'Adimplente / Ativo' : 'Inadimplente',
        level: levels.join(', ') || (filterCategory === 'reseller' ? 'REG' : (profile.role === 'regional_reseller' ? 'REG' : 'G0')),
        levels,
        orderNumber: orderNumbers.join(', #'),
        orderNumbers,
        polo: profile.city ? `${profile.city}${profile.state ? ` - ${profile.state}` : ''}` : '',
        // Informações da Nota Fiscal
        hasInvoice,
        canPayMonthly,
        invoiceStatus: userInvoice?.status || 'none',
        invoiceLink: userInvoice?.invoice_link || null,
        invoiceFileUrl: userInvoice?.file_url || null,
        invoiceNumber: userInvoice?.invoice_number || null,
        invoiceId: userInvoice?.id || null
      };
    }).filter(p => p.monthlyPending > 0 || p.annualPending > 0 || p.digitalPending > 0);

    return payableList;
  },

  getAffiliateInvoiceSummary: async (userId: string, year?: number, month?: number) => {
    const now = new Date();
    const selYear = year !== undefined ? year : now.getFullYear();
    const selMonth = month !== undefined ? month : now.getMonth();
    const refMonthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;

    const startDate = new Date(selYear, selMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999);

    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const commissions = (txs || []).filter(t => t.type === 'commission' && (t.status === 'completed' || t.status === 'pago' || t.status === 'pending'));

    const weeklyGross = commissions
      .filter(t => (t.description?.includes('Digital') || t.description?.includes('Semanal') || t.description?.includes('(CD)')))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const monthlyGross = commissions
      .filter(t => t.description?.includes('Mensal'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const totalGross = weeklyGross + monthlyGross;

    // Busca nota fiscal já enviada para o mês
    const existingInvoices = await businessRules.getAffiliateInvoices(userId, refMonthStr);
    const currentInvoice = existingInvoices[0] || null;

    return {
      referenceMonth: refMonthStr,
      monthLabel: new Date(selYear, selMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      weeklyGross,
      monthlyGross,
      totalGross,
      currentInvoice
    };
  },

  submitAffiliateInvoice: async (data: {
    profile_id: string;
    reference_month: string;
    amount_gross: number;
    invoice_number?: string;
    invoice_link?: string;
    file?: File;
    notes?: string;
  }) => {
    let fileUrl: string | null = null;
    if (data.file) {
      fileUrl = await businessRules.uploadReceipt(data.file);
    }

    const payload = {
      profile_id: data.profile_id,
      reference_month: data.reference_month,
      amount_gross: data.amount_gross,
      invoice_number: data.invoice_number || null,
      invoice_link: data.invoice_link || null,
      file_url: fileUrl,
      notes: data.notes || null,
      status: 'pending'
    };

    try {
      const { data: inserted, error } = await supabase
        .from('affiliate_invoices')
        .insert([payload])
        .select()
        .single();
      if (!error && inserted) return inserted;
    } catch (err) {
      console.warn('affiliate_invoices table fallback to storage', err);
    }

    // Fallback via localStorage global para o Admin ler
    const invoiceRecord = {
      id: `inv-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    try {
      const allInvoices = JSON.parse(localStorage.getItem('all_affiliate_invoices') || '[]');
      const filtered = allInvoices.filter((i: any) => !(i.profile_id === data.profile_id && i.reference_month === data.reference_month));
      filtered.push(invoiceRecord);
      localStorage.setItem('all_affiliate_invoices', JSON.stringify(filtered));
    } catch (e) {}

    return invoiceRecord;
  },

  getAffiliateInvoices: async (userId?: string, referenceMonth?: string) => {
    let results: any[] = [];
    try {
      let query = supabase.from('affiliate_invoices').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('profile_id', userId);
      if (referenceMonth) query = query.eq('reference_month', referenceMonth);
      const { data, error } = await query;
      if (!error && data && data.length > 0) results = data;
    } catch (err) {
      console.warn('Fallback getting invoices', err);
    }

    if (results.length === 0) {
      try {
        const localAll = JSON.parse(localStorage.getItem('all_affiliate_invoices') || '[]');
        results = localAll.filter((i: any) => {
          if (userId && i.profile_id !== userId) return false;
          if (referenceMonth && i.reference_month !== referenceMonth) return false;
          return true;
        });
      } catch (e) {}
    }

    return results;
  },

  getPaymentHistory: async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, profiles:profile_id(id, full_name, email, cpf, cnpj, pix_key, pix_type, role, bank_name, bank_branch, bank_account)')
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((t: any) => {
        const profile = t.profiles || {};
        const isReseller = t.description?.includes('Revendedor') || t.description?.includes('Regional') || t.description?.includes('(REG)') || profile.role === 'regional_reseller';
        let categoryLabel = 'Rede MMN';
        if (isReseller) categoryLabel = 'Revendedor Regional';

        let cycleLabel = 'Semanal';
        if (t.description?.includes('Mensal')) cycleLabel = 'Mensal';
        else if (t.description?.includes('Anual')) cycleLabel = 'Anual';

        return {
          id: t.id,
          date: t.created_at,
          profileId: t.profile_id,
          userName: profile.full_name || 'Desconhecido',
          userEmail: profile.email || 'N/A',
          cpf: profile.cpf || profile.cnpj || 'N/A',
          role: profile.role || 'affiliate',
          pixKey: profile.pix_key || 'N/A',
          pixType: profile.pix_type || 'PIX',
          bankDetails: profile.bank_name ? `${profile.bank_name} - Ag: ${profile.bank_branch} / CC: ${profile.bank_account}` : 'PIX',
          amount: Math.abs(Number(t.amount || 0)),
          description: t.description ? t.description.replace(/\s*\[RECIBO:.*?\]/, '') : '',
          receiptUrl: (() => {
            if (t.receipt_url) return t.receipt_url;
            if (t.description && t.description.includes('[RECIBO:')) {
              const match = t.description.match(/\[RECIBO:(.*?)\]/);
              if (match && match[1]) return match[1];
            }
            try {
              return localStorage.getItem(`receipt_tx_${t.id}`) || null;
            } catch (e) {
              return null;
            }
          })(),
          categoryLabel,
          cycleLabel,
          status: t.status
        };
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  },

  getResellerFinancialSummary: async (userId: string, year?: number, month?: number) => {
    try {
      const now = new Date();
      const selYear = year !== undefined ? year : now.getFullYear();
      const selMonth = month !== undefined ? month : now.getMonth(); // 0-indexed: 0 = Jan, 8 = Set

      const startDate = new Date(selYear, selMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999);

      // 1. Buscar perfil do revendedor e configurações
      const [{ data: profile }, { data: config }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('mmn_config').select('commission_regional_semanal, commission_regional_mensal, commission_regional_anual').single()
      ]);

      // 2. Buscar todas as transações do revendedor
      const { data: allTransactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // Filtrar apenas comissões e repasses de revendedor regional
      const resellerTransactions = (allTransactions || []).filter(t => {
        const desc = t.description || '';
        return desc.includes('Revendedor') || desc.includes('Regional');
      });

      // Transações do mês selecionado
      const monthTransactions = resellerTransactions.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= startDate && tDate <= endDate;
      });

      // Cálculos específicos do mês selecionado
      const monthCommissions = monthTransactions.filter(t => 
        t.type === 'commission' && (t.status === 'completed' || t.status === 'pago' || t.status === 'pending')
      );
      const monthWithdrawals = monthTransactions.filter(t => 
        t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'pago')
      );

      const monthlyEarned = monthCommissions
        .filter(t => t.description?.includes('Mensal'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      
      const monthlyPaid = monthWithdrawals
        .filter(t => t.description?.includes('Mensal'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const monthlyToReceive = Math.max(0, monthlyEarned - monthlyPaid);

      const weeklyEarned = monthCommissions
        .filter(t => t.description?.includes('Semanal'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      
      const weeklyPaid = monthWithdrawals
        .filter(t => t.description?.includes('Semanal') || (!t.description?.includes('Mensal') && !t.description?.includes('Anual')))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const weeklyAvailable = Math.max(0, weeklyEarned - weeklyPaid);

      const annualEarned = monthCommissions
        .filter(t => t.description?.includes('Anual'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const annualPaid = monthWithdrawals
        .filter(t => t.description?.includes('Anual'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

      const annualToReceive = Math.max(0, annualEarned - annualPaid);

      // Acumulado geral da revenda
      const allResellerCommissions = resellerTransactions.filter(t => 
        t.type === 'commission' && (t.status === 'completed' || t.status === 'pago' || t.status === 'pending')
      );
      const allResellerWithdrawals = resellerTransactions.filter(t => 
        t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'pago')
      );

      const totalHistoricalMonthly = allResellerCommissions
        .filter(t => t.description?.includes('Mensal'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const totalHistoricalMonthlyPaid = allResellerWithdrawals
        .filter(t => t.description?.includes('Mensal'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
      const totalMonthlyPendingHistorical = Math.max(0, totalHistoricalMonthly - totalHistoricalMonthlyPaid);

      const isPJ = isCnpj(profile?.cpf || profile?.cnpj, profile?.pix_key);
      const taxMonthly = calculateTaxDeductions(monthlyToReceive, isPJ);

      // Buscar pedidos das comissões do mês
      const orderIds = [...new Set(monthCommissions.map(t => {
        const match = t.description?.match(/Pedido\s*#?\s*([a-zA-Z0-9_-]+)/i);
        return t.order_id || (match ? match[1] : null);
      }).filter(Boolean))] as string[];

      let ordersMap = new Map();
      if (orderIds.length > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, amount, customer_id, customer_name, status, created_at, order_date, items')
          .in('id', orderIds);
        ordersMap = new Map((ordersData || []).map(o => [String(o.id), o]));
      }

      // Agrupar comissões por pedido para tabela de fechamentos/vendas do mês
      const groupedMap = new Map<string, any>();

      monthCommissions.forEach(t => {
        const orderId = String(t.order_id || (t.description?.match(/Pedido\s*#?\s*([a-zA-Z0-9_-]+)/i)?.[1] || t.id));
        if (!groupedMap.has(orderId)) {
          const orderInfo = ordersMap.get(orderId);
          groupedMap.set(orderId, {
            orderId,
            date: t.created_at,
            customerName: orderInfo?.customer_name || 'Cliente Direto',
            orderAmount: Number(orderInfo?.amount || 0),
            orderStatus: orderInfo?.status || 'Concluído',
            semanal: 0,
            mensal: 0,
            anual: 0,
            totalCommission: 0,
            status: t.status,
            rawTransactions: []
          });
        }

        const item = groupedMap.get(orderId);
        const amt = Number(t.amount || 0);
        item.rawTransactions.push(t);
        item.totalCommission += amt;
        if (t.description?.includes('Semanal')) item.semanal += amt;
        else if (t.description?.includes('Mensal')) item.mensal += amt;
        else if (t.description?.includes('Anual')) item.anual += amt;
      });

      const salesList = Array.from(groupedMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const totalOrderVolume = salesList.reduce((acc, s) => acc + s.orderAmount, 0);

      // Pagamentos já liquidados (saques concluídos da revenda)
      const withdrawalsList = allResellerWithdrawals.map(w => ({
        id: w.id,
        date: w.created_at,
        amount: Math.abs(Number(w.amount || 0)),
        description: w.description,
        status: w.status,
        receiptUrl: w.receipt_url || null
      }));

      // Lançamentos individuais de nível REG para a visão detalhada do revendedor
      const itemizedTransactions = monthCommissions.map(t => {
        const orderId = String(t.order_id || (t.description?.match(/Pedido\s*#?\s*([a-zA-Z0-9_-]+)/i)?.[1] || '---'));
        const orderInfo = ordersMap.get(orderId);
        
        let category = 'SEMANAL (REG)';
        if (t.description?.includes('Mensal')) category = 'MENSAL (REG)';
        else if (t.description?.includes('Anual')) category = 'ANUAL (REG)';

        return {
          id: t.id,
          orderId,
          affiliateName: orderInfo?.customer_name ? `${orderInfo.customer_name} (Regional)` : 'Regional',
          level: 'REG',
          category,
          date: t.created_at,
          amount: Number(t.amount || 0),
          status: (t.status === 'completed' || t.status === 'pago') ? 'PAGO' : 'PENDENTE'
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        profile,
        isPJ,
        year: selYear,
        month: selMonth,
        rates: {
          semanal: Number(config?.commission_regional_semanal ?? 2.00),
          mensal: Number(config?.commission_regional_mensal ?? 2.00),
          anual: Number(config?.commission_regional_anual ?? 2.00),
          total: Number(config?.commission_regional_semanal ?? 2.00) + Number(config?.commission_regional_mensal ?? 2.00) + Number(config?.commission_regional_anual ?? 2.00)
        },
        monthlyEarned,
        monthlyPaid,
        monthlyToReceive,
        weeklyEarned,
        weeklyPaid,
        weeklyAvailable,
        annualEarned,
        annualPaid,
        annualToReceive,
        totalMonthlyPendingHistorical,
        tax: taxMonthly,
        salesList,
        itemizedTransactions,
        salesCount: salesList.length,
        totalOrderVolume,
        withdrawalsList
      };
    } catch (error) {
      console.error("Erro ao carregar dados financeiros do revendedor:", error);
      throw error;
    }
  },

  uploadReceipt: async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payouts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('payouts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  processPayout: async (
    profileId: string, 
    amount: number, 
    type: 'mensal' | 'anual' | 'digital', 
    receiptUrl: string,
    category: 'network' | 'reseller' = 'network'
  ) => {
    // Validação estrita de adimplência
    const stats = await businessRules.getAffiliateStats(profileId);
    if (!stats.isEligible) {
      throw new Error('Usuário inadimplente (sem plano ativo). Pagamento bloqueado.');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('cpf, pix_key')
      .eq('id', profileId)
      .single();

    const isPJ = isCnpj(profile?.cpf, profile?.pix_key);
    const tax = calculateTaxDeductions(amount, isPJ);

    let displayType = '';
    if (type === 'mensal') displayType = 'Mensal';
    else if (type === 'anual') displayType = 'Anual';
    else displayType = 'Digital';

    const isReseller = category === 'reseller';
    const taxDetail = isPJ ? ' (PJ Isento)' : (tax.inss > 0 ? ` (Líq. R$ ${tax.liquido.toFixed(2)} | INSS 11%: -R$ ${tax.inss.toFixed(2)})` : '');
    const description = isReseller 
      ? `Pagamento Repasse Revendedor ${displayType}${taxDetail} - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
      : `Pagamento Cashback Rede ${displayType}${taxDetail} - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    
    const descWithReceipt = receiptUrl ? `${description} [RECIBO:${receiptUrl}]` : description;

    // Tenta primeiro com receipt_url caso a coluna exista na base
    const insertPayload: any = {
      profile_id: profileId,
      type: 'withdrawal',
      amount: -Math.abs(amount),
      description: descWithReceipt,
      status: 'completed'
    };

    if (receiptUrl) {
      insertPayload.receipt_url = receiptUrl;
    }

    let { data: insertedData, error } = await supabase
      .from('transactions')
      .insert([insertPayload])
      .select('id')
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('receipt_url'))) {
      // Se a coluna receipt_url não existe no schema da tabela transactions, insere sem ela
      delete insertPayload.receipt_url;
      const retry = await supabase
        .from('transactions')
        .insert([insertPayload])
        .select('id')
        .single();
      
      error = retry.error;
      insertedData = retry.data;
    }

    if (error) throw error;

    if (insertedData?.id && receiptUrl) {
      try {
        localStorage.setItem(`receipt_tx_${insertedData.id}`, receiptUrl);
      } catch (e) {}
    }
  },

  approveWithdrawal: async (transactionId: string, receiptUrl?: string) => {
    const updatePayload: any = { status: 'completed' };
    if (receiptUrl) updatePayload.receipt_url = receiptUrl;

    let { error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', transactionId);

    if (error && (error.code === 'PGRST204' || error.message?.includes('receipt_url'))) {
      delete updatePayload.receipt_url;
      const retry = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', transactionId);
      error = retry.error;
    }

    if (error) throw error;

    if (receiptUrl) {
      try {
        localStorage.setItem(`receipt_tx_${transactionId}`, receiptUrl);
      } catch (e) {}
    }
  },

  rejectWithdrawal: async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('id', transactionId);

    if (error) throw error;
  },

  // Lojista Dashboard
  getMerchantDashboardStats: async (merchantId: string, branchId?: string) => {
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);

    // Queries base
    let currentSalesQuery = supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).gte('order_date', firstDayCurrentMonth.toISOString());
    let lastSalesQuery = supabase.from('orders').select('amount').in('status', ['Pago, Aguardando Retirada', 'Concluído']).gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString());
    let newOrdersQuery = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pendente').gte('order_date', firstDayCurrentMonth.toISOString());
    let lastNewOrdersQuery = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pendente').gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString());
    let activeProductsQuery = supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'Ativo').eq('merchant_id', merchantId);

    if (branchId) {
      // Filtro específico de filial
      currentSalesQuery = currentSalesQuery.eq('branch_id', branchId);
      lastSalesQuery = lastSalesQuery.eq('branch_id', branchId);
      newOrdersQuery = newOrdersQuery.eq('branch_id', branchId);
      lastNewOrdersQuery = lastNewOrdersQuery.eq('branch_id', branchId);
      activeProductsQuery = activeProductsQuery.eq('branch_id', branchId);
    } else {
      // Filtro global do lojista (Matriz + todas as filiais)
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      
      currentSalesQuery = currentSalesQuery.or(filter);
      lastSalesQuery = lastSalesQuery.or(filter);
      newOrdersQuery = newOrdersQuery.or(filter);
      lastNewOrdersQuery = lastNewOrdersQuery.or(filter);
    }

    const [
      { data: currentSales },
      { data: lastSales },
      { count: newOrders },
      { count: lastNewOrders },
      { count: activeProducts },
      marketConfig
    ] = await Promise.all([
      currentSalesQuery,
      lastSalesQuery,
      newOrdersQuery,
      lastNewOrdersQuery,
      activeProductsQuery,
      businessRules.getMarketplaceConfig()
    ]);

    const totalSales = currentSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastTotalSales = lastSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;

    const platformRate = marketConfig?.commissionRate || 12;
    const merchantCommission = totalSales * (1 - (platformRate / 100));
    const lastMerchantCommission = lastTotalSales * (1 - (platformRate / 100));

    const calculateTrend = (current: number, last: number) => {
      if (last <= 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    return [
      { title: 'Vendas Totais', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSales), change: `${calculateTrend(totalSales, lastTotalSales).toFixed(1)}%`, isPositive: totalSales >= lastTotalSales, icon: 'TrendingUp' },
      { title: 'Novos Pedidos', value: (newOrders || 0).toString(), change: `${(newOrders || 0) - (lastNewOrders || 0)}`, isPositive: (newOrders || 0) >= (lastNewOrders || 0), icon: 'ShoppingBag' },
      { title: 'Produtos Ativos', value: (activeProducts || 0).toString(), change: '0', isPositive: true, icon: 'Package' },
      { title: 'Comissões a Receber', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(merchantCommission), change: `${calculateTrend(merchantCommission, lastMerchantCommission).toFixed(1)}%`, isPositive: merchantCommission >= lastMerchantCommission, icon: 'DollarSign' },
    ];
  },

  getMerchantRecentOrders: async (merchantId: string, branchId?: string) => {
    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);
    
    let query = supabase.from('orders').select('*').order('order_date', { ascending: false }).limit(10);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      query = query.or(filter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(o => ({
      id: `#${o.id.substring(0, 4)}`,
      customer: o.customer_name || 'Desconhecido',
      date: new Date(o.order_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.amount),
      status: o.status,
      color: 
        o.status === 'Concluído' ? 'green' : 
        o.status === 'Cancelado' ? 'red' : 
        o.status === 'Processando' ? 'blue' : 'gray'
    }));
  },

  getMerchantTopProducts: async (merchantId: string, branchId?: string) => {
    let query = supabase
      .from('products')
      .select('name, sales, price')
      .eq('merchant_id', merchantId)
      .order('sales', { ascending: false })
      .limit(5);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(p => ({
      name: p.name,
      sales: p.sales.toString(),
      revenue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(p.sales * p.price),
      color: 'blue'
    }));
  },

  getMerchantSalesPerformance: async (merchantId: string, branchId?: string) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);
    
    let query = supabase
      .from('orders')
      .select('amount, order_date')
      .in('status', ['Pago, Aguardando Retirada', 'Concluído'])
      .gte('order_date', thirtyDaysAgo.toISOString());

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      query = query.or(filter);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por dia para os últimos 30 dias
    const salesByDay: { [key: string]: number } = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesByDay[d.toISOString().split('T')[0]] = 0;
    }

    data?.forEach(o => {
      const day = new Date(o.order_date).toISOString().split('T')[0];
      if (salesByDay[day] !== undefined) {
        salesByDay[day] += Number(o.amount);
      }
    });

    const labels = Object.keys(salesByDay).sort().map(day => {
      const [_, m, d] = day.split('-');
      return `${d}/${m}`;
    });
    const values = Object.keys(salesByDay).sort().map(day => salesByDay[day]);

    return { labels, values };
  },

  getMerchantCustomers: async (merchantId: string, branchId?: string) => {
    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);
    
    if (branchIds.length === 0) return [];

    // 1. Buscar todos os pedidos concluídos
    let query = supabase
      .from('orders')
      .select('customer_id, customer_name, customer_initial, amount, order_date')
      .in('status', ['Pago, Aguardando Retirada', 'Concluído']);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      query = query.or(filter);
    }

    const { data: orders, error: oError } = await query;

    if (oError) throw oError;
    if (!orders || orders.length === 0) return [];

    // 2. Agrupar por cliente e calcular totais
    const customerMap: { [key: string]: any } = {};
    const customerIds: string[] = [];

    orders.forEach(o => {
      const cid = o.customer_id;
      if (!customerMap[cid]) {
        customerMap[cid] = {
          id: cid,
          name: o.customer_name,
          initial: o.customer_initial,
          orders: 0,
          spent: 0,
          lastOrder: o.order_date,
        };
        customerIds.push(cid);
      }

      customerMap[cid].orders += 1;
      customerMap[cid].spent += Number(o.amount);
      if (new Date(o.order_date) > new Date(customerMap[cid].lastOrder)) {
        customerMap[cid].lastOrder = o.order_date;
      }
    });

    // 3. Buscar detalhes dos perfis para obter e-mail, whatsapp e localização, e buscar assinaturas
    const [profilesRes, subsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, whatsapp, city, state')
        .in('id', customerIds),
      supabase
        .from('subscriptions')
        .select('profile_id, status, end_date')
        .in('profile_id', customerIds)
        .order('end_date', { ascending: false })
    ]);

    if (profilesRes.error) throw profilesRes.error;
    const profiles = profilesRes.data;
    const subscriptions = subsRes.data || [];

    // 4. Consolidar dados
    return customerIds.map(id => {
      const stats = customerMap[id];
      const profile = profiles?.find(p => p.id === id);
      const sub = subscriptions.find(s => s.profile_id === id);
      
      const lastOrderDate = new Date(stats.lastOrder);
      
      let customerStatus: 'Ativo' | 'Inativo' | 'A Renovar' = 'Inativo';
      let renewalDate = 'Nenhuma';

      if (sub) {
        const endDate = new Date(sub.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        renewalDate = endDate.toLocaleDateString('pt-BR');

        if (sub.status === 'active' && endDate > today) {
          if (diffDays <= 7) {
            customerStatus = 'A Renovar';
          } else {
            customerStatus = 'Ativo';
          }
        } else {
          customerStatus = 'Inativo';
        }
      }

      return {
        id: `C-${id.substring(0, 4).toUpperCase()}`,
        name: stats.name || 'Cliente Desconhecido',
        email: profile?.email || '--',
        phone: profile?.whatsapp || '--',
        location: profile?.city ? `${profile.city}, ${profile.state}` : 'Local não informado',
        orders: stats.orders,
        spent: stats.spent,
        lastOrder: lastOrderDate.toLocaleDateString('pt-BR'),
        status: customerStatus,
        renewalDate,
        rating: 5.0
      };
    });
  },

  getMerchantDetailedReports: async (merchantId: string, period: string, branchId?: string) => {
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let interval: 'day' | 'month' = 'day';

    const branches = await businessRules.getBranches(merchantId);
    const branchIds = branches.map(b => b.id);
    
    if (branchIds.length === 0) return { kpis: [], chart: { labels: [], values: [] }, categories: [] };

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(startDate.getDate() - 7);
        break;
      case '15d':
        startDate.setDate(now.getDate() - 15);
        previousStartDate.setDate(startDate.getDate() - 15);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(startDate.getDate() - 30);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        interval = 'month';
        break;
    }

    let currentOrdersQuery = supabase.from('orders')
      .select('amount, order_date, items')
      .in('status', ['Pago, Aguardando Retirada', 'Concluído'])
      .gte('order_date', startDate.toISOString());
    
    let previousOrdersQuery = supabase.from('orders')
      .select('amount')
      .in('status', ['Pago, Aguardando Retirada', 'Concluído'])
      .lt('order_date', startDate.toISOString())
      .gte('order_date', previousStartDate.toISOString());
    
    let topCategoriesQuery = supabase.from('products').select('category, sales').eq('merchant_id', merchantId);

    if (branchId) {
      currentOrdersQuery = currentOrdersQuery.eq('branch_id', branchId);
      previousOrdersQuery = previousOrdersQuery.eq('branch_id', branchId);
      topCategoriesQuery = topCategoriesQuery.eq('branch_id', branchId);
    } else {
      const ids = [...branchIds];
      const filter = ids.length > 0 
        ? `branch_id.in.(${ids.join(',')}),branch_id.is.null`
        : `branch_id.is.null`;
      
      currentOrdersQuery = currentOrdersQuery.or(filter);
      previousOrdersQuery = previousOrdersQuery.or(filter);
      // topCategories já filtrado por merchant_id
    }

    const [
      { data: currentOrders },
      { data: previousOrders },
      { data: topCategoriesData }
    ] = await Promise.all([
      currentOrdersQuery,
      previousOrdersQuery,
      topCategoriesQuery
    ]);

    const calculateTotal = (orders: any[] | null) => orders?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    
    const currentGMV = calculateTotal(currentOrders);
    const previousGMV = calculateTotal(previousOrders);
    
    const currentTicket = currentOrders && currentOrders.length > 0 ? currentGMV / currentOrders.length : 0;
    const previousTicket = previousOrders && previousOrders.length > 0 ? previousGMV / previousOrders.length : 0;

    const calculateTrend = (curr: number, prev: number) => {
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    // Agrupamento para o gráfico
    const chartData: { [key: string]: number } = {};
    const labels: string[] = [];
    const values: number[] = [];

    if (interval === 'day') {
      for (let i = 0; i <= (period === '7d' ? 7 : period === '15d' ? 15 : 30); i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        chartData[d.toISOString().split('T')[0]] = 0;
      }
      currentOrders?.forEach(o => {
        const day = new Date(o.order_date).toISOString().split('T')[0];
        if (chartData[day] !== undefined) chartData[day] += Number(o.amount);
      });
      Object.keys(chartData).sort().forEach(day => {
        const [_, m, d] = day.split('-');
        labels.push(`${d}/${m}`);
        values.push(chartData[day]);
      });
    } else {
      // YTD (Month)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthData = new Array(12).fill(0);
      currentOrders?.forEach(o => {
        const d = new Date(o.order_date);
        if (d.getFullYear() === now.getFullYear()) monthData[d.getMonth()] += Number(o.amount);
      });
      for (let i = 0; i <= now.getMonth(); i++) {
        labels.push(months[i]);
        values.push(monthData[i]);
      }
    }

    // Categorias
    const categoriesMap: { [key: string]: number } = {};
    topCategoriesData?.forEach(p => {
      const cat = p.category || 'Outros';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + Number(p.sales);
    });
    const totalSales = Object.values(categoriesMap).reduce((a, b) => a + b, 0);
    const topCategories = Object.entries(categoriesMap)
      .map(([name, sales]) => ({
        name,
        percent: totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0,
        color: name === 'Eletrônicos' ? 'bg-primary-blue' : name === 'Vestuário' ? 'bg-emerald-500' : 'bg-purple-500'
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);

    return {
      kpis: [
        { title: 'Receita Bruta', value: currentGMV, trend: calculateTrend(currentGMV, previousGMV), isPositive: currentGMV >= previousGMV },
        { title: 'Ticket Médio', value: currentTicket, trend: calculateTrend(currentTicket, previousTicket), isPositive: currentTicket >= previousTicket },
        { title: 'Pedidos', value: currentOrders?.length || 0, trend: calculateTrend(currentOrders?.length || 0, previousOrders?.length || 0), isPositive: (currentOrders?.length || 0) >= (previousOrders?.length || 0) },
        { title: 'CAC (Est.)', value: currentGMV * 0.05, trend: 0, isPositive: true }, // CAC simplificado 5% GMV
      ],
      chart: { labels, values },
      categories: topCategories
    };
  },

  // Busca lista de espera de lojistas
  getMerchantWaitlist: async () => {
    const { data, error } = await supabase
      .from('merchant_waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getOrderCommissions: async (orderId: string | number) => {
    const orderIdStr = String(orderId);

    const mapRows = (rows: any[], nameById: Record<string, string>) =>
      rows.map((c: any) => {
        const desc = c.description || '';
        const isRegional = desc.includes('Regional');
        
        let level = Number(c.level) || 0;
        if (isRegional) {
          level = 99;
        } else {
          const gMatch = desc.match(/G(\d+)/i);
          if (gMatch) {
            level = parseInt(gMatch[1], 10);
          } else {
            const levelMatch = desc.match(/Nível\s+(\d+)/i);
            if (levelMatch) {
              level = parseInt(levelMatch[1], 10);
            }
          }
        }

        return {
          id: c.id,
          affiliate_id: c.affiliate_id || c.profile_id,
          amount: c.amount,
          status: c.status,
          description: desc,
          order_id: c.order_id || orderIdStr,
          level,
          isRegional,
          affiliateName: nameById[c.affiliate_id || c.profile_id] || 'Desconhecido',
        };
      });

    const fetchAffiliateNames = async (affiliateIds: string[]) => {
      const unique = [...new Set(affiliateIds.filter(Boolean))];
      if (unique.length === 0) return {} as Record<string, string>;
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', unique);
      return Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, p.full_name || 'Desconhecido'])
      );
    };

    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('id, affiliate_id, amount, level, status, description, order_id')
        .eq('order_id', orderIdStr)
        .order('level', { ascending: true });

      if (!error && data && data.length > 0) {
        const names = await fetchAffiliateNames(data.map((c: any) => c.affiliate_id));
        return mapRows(data, names);
      }

      if (error) {
        console.warn('commissions view query failed, falling back to transactions:', error.message);
      }

      // Fallback: transações de comissão (caso a view ainda não exista no projeto Supabase)
      const { data: txRows, error: txError } = await supabase
        .from('transactions')
        .select('id, profile_id, amount, status, description, order_id')
        .eq('type', 'commission')
        .or(`order_id.eq.${orderIdStr},description.ilike.%Pedido #${orderIdStr}%`);

      if (txError) {
        console.error('Error fetching order commissions:', txError);
        return [];
      }

      const names = await fetchAffiliateNames(txRows.map((t: any) => t.profile_id));
      return mapRows(txRows, names);
    } catch (error) {
      console.error('Error in getOrderCommissions:', error);
      return [];
    }
  },

  // WhatsApp Config
  getWhatsAppConfig: async () => {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('Error fetching WhatsApp config:', error);
      }
      return {
        zapiInstanceId: '',
        zapiToken: '',
        zapiClientToken: '',
        supabaseUrl: '',
        supabaseAnonKey: '',
        isEnabled: true
      };
    }

    return {
      zapiInstanceId: data.zapi_instance_id || '',
      zapiToken: data.zapi_token || '',
      zapiClientToken: data.zapi_client_token || '',
      supabaseUrl: data.supabase_url || '',
      supabaseAnonKey: data.supabase_anon_key || '',
      isEnabled: data.is_enabled ?? true
    };
  },

  saveWhatsAppConfig: async (config: {
    zapiInstanceId: string;
    zapiToken: string;
    zapiClientToken: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    isEnabled: boolean;
  }) => {
    const { error } = await supabase
      .from('whatsapp_config')
      .upsert({
        id: 1,
        zapi_instance_id: config.zapiInstanceId,
        zapi_token: config.zapiToken,
        zapi_client_token: config.zapiClientToken,
        supabase_url: config.supabaseUrl,
        supabase_anon_key: config.supabaseAnonKey,
        is_enabled: config.isEnabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  },

  // WhatsApp Queue Logs
  getWhatsAppMessages: async (limitCount = 15): Promise<any[]> => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error fetching WhatsApp messages:', error);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      phone: m.phone,
      message: m.message,
      status: m.status,
      errorMessage: m.error_message,
      createdAt: new Date(m.created_at).toLocaleString('pt-BR'),
      sentAt: m.sent_at ? new Date(m.sent_at).toLocaleString('pt-BR') : null,
      attempts: m.attempts
    }));
  },

  sendTestWhatsAppMessage: async (phone: string, message: string) => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([{
        phone,
        message,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

