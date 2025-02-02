// Verificar token
const token = localStorage.getItem('token');
console.log('Token encontrado:', token);

if (!token) {
    console.log('Token não encontrado, redirecionando para login');
    window.location.href = '/login.html';
}

// Configurar headers da requisição
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
console.log('Headers da requisição:', axios.defaults.headers);

// Carregar dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Headers da requisição:', axios.defaults.headers);
        await loadDashboard();
        setupEventListeners();
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        if (error.response?.status === 401) {
            console.log('Token inválido, redirecionando para login');
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }
        handleError(error);
    }
});

// Função para carregar o dashboard
async function loadDashboard() {
    try {
        // Carregar dados do criador
        console.log('Carregando dados do criador...');
        const userResponse = await axios.get('/users/me');
        console.log('Resposta da API:', userResponse.data);

        if (userResponse.data.status === 'success') {
            const user = userResponse.data.data.user;
            console.log('Dados do usuário:', user);

            // Verificar se é um criador
            if (!user || user.role !== 'creator') {
                console.log('Usuário não é um criador, redirecionando...', user);
                window.location.href = '/user-dashboard.html';
                return;
            }

            // Atualizar informações do perfil
            const creatorName = document.getElementById('creatorName');
            const creatorAvatar = document.getElementById('creatorAvatar');

            if (creatorName) {
                creatorName.textContent = user.name || user.username;
            }
            
            if (creatorAvatar && user.avatar) {
                creatorAvatar.src = user.avatar;
            }
        } else {
            throw new Error('Falha ao carregar dados do usuário');
        }

        // Carregar estatísticas
        console.log('Carregando estatísticas...');
        const statsResponse = await axios.get('/creators/statistics');
        console.log('Resposta das estatísticas:', statsResponse.data);

        if (statsResponse.data.status === 'success') {
            const stats = statsResponse.data.data;
            updateStatistics(stats);
        }

        // Carregar conteúdos
        await loadContent();

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        handleError(error);
    }
}

// Função para carregar conteúdo
async function loadContent() {
    try {
        console.log('Carregando conteúdos...');
        const response = await axios.get('/creators/content');
        console.log('Resposta dos conteúdos:', response.data);

        if (response.data.status === 'success') {
            const contents = response.data.data.content || [];
            console.log('Conteúdos detalhados:', contents.map(c => ({
                id: c._id,
                title: c.title,
                file: c.file,
                type: c.type
            })));
            displayContent(contents);
        }
    } catch (error) {
        console.error('Erro ao carregar conteúdos:', error);
        handleError(error);
    }
}

// Função para exibir conteúdo
function displayContent(contents) {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) {
        console.error('Elemento contentGrid não encontrado');
        return;
    }

    contentGrid.innerHTML = ''; // Limpar grid atual

    if (!Array.isArray(contents) || contents.length === 0) {
        contentGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>Nenhum conteúdo publicado ainda</h3>
                <p>Clique no botão "Novo Conteúdo" para começar!</p>
            </div>
        `;
        return;
    }

    contents.forEach(content => {
        if (!content) {
            console.error('Conteúdo inválido:', content);
            return;
        }

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        // Construir URL completa para o arquivo
        let fileUrl = '/public/img/placeholder.jpg'; // URL padrão
        
        if (content.file) {
            fileUrl = content.file.startsWith('http') 
                ? content.file 
                : `${axios.defaults.baseURL}${content.file}`;
        }
        
        console.log('URL do arquivo:', fileUrl);
        
        const previewHtml = content.type === 'video' 
            ? `<video src="${fileUrl}" class="card-img-top" style="height: 200px; object-fit: cover;" controls></video>`
            : `<img src="${fileUrl}" class="card-img-top" alt="${content.title || 'Sem título'}" style="height: 200px; object-fit: cover;">`;
        
        col.innerHTML = `
            <div class="card h-100">
                ${previewHtml}
                <div class="card-body">
                    <h5 class="card-title">${content.title || 'Sem título'}</h5>
                    <p class="card-text text-muted small">${content.description || 'Sem descrição'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${formatCurrency(content.price || 0)}</span>
                        <span class="text-muted small">${content.views || 0} visualizações</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-primary btn-sm edit-content" data-id="${content._id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm delete-content" data-id="${content._id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;

        contentGrid.appendChild(col);
    });
}

// Função para atualizar estatísticas
function updateStatistics(stats) {
    const elements = {
        totalSubscribers: document.getElementById('totalSubscribers'),
        totalContent: document.getElementById('totalContent'),
        totalViews: document.getElementById('totalViews'),
        totalEarnings: document.getElementById('totalEarnings')
    };

    // Atualizar apenas os elementos que existem
    if (elements.totalSubscribers) elements.totalSubscribers.textContent = stats.subscribers || 0;
    if (elements.totalContent) elements.totalContent.textContent = stats.contentCount || 0;
    if (elements.totalViews) elements.totalViews.textContent = stats.totalViews || 0;
    if (elements.totalEarnings) elements.totalEarnings.textContent = formatCurrency(stats.totalEarnings || 0);
}

// Função para criar card de conteúdo
function createContentCard(content) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    col.innerHTML = `
        <div class="card h-100">
            <img src="${content.thumbnail || '/public/img/default-thumbnail.jpg'}" class="card-img-top" alt="${content.title}">
            <div class="card-body">
                <h5 class="card-title">${content.title}</h5>
                <p class="card-text">${content.description}</p>
                <p class="card-text">
                    <small class="text-muted">
                        Visualizações: ${content.views || 0} | 
                        Preço: ${formatCurrency(content.price)}
                    </small>
                </p>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm edit-content" data-id="${content._id}">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm delete-content" data-id="${content._id}">
                    Excluir
                </button>
            </div>
        </div>
    `;

    return col;
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para tratar erros
function handleError(error) {
    console.error('Erro:', error);
    const message = error.response?.data?.message || error.message || 'Ocorreu um erro inesperado';
    
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: message
    });
}

