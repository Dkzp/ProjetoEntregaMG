document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const profileLink = document.getElementById('profileLink');
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const logoutLink = document.getElementById('logoutLink');

    if (token) {
        if (profileLink) profileLink.href = 'profile.html';
        if (loginNav) loginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'block';
    } else {
        if (profileLink) profileLink.href = 'login.html';
        if (loginNav) loginNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'none';
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
});