// --- START OF FILE server.js ---

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken'); // Importa o JWT
const bcrypt = require("bcrypt");
const rateLimit = require('express-rate-limit'); // Importa o rate limiter

const db = require("./db");
const app = require("./app.js");
const authMiddleware = require('./authMiddleware');
const isAdminMiddleware = require('./isAdminMiddleware'); 
const { sendContactEmail } = require('./email-service'); 

// --- CONFIGURAÇÃO DO LIMITADOR DE REQUISIÇÕES (RATE LIMITER) ---
const contactLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, 
	max: 3, 
	message: { message: 'Muitas tentativas de envio de e-mail deste IP. Tente novamente após uma hora.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});


// --- Rota de Login ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }

    try {
        const user = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
        if (!user) {
            return res.status(401).json({ message: "Email ou senha inválidos" });
        }
        

        const payload = { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin }; 
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({ 
            message: "Login bem-sucedido", 
            token: token
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// --- Rota de Registro ---
app.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, senha e nome de usuário são obrigatórios" });
    }

    try {
        const existingUser = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return res.status(400).json({ message: "Email já registrado" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // AQUI USAMOS A RESPOSTA DA FUNÇÃO runAsync (que já tem ID e is_admin)
        const newUserRecord = await db.runAsync( 
            "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
            [email, username, hashedPassword]
        );
        
        // Não é mais necessário o db.getAsync, usamos o newUserRecord
        const payload = { id: newUserRecord.id, email: newUserRecord.email, username: newUserRecord.username, is_admin: newUserRecord.is_admin }; 
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({ 
            message: "Usuário registrado com sucesso",
            token: token
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// --- ROTA PROTEGIDA DE EXEMPLO ---
app.get('/profile', authMiddleware, (req, res) => {
    res.status(200).json({
        message: "Acesso autorizado",
        user: req.user
    });
});

// --- ROTA DE ADMINISTRAÇÃO ---
// --- ROTA DE ADMINISTRAÇÃO ---
app.get('/admin/dashboard', isAdminMiddleware, async (req, res) => {
    try {
        // Busca dados reais do Supabase
        const menuItems = await db.getAllAsync("SELECT * FROM menu_items");
        const promotions = await db.getAllAsync("SELECT * FROM promotions");
        
        res.status(200).json({
            message: "Acesso Admin autorizado",
            user: req.user,
            dashboardData: {
                menuItemsCount: menuItems.length,
                promotionsCount: promotions.length,
            }
        });
    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        res.status(500).json({ message: "Erro ao carregar dashboard." });
    }
});

// --- CRUD DE ITENS DO MENU ---

// READ ALL (Público - para a página menu.html)
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await db.getAllAsync("SELECT * FROM menu_items"); 
        res.status(200).json(menuItems);
    } catch (error) {
        console.error("Erro ao buscar menu:", error);
        res.status(500).json({ message: "Erro ao buscar itens do menu." });
    }
});

// READ FEATURED (Público - para a página index.html)
app.get('/api/menu/featured', async (req, res) => {
    try {
        const featuredItems = await db.getAllAsync("SELECT * FROM menu_items WHERE is_featured = TRUE"); 
        res.status(200).json(featuredItems);
    } catch (error) {
        console.error("Erro ao buscar destaques:", error);
        res.status(500).json({ message: "Erro ao buscar itens em destaque." });
    }
});

// CREATE (Apenas Admin)
app.post('/api/menu', isAdminMiddleware, async (req, res) => {
    const { name, description, price, category, image, discount_badge } = req.body;
    if (!name || !price || !category || !image) {
        return res.status(400).json({ message: "Nome, preço, categoria e imagem são obrigatórios." });
    }
    try {
        const newMenuItem = await db.runAsync(
            "INSERT INTO menu_items (name, description, price, category, image, discount_badge) VALUES (?, ?, ?, ?, ?, ?)",
            [name, description || '', price, category, image, discount_badge || '']
        );
        res.status(201).json({ message: "Item de menu adicionado com sucesso!", item: newMenuItem });
    } catch (error) {
        console.error("Erro ao adicionar item do menu:", error);
        res.status(500).json({ message: "Erro ao adicionar item do menu." });
    }
});

// UPDATE (Apenas Admin - Usado para Destaques)
app.put('/api/menu/:id', isAdminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { is_featured, discount_badge } = req.body;
    
    const updateData = {};
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (discount_badge !== undefined) updateData.discount_badge = discount_badge;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum campo de destaque fornecido para atualização." });
    }

    try {
        const updatedItem = await db.updateAsync('menu_items', id, updateData);
        res.status(200).json({ message: `Item ID ${id} atualizado com sucesso.`, item: updatedItem });
    } catch (error) {
        console.error("Erro ao atualizar item do menu:", error);
        res.status(404).json({ message: error.message || "Item não encontrado ou erro na atualização." });
    }
});

// DELETE (Apenas Admin)
app.delete('/api/menu/:id', isAdminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await db.deleteAsync('menu_items', id);
        res.status(200).json({ message: `Item ID ${id} excluído com sucesso.` });
    } catch (error) {
        console.error("Erro ao excluir item do menu:", error);
        res.status(404).json({ message: "Item não encontrado ou erro na exclusão." });
    }
});


// --- ROTA PARA ENVIAR E-MAIL DE CONTATO ---
app.post('/contact', contactLimiter, async (req, res) => {
    const { user_name: name, user_email: email, user_phone: phone, user_subject: subject, user_message: message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        await sendContactEmail({ name, email, phone, subject, message });
        return res.status(200).json({ message: "Mensagem enviada com sucesso! Agradecemos o contato." });
    } catch (error) {
        console.error("Erro na rota /contact:", error);
        return res.status(500).json({ message: "Ocorreu um erro no servidor ao tentar enviar a mensagem." });
    }
});

// ============================================
// ADICIONE ESTAS ROTAS NO server.js
// (depois das rotas de promoções e antes da rota /contact)
// ============================================

// --- ROTAS DE CARRINHO (PROTEGIDAS) ---

// GET: Buscar carrinho do usuário logado
app.get('/api/cart', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItems = await db.getCartAsync(userId);
        res.status(200).json(cartItems);
    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        res.status(500).json({ message: 'Erro ao buscar carrinho.' });
    }
});

