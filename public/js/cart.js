// --- cart.js - Sistema de Carrinho com Banco de Dados ---

class Cart {
    constructor() {
        this.items = [];
        this.deliveryFee = 5.00;
        this.isLoggedIn = false;
        this.token = null;
        this.init();
    }

    // Inicializa o carrinho (verifica se está logado)
    async init() {
        this.token = localStorage.getItem('token');
        this.isLoggedIn = !!this.token;

        if (this.isLoggedIn) {
            // Usuário logado: busca carrinho do banco
            await this.syncFromDatabase();
        } else {
            // Usuário não logado: usa sessionStorage
            this.items = this.loadFromSession();
        }
        
        this.updateCartBadge();
    }

    // ========== MÉTODOS PARA USUÁRIO NÃO LOGADO ==========

    loadFromSession() {
        const cartData = sessionStorage.getItem('frydaysCart');
        return cartData ? JSON.parse(cartData) : [];
    }

    saveToSession() {
        sessionStorage.setItem('frydaysCart', JSON.stringify(this.items));
    }

    // ========== MÉTODOS PARA USUÁRIO LOGADO ==========

    async syncFromDatabase() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                this.items = await response.json();
            } else {
                console.error('Erro ao buscar carrinho do banco');
                this.items = [];
            }
        } catch (error) {
            console.error('Erro ao sincronizar carrinho:', error);
            this.items = [];
        }
    }

    async addToDatabase(menuItemId, quantity = 1) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ 
                    menu_item_id: menuItemId, 
                    quantity: quantity 
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.items = result.cart;
                return true;
            } else {
                console.error('Erro ao adicionar item ao banco');
                return false;
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            return false;
        }
    }

    async updateInDatabase(cartItemId, quantity) {
        try {
            const response = await fetch(`/api/cart/${cartItemId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                const result = await response.json();
                this.items = result.cart;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao atualizar carrinho:', error);
            return false;
        }
    }

    async removeFromDatabase(cartItemId) {
        try {
            const response = await fetch(`/api/cart/${cartItemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const result = await response.json();
                this.items = result.cart;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao remover do carrinho:', error);
            return false;
        }
    }

    async clearDatabase() {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                this.items = [];
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            return false;
        }
    }

    // ========== MÉTODOS PÚBLICOS (FUNCIONAM PARA AMBOS) ==========

    async addItem(item) {
        if (this.isLoggedIn) {
            // Usuário logado: adiciona no banco
            const success = await this.addToDatabase(item.id, 1);
            if (success) {
                this.updateCartBadge();
                return true;
            }
            return false;
        } else {
            // Usuário não logado: adiciona no sessionStorage
            const existingItem = this.items.find(i => i.id === item.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    image: item.image,
                    description: item.description || '',
                    quantity: 1
                });
            }
            
            this.saveToSession();
            this.updateCartBadge();
            return true;
        }
    }

    async updateQuantity(itemId, newQuantity) {
        if (this.isLoggedIn) {
            // Usuário logado: atualiza no banco
            const item = this.items.find(i => i.id === itemId);
            if (item && item.cart_id) {
                await this.updateInDatabase(item.cart_id, newQuantity);
                this.updateCartBadge();
            }
        } else {
            // Usuário não logado: atualiza sessionStorage
            const item = this.items.find(i => i.id === itemId);
            if (item) {
                if (newQuantity <= 0) {
                    this.removeItem(itemId);
                } else {
                    item.quantity = newQuantity;
                    this.saveToSession();
                    this.updateCartBadge();
                }
            }
        }
    }

    async removeItem(itemId) {
        if (this.isLoggedIn) {
            // Usuário logado: remove do banco
            const item = this.items.find(i => i.id === itemId);
            if (item && item.cart_id) {
                await this.removeFromDatabase(item.cart_id);
                this.updateCartBadge();
            }
        } else {
            // Usuário não logado: remove do sessionStorage
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveToSession();
            this.updateCartBadge();
        }
    }

    async clearCart() {
        if (this.isLoggedIn) {
            await this.clearDatabase();
        } else {
            this.items = [];
            this.saveToSession();
        }
        this.updateCartBadge();
    }

    // Calcula subtotal
    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Calcula total
    getTotal() {
        return this.getSubtotal() + this.deliveryFee;
    }

    // Retorna quantidade total de itens
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Atualiza o badge do carrinho no header
    updateCartBadge() {
        const badge = document.getElementById('cart-count-badge');
        const totalItems = this.getTotalItems();
        
        if (badge) {
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.style.display = 'inline-block';
                badge.style.backgroundColor = 'var(--primary-color)';
                badge.style.color = 'white';
                badge.style.borderRadius = '50%';
                badge.style.padding = '2px 6px';
                badge.style.fontSize = '0.75rem';
                badge.style.position = 'absolute';
                badge.style.top = '-5px';
                badge.style.right = '-10px';
                badge.style.fontWeight = 'bold';
            } else {
                badge.style.display = 'none';
            }
        }
        
        const cartIcon = document.querySelector('.cart-icon-link');
        if (cartIcon) {
            cartIcon.style.position = 'relative';
        }
    }

    // Migra carrinho de sessionStorage para o banco quando o usuário faz login
    async migrateSessionToDatabase() {
        const sessionItems = this.loadFromSession();
        
        if (sessionItems.length > 0) {
            for (const item of sessionItems) {
                await this.addToDatabase(item.id, item.quantity);
            }
            
            // Limpa sessionStorage após migrar
            sessionStorage.removeItem('frydaysCart');
        }
    }
}

