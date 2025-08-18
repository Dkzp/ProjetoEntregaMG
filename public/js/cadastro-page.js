document.addEventListener('DOMContentLoaded', () => {
    const createAccountContainer = document.getElementById('createAccountContainer');
    const registrationDetailsContainer = document.getElementById('registrationDetailsContainer');
    const createAccountForm = document.getElementById('createAccountForm');
    const registrationDetailsForm = document.getElementById('registrationDetailsForm');
    const backToCreateAccountBtn = document.getElementById('backToCreateAccount');
    const authMessage = document.getElementById('auth-message');
    let registrationData = {};

    const showMessage = (message, type = 'error') => {
        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
    };

    createAccountForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('createEmail').value.trim();
        const password = document.getElementById('createPassword').value;
        const repeatPassword = document.getElementById('repeatPassword').value;
        if (!email || !password || !repeatPassword) {
            showMessage('Por favor, preencha todos os campos.');
            return;
        }
        if (password !== repeatPassword) {
            showMessage('As senhas não coincidem. Tente novamente.');
            return;
        }
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        registrationData.email = email;
        registrationData.password = password;
        createAccountContainer.style.display = 'none';
        registrationDetailsContainer.style.display = 'flex';
        authMessage.className = 'auth-message';
    });

    registrationDetailsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nome = document.getElementById('regNome').value.trim();
        const sobrenome = document.getElementById('regSobrenome').value.trim();
        const username = `${nome} ${sobrenome}`;
        if (!nome || !sobrenome) {
            showMessage('Nome e sobrenome são obrigatórios.');
            return;
        }
        const finalUserData = { ...registrationData, username: username };

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalUserData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ocorreu um erro ao registrar.');
            }

            // --- GUARDA O TOKEN ---
            localStorage.setItem('token', result.token); // Login automático após o cadastro

            showMessage('Cadastro realizado com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html'; // Redireciona para a página principal
            }, 2000);

        } catch (error) {
            showMessage(error.message);
        }
    });

    backToCreateAccountBtn.addEventListener('click', () => {
        registrationDetailsContainer.style.display = 'none';
        createAccountContainer.style.display = 'flex';
        authMessage.className = 'auth-message';
    });
});