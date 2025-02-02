document.addEventListener('DOMContentLoaded', async () => {
    // Elementos do DOM
    const uploadButton = document.getElementById('uploadButton');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const contentGrid = document.getElementById('contentGrid');
    const saveDraft = document.getElementById('saveDraft');
    const publishContent = document.getElementById('publishContent');

    // Dados simulados de conteúdo
    const sampleContent = [
        {
            id: 1,
            type: 'video',
            thumbnail: 'https://via.placeholder.com/300x169',
            title: 'Vídeo Exclusivo #1',
            views: 1234,
            likes: 89,
            earnings: 450.00,
            status: 'published'
        },
        {
            id: 2,
            type: 'image',
            thumbnail: 'https://via.placeholder.com/300x169',
            title: 'Ensaio Fotográfico Premium',
            views: 2341,
            likes: 156,
            earnings: 890.00,
            status: 'published'
        },
        {
            id: 3,
            type: 'text',
            thumbnail: 'https://via.placeholder.com/300x169',
            title: 'História Exclusiva',
            views: 567,
            likes: 45,
            earnings: 120.00,
            status: 'draft'
        }
    ];

    // Funções de manipulação do modal
    function openModal() {
        uploadModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModalHandler() {
        uploadModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Event Listeners para o modal
    uploadButton.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalHandler);
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeModalHandler();
        }
    });

    // Manipulação de upload de arquivos
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        uploadArea.style.backgroundColor = '#f8f9fa';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });

    function handleFiles(files) {
        // Aqui você implementaria a lógica de upload
        console.log('Arquivos para upload:', files);
        // Simular progresso de upload
        showUploadProgress();
    }

    function showUploadProgress() {
        uploadArea.innerHTML = `
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
                <p>Enviando arquivos...</p>
            </div>
        `;

        // Simular progresso
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            const progressBar = uploadArea.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    resetUploadArea();
                }, 500);
            }
        }, 300);
    }

    function resetUploadArea() {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arraste arquivos aqui ou clique para selecionar</p>
        `;
    }

    // Renderizar grid de conteúdo
    function renderContentGrid() {
        contentGrid.innerHTML = sampleContent.map(content => `
            <div class="content-card">
                <div class="content-thumbnail">
                    <img src="${content.thumbnail}" alt="${content.title}">
                    <span class="content-type">${content.type}</span>
                </div>
                <div class="content-info">
                    <h3 class="content-title">${content.title}</h3>
                    <div class="content-stats">
                        <span><i class="fas fa-eye"></i> ${content.views}</span>
                        <span><i class="fas fa-heart"></i> ${content.likes}</span>
                        <span><i class="fas fa-dollar-sign"></i> ${content.earnings.toFixed(2)}</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="action-button" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button" title="Estatísticas">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="action-button" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Inicializar a página
    renderContentGrid();

    // Handlers para salvar e publicar
    saveDraft.addEventListener('click', () => {
        // Implementar lógica de salvamento
        alert('Rascunho salvo com sucesso!');
        closeModalHandler();
    });

    publishContent.addEventListener('click', () => {
        // Implementar lógica de publicação
        alert('Conteúdo publicado com sucesso!');
        closeModalHandler();
    });

    // Implementar filtros
    document.querySelectorAll('.filter-group select').forEach(select => {
        select.addEventListener('change', () => {
            // Implementar lógica de filtro
            console.log('Filtro alterado:', select.value);
        });
    });

    const DOMPurify = require('dompurify');

    const fetchContent = async () => {
        const response = await fetch('/api/content');
        return await response.json();
    };

    const { content } = await fetchContent();
    const videos = content || [];

    if (videos?.length) {
        const contentListElement = document.querySelector('#content-list');
        const htmlContent = videos.map(video => `
          <div class='content-item'>
            <h3>${video.title}</h3>
            <video controls src='${video.url}'></video>
          </div>
        `).join('');
        contentListElement.innerHTML = DOMPurify.sanitize(htmlContent);
    }
});