// Renderiza o carrinho na página carrinho.html
async function renderCart() {
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const cartItemsList = document.getElementById('cart-items-list');
    const subtotalElement = document.getElementById('cart-subtotal');
    const deliveryElement = document.getElementById('cart-delivery');
    const totalElement = document.getElementById('cart-total');

    // Aguarda o carrinho carregar
    await cart.init();

    if (cart.items.length === 0) {
        cartEmpty.style.display = 'block';
        cartContent.style.display = 'none';
        return;
    }

    cartEmpty.style.display = 'none';
    cartContent.style.display = 'block';

    // Renderiza itens
    cartItemsList.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-description">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn qty-decrease" data-id="${item.id}">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn qty-increase" data-id="${item.id}">+</button>
            </div>
            <button class="remove-btn" data-id="${item.id}">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
    `).join('');

    // Atualiza valores
    const subtotal = cart.getSubtotal();
    const total = cart.getTotal();
    
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    deliveryElement.textContent = `R$ ${cart.deliveryFee.toFixed(2).replace('.', ',')}`;
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // Adiciona event listeners
    addCartEventListeners();
}

// Adiciona event listeners aos botões do carrinho
function addCartEventListeners() {
    document.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = cart.items.find(i => i.id === itemId);
            if (item) {
                await cart.updateQuantity(itemId, item.quantity - 1);
                await renderCart();
            }
        });
    });

    document.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = cart.items.find(i => i.id === itemId);
            if (item) {
                await cart.updateQuantity(itemId, item.quantity + 1);
                await renderCart();
            }
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = parseInt(e.currentTarget.getAttribute('data-id'));
            if (confirm('Deseja remover este item do carrinho?')) {
                await cart.removeItem(itemId);
                await renderCart();
            }
        });
    });
}

// Instância global do carrinho
const cart = new Cart();

// Inicializa a página do carrinho
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('cart-items-list')) {
        await renderCart();

        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', async () => {
                if (confirm('Deseja limpar todo o carrinho?')) {
                    await cart.clearCart();
                    await renderCart();
                }
            });
        }

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                alert('Sistema de pagamento em desenvolvimento!\n\nTotal: R$ ' + cart.getTotal().toFixed(2).replace('.', ','));
            });
        }
    } else {
        // Em outras páginas, apenas atualiza o badge
        await cart.init();
    }
});

window.cart = cart;