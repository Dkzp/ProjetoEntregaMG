// --- START OF FILE isAdminMiddleware.js ---
const jwt = require('jsonwebtoken');
const db = require('./db'); 

const isAdminMiddleware = async (req, res, next) => {
    // 1. Lógica para pegar o token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, userPayload) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido ou expirado." });
        }
        
        // 2. Busca o usuário no DB para verificar o status de Admin
        try {
             // O payload do token tem o email. Usamos db.getAsync.
            const user = await db.getAsync("SELECT * FROM users WHERE email = ?", [userPayload.email]);
            
            if (!user || user.is_admin !== true) {
                return res.status(403).json({ message: "Acesso negado. Usuário não é administrador." });
            }

            // 3. Se for admin, anexa os dados e continua
            req.user = user; 
            next();

        } catch (error) {
            console.error("Erro na verificação de admin:", error);
            return res.status(500).json({ message: "Erro interno do servidor ao verificar permissões." });
        }
    });
};

module.exports = isAdminMiddleware;
// --- END OF FILE isAdminMiddleware.js ---