// Função para enviar o formulário de conteúdo
async function submitContent(event) {
    event.preventDefault();
    
    const form = document.getElementById('addContentForm');
    const submitButton = document.getElementById('submitContent');
    const spinner = submitButton.querySelector('.spinner-border');
    
    try {
        // Validar o formulário
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Desabilitar o botão e mostrar spinner
        submitButton.disabled = true;
        spinner.classList.remove('d-none');

        // Criar FormData com os dados do formulário
        const formData = new FormData();
        
        // Adicionar campos manualmente para garantir os tipos corretos
        formData.append('title', form.querySelector('#newContentTitle').value.trim());
        formData.append('description', form.querySelector('#newContentDescription').value.trim());
        formData.append('price', parseFloat(form.querySelector('#newContentPrice').value));
        formData.append('file', form.querySelector('#newContentFile').files[0]);
        
        // Processar tags
        const tagsInput = form.querySelector('#newContentTags');
        if (tagsInput.value.trim()) {
            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            formData.append('tags', JSON.stringify(tags));
        }

        // Log dos dados sendo enviados
        console.log('Enviando dados:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        // Enviar requisição
        const response = await axios.post('/creators/content', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.status === 'success') {
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addContentModal'));
            modal.hide();
            
            // Limpar formulário
            form.reset();
            form.classList.remove('was-validated');
            
            // Recarregar conteúdos
            await loadContent();
            
            // Mostrar mensagem de sucesso
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Conteúdo publicado com sucesso!'
            });
        }
    } catch (error) {
        console.error('Erro ao publicar conteúdo:', error);
        // Mostrar mensagem de erro mais específica
        if (error.response && error.response.data && error.response.data.message) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: error.response.data.message
            });
        } else {
            handleError(error);
        }
    } finally {
        // Reabilitar o botão e esconder spinner
        submitButton.disabled = false;
        spinner.classList.add('d-none');
    }
}

// Adicionar listener para o botão de submit
document.getElementById('submitContent').addEventListener('click', submitContent);

// Configurar event listeners
function setupEventListeners() {
    // Event listener para botões de editar e excluir
    const contentGrid = document.getElementById('contentGrid');
    if (contentGrid) {
        contentGrid.addEventListener('click', async (e) => {
            const target = e.target;
            
            if (target.classList.contains('edit-content')) {
                const contentId = target.dataset.id;
                // Implementar edição
                console.log('Editar conteúdo:', contentId);
            }
            
            if (target.classList.contains('delete-content')) {
                const contentId = target.dataset.id;
                // Confirmar exclusão
                Swal.fire({
                    title: 'Tem certeza?',
                    text: "Esta ação não pode ser desfeita!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sim, excluir!',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            await axios.delete(`/creators/content/${contentId}`);
                            await loadContent(); // Recarregar conteúdos
                            Swal.fire(
                                'Excluído!',
                                'O conteúdo foi excluído com sucesso.',
                                'success'
                            );
                        } catch (error) {
                            console.error('Erro ao excluir conteúdo:', error);
                            handleError(error);
                        }
                    }
                });
            }
        });
    }
}
