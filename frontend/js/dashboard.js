document.addEventListener('DOMContentLoaded', () => {
    // Gerenciamento de menu ativo
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Simulação de dados em tempo real
    function updateStats() {
        const stats = {
            subscribers: Math.floor(Math.random() * 100) + 1200,
            earnings: Math.floor(Math.random() * 1000) + 8000,
            views: Math.floor(Math.random() * 1000) + 44000,
            engagement: Math.floor(Math.random() * 5) + 85
        };

        document.querySelectorAll('.stat-number').forEach((stat, index) => {
            const key = Object.keys(stats)[index];
            let value = stats[key];
            
            if (key === 'earnings') {
                value = `R$ ${value.toLocaleString()}`;
            } else if (key === 'views') {
                value = `${(value / 1000).toFixed(1)}K`;
            } else if (key === 'engagement') {
                value = `${value}%`;
            } else {
                value = value.toLocaleString();
            }
            
            stat.textContent = value;
        });
    }

    // Atualiza estatísticas a cada 30 segundos
    setInterval(updateStats, 30000);

    // Sistema de notificações
    const notifications = [
        'Novo assinante se juntou ao seu perfil!',
        'Sua última postagem recebeu 50 curtidas',
        'Novo comentário em seu conteúdo',
        'Meta de ganhos mensais atingida!'
    ];

    function showNotification() {
        const notification = notifications[Math.floor(Math.random() * notifications.length)];
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification-toast');
        notificationElement.innerHTML = `
            <i class="fas fa-bell"></i>
            <span>${notification}</span>
        `;
        document.body.appendChild(notificationElement);

        setTimeout(() => {
            notificationElement.remove();
        }, 5000);
    }

    // Simula notificações aleatórias
    setInterval(showNotification, 45000);

    // Pesquisa
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Implementar lógica de pesquisa aqui
    });
});
