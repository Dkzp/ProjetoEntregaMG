// --- db.js COMPLETO COM SUPORTE A CARRINHO (CORRIGIDO) ---
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ ERRO: Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const db = {
    /**
     * Buscar um único registro (usado no LOGIN)
     */
    getAsync: async (query, params) => {
        if (query.toUpperCase().includes('FROM USERS')) {
            const email = params[0];
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (error) {
                console.error('Erro ao buscar usuário:', error);
                return null;
            }
            return data;
        }

        throw new Error('Query não suportada em getAsync: ' + query);
    },

    /**
     * Inserir um novo registro (usado no REGISTER e CREATE)
     */
    runAsync: async (query, params) => {
        if (query.toUpperCase().startsWith('INSERT')) {
            const tableMatch = query.match(/INTO\s+(\w+)/i);
            const columnsMatch = query.match(/\((.+?)\)/);

            if (!tableMatch || !columnsMatch) {
                throw new Error('Query INSERT mal formatada');
            }

            const table = tableMatch[1];
            const columns = columnsMatch[1].split(',').map(c => c.trim());

            const record = {};
            columns.forEach((col, index) => {
                record[col] = params[index];
            });

            // INSERT em USERS
            if (table.toLowerCase() === 'users') {
                record.is_admin = false;

                const { data, error } = await supabase
                    .from('users')
                    .insert(record)
                    .select('id, email, username, is_admin')
                    .single();

                if (error) {
                    console.error('Erro ao inserir usuário:', error);
                    throw error;
                }
                return data;
            }

            // INSERT em MENU_ITEMS
            if (table.toLowerCase() === 'menu_items') {
                record.price = parseFloat(record.price);
                record.is_featured = false;
                record.discount_badge = record.discount_badge || '';

                const { data, error } = await supabase
                    .from('menu_items')
                    .insert(record)
                    .select()
                    .single();

                if (error) {
                    console.error('Erro ao inserir menu item:', error);
                    throw error;
                }
                return data;
            }

            // INSERT em PROMOTIONS
            if (table.toLowerCase() === 'promotions') {
                record.price = parseFloat(record.price);

                const { data, error } = await supabase
                    .from('promotions')
                    .insert(record)
                    .select()
                    .single();

                if (error) {
                    console.error('Erro ao inserir promoção:', error);
                    throw error;
                }
                return data;
            }
        }

        throw new Error('Query não suportada em runAsync: ' + query);
    },

    /**
     * Buscar múltiplos registros (usado para listar MENU e PROMOÇÕES)
     */
    getAllAsync: async (query) => {
        // MENU ITEMS - TODOS
        if (query.toUpperCase().includes('FROM MENU_ITEMS')) {
            let queryBuilder = supabase.from('menu_items').select('*');

            // MENU ITEMS - APENAS FEATURED
            if (query.toUpperCase().includes('WHERE IS_FEATURED = TRUE')) {
                queryBuilder = queryBuilder.eq('is_featured', true);
            }

            const { data, error } = await queryBuilder;

            if (error) {
                console.error('Erro ao buscar menu items:', error);
                throw error;
            }
            return data || [];
        }

        // PROMOTIONS
        if (query.toUpperCase().includes('FROM PROMOTIONS')) {
            const { data, error } = await supabase
                .from('promotions')
                .select('*');

            if (error) {
                console.error('Erro ao buscar promoções:', error);
                throw error;
            }
            return data || [];
        }

        throw new Error('Query não suportada em getAllAsync: ' + query);
    },

    /**
     * Atualizar um registro (usado para mudar IS_FEATURED e DISCOUNT_BADGE)
     */
    updateAsync: async (table, id, data) => {
        const parsedId = parseInt(id);

        if (table.toLowerCase() === 'menu_items') {
            // Converter is_featured para boolean se necessário
            if (data.is_featured !== undefined) {
                data.is_featured = data.is_featured === 'true' || data.is_featured === true;
            }

            const { data: updated, error } = await supabase
                .from('menu_items')
                .update(data)
                .eq('id', parsedId)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar menu item:', error);
                throw new Error('Item não encontrado ou erro na atualização.');
            }
            return updated;
        }

        throw new Error('Tabela não suportada para atualização: ' + table);
    },

    /**
     * Deletar um registro
     */
    /**
 * Deletar um registro (COM LOGS DE DEBUG)
 */
