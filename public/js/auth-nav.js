// --- START OF FILE auth-nav.js ---
document.addEventListener('DOMContentLoaded', async () => { // <--- Adicionado async
    const token = localStorage.getItem('token');
    const profileLink = document.getElementById('profileLink');
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const logoutLink = document.getElementById('logoutLink');
    const adminNav = document.getElementById('adminNav'); // <--- NOVO

    if (token) {
        if (profileLink) profileLink.href = 'profile.html';
        if (loginNav) loginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'block';
        
        // NOVO: Verifica se é Admin para mostrar o link
        if (adminNav) {
            try {
                // Tenta acessar a rota de Admin protegida
                const response = await fetch('/admin/dashboard', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    // Se o acesso for autorizado (status 200)
                    adminNav.style.display = 'block';
                } else {
                    adminNav.style.display = 'none';
                }
            } catch (error) {
                console.error("Erro ao verificar status de admin:", error);
                adminNav.style.display = 'none';
            }
        }

    } else {
        if (profileLink) profileLink.href = 'login.html';
        if (loginNav) loginNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none'; // Esconder se não estiver logado
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
});
// --- END OF FILE auth-nav.js ---