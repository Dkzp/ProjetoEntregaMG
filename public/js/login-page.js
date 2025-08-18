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
            
            // --- GUARDA O TOKEN ---
            localStorage.setItem('token', result.token); // Guarda o token no armazenamento local do navegador

            showMessage('Login bem-sucedido! Redirecionando...', 'success');
            
            // Redireciona para a página principal ou para uma página de perfil
            setTimeout(() => {
                window.location.href = 'index.html'; // Ou 'profile.html' se você criar uma
            }, 1500);

        } catch (error) {
            showMessage(error.message);
        }
    });
});