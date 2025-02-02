// Configuração global do axios
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para adicionar o token JWT
if (localStorage.getItem('token')) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
}

// Interceptor para tratar erros
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Erro do servidor
            if (error.response.status === 401) {
                // Token expirado ou inválido
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        }
        return Promise.reject(error);
    }
);
