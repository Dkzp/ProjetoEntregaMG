// --- START OF FILE admin.js ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const menuContent = document.getElementById('menuContent');
    const promoContent = document.getElementById('promoContent');
    const menuTab = document.getElementById('menuTab');
    const promoTab = document.getElementById('promoTab');
    const menuList = document.getElementById('menuList');
    const promoList = document.getElementById('promoList');
    const addMenuItemForm = document.getElementById('addMenuItemForm');
    const addPromotionForm = document.getElementById('addPromotionForm'); // <--- NOVO
    const menuMessages = document.getElementById('menu-messages');
    const promoMessages = document.getElementById('promo-messages'); // <--- NOVO
    const generalMessages = document.getElementById('general-messages');
    const adminUsername = document.getElementById('admin-username');

    const showMessage = (element, message, type = 'error') => {
        element.textContent = message;
        element.className = 'admin-message';
        if (type === 'error') { element.classList.add('error'); }
        if (type === 'success') { element.classList.add('success'); }
        element.style.display = 'block';
        
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    };
    
    const hideMessages = (element) => {
        element.style.display = 'none';
    }


    // 1. VERIFICAÇÃO DE ADMIN
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/admin/dashboard', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            showMessage(generalMessages, 'Acesso negado. Você não é um administrador.', 'error');
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            return;
        }

        const result = await response.json();
        adminUsername.textContent = result.user.username;
        hideMessages(generalMessages);
        
    } catch (error) {
        localStorage.removeItem('token');
        showMessage(generalMessages, 'Erro de comunicação com o servidor. Redirecionando...', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        return;
    }

    // 2. FUNÇÃO PARA CARREGAR ITENS DO MENU
    const loadMenuItems = async () => {
        menuList.innerHTML = '<p style="text-align: center; color: var(--text-color); margin: 20px 0;">Carregando itens...</p>';
        try {
            const response = await fetch('/api/menu'); 
            if (!response.ok) throw new Error('Falha ao buscar itens do menu.');
            
            const items = await response.json();
            
            menuList.innerHTML = ''; 
            if (items.length === 0) {
                 menuList.innerHTML = '<p style="text-align: center; color: var(--text-color); margin: 20px 0;">Nenhum item cadastrado no momento.</p>';
                 return;
            }

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'admin-item-card'; 
                itemDiv.innerHTML = `
                    <div class="item-info">
                        <p><strong>ID: ${item.id}</strong> | R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                        <small><strong>${item.name}</strong> - Cat: ${item.category} | ${item.description.substring(0, 50)}...</small>
                    </div>
                    <button class="cta-button small delete-btn delete-btn-style" data-id="${item.id}" data-type="menu">Excluir</button>
                `;
                menuList.appendChild(itemDiv);
            });
            
            addDeleteListeners();

        } catch (error) {
            menuList.innerHTML = `<p class="admin-message error" style="display: block; text-align: center;">Erro: ${error.message}</p>`;
        }
    };
    
    // 3. FUNÇÃO PARA CARREGAR PROMOÇÕES
    const loadPromotions = async () => {
        promoList.innerHTML = '<p style="text-align: center; color: var(--text-color); margin: 20px 0;">Carregando promoções...</p>';
        try {
            const response = await fetch('/api/promotions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar promoções.');
            
            const items = await response.json();
            
            promoList.innerHTML = ''; 
            if (items.length === 0) {
                 promoList.innerHTML = '<p style="text-align: center; color: var(--text-color); margin: 20px 0;">Nenhuma promoção cadastrada no momento.</p>';
                 return;
            }

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'admin-item-card';
                itemDiv.innerHTML = `
                    <div class="item-info">
                        <p><strong>ID: ${item.id}</strong> | R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                        <small><strong>${item.title}</strong> | ${item.description.substring(0, 50)}...</small>
                    </div>
                    <button class="cta-button small delete-btn delete-btn-style" data-id="${item.id}" data-type="promotion">Excluir</button>
                `;
                promoList.appendChild(itemDiv);
            });

            addDeleteListeners();

        } catch (error) {
            promoList.innerHTML = `<p class="admin-message error" style="display: block; text-align: center;">Erro: ${error.message}</p>`;
        }
    };
    
    
    // 4. FUNÇÃO PARA ADICIONAR ITEM DO MENU
    addMenuItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages(menuMessages);

        const data = {
            name: document.getElementById('menuName').value,
            category: document.getElementById('menuCategory').value,
            price: parseFloat(document.getElementById('menuPrice').value),
            image: document.getElementById('menuImage').value,
            description: document.getElementById('menuDescription').value
        };

        if (isNaN(data.price)) {
            showMessage(menuMessages, 'O preço deve ser um número válido.');
            return;
        }

        try {
            const response = await fetch('/api/menu', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao adicionar item.');
            }

            showMessage(menuMessages, result.message, 'success');
            addMenuItemForm.reset();
            loadMenuItems(); 
            
        } catch (error) {
            showMessage(menuMessages, error.message);
        }
    });
    
    // 5. FUNÇÃO PARA ADICIONAR NOVA PROMOÇÃO <--- NOVO BLOCO
    addPromotionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages(promoMessages);

        const data = {
            title: document.getElementById('promoTitle').value,
            price: parseFloat(document.getElementById('promoPrice').value),
            image: document.getElementById('promoImage').value,
            description: document.getElementById('promoDescription').value
        };

        if (isNaN(data.price)) {
            showMessage(promoMessages, 'O preço deve ser um número válido.');
            return;
        }

        try {
            const response = await fetch('/api/promotions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao adicionar promoção.');
            }

            showMessage(promoMessages, result.message, 'success');
            addPromotionForm.reset();
            loadPromotions(); 
            
        } catch (error) {
            showMessage(promoMessages, error.message);
        }
    });


    // 6. FUNÇÃO PARA EXCLUIR ITEM
    const addDeleteListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const type = e.target.getAttribute('data-type');
                const apiPath = type === 'menu' ? `/api/menu/${id}` : `/api/promotions/${id}`;
                
                if (!confirm(`Tem certeza que deseja excluir o item ID ${id} (${type})?`)) return;

                try {
                    const response = await fetch(apiPath, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Erro ao excluir.');
                    }
                    
                    showMessage(generalMessages, result.message, 'success');
                    if (type === 'menu') loadMenuItems();
                    if (type === 'promotion') loadPromotions();
                    
                } catch (error) {
                    showMessage(generalMessages, error.message, 'error');
                }
            });
        });
    };
    
    // 7. CONTROLE DE ABAS
    menuTab.addEventListener('click', () => {
        menuContent.style.display = 'block';
        promoContent.style.display = 'none';
        menuTab.classList.remove('secondary');
        promoTab.classList.add('secondary');
        loadMenuItems();
    });

    promoTab.addEventListener('click', () => {
        menuContent.style.display = 'none';
        promoContent.style.display = 'block';
        promoTab.classList.remove('secondary');
        menuTab.classList.add('secondary');
        loadPromotions();
    });

    // Carrega o menu por padrão
    menuTab.click();
});
// --- END OF FILE admin.js ---