deleteAsync: async (table, id) => {
    console.log('🗑️ deleteAsync chamado:', { table, id, tipo: typeof id });
    
    const parsedId = parseInt(id);
    console.log('🔢 ID parseado:', parsedId);

    if (isNaN(parsedId)) {
        throw new Error('ID inválido: ' + id);
    }

    if (table.toLowerCase() === 'menu_items') {
        console.log('📋 Tentando deletar menu item ID:', parsedId);
        
        // Primeiro verifica se o item existe
        const { data: existingItem, error: checkError } = await supabase
            .from('menu_items')
            .select('id, name')
            .eq('id', parsedId)
            .single();

        console.log('✅ Item encontrado:', existingItem);
        console.log('❌ Erro ao buscar:', checkError);

        if (checkError || !existingItem) {
            throw new Error('Item não encontrado no banco de dados.');
        }

        // Agora deleta
        const { data, error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', parsedId)
            .select(); // Adiciona select() para retornar o item deletado

        console.log('🔥 Resultado do delete:', { data, error });

        if (error) {
            console.error('❌ Erro ao deletar menu item:', error);
            throw new Error('Erro ao deletar: ' + error.message);
        }

        console.log('✅ Item deletado com sucesso:', data);
        return { message: 'Item excluído', deleted: data };
    }

    if (table.toLowerCase() === 'promotions') {
        console.log('🎉 Tentando deletar promoção ID:', parsedId);
        
        // Primeiro verifica se existe
        const { data: existingPromo, error: checkError } = await supabase
            .from('promotions')
            .select('id, title')
            .eq('id', parsedId)
            .single();

        console.log('✅ Promoção encontrada:', existingPromo);
        console.log('❌ Erro ao buscar:', checkError);

        if (checkError || !existingPromo) {
            throw new Error('Promoção não encontrada no banco de dados.');
        }

        const { data, error } = await supabase
            .from('promotions')
            .delete()
            .eq('id', parsedId)
            .select();

        console.log('🔥 Resultado do delete:', { data, error });

        if (error) {
            console.error('❌ Erro ao deletar promoção:', error);
            throw new Error('Erro ao deletar: ' + error.message);
        }

        console.log('✅ Promoção deletada com sucesso:', data);
        return { message: 'Promoção excluída', deleted: data };
    }

    throw new Error('Tabela não suportada para exclusão: ' + table);
},

    // ========== FUNÇÕES DE CARRINHO (CORRIGIDAS) ==========

    /**
     * Buscar carrinho do usuário (COM JOIN MANUAL)
     */
    getCartAsync: async (userId) => {
        // 1. Busca itens do carrinho
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select('id, menu_item_id, quantity')
            .eq('user_id', userId);

        if (cartError) {
            console.error('Erro ao buscar carrinho:', cartError);
            throw cartError;
        }

        if (!cartItems || cartItems.length === 0) {
            return [];
        }

        // 2. Busca os detalhes dos menu_items manualmente
        const menuItemIds = cartItems.map(item => item.menu_item_id);
        
        const { data: menuItems, error: menuError } = await supabase
            .from('menu_items')
            .select('*')
            .in('id', menuItemIds);

        if (menuError) {
            console.error('Erro ao buscar menu items:', menuError);
            throw menuError;
        }

        // 3. Combina os dados
        return cartItems.map(cartItem => {
            const menuItem = menuItems.find(m => m.id === cartItem.menu_item_id);
            return {
                cart_id: cartItem.id,
                id: menuItem.id,
                name: menuItem.name,
                description: menuItem.description,
                price: parseFloat(menuItem.price),
                image: menuItem.image,
                category: menuItem.category,
                quantity: cartItem.quantity
            };
        });
    },

    /**
     * Adicionar item ao carrinho (ou atualizar quantidade se já existe)
     */
    addToCartAsync: async (userId, menuItemId, quantity = 1) => {
        // Verifica se o item já existe no carrinho
        const { data: existing, error: checkError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('menu_item_id', menuItemId)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Erro ao verificar item:', checkError);
            throw checkError;
        }

        if (existing) {
            // Atualiza a quantidade
            const { data, error } = await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar quantidade:', error);
                throw error;
            }
            return data;
        } else {
            // Insere novo item
            const { data, error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: userId,
                    menu_item_id: menuItemId,
                    quantity: quantity
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao inserir no carrinho:', error);
                throw error;
            }
            return data;
        }
    },

    /**
     * Atualizar quantidade de item no carrinho
     */
    updateCartItemAsync: async (cartItemId, quantity) => {
        if (quantity <= 0) {
            // Se quantidade é 0 ou negativa, remove o item
            return await db.removeFromCartAsync(cartItemId);
        }

        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItemId)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar item do carrinho:', error);
            throw error;
        }
        return data;
    },

    /**
     * Remover item do carrinho
     */
    removeFromCartAsync: async (cartItemId) => {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) {
            console.error('Erro ao remover do carrinho:', error);
            throw error;
        }
        return { message: 'Item removido do carrinho' };
    },

    /**
     * Limpar todo o carrinho do usuário
     */
    clearCartAsync: async (userId) => {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Erro ao limpar carrinho:', error);
            throw error;
        }
        return { message: 'Carrinho limpo' };
    }
};

module.exports = db;