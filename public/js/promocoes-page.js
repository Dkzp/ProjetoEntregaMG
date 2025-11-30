// --- promocoes-page.js - Carrega todas as promoções ---
document.addEventListener('DOMContentLoaded', async () => {
    const highlightSection = document.getElementById('promo-highlight-section');
    const promotionsGrid = document.getElementById('promotions-grid-fullpage');
    const token = localStorage.getItem('token');

    const fetchPromotions = async () => {
        try {
            const response = await fetch('/api/promotions', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) throw new Error('Não foi possível carregar as promoções.');

            const promos = await response.json();
            
            if (promos.length === 0) {
                highlightSection.innerHTML = '<p style="text-align: center; padding: 40px;">Nenhuma promoção disponível no momento.</p>';
                promotionsGrid.innerHTML = '';
                return;
            }

            // Primeira promoção = Destaque principal
            const mainPromo = promos[0];
            
            highlightSection.innerHTML = `
                <div class="promo-highlight-content">
                    <div class="promo-highlight-image">
                         <img src="${mainPromo.image}" alt="${mainPromo.title}">
                         <span class="highlight-badge">OFERTA TOP!</span>
                    </div>
                    <div class="promo-highlight-text">
                        <h2>${mainPromo.title}</h2>
                        <p class="promo-description">${mainPromo.description}</p>
                        <div class="promo-price-area">
                            <span class="price-label">Por Apenas:</span>
                            <span class="main-price">R$ ${parseFloat(mainPromo.price).toFixed(0)}<span class="cents">,${(parseFloat(mainPromo.price) % 1).toFixed(2).substring(2)}</span></span>
                        </div>
                        <a href="menu.html" class="cta-button large">QUERO APROVEITAR!</a>
                         <p class="validity">Válido enquanto durarem os estoques.</p>
                    </div>
                </div>
            `;

            // Demais promoções = Grid
            const otherPromos = promos.slice(1);
            
            if (otherPromos.length === 0) {
                promotionsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Confira mais promoções em breve!</p>';
                return;
            }

            promotionsGrid.innerHTML = otherPromos.map((promo, index) => {
                // Alterna estilos para variedade visual
                const styles = ['promo-2 colored-bg', 'promo-combo', 'promo-3 colored-bg', 'promo-dessert'];
                const style = styles[index % styles.length];
                
                return `
                    <div class="promo-block ${style}">
                        ${index % 2 === 0 ? `
                            <h3>${promo.title.toUpperCase()} <i class="fas fa-gift"></i></h3>
                            <p>${promo.description.substring(0, 50)}...</p>
                            ${promo.price > 0 ? 
                                `<span>R$ ${parseFloat(promo.price).toFixed(2).replace('.', ',')}</span>` : 
                                '<span>BRINDE!</span>'
                            }
                            <img src="${promo.image}" alt="${promo.title}">
                            <a href="menu.html" class="cta-button secondary small">Ver Menu</a>
                        ` : `
                            <img src="${promo.image}" alt="${promo.title}">
                            <h3>${promo.title}</h3>
                            <p class="combo-details">${promo.description.substring(0, 80)}...</p>
                            <p class="combo-price"><strong>R$ ${parseFloat(promo.price).toFixed(2).replace('.', ',')}</strong></p>
                            <a href="menu.html" class="cta-button small">Pedir Agora</a>
                        `}
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
            highlightSection.innerHTML = '<p style="text-align: center; padding: 40px; color: #721c24;">Erro ao carregar promoções.</p>';
            promotionsGrid.innerHTML = '';
        }
    };

    fetchPromotions();
});