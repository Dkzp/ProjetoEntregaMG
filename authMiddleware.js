const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Pega o token do cabeçalho da requisição (Authorization: Bearer TOKEN)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega só a parte do token

    if (token == null) {
        // Se não há token, acesso negado
        return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
    }

    // Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Se o token for inválido ou expirado
            return res.status(403).json({ message: "Token inválido ou expirado." });
        }

        // Se o token for válido, anexa os dados do usuário ao objeto 'req'
        req.user = user;
        
        // Continua para a próxima função (a rota em si)
        next();
    });
};

module.exports = authMiddleware;