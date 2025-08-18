// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken'); // Importa o JWT
const bcrypt = require("bcrypt");
const rateLimit = require('express-rate-limit'); // Importa o rate limiter

const db = require("./db");
const app = require("./app.js");
const authMiddleware = require('./authMiddleware');
const { sendContactEmail } = require('./email-service'); // Importa nossa função de e-mail

// --- CONFIGURAÇÃO DO LIMITADOR DE REQUISIÇÕES (RATE LIMITER) ---
// Define que cada IP pode fazer no máximo 3 requisições a cada hora na rota de contato.
const contactLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hora em milissegundos
	max: 3, // Máximo de 3 requisições
	message: { message: 'Muitas tentativas de envio de e-mail deste IP. Tente novamente após uma hora.' },
    standardHeaders: true, // Adiciona headers de rate limit na resposta
    legacyHeaders: false, // Desativa os headers legados (X-RateLimit-*)
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

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Email ou senha inválidos" });
        }

        const payload = { id: user.id, email: user.email, username: user.username };
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
        
        await db.runAsync(
            "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
            [email, username, hashedPassword]
        );
        
        const newUser = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
        const payload = { id: newUser.id, email: newUser.email, username: newUser.username };
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

// --- NOVA ROTA PARA ENVIAR E-MAIL DE CONTATO ---
// Aplicamos o middleware de rate limit 'contactLimiter' apenas a esta rota.
app.post('/contact', contactLimiter, async (req, res) => {
    const { user_name: name, user_email: email, user_phone: phone, user_subject: subject, user_message: message } = req.body;

    // Validação simples dos campos
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        // Usa a função do nosso módulo de e-mail para enviar o e-mail
        await sendContactEmail({ name, email, phone, subject, message });
        return res.status(200).json({ message: "Mensagem enviada com sucesso! Agradecemos o contato." });
    } catch (error) {
        console.error("Erro na rota /contact:", error);
        return res.status(500).json({ message: "Ocorreu um erro no servidor ao tentar enviar a mensagem." });
    }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});