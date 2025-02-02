// Configurar Axios
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

// Configurar token de autorização se existir
if (localStorage.getItem('token')) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

// Função para obter o ID do criador da URL
function getCreatorId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função para carregar os dados do criador
async function loadCreatorProfile() {
    try {
        console.log('Carregando perfil do criador...');
        const creatorId = getCreatorId();
        if (!creatorId) {
            window.location.href = '/user-dashboard.html';
            return;
        }

        const response = await axios.get(`/api/creators/${creatorId}`);
        console.log('Resposta da API (perfil):', response.data);

        if (!response.data || response.data.status !== 'success' || !response.data.data) {
            throw new Error('Resposta inválida do servidor');
        }

        const creator = response.data.data;
        console.log('Dados do criador:', creator);
        
        // Atualizar informações do perfil
        document.getElementById('creator-name').textContent = creator.name || creator.username || 'Sem nome';
        document.getElementById('creator-bio').textContent = creator.bio || 'Sem biografia';
        document.getElementById('content-count').textContent = creator.contentCount || 0;
        document.getElementById('followers-count').textContent = creator.followersCount || 0;
        
        if (creator.avatar) {
            const avatarImg = document.getElementById('creator-avatar');
            avatarImg.src = creator.avatar;
            avatarImg.onerror = () => {
                avatarImg.src = 'images/default-avatar.svg';
            };
        }

        // Carregar conteúdos do criador
        await loadCreatorContent(creatorId);

    } catch (error) {
        console.error('Erro ao carregar perfil do criador:', error);
        if (error.response) {
            console.error('Resposta do servidor:', error.response.data);
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar o perfil do criador'
        });

        // Se for erro de autenticação, redirecionar para login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}

// Função para carregar os conteúdos do criador
async function loadCreatorContent(creatorId) {
    try {
        console.log('Carregando conteúdos do criador:', creatorId);
        const response = await axios.get(`/api/creators/${creatorId}/content`);
        console.log('Resposta da API (conteúdos):', response.data);

        if (!response.data || !response.data.data || !response.data.data.content) {
            throw new Error('Resposta inválida do servidor');
        }

        // Garantir que temos um array de conteúdos
        const contents = Array.isArray(response.data.data.content) ? response.data.data.content : [];
        console.log('Conteúdos do criador:', contents);

        const contentContainer = document.getElementById('creator-content');
        contentContainer.innerHTML = ''; // Limpar conteúdo existente

        if (contents.length === 0) {
            contentContainer.innerHTML = '<div class="col-12"><p class="text-center">Este criador ainda não possui conteúdos disponíveis.</p></div>';
            return;
        }

        contents.forEach(content => {
            const contentCard = createContentCard(content);
            contentContainer.appendChild(contentCard);
        });

    } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        if (error.response) {
            console.error('Resposta do servidor:', error.response.data);
        }
        
        const contentContainer = document.getElementById('creator-content');
        contentContainer.innerHTML = '<div class="col-12"><p class="text-center text-danger">Erro ao carregar conteúdos. Por favor, tente novamente mais tarde.</p></div>';
    }
}

// Função para criar card de conteúdo
function createContentCard(content) {
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    
    const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(content.price);

    // Ajustar caminhos das imagens
    const thumbnailUrl = content.thumbnail 
        ? `http://localhost:3000${content.thumbnail}` 
        : '/images/default-thumbnail.svg';

    card.innerHTML = `
        <div class="card h-100">
            <img src="${thumbnailUrl}" 
                 class="card-img-top" 
                 alt="${content.title}"
                 onerror="this.src='/images/default-thumbnail.svg'"
                 style="height: 200px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title">${content.title}</h5>
                <p class="card-text">${content.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">${content.type}</span>
                    <span class="price">${priceFormatted}</span>
                </div>
                ${content.tags && content.tags.length > 0 ? `
                    <div class="mt-2">
                        ${content.tags.map(tag => `
                            <span class="badge bg-secondary me-1">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="mt-2 text-muted">
                    <small>
                        <i class="bi bi-eye"></i> ${content.views || 0} visualizações
                    </small>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary w-100 purchase-btn" 
                        data-content-id="${content._id}"
                        onclick="purchaseContent('${content._id}')">
                    Comprar
                </button>
            </div>
        </div>
    `;

    return card;
}

// Função para comprar conteúdo
async function purchaseContent(contentId) {
    try {
        console.log('Iniciando compra do conteúdo:', contentId);

        // Verificar se o usuário está logado
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Confirmar a compra
        const result = await Swal.fire({
            title: 'Confirmar compra',
            text: 'Deseja realmente comprar este conteúdo?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, comprar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        // Realizar a compra
        const response = await axios.post(`/api/purchases/${contentId}`);
        console.log('Resposta da API:', response.data);

        if (response.data.status === 'success') {
            Swal.fire({
                title: 'Sucesso!',
                text: 'Compra realizada com sucesso!',
                icon: 'success',
                confirmButtonText: 'Ver meus conteúdos',
                showCancelButton: true,
                cancelButtonText: 'Continuar navegando'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'user-dashboard.html';
                }
            });
        }

    } catch (error) {
        console.error('Erro ao comprar conteúdo:', error);
        if (error.response) {
            console.error('Resposta do servidor:', error.response.data);
        }

        let errorMessage = 'Não foi possível realizar a compra';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        Swal.fire({
            title: 'Erro',
            text: errorMessage,
            icon: 'error'
        });

        // Se for erro de autenticação, redirecionar para login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
}

// Carregar perfil do criador quando a página carregar
document.addEventListener('DOMContentLoaded', loadCreatorProfile);
