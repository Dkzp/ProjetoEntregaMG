// --- START OF FILE db.js ---
// Importa o cliente Supabase e o dotenv para garantir que as variáveis de ambiente sejam carregadas
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require("bcrypt");

// Configuração do Supabase, lendo as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifica se as credenciais foram fornecidas no .env
if (!supabaseUrl || !supabaseKey) {
    console.warn("AVISO: Variáveis Supabase não configuradas. Usando dados MOCKADOS para CRUD de Admin.");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;


// --- MOCK DE DADOS PARA SIMULAÇÃO ---
const HASHED_PASSWORD_123456 = '$2b$10$v7KzE.yS1QWpG5gX7y8U0O9p8t6E5y3WqE8H.N4c'; 

let mockUsers = [
    // Usuários mockados permanecem para o login admin/teste
    { id: 1, email: 'admin@frydays.com', username: 'Admin Fryday', password: HASHED_PASSWORD_123456, is_admin: true }, 
    { id: 2, email: 'user@teste.com', username: 'Usuário Teste', password: HASHED_PASSWORD_123456, is_admin: false }
];
let mockMenuItems = [
    { id: 1, name: 'Clássico Fryday\'s', description: 'Pão brioche, burger bovino 150g, queijo cheddar, alface, tomate e molho especial da casa.', price: 25.90, category: 'hamburgueres', image: 'https://i.ibb.co/pWcQ5Nt/burger-card.png', is_featured: true, discount_badge: '50% OFF' }, 
    { id: 2, name: 'Duplo Bacon Paradise', description: 'Pão australiano, 2x burgers bovinos 100g, dobro de queijo cheddar, bacon crocante e cebola caramelizada.', price: 32.50, category: 'hamburgueres', image: 'https://i.ibb.co/yqM0kXk/promo-double-burger.png', is_featured: false, discount_badge: '' }, 
    { id: 3, name: 'Pepperoni Clássica', description: 'Molho de tomate artesanal, muçarela de primeira e fatias generosas de pepperoni.', price: 45.00, category: 'pizzas', image: 'https://i.ibb.co/qCB7P9k/pizza-card.png', is_featured: true, discount_badge: '' }, 
    { id: 4, name: 'Hot Dog Delícia', description: 'Salsicha especial, molho da casa, purê de batata, milho e queijo ralado.', price: 15.00, category: 'lanches', image: 'https://i.ibb.co/bQ489wV/hotdog-card.png', is_featured: true, discount_badge: 'Combo!' }, 
    { id: 5, name: 'Fritas Crocantes', description: 'Batata frita tradicional, extra crocante e com tempero especial.', price: 12.00, category: 'acompanhamentos', image: 'https://i.ibb.co/fC9r4G6/fries-card.png', is_featured: true, discount_badge: '' }, 
    { id: 6, name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná, Fanta (350ml)', price: 5.00, category: 'bebidas', image: 'https://via.placeholder.com/150x150/3498db/ffffff?text=Refrigerante', is_featured: false, discount_badge: '' }, 
];
let mockPromotions = [
    { id: 1, title: 'DOIS SUPER SMASH BURGERS', description: 'Leve dois Smash Burgers por um preço inacreditável!', price: 29.99, image: 'https://i.ibb.co/yqM0kXk/promo-double-burger.png', promo_type: 'highlight_1' }, 
    { id: 2, title: 'Fritas de Brinde', description: 'Em pedidos acima de R$ 40, ganhe uma batata frita de brinde!', price: 0, image: 'https://i.ibb.co/fC9r4G6/fries-card.png', promo_type: 'highlight_2' }, 
    { id: 3, title: 'Hot Dog Day', description: 'Todo sabor do nosso hot dog especial com precinho camarada!', price: 15.00, image: 'https://i.ibb.co/bQ489wV/hotdog-card.png', promo_type: 'highlight_3' }, 
    { id: 4, title: 'Combo Pizza Família', description: '1 Pizza Grande (sabores selecionados) + 1 Refri 2L. De R$ 65,00 por R$ 55,00', price: 55.00, image: 'https://via.placeholder.com/300x180/e74c3c/ffffff?text=Pizza+G+Refri', promo_type: 'promo_page' },
];

let nextUserId = 3;
let nextMenuItemId = 7;
let nextPromotionId = 5;


const db = {
    /**
     * Função para buscar um único registro (equivalente ao db.get do SQLite).
     * Esta função é crucial para o LOGIN e para verificar se o EMAIL JÁ EXISTE.
     */
    getAsync: async (query, params) => {
        if (query.toUpperCase().startsWith('SELECT')) {
            const email = params[0];

            // 1. Tenta buscar o usuário no Supabase real
            if (supabase && query.toUpperCase().includes('FROM USERS')) {
                 const { data, error } = await supabase
                     .from('users')
                     .select('id, email, password, username, is_admin') // Seleciona campos para login
                     .eq('email', email)
                     .maybeSingle();
 
                 if (data) {
                     // Adiciona is_admin: false se não existir no DB (para evitar crashs)
                     return { ...data, is_admin: data.is_admin || false }; 
                 }
                 
                 // Se deu erro ou não encontrou, continua para o mock (para o admin@frydays.com)
            }
            
            // 2. Se falhou na busca real, busca nos usuários mockados (apenas admin/teste)
            if (query.toUpperCase().includes('FROM USERS')) {
                const user = mockUsers.find(u => u.email === email);
                if (user) return { ...user };
            }
        }
        
        console.error('Query não suportada no adaptador Supabase (getAsync):', query);
        // Não lançar erro se não for usuário, retorna null
        return null;
    },

    /**
     * Função para executar uma ação, como INSERT (equivalente ao db.run do SQLite).
     */
    runAsync: async (query, params) => {
        if (query.toUpperCase().startsWith('INSERT')) {
            const tableMatch = query.match(/INTO\s+(\w+)/i);
            const columnsMatch = query.match(/\((.+?)\)/);
            
            if (tableMatch && columnsMatch) {
                const table = tableMatch[1];
                const columns = columnsMatch[1].split(',').map(c => c.trim());
                
                const record = {};
                columns.forEach((col, index) => {
                    record[col] = params[index];
                });
                
                // LÓGICA CORRIGIDA PARA INSERT DE USUÁRIOS NO SUPABASE REAL
                if (table.toUpperCase() === 'USERS' && supabase) {
                     // O objeto record já tem email, username, password
                     // Adicione is_admin manualmente (false por padrão)
                     record.is_admin = false; 

                     const { data, error } = await supabase
                        .from('users')
                        .insert(record)
                        .select('id, email, username, is_admin'); // Seleciona o que é necessário para o token
                     
                    if (error) {
                        console.error("Erro no INSERT de usuário no Supabase:", error.message);
                        throw error;
                    }
                    // Retorna o primeiro elemento do array de dados inseridos
                    return data[0]; 
                }

                // Lógica de mock para tabelas de Admin
                if (table.toUpperCase() === 'MENU_ITEMS') {
                    record.id = nextMenuItemId++;
                    record.price = parseFloat(record.price);
                    record.is_featured = false; 
                    record.discount_badge = record.discount_badge || '';
                    mockMenuItems.push(record);
                    return { ...record };
                }
                
                if (table.toUpperCase() === 'PROMOTIONS') {
                    record.id = nextPromotionId++;
                    record.price = parseFloat(record.price);
                    mockPromotions.push(record);
                    return { ...record };
                }
            }
        }
        console.error('Query não suportada no adaptador Supabase (runAsync):', query);
        throw new Error('Query não suportada no adaptador Supabase');
    },
    
    /**
     * Função para buscar múltiplos registros (simulando db.all do SQLite).
     */
    getAllAsync: async (query) => {
        if (query.toUpperCase().includes('FROM MENU_ITEMS')) {
             if (query.toUpperCase().includes('WHERE IS_FEATURED = TRUE')) { 
                return mockMenuItems.filter(item => item.is_featured === true);
            }
            return mockMenuItems;
        }
        if (query.toUpperCase().includes('FROM PROMOTIONS')) {
            return mockPromotions;
        }
        console.error('Query não suportada no adaptador Supabase (getAllAsync):', query);
        throw new Error('Query não suportada no adaptador Supabase');
    },
    
    /**
     * Simula UPDATE, necessário para o is_featured
     */
    updateAsync: async (table, id, data) => {
        const parsedId = parseInt(id);
        if (table.toUpperCase() === 'MENU_ITEMS') {
            const index = mockMenuItems.findIndex(item => item.id === parsedId);
            if (index > -1) {
                if (data.is_featured !== undefined) {
                    data.is_featured = data.is_featured === 'true' || data.is_featured === true;
                }
                mockMenuItems[index] = { ...mockMenuItems[index], ...data };
                return mockMenuItems[index];
            }
            throw new Error('Item de Menu não encontrado para atualização.');
        }
         
        throw new Error('Tabela não suportada para atualização.');
    },

    /**
     * Simula DELETE
     */
    deleteAsync: async (table, id) => {
        const parsedId = parseInt(id);

        if (table.toUpperCase() === 'MENU_ITEMS') {
            const initialLength = mockMenuItems.length;
            mockMenuItems = mockMenuItems.filter(item => item.id !== parsedId);
            if (mockMenuItems.length === initialLength) throw new Error('Item de Menu não encontrado.');
            return { message: 'Item excluído' };
        }
        if (table.toUpperCase() === 'PROMOTIONS') {
            const initialLength = mockPromotions.length;
            mockPromotions = mockPromotions.filter(item => item.id !== parsedId);
            if (mockPromotions.length === initialLength) throw new Error('Promoção não encontrada.');
            return { message: 'Promoção excluída' };
        }
        throw new Error('Tabela não suportada para exclusão.');
    }
};

db.mockUsers = mockUsers;
db.mockMenuItems = mockMenuItems;
db.mockPromotions = mockPromotions;

module.exports = db;
// --- END OF FILE db.js ---