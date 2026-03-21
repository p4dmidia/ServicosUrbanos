
// Simulação de Banco de Dados e Regras de Negócio
// Persistência via localStorage para o protótipo

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
  role: 'owner' | 'manager';
  branchId?: string; // Se for manager, está associado a uma filial
  commissionRate: number; // Por padrão 30%
}

export interface OrderWithCode {
  id: string;
  withdrawalCode: string;
  status: 'Pendente' | 'Processando' | 'Enviado' | 'Concluído' | 'Cancelado';
}

const STORAGE_KEYS = {
  BRANCHES: 'urbashop_branches',
  USERS: 'urbashop_merchant_users',
  ORDERS_EXTRA: 'urbashop_orders_extra',
  CURRENT_USER: 'urbashop_current_user'
};

// Dados Iniciais (Seed)
const initialBranches: Branch[] = [
  { id: '1', name: 'Loja Matriz Centro', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100' },
  { id: 'branch-shopping', name: 'Filial Shopping West', address: 'Av. Francisco Matarazzo, 1500', city: 'São Paulo', state: 'SP', zipCode: '05001-100' },
  { id: 'branch-sul', name: 'Filial Zona Sul', address: 'Av. Interlagos, 2255', city: 'São Paulo', state: 'SP', zipCode: '04661-200' }
];

const initialUsers: MerchantUser[] = [
  { id: 'owner-1', name: 'Dono da Loja', email: 'contato@minhalojatech.com', role: 'owner', commissionRate: 0 },
  { id: 'manager-1', name: 'Ricardo Almeida', email: 'ricardo@loja.com', role: 'manager', branchId: 'branch-shopping', commissionRate: 35 },
  { id: 'manager-2', name: 'Juliana Silva', email: 'juliana@loja.com', role: 'manager', branchId: 'branch-sul', commissionRate: 25 }
];

const initialOrders = [
  { id: '#8492', customerName: 'João Silva', customerInitial: 'J', date: 'Hoje, 14:20', amount: 199.90, status: 'Concluído', items: 2, branchId: '1', cashbackAmount: 9.99 },
  { id: '#8491', customerName: 'Maria Santos', customerInitial: 'M', date: 'Hoje, 12:45', amount: 349.00, status: 'Enviado', items: 1, branchId: '1', cashbackAmount: 17.45 },
  { id: '#8490', customerName: 'Pedro Costa', customerInitial: 'P', date: 'Ontem, 21:10', amount: 89.90, status: 'Cancelado', items: 3, branchId: '2', cashbackAmount: 4.50 },
  { id: '#8489', customerName: 'Ana Oliveira', customerInitial: 'A', date: 'Ontem, 18:30', amount: 1250.00, status: 'Concluído', items: 1, branchId: '1', cashbackAmount: 62.50 },
  { id: '#8488', customerName: 'Carlos Mendes', customerInitial: 'C', date: '12 Nov, 09:15', amount: 450.50, status: 'Pendente', items: 4, branchId: '3', cashbackAmount: 22.50 },
  { id: '#8487', customerName: 'Fernanda Lima', customerInitial: 'F', date: '11 Nov, 16:40', amount: 210.00, status: 'Concluído', items: 2, branchId: '1', cashbackAmount: 10.50 },
];

export const businessRules = {
  getOrders: () => initialOrders, // Em um app real, buscaria do localstorage ou API
  getBranches: (): Branch[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(initialBranches));
      return initialBranches;
    }
    return JSON.parse(data);
  },

  addBranch: (branch: Omit<Branch, 'id'>) => {
    const branches = businessRules.getBranches();
    const newBranch = { ...branch, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify([...branches, newBranch]));
    return newBranch;
  },

  getUsers: (): MerchantUser[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  },

  addUser: (user: Omit<MerchantUser, 'id'>) => {
    const users = businessRules.getUsers();
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([...users, newUser]));
    return newUser;
  },

  updateUserCommission: (userId: string, rate: number) => {
    const users = businessRules.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, commissionRate: rate } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  },

  assignUserToBranch: (userId: string, branchId: string) => {
    const users = businessRules.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, branchId } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  },

  getCurrentUser: (): MerchantUser => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return initialUsers[0]; // Padrão dono para o protótipo
    return JSON.parse(data);
  },

  setCurrentUser: (user: MerchantUser) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  generateWithdrawalCode: () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  getOrderExtra: (orderId: string): OrderWithCode | null => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS_EXTRA);
    if (!data) return null;
    const extras: OrderWithCode[] = JSON.parse(data);
    return extras.find(e => e.id === orderId) || null;
  },

  saveOrderExtra: (orderId: string, extra: Partial<OrderWithCode>) => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS_EXTRA);
    let extras: OrderWithCode[] = data ? JSON.parse(data) : [];
    const index = extras.findIndex(e => e.id === orderId);
    
    if (index >= 0) {
      extras[index] = { ...extras[index], ...extra };
    } else {
      extras.push({ 
        id: orderId, 
        withdrawalCode: extra.withdrawalCode || businessRules.generateWithdrawalCode(),
        status: extra.status || 'Pendente' 
      });
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS_EXTRA, JSON.stringify(extras));
  },

  // Financeiro
  calculateFinancials: (user: MerchantUser, orders: any[]) => {
    // Mantém a lógica de marketplace para lojistas
    const isOwner = user.role === 'owner';
    const userBranchId = user.branchId;
    const relevantOrders = isOwner ? orders : orders.filter(o => o.branchId === userBranchId);
    
    let totalBilled = 0;
    let totalCashback = 0;
    let managerCommission = 0;
    
    relevantOrders.forEach(o => {
      if (o.status === 'Concluído') {
        totalBilled += o.amount;
        const cashback = o.cashbackAmount || (o.amount * 0.05);
        totalCashback += cashback;
        if (!isOwner) {
          const rate = (user.commissionRate || 30) / 100;
          managerCommission += o.amount * rate;
        }
      }
    });

    return {
      totalBilled,
      totalCashback,
      netBilled: totalBilled - totalCashback,
      managerCommission,
      balance: isOwner ? (totalBilled - totalCashback) : managerCommission
    };
  },

  // Afiliados & Escritório Virtual (Regras CAM - Passageiros)
  getAffiliateStats: (userId: string) => {
    // Simulação baseada no PRD (Total 1.5% por nível acumulado)
    const monthlyBonus = 450.20; // 0.75% por nível
    const annualBonus = 120.50;  // 0.50% por nível (Anual Fidelidade)
    const walletBonus = 55.40;   // 0.25% por nível (Carteira Digital)
    
    const gross = monthlyBonus + annualBonus + walletBonus;
    const maintenanceFee = gross * 0.10; // Taxa de manutenção 10%

    return {
      monthlyBonus,
      annualBonus,
      walletBonus,
      maintenanceFee,
      totalEarnings: gross - maintenanceFee,
      availableBalance: 870.30,
      cashbackBalance: 54.20,
      consumptionCount: 3, // Realizou 3 dos 4 consumos necessários
      isEligible: false // Precisa de mais um consumo para liberar saldo
    };
  },

  getAffiliateNetwork: (userId: string) => {
    return [
      { id: 'n1', name: 'Marcos Silva', level: 1, joinedDate: '10/03/2024', status: 'Ativo', earnings: 150.00, spillover: true },
      { id: 'n2', name: 'Ana Souza', level: 1, joinedDate: '12/03/2024', status: 'Ativo', earnings: 85.50, spillover: false },
      { id: 'n3', name: 'Pedro Lima', level: 2, joinedDate: '15/03/2024', status: 'Inativo', earnings: 0, spillover: true },
      { id: 'n4', name: 'Carla Dias', level: 2, joinedDate: '18/03/2024', status: 'Ativo', earnings: 42.00, spillover: true },
    ];
  },

  getEcosystemActivity: (userId: string) => {
    return [
      { id: 'act1', type: 'Urba Moby', description: 'Viagem ao Centro', date: 'Hoje, 09:30', amount: 22.50, points: 5 },
      { id: 'act2', type: 'Marketplace', description: 'Compra de Eletrônico', date: 'Ontem, 14:20', amount: 450.00, points: 45 },
      { id: 'act3', type: 'Urba Food', description: 'Almoço Executivo', date: '19 Mar, 12:45', amount: 35.00, points: 3 },
    ];
  },

  getAffiliateTree: (userId: string) => {
    // Simulação de estrutura em árvore para a genealogia
    return {
      id: userId,
      name: 'Ricardo Oliveira',
      level: 1,
      totalEarnings: 870.30,
      children: [
        {
          id: 'n1',
          name: 'Marcos Silva',
          level: 2,
          earnings: 150.00,
          children: [
            { id: 'n5', name: 'Juliana Costa', level: 3, earnings: 45.00, children: [] },
            { id: 'n6', name: 'Fabio Junior', level: 3, earnings: 12.00, children: [] },
          ]
        },
        {
          id: 'n2',
          name: 'Ana Souza',
          level: 2,
          earnings: 85.50,
          children: [
            { id: 'n7', name: 'Carla Dias', level: 3, earnings: 42.00, children: [] },
          ]
        },
        {
          id: 'n8',
          name: 'Bruno Meira',
          level: 2,
          earnings: 0,
          children: []
        }
      ]
    };
  },

  getAffiliateLinks: (userId: string) => {
    const baseUrl = 'urbashop.com.br/invite/';
    return [
      { id: 'l1', name: 'Link Geral', url: baseUrl + 'user123', description: 'Convidar novos usuários' },
      { id: 'l2', name: 'Link Lojista', url: baseUrl + 'lojista/user123', description: 'Convidar novos parceiros lojistas' },
    ];
  }
};
