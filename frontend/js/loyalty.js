// Sistema de Fidelidade
async function getLoyaltyStatus() {
    try {
        const response = await axios.get('/users/loyalty/status');
        return response.data.data;
    } catch (error) {
        console.error('Erro ao obter status de fidelidade:', error);
        throw error;
    }
}

async function redeemReward(rewardId) {
    try {
        const response = await axios.post('/users/loyalty/redeem', { rewardId });
        return response.data;
    } catch (error) {
        console.error('Erro ao resgatar recompensa:', error);
        throw error;
    }
}

// Integração com Redes Sociais
async function connectTwitter() {
    try {
        window.location.href = axios.defaults.baseURL + '/social/twitter/auth';
    } catch (error) {
        console.error('Erro ao conectar com Twitter:', error);
        throw error;
    }
}

async function connectInstagram() {
    try {
        window.location.href = axios.defaults.baseURL + '/social/instagram/auth';
    } catch (error) {
        console.error('Erro ao conectar com Instagram:', error);
        throw error;
    }
}

async function disconnectSocial(platform) {
    try {
        const response = await axios.post(`/social/disconnect/${platform}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao desconectar ${platform}:`, error);
        throw error;
    }
}

// Atualizar UI com informações de fidelidade
async function updateLoyaltyUI() {
    try {
        const loyaltyStatus = await getLoyaltyStatus();
        const loyaltyContainer = document.getElementById('loyaltyContainer');
        
        if (loyaltyContainer) {
            loyaltyContainer.innerHTML = `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-award"></i> Programa de Fidelidade</h5>
                    </div>
                    <div class="card-body">
                        <div class="loyalty-info">
                            <h4>Nível ${loyaltyStatus.tier}</h4>
                            <p class="mb-2">Pontos: ${loyaltyStatus.points}</p>
                            ${loyaltyStatus.nextTier ? 
                                `<p class="text-muted">Faltam ${loyaltyStatus.pointsToNextTier} pontos para o nível ${loyaltyStatus.nextTier}</p>` 
                                : '<p class="text-success">Nível máximo atingido!</p>'
                            }
                        </div>
                        <div class="progress mb-3">
                            <div class="progress-bar" role="progressbar" 
                                style="width: ${(loyaltyStatus.points / (loyaltyStatus.tier === 'bronze' ? 500 : 1000)) * 100}%" 
                                aria-valuenow="${loyaltyStatus.points}" 
                                aria-valuemin="0" 
                                aria-valuemax="${loyaltyStatus.tier === 'bronze' ? 500 : 1000}">
                            </div>
                        </div>
                        <div class="rewards-list">
                            <!-- Lista de recompensas disponíveis -->
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao atualizar UI de fidelidade:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar as informações de fidelidade'
        });
    }
}

// Atualizar UI com informações de redes sociais
async function updateSocialUI() {
    try {
        const response = await axios.get('/users/me');
        const user = response.data.data.user;
        const socialContainer = document.getElementById('socialContainer');
        
        if (socialContainer) {
            socialContainer.innerHTML = `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-share-alt"></i> Redes Sociais</h5>
                    </div>
                    <div class="card-body">
                        <div class="social-connections">
                            <div class="mb-3">
                                <h6>Twitter</h6>
                                ${user.socialConnections?.twitter?.connected ? 
                                    `<p class="text-success">Conectado como @${user.socialConnections.twitter.username}
                                     <button class="btn btn-sm btn-outline-danger" onclick="disconnectSocial('twitter')">
                                         Desconectar
                                     </button></p>` 
                                    : '<button class="btn btn-primary" onclick="connectTwitter()">Conectar Twitter</button>'
                                }
                            </div>
                            <div class="mb-3">
                                <h6>Instagram</h6>
                                ${user.socialConnections?.instagram?.connected ? 
                                    `<p class="text-success">Conectado como @${user.socialConnections.instagram.username}
                                     <button class="btn btn-sm btn-outline-danger" onclick="disconnectSocial('instagram')">
                                         Desconectar
                                     </button></p>` 
                                    : '<button class="btn btn-primary" onclick="connectInstagram()">Conectar Instagram</button>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao atualizar UI social:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar as informações de redes sociais'
        });
    }
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            updateLoyaltyUI(),
            updateSocialUI()
        ]);
    } catch (error) {
        console.error('Erro ao inicializar:', error);
    }
});
