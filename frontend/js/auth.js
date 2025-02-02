// Configuração do Axios
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Interceptor para logs
axios.interceptors.request.use(request => {
    console.log('Requisição:', request);
    return request;
}, error => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
});

axios.interceptors.response.use(response => {
    console.log('Resposta:', response);
    return response;
}, error => {
    console.error('Erro na resposta:', error);
    return Promise.reject(error);
});

// Função para fazer login
async function login(email, password) {
    try {
        console.log('Tentando fazer login...', { email });
        
        const response = await axios.post('/users/login', {
            email,
            password
        });

        const { token, data } = response.data;
        const user = data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userType', user.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Mostrar mensagem de sucesso
        Swal.fire({
            icon: 'success',
            title: 'Login realizado com sucesso!',
            text: 'Redirecionando...',
            timer: 2000,
            showConfirmButton: false
        });

        // Redirecionar baseado no tipo de usuário
        setTimeout(() => {
            if (user.role === 'creator') {
                window.location.href = '/creator-dashboard.html';
            } else {
                window.location.href = '/user-dashboard.html';
            }
        }, 2000);

    } catch (error) {
        console.error('Erro no login:', error);
        throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
}

// Função para fazer registro
async function register(username, email, password, passwordConfirm, isCreator = false) {
    try {
        const response = await axios.post('/users/signup', {
            username,
            email,
            password,
            passwordConfirm,
            role: isCreator ? 'creator' : 'user'
        });

        const { token, data } = response.data;
        const user = data.user;

        localStorage.setItem('token', token);
        localStorage.setItem('userType', user.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Mostrar mensagem de sucesso
        Swal.fire({
            icon: 'success',
            title: 'Conta criada com sucesso!',
            text: 'Redirecionando...',
            timer: 2000,
            showConfirmButton: false
        });

        // Redirecionar baseado no tipo de usuário
        setTimeout(() => {
            if (user.role === 'creator') {
                window.location.href = '/creator-dashboard.html';
            } else {
                window.location.href = '/user-dashboard.html';
            }
        }, 2000);

    } catch (error) {
        console.error('Erro no registro:', error);
        throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirecionar para a página de login
    window.location.href = '/login.html';
}

// Função para verificar se o usuário está logado
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Função para obter o token
function getToken() {
    return localStorage.getItem('token');
}

// Configurar token se existir
const token = getToken();
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Função para mostrar mensagem de sucesso
function showSuccess(title, message) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

// Função para mostrar mensagem de erro
function showError(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message
    });
}

// Função para verificar tipo de usuário e redirecionar se necessário
function checkUserTypeAndRedirect() {
    const userType = localStorage.getItem('userType');
    const pathname = window.location.pathname;
    
    if (userType === 'creator' && pathname.includes('user-dashboard')) {
        window.location.href = '/creator-dashboard.html';
    } else if (userType === 'user' && pathname.includes('creator-dashboard')) {
        window.location.href = '/user-dashboard.html';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando event listeners...');
    
    // Verificar se estamos em uma página de autenticação
    const pathname = window.location.pathname;
    const isAuthPage = pathname.includes('login.html') || pathname.includes('register.html');
    
    if (!isAuthPage) {
        console.log('Não estamos em uma página de autenticação');
        return;
    }

    checkUserTypeAndRedirect();

    // Verificar se há parâmetro type=creator na URL
    const urlParams = new URLSearchParams(window.location.search);
    const isCreatorParam = urlParams.get('type') === 'creator';

    // Form de Login
    const loginForm = document.getElementById('loginForm');
    console.log('Form de login encontrado:', loginForm);
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            try {
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                
                console.log('Elementos do form:', {
                    emailInput: emailInput ? 'encontrado' : 'não encontrado',
                    passwordInput: passwordInput ? 'encontrado' : 'não encontrado'
                });

                if (!emailInput || !passwordInput) {
                    throw new Error('Campos do formulário não encontrados');
                }

                const email = emailInput.value;
                const password = passwordInput.value;

                console.log('Valores do form:', { email, password: '***' });

                // Mostrar loading
                Swal.fire({
                    title: 'Fazendo login...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                await login(email, password);
            } catch (error) {
                console.error('Erro no submit do login:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no login',
                    text: error.message || 'Erro ao fazer login. Tente novamente.'
                });
            }
        });
    } else if (pathname.includes('login.html')) {
        console.warn('Formulário de login não encontrado na página de login');
    }

    // Form de Registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Se tiver o parâmetro type=creator, marcar checkbox automaticamente
        const isCreatorCheckbox = document.getElementById('isCreator');
        if (isCreatorCheckbox && isCreatorParam) {
            isCreatorCheckbox.checked = true;
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const username = document.getElementById('register-username').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('register-confirmPassword').value;
                const isCreator = document.getElementById('isCreator').checked;
                const termsAccepted = document.getElementById('termsAccepted').checked;

                // Validações
                if (password !== confirmPassword) {
                    showError('Senhas diferentes', 'As senhas não coincidem. Por favor, verifique.');
                    return;
                }

                if (!termsAccepted) {
                    showError('Termos não aceitos', 'Você precisa aceitar os termos de uso para criar uma conta.');
                    return;
                }

                // Mostrar loading
                Swal.fire({
                    title: 'Criando conta...',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading();
                    }
                });

                console.log('Dados do registro:', { username, email, isCreator });
                await register(username, email, password, confirmPassword, isCreator);
            } catch (error) {
                console.error('Erro no registro:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro no registro',
                    text: error.message || 'Erro ao criar conta. Tente novamente.'
                });
            }
        });
    }

    // Link de Logout
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Verificar autenticação em páginas protegidas
    const protectedPages = ['/dashboard.html', '/content-manager.html'];

    if (protectedPages.includes(pathname)) {
        if (!isLoggedIn()) {
            window.location.href = '/login.html';
        }
    }

    // Adicionar sanitização
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        const user = {
            name: 'John Doe'
        };
        const userInfoElement = document.getElementById('userInfo');
        userInfoElement.textContent = user.name;
    }
});
