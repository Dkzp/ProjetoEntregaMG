// --- index-featured.js - Carrega itens em destaque na home ---
document.addEventListener('DOMContentLoaded', async () => {
    const featuredGrid = document.getElementById('featured-items-grid');

    const fetchFeaturedItems = async () => {
        try {
            const response = await fetch('/api/menu/featured');
            if (!response.ok) throw new Error('Não foi possível carregar os destaques.');

            const items = await response.json();
            
            if (items.length === 0) {
                featuredGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Nenhum item em destaque no momento.</p>';
                return;
            }

            featuredGrid.innerHTML = items.map(item => `
                <div class="product-card">
                    ${item.discount_badge ? `<span class="discount-badge${item.discount_badge.includes('Combo') ? ' special-badge' : ''}">${item.discount_badge}</span>` : ''}
                    <img src="${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p class="price">R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                    <button class="add-to-cart-btn" 
                            data-id="${item.id}"
                            data-name="${item.name}"
                            data-price="${item.price}"
                            data-image="${item.image}"
                            data-description="${item.description}"
                            aria-label="Adicionar ao carrinho">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            `).join('');

            // Adiciona event listeners
            addCartButtonListeners();

        } catch (error) {
            featuredGrid.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: #721c24;">Erro ao carregar destaques: ${error.message}</p>`;
        }
    };

    function addCartButtonListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const item = {
                    id: parseInt(btn.getAttribute('data-id')),
                    name: btn.getAttribute('data-name'),
                    price: parseFloat(btn.getAttribute('data-price')),
                    image: btn.getAttribute('data-image'),
                    description: btn.getAttribute('data-description') || ''
                };

                // Adiciona ao carrinho
                window.cart.addItem(item);

                // Feedback visual
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.backgroundColor = '';
                }, 1500);
            });
        });
    }

    fetchFeaturedItems();
});