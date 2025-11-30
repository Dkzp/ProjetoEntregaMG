document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('auth-message');

    const showMessage = (message, type = 'error') => {
        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
    };

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showMessage('Por favor, preencha o email e a senha.');
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao tentar fazer login.');
            }
            
            // Guarda o token
            localStorage.setItem('token', result.token);

            showMessage('Login bem-sucedido!', 'success');
            
            // Aguarda um pouco para carregar o cart.js se necessário
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Migra carrinho de sessionStorage para o banco
            if (window.cart) {
                await window.cart.migrateSessionToDatabase();
            }
            
            // Redireciona
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            showMessage(error.message);
        }
    });
});