// Configurar Axios
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.defaults.withCredentials = true;

// Configurar token de autorização se existir
if (localStorage.getItem('token')) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUserProfile();
        await loadPurchasedContent();
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        if (error.response?.status === 401) {
            window.location.href = 'login.html';
        }
    }
});

// Função para carregar perfil do usuário
async function loadUserProfile() {
    try {
        const response = await axios.get('/users/me');
        console.log('Dados do usuário:', response.data);

        if (!response.data || response.data.status !== 'success') {
            throw new Error('Erro ao carregar perfil');
        }

        const user = response.data.data.user;
        
        // Atualizar informações do perfil
        document.getElementById('username').textContent = user.name || user.username;
        document.getElementById('email').textContent = user.email;
        
        if (user.avatar) {
            const avatarImg = document.getElementById('foto-usuario');
            avatarImg.src = user.avatar;
            avatarImg.onerror = () => {
                avatarImg.src = 'images/default-avatar.svg';
            };
        }

        // Se o usuário for um criador, mostrar link para o dashboard de criador
        if (user.role === 'creator') {
            const creatorDashboardLink = document.createElement('a');
            creatorDashboardLink.href = 'creator-dashboard.html';
            creatorDashboardLink.className = 'btn btn-primary mt-3';
            creatorDashboardLink.textContent = 'Ir para Dashboard de Criador';
            document.querySelector('.profile-section').appendChild(creatorDashboardLink);
        }

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar seu perfil'
        });
    }
}

// Função para carregar conteúdos comprados
async function loadPurchasedContent() {
    try {
        const response = await axios.get('/users/purchases');
        console.log('Conteúdos comprados:', response.data);

        if (!response.data || response.data.status !== 'success') {
            throw new Error('Erro ao carregar conteúdos');
        }

        const purchases = response.data.data.purchases;
        const contentContainer = document.getElementById('purchased-content');
        contentContainer.innerHTML = ''; // Limpar conteúdo existente

        if (purchases.length === 0) {
            contentContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">
                        Você ainda não comprou nenhum conteúdo. 
                        <a href="explore.html" class="alert-link">Explorar conteúdos</a>
                    </div>
                </div>
            `;
            return;
        }

        purchases.forEach(purchase => {
            const content = purchase.content;
            const creator = purchase.creator;
            
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            const thumbnailUrl = content.thumbnail 
                ? content.thumbnail.startsWith('http') 
                    ? content.thumbnail 
                    : `${axios.defaults.baseURL}${content.thumbnail}`
                : '/images/default-thumbnail.svg';

            card.innerHTML = `
                <div class="card h-100">
                    <img src="${thumbnailUrl}" class="card-img-top" alt="${content.title}" 
                        onerror="this.src='/images/default-thumbnail.svg'">
                    <div class="card-body">
                        <h5 class="card-title">${content.title}</h5>
                        <p class="card-text">${content.description}</p>
                        <div class="creator-info mb-3">
                            <small class="text-muted">
                                Por: ${creator.name || creator.username}
                            </small>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <a href="view-content.html?id=${content._id}" class="btn btn-primary">
                                Acessar Conteúdo
                            </a>
                            <small class="text-muted">
                                Comprado em: ${new Date(purchase.purchaseDate).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
            `;

            contentContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar seus conteúdos'
        });
    }
}
