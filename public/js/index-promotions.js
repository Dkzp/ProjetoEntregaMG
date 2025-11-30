// --- index-promotions.js - Carrega promoções na home ---
document.addEventListener('DOMContentLoaded', async () => {
    const promotionsGrid = document.getElementById('promotions-grid');
    const token = localStorage.getItem('token');

    const fetchPromotions = async () => {
        try {
            const response = await fetch('/api/promotions', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) throw new Error('Não foi possível carregar as promoções.');

            const promos = await response.json();
            
            if (promos.length === 0) {
                promotionsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: white;">Nenhuma promoção disponível no momento.</p>';
                return;
            }

            // Separa as 3 primeiras promoções para os highlights
            const highlight1 = promos.find(p => p.promo_type === 'highlight_1') || promos[0];
            const highlight2 = promos.find(p => p.promo_type === 'highlight_2') || promos[1];
            const highlight3 = promos.find(p => p.promo_type === 'highlight_3') || promos[2];

            promotionsGrid.innerHTML = `
                ${highlight1 ? `
                <div class="promo-block promo-1">
                    <div class="promo-text">
                        <h3>${highlight1.title}</h3>
                        <p>${highlight1.description.split('.')[0]}</p>
                        <div class="price-tag">R$ ${parseFloat(highlight1.price).toFixed(0)}<span>,${(parseFloat(highlight1.price) % 1).toFixed(2).substring(2)}</span></div>
                        <span class="promo-badge">2X</span>
                    </div>
                    <div class="promo-image">
                        <img src="${highlight1.image}" alt="${highlight1.title}">
                    </div>
                </div>
                ` : ''}
                
                ${highlight2 ? `
                <div class="promo-block promo-2">
                    <h3>${highlight2.title.split(' ').slice(0, 2).join(' ')}</h3>
                    <p>${highlight2.title.split(' ').slice(2).join(' ')}</p>
                    ${highlight2.price > 0 ? 
                        `<span>R$ ${parseFloat(highlight2.price).toFixed(2).replace('.', ',')}</span>` : 
                        '<span>DE BRINDE!*</span>'
                    }
                    <img src="${highlight2.image}" alt="${highlight2.title}">
                    <small>${highlight2.description}</small>
                </div>
                ` : ''}
                
                ${highlight3 ? `
                <div class="promo-block promo-3">
                    <h3>${highlight3.title.toUpperCase()} <br><span>${highlight3.description.split(' ').slice(0, 2).join(' ')}</span></h3>
                    <img src="${highlight3.image}" alt="${highlight3.title}">
                    <a href="menu.html" class="cta-button small">Pedir Agora!</a>
                </div>
                ` : ''}
            `;

        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
            promotionsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: white;">Erro ao carregar promoções.</p>';
        }
    };

    fetchPromotions();
});