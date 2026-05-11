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

  decrementStock: async (productId: string, quantity: number) => {
    // Busca estoque atual
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, sales')
      .eq('id', productId)
      .single();
    
    if (fetchError || !product) return;

    const newStock = Math.max(0, (product.stock || 0) - quantity);
    const newSales = (product.sales || 0) + quantity;

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        sales: newSales 
      })
      .eq('id', productId);

    if (updateError) {
      console.error('ERRO CRÍTICO AO ATUALIZAR ESTOQUE:', updateError.message, updateError.details);
    } else {
      console.log(`Estoque atualizado com sucesso para o produto ${productId}. Novo saldo: ${newStock}`);
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
        withdrawal_code: extra.withdrawalCode || `${orderId}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
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
        cashbackAnual: 0.75
      };
    }
    
    return {
      depth: data.depth,
      paymentType: data.payment_type as 'percent' | 'fixed',
      cashbackMensal: Number(data.cashback_mensal),
      cashbackDigital: Number(data.cashback_digital),
      cashbackAnual: Number(data.cashback_anual)
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
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const depth = config?.depth || 4; // Fallback para 4 se não achar

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
      return { g1: 0, g2: 0, g3: 0, g4: 0, total: 0, rank: 'Afiliado' };
    }
  },

  getAffiliateStats: async (userId: string) => {
    try {
      if (!userId || userId === 'user123') {
        throw new Error('ID de usuário inválido.');
      }

      const [tResult, nSummary, oResult] = await Promise.all([
        supabase.from('transactions').select('amount, type, description, status').eq('profile_id', userId),
        businessRules.getNetworkSummary(userId),
        supabase.from('orders').select('id').eq('customer_id', userId).eq('status', 'Concluído')
      ]);

      const transactions = tResult.data || [];
      const consumptionCount = oResult.data?.length || 0;

      // Cálculo Real baseado no PRD (Divisão Tripla)
      // Buscamos por palavras-chave na descrição ou tipo de forma mais flexível
      const monthlyBonus = transactions
        .filter(t => (t.description?.includes('(Mensal)') || t.description?.includes('Mensal')) && 
                (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const annualBonus = transactions
        .filter(t => (t.description?.includes('(Anual)') || t.description?.includes('Anual')) && 
                (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const walletBonus = transactions
        .filter(t => (t.description?.includes('(CD)') || t.description?.includes('Digital')) && 
                (t.status === 'completed' || t.status === 'pago'))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const totalEarnings = monthlyBonus + annualBonus + walletBonus;
      
      // O Saldo Disponível conforme o PRD é o da Carteira Digital (CD)
      const totalWithdrawn = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

      const availableBalance = walletBonus - totalWithdrawn;

      return {
        monthlyBonus,
        annualBonus,
        walletBonus,
        maintenanceFee: 0,
        totalEarnings,
        availableBalance,
        cashbackBalance: 0,
        consumptionCount,
        isEligible: consumptionCount >= 1 && availableBalance > 0,
        networkSummary: nSummary,
        rank: nSummary.rank
      };
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      return {
        monthlyBonus: 0, annualBonus: 0, walletBonus: 0, maintenanceFee: 0,
        totalEarnings: 0, availableBalance: 0, cashbackBalance: 0,
        consumptionCount: 0, isEligible: false,
        networkSummary: { g1: 0, g2: 0, g3: 0, g4: 0, total: 0, rank: 'Afiliado' },
        rank: 'Afiliado'
      };
    }
  },

  getAffiliateNetwork: async (userId: string) => {
    try {
      if (!userId || userId === 'user123') return [];

      // 1. Buscar profundidade
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const depth = config?.depth || 4;

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

      return transactions.map(t => {
        const orderMatch = t.description?.match(/Pedido\s*#\s*([A-Z0-9-]+)/i);
        const orderId = orderMatch ? orderMatch[1].trim() : null;
        const order = orderId ? ordersMap.get(orderId) : null;

        const typeMatch = t.description?.match(/\((Mensal|Anual|CD|Digital)\)/i);
        let cashbackType = typeMatch ? typeMatch[1] : 'Outros';
        if (cashbackType === 'CD') cashbackType = 'Digital';

        // Determinar o nível
        let level = '0';
        if (order?.customer_id && levelMap.has(order.customer_id)) {
          level = String(levelMap.get(order.customer_id));
        } else {
          const todosNumeros = t.description?.match(/\d+/g) || [];
          const nivelEncontrado = todosNumeros.find(n => n !== orderId && n.length < 3);
          level = nivelEncontrado || (t.type === 'commission' ? '0' : '---');
        }

        return {
          id: t.id,
          orderId: orderId || '---',
          affiliateName: order?.buyer_name || (t.type === 'withdrawal' ? 'Resgate' : 'Sistema'),
          level: level,
          cashbackType: cashbackType,
          date: new Date(t.created_at).toLocaleDateString('pt-BR'),
          amount: t.amount,
          status: order?.status || (t.status === 'completed' ? 'Concluído' : 'Pendente'),
          originalType: t.type,
          description: t.description
        };
      });
    } catch (error) {
      console.error("Activity Fetch Error:", error);
      return [];
    }
  },

  getAffiliateTree: async (userId: string) => {
    try {
      const { data: config } = await supabase.from('mmn_config').select('depth').single();
      const depth = config?.depth || 4;

      // Buscar todos os perfis da rede de uma vez para construir a árvore na memória
      // (Mais eficiente do que múltiplas chamadas recursivas ao banco)
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code, whatsapp, referred_by');

      if (!allMembers) return null;

      const buildTree = (currentId: string, currentLevel: number): any => {
        const profile = allMembers.find(p => p.id === currentId);
        if (!profile || currentLevel > depth + 1) return null;

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
      { count: currentBranchCount },
      { count: lastBranchCount },
      { data: currentCommissions },
      { data: lastCommissions },
      { count: blockedUserCount },
      { count: pendingWithdrawalCount }
    ] = await Promise.all([
      // Revenue
      supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', firstDayCurrentMonth.toISOString()),
      supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString()),
      
      // Users
      supabase.from('profiles').select('*', { count: 'exact', head: true }), // Total
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayCurrentMonth.toISOString()), // Novos este mês
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()), // Novos mês passado
      
      // Lojistas
      supabase.from('branches').select('*', { count: 'exact', head: true }).gte('created_at', firstDayCurrentMonth.toISOString()),
      supabase.from('branches').select('*', { count: 'exact', head: true }).lte('created_at', lastDayLastMonth.toISOString()),
      
      // Commissions
      supabase.from('transactions').select('amount').eq('type', 'commission').gte('created_at', firstDayCurrentMonth.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'commission').gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),

      // Blocked Users
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),

      // Pending Withdrawals
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending')
    ]);

    // Totais Atuais (Gerais)
    const { data: allOrders } = await supabase.from('orders').select('amount').eq('status', 'Concluído');
    const currentTotalRevenue = currentRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastTotalRevenue = lastRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;

    const { data: allCommissions } = await supabase.from('transactions').select('amount').eq('type', 'commission');
    const currentTotalCommissions = currentCommissions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lastTotalCommissions = lastCommissions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    // Cálculos de Tendência
    const calculateTrend = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    const usersCurrent = totalUserCount || 0;
    const usersLast = (totalUserCount || 0) - (currentMonthUserCount || 0);

    return {
      revenueTotal: currentTotalRevenue,
      revenueTrend: calculateTrend(currentTotalRevenue, lastTotalRevenue),
      userCount: totalUserCount || 0,
      userTrend: calculateTrend(usersCurrent, usersLast),
      branchCount: currentBranchCount || 0,
      branchTrend: calculateTrend(currentBranchCount || 0, lastBranchCount || 0),
      commissionTotal: currentTotalCommissions,
      commissionTrend: calculateTrend(currentTotalCommissions, lastTotalCommissions),
      blockedUserCount: blockedUserCount || 0,
      pendingWithdrawals: pendingWithdrawalCount || 0
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
      .from('user_profiles')
      .select('id, full_name, pix_key, cpf')
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
          logs.push({
            type: 'Success',
            text: `Comissão gerada: R$ ${Number(t.amount).toFixed(2)} - ${t.description.split(' (')[0]}`,
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
        supabase.from('orders').select('amount').eq('status', 'Concluído')
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
      supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', thirtyDaysAgo.toISOString()),
      supabase.from('orders').select('amount').eq('status', 'Concluído').lt('order_date', thirtyDaysAgo.toISOString()).gte('order_date', new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
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
        products:products(count),
        orders:orders(amount, status)
      `);

    if (error) throw error;

    return merchants.map(m => {
      const successfulOrders = m.orders?.filter((o: any) => o.status === 'Concluído') || [];
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

  getAdminReportsData: async (range: string) => {
    const now = new Date();
    let days = 30;
    let groupBy: 'day' | 'month' = 'day';
    let startDate = new Date();
    let previousStartDate = new Date();

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

    const [
      { data: currentRevenue },
      { data: lastRevenue },
      { count: currentUserGrowth },
      { count: lastUserGrowth },
      { data: currentCommissions },
      { data: lastCommissions },
      { data: config },
      { data: chartRawData }
    ] = await Promise.all([
      supabase.from('orders').select('amount, order_date').eq('status', 'Concluído').gte('order_date', startDate.toISOString()),
      supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', previousStartDate.toISOString()).lt('order_date', startDate.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'commission').gte('created_at', startDate.toISOString()),
      supabase.from('transactions').select('amount').eq('type', 'commission').gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString()),
      supabase.from('marketplace_config').select('commission_rate').eq('id', 1).single(),
      supabase.from('orders').select('amount, order_date').eq('status', 'Concluído').gte('order_date', startDate.toISOString())
    ]);

    const platformRate = config?.commission_rate || 12;
    const currentGMVTotal = currentRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastGMVTotal = lastRevenue?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const currentPayout = currentCommissions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    const lastPayout = lastCommissions?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    const calculateTrend = (current: number, last: number) => {
      if (last <= 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    // Advanced Chart Logic
    const labels: string[] = [];
    const values: number[] = [];
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (groupBy === 'day') {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        labels.push(label);
        
        const dayTotal = chartRawData?.filter(o => {
          const od = new Date(o.order_date);
          return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        }).reduce((acc, o) => acc + Number(o.amount), 0) || 0;
        
        values.push(dayTotal);
      }
    } else {
      const numMonths = range === '6 meses' ? 6 : 12;
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthsNames[d.getMonth()]);

        const monthTotal = chartRawData?.filter(o => {
          const od = new Date(o.order_date);
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
      distribution: [
        { label: 'UrbaShop', percent: '100%', color: 'bg-indigo-600' },
        { label: 'UrbaPay', percent: '0%', color: 'bg-purple-500' },
        { label: 'Outros', percent: '0%', color: 'bg-emerald-500' },
      ]
    };
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
    const { error } = await supabase
      .from('orders')
      .update({ status })
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
    let query = supabase
      .from('products')
      .select('*')
      .order('name');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(p => ({
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
      description: p.description
    }));
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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('name');
    
    if (error) throw error;
    
    return data.map(p => ({
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
      description: p.description
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
    let ordersQuery = supabase.from('orders').select('amount, cashback_amount').eq('status', 'Concluído');
    
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
    // 1. Verificar saldo (opcional, mas bom ter no cliente também)
    // 2. Criar registro de transação negativa pendente
    const { error } = await supabase
      .from('transactions')
      .insert([{
        profile_id: profileId,
        type: 'withdrawal',
        amount: -Math.abs(amount),
        description: 'Solicitação de Saque',
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

  getPayableBalances: async () => {
    // 1. Buscar todos os perfis
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, email, pix_key, bank_name, bank_branch, bank_account');
    
    if (pError) throw pError;

    // 2. Buscar todas as transações para calcular saldos de cashback
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'completed');
    
    if (tError) throw tError;

    // 3. Processar saldos por usuário
    const payableList = profiles.map(profile => {
      const userTransactions = transactions.filter(t => t.profile_id === profile.id);
      
      const monthlyBonus = userTransactions
        .filter(t => t.description?.includes('(Mensal)'))
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const annualBonus = userTransactions
        .filter(t => t.description?.includes('(Anual)'))
        .reduce((acc, t) => acc + Number(t.amount), 0);

      // Subtrair pagamentos já realizados (withdrawals com descrição de pagamento)
      const monthlyPaid = userTransactions
        .filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Mensal'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

      const annualPaid = userTransactions
        .filter(t => t.type === 'withdrawal' && t.description?.includes('Pagamento Cashback Anual'))
        .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

      return {
        profileId: profile.id,
        userName: profile.full_name || 'N/A',
        userEmail: profile.email || 'N/A',
        pixKey: profile.pix_key || 'Não informado',
        bankDetails: profile.bank_name ? `${profile.bank_name} / Ag: ${profile.bank_branch} / CC: ${profile.bank_account}` : 'Apenas PIX',
        monthlyPending: monthlyBonus - monthlyPaid,
        annualPending: annualBonus - annualPaid,
      };
    }).filter(p => p.monthlyPending > 0 || p.annualPending > 0);

    return payableList;
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

  processPayout: async (profileId: string, amount: number, type: 'mensal' | 'anual', receiptUrl: string) => {
    const description = `Pagamento Cashback ${type === 'mensal' ? 'Mensal' : 'Anual'} - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
    
    const { error } = await supabase
      .from('transactions')
      .insert([{
        profile_id: profileId,
        type: 'withdrawal',
        amount: -Math.abs(amount),
        description,
        status: 'completed',
        receipt_url: receiptUrl
      }]);

    if (error) throw error;
  },

  approveWithdrawal: async (transactionId: string, receiptUrl?: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        receipt_url: receiptUrl 
      })
      .eq('id', transactionId);

    if (error) throw error;
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
    let currentSalesQuery = supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', firstDayCurrentMonth.toISOString());
    let lastSalesQuery = supabase.from('orders').select('amount').eq('status', 'Concluído').gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString());
    let newOrdersQuery = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pendente').gte('order_date', firstDayCurrentMonth.toISOString());
    let lastNewOrdersQuery = supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pendente').gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString());
    let activeProductsQuery = supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'Ativo').eq('merchant_id', merchantId);
    let currentCashbackQuery = supabase.from('orders').select('cashback_amount').eq('status', 'Concluído').gte('order_date', firstDayCurrentMonth.toISOString());
    let lastCashbackQuery = supabase.from('orders').select('cashback_amount').eq('status', 'Concluído').gte('order_date', firstDayLastMonth.toISOString()).lte('order_date', lastDayLastMonth.toISOString());

    if (branchId) {
      // Filtro específico de filial
      currentSalesQuery = currentSalesQuery.eq('branch_id', branchId);
      lastSalesQuery = lastSalesQuery.eq('branch_id', branchId);
      newOrdersQuery = newOrdersQuery.eq('branch_id', branchId);
      lastNewOrdersQuery = lastNewOrdersQuery.eq('branch_id', branchId);
      activeProductsQuery = activeProductsQuery.eq('branch_id', branchId);
      currentCashbackQuery = currentCashbackQuery.eq('branch_id', branchId);
      lastCashbackQuery = lastCashbackQuery.eq('branch_id', branchId);
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
      currentCashbackQuery = currentCashbackQuery.or(filter);
      lastCashbackQuery = lastCashbackQuery.or(filter);
    }

    const [
      { data: currentSales },
      { data: lastSales },
      { count: newOrders },
      { count: lastNewOrders },
      { count: activeProducts },
      { data: currentCashback },
      { data: lastCashback }
    ] = await Promise.all([
      currentSalesQuery,
      lastSalesQuery,
      newOrdersQuery,
      lastNewOrdersQuery,
      activeProductsQuery,
      currentCashbackQuery,
      lastCashbackQuery
    ]);

    const totalSales = currentSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const lastTotalSales = lastSales?.reduce((acc, o) => acc + Number(o.amount), 0) || 0;
    const totalCashback = currentCashback?.reduce((acc, o) => acc + Number(o.cashback_amount), 0) || 0;
    const lastTotalCashback = lastCashback?.reduce((acc, o) => acc + Number(o.cashback_amount), 0) || 0;

    const calculateTrend = (current: number, last: number) => {
      if (last <= 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    return [
      { title: 'Vendas Totais', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSales), change: `${calculateTrend(totalSales, lastTotalSales).toFixed(1)}%`, isPositive: totalSales >= lastTotalSales, icon: 'TrendingUp' },
      { title: 'Novos Pedidos', value: (newOrders || 0).toString(), change: `${(newOrders || 0) - (lastNewOrders || 0)}`, isPositive: (newOrders || 0) >= (lastNewOrders || 0), icon: 'ShoppingBag' },
      { title: 'Produtos Ativos', value: (activeProducts || 0).toString(), change: '0', isPositive: true, icon: 'Package' },
      { title: 'Cashback Distribuído', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCashback), change: `${calculateTrend(totalCashback, lastTotalCashback).toFixed(1)}%`, isPositive: totalCashback >= lastTotalCashback, icon: 'DollarSign' },
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
      .eq('status', 'Concluído')
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
      .eq('status', 'Concluído');

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

    // 3. Buscar detalhes dos perfis para obter e-mail, whatsapp e localização
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, email, whatsapp, city, state')
      .in('id', customerIds);

    if (pError) throw pError;

    // 4. Consolidar dados
    return customerIds.map(id => {
      const stats = customerMap[id];
      const profile = profiles?.find(p => p.id === id);
      
      const lastOrderDate = new Date(stats.lastOrder);
      const isRecent = (new Date().getTime() - lastOrderDate.getTime()) < (30 * 24 * 60 * 60 * 1000);

      return {
        id: `C-${id.substring(0, 4).toUpperCase()}`,
        name: stats.name || 'Cliente Desconhecido',
        email: profile?.email || '--',
        phone: profile?.whatsapp || '--',
        location: profile?.city ? `${profile.city}, ${profile.state}` : 'Local não informado',
        orders: stats.orders,
        spent: stats.spent,
        lastOrder: lastOrderDate.toLocaleDateString('pt-BR'),
        status: isRecent ? 'Ativo' : 'Inativo',
        rating: 5.0 // Por enquanto fixo, poderia ser média de avaliações se houver tabela de reviews
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
      .eq('status', 'Concluído')
      .gte('order_date', startDate.toISOString());
    
    let previousOrdersQuery = supabase.from('orders')
      .select('amount')
      .eq('status', 'Concluído')
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
  }
};

