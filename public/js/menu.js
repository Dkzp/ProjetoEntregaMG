// --- START OF FILE menu.js ---
document.addEventListener('DOMContentLoaded', async () => {
    const menuContainer = document.getElementById('menu-all-items');

    const fetchMenu = async () => {
        menuContainer.innerHTML = '<p style="text-align: center; font-size: 1.5rem; color: #D32F2F;">Carregando o cardápio...</p>';

        try {
            const response = await fetch('/api/menu');
            if (!response.ok) throw new Error('Não foi possível carregar o cardápio.');

            const items = await response.json();
            
            if (items.length === 0) {
                 menuContainer.innerHTML = '<p style="text-align: center; font-size: 1.2rem;">O cardápio está vazio no momento. Volte em breve!</p>';
                 return;
            }

            // Agrupa os itens por categoria
            const categorizedItems = items.reduce((acc, item) => {
                const category = item.category || 'Outros'; // Default category
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(item);
                return acc;
            }, {});

            menuContainer.innerHTML = ''; // Limpa o carregador
            
            for (const category in categorizedItems) {
                const section = document.createElement('section');
                section.id = category.toLowerCase().replace(/\s/g, '-');
                section.className = 'menu-category';
                
                // Capitaliza a primeira letra da categoria para o título
                const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

                section.innerHTML = `
                    <h2 class="category-title"><span>//</span> ${displayCategory}</h2>
                    <div class="menu-grid">
                        ${categorizedItems[category].map(item => `
                            <div class="menu-item-card">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="item-details">
                                    <h3>${item.name}</h3>
                                    <p class="description">${item.description}</p>
                                    <p class="price">R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                                    <button class="add-to-cart-btn small" aria-label="Adicionar ${item.name} ao carrinho"><i class="fas fa-cart-plus"></i> Add</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                menuContainer.appendChild(section);
            }

        } catch (error) {
            menuContainer.innerHTML = `<p style="text-align: center; font-size: 1.2rem; color: #721c24;">Erro ao buscar cardápio: ${error.message}</p>`;
        }
    };

    fetchMenu();
});
// --- END OF FILE menu.js ---