// POST: Adicionar item ao carrinho
app.post('/api/cart', authMiddleware, async (req, res) => {
    const { menu_item_id, quantity } = req.body;
    
    if (!menu_item_id) {
        return res.status(400).json({ message: 'ID do item é obrigatório.' });
    }

    try {
        const userId = req.user.id;
        const qty = quantity || 1;
        
        await db.addToCartAsync(userId, menu_item_id, qty);
        
        // Retorna o carrinho atualizado
        const updatedCart = await db.getCartAsync(userId);
        res.status(200).json({ 
            message: 'Item adicionado ao carrinho!',
            cart: updatedCart 
        });
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        res.status(500).json({ message: 'Erro ao adicionar item ao carrinho.' });
    }
});

// PUT: Atualizar quantidade de item no carrinho
app.put('/api/cart/:cart_item_id', authMiddleware, async (req, res) => {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
        return res.status(400).json({ message: 'Quantidade é obrigatória.' });
    }

    try {
        await db.updateCartItemAsync(parseInt(cart_item_id), quantity);
        
        // Retorna o carrinho atualizado
        const updatedCart = await db.getCartAsync(req.user.id);
        res.status(200).json({ 
            message: 'Carrinho atualizado!',
            cart: updatedCart 
        });
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        res.status(500).json({ message: 'Erro ao atualizar item do carrinho.' });
    }
});

// DELETE: Remover item do carrinho
app.delete('/api/cart/:cart_item_id', authMiddleware, async (req, res) => {
    const { cart_item_id } = req.params;

    try {
        await db.removeFromCartAsync(parseInt(cart_item_id));
        
        // Retorna o carrinho atualizado
        const updatedCart = await db.getCartAsync(req.user.id);
        res.status(200).json({ 
            message: 'Item removido do carrinho!',
            cart: updatedCart 
        });
    } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
        res.status(500).json({ message: 'Erro ao remover item do carrinho.' });
    }
});

// DELETE: Limpar todo o carrinho
app.delete('/api/cart', authMiddleware, async (req, res) => {
    try {
        await db.clearCartAsync(req.user.id);
        res.status(200).json({ message: 'Carrinho limpo com sucesso!' });
    } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
        res.status(500).json({ message: 'Erro ao limpar carrinho.' });
    }
});
// ============================================
// SUBSTITUA a rota GET '/api/promotions' no server.js
// (a rota antiga exigia admin, a nova é pública)
// ============================================

// READ PROMOTIONS (PÚBLICO - para a home e página de promoções)
app.get('/api/promotions', async (req, res) => {
    try {
        const promotions = await db.getAllAsync("SELECT * FROM promotions"); 
        res.status(200).json(promotions);
    } catch (error) {
        console.error("Erro ao buscar promoções:", error);
        res.status(500).json({ message: "Erro ao buscar promoções." });
    }
});

// ============================================
// MANTENHA as rotas de ADMIN (POST e DELETE) como estão:
// ============================================

// CREATE PROMOTION (Apenas Admin)
app.post('/api/promotions', isAdminMiddleware, async (req, res) => {
    const { title, description, price, image } = req.body;
    if (!title || !description || !price || !image) {
        return res.status(400).json({ message: "Título, descrição, preço e imagem são obrigatórios para a promoção." });
    }
    try {
        const newPromotion = await db.runAsync(
            "INSERT INTO promotions (title, description, price, image) VALUES (?, ?, ?, ?)",
            [title, description, price, image]
        );
        res.status(201).json({ message: "Promoção adicionada com sucesso!", item: newPromotion });
    } catch (error) {
        console.error("Erro ao adicionar promoção:", error);
        res.status(500).json({ message: "Erro ao adicionar promoção." });
    }
});

// DELETE PROMOTION (Apenas Admin)
app.delete('/api/promotions/:id', isAdminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await db.deleteAsync('promotions', id);
        res.status(200).json({ message: `Promoção ID ${id} excluída com sucesso.` });
    } catch (error) {
        console.error("Erro ao excluir promoção:", error);
        res.status(404).json({ message: "Promoção não encontrada ou erro na exclusão." });
    }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// --- END OF FILE server.js ---