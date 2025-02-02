// Configurar Axios
const API_URL = 'http://localhost:3000/api';
const BACKEND_URL = 'http://localhost:3000';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Configurar token de autorização se existir
if (localStorage.getItem('token')) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

// Função para obter ID do conteúdo da URL
function getContentId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função para obter URL completa do conteúdo
function getContentUrl(contentUrl) {
    if (!contentUrl) return '';
    if (contentUrl.startsWith('http')) return contentUrl;
    return `${BACKEND_URL}${contentUrl}`;
}

// Função para carregar o conteúdo
async function loadContent() {
    try {
        const contentId = getContentId();
        if (!contentId) {
            throw new Error('ID do conteúdo não fornecido');
        }

        // Carregar detalhes do conteúdo
        const contentResponse = await axios.get(`/content/${contentId}`);
        const content = contentResponse.data.data.content;

        // Atualizar informações na página
        document.getElementById('content-title').textContent = content.title;
        document.getElementById('content-description').textContent = content.description;
        document.getElementById('creator-name').textContent = content.creator.name || content.creator.username;
        document.getElementById('content-date').textContent = new Date(content.createdAt).toLocaleDateString();

        if (content.creator.avatar) {
            const avatarImg = document.getElementById('creator-avatar');
            avatarImg.src = getContentUrl(content.creator.avatar);
            avatarImg.onerror = () => {
                avatarImg.src = '/images/default-avatar.svg';
            };
        }

        // Carregar o conteúdo baseado no tipo
        const container = document.getElementById('content-container');
        container.innerHTML = ''; // Limpar conteúdo existente

        const contentUrl = getContentUrl(content.contentUrl);

        switch (content.type) {
            case 'video':
                container.innerHTML = `
                    <div class="video-container">
                        <video controls>
                            <source src="${contentUrl}" type="video/mp4">
                            Seu navegador não suporta o elemento de vídeo.
                        </video>
                    </div>
                `;
                break;

            case 'audio':
                container.innerHTML = `
                    <div class="audio-container">
                        <audio controls class="w-100">
                            <source src="${contentUrl}" type="audio/mpeg">
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                    </div>
                `;
                break;

            case 'image':
                container.innerHTML = `
                    <img src="${contentUrl}" alt="${content.title}" class="content-media">
                `;
                break;

            case 'document':
                // Para documentos, podemos usar um iframe ou um link para download
                if (content.contentUrl.endsWith('.pdf')) {
                    container.innerHTML = `
                        <iframe src="${contentUrl}" class="document-container"></iframe>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="alert alert-info">
                            <p>Este é um documento para download.</p>
                            <a href="${contentUrl}" class="btn btn-primary" download>
                                <i class="fas fa-download"></i> Baixar Documento
                            </a>
                        </div>
                    `;
                }
                break;

            default:
                container.innerHTML = `
                    <div class="alert alert-warning">
                        Tipo de conteúdo não suportado.
                    </div>
                `;
        }

        // Registrar visualização
        await axios.post(`/content/${contentId}/view`);

    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        
        let title = 'Erro';
        let text = 'Erro ao carregar conteúdo';
        
        if (error.response?.status === 403) {
            title = 'Acesso Negado';
            text = 'Você precisa comprar este conteúdo para acessá-lo. Deseja ir para a página de compra?';
            
            Swal.fire({
                icon: 'warning',
                title,
                text,
                showCancelButton: true,
                confirmButtonText: 'Ir para Compra',
                cancelButtonText: 'Voltar ao Dashboard',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `explore.html?content=${getContentId()}`;
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title,
                text: error.response?.data?.message || text,
                confirmButtonText: 'Voltar ao Dashboard',
            }).then(() => {
                window.location.href = 'user-dashboard.html';
            });
        }
    }
}

// Verificar se usuário está logado
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Carregar conteúdo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    loadContent();
});
