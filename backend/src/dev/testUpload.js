const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function login() {
    try {
        const response = await axios.post('http://localhost:3000/api/users/login', {
            email: 'creator@example.com',
            password: 'password123'
        });
        return response.data.token;
    } catch (error) {
        console.error('Erro ao fazer login:', error.response?.data || error.message);
        throw error;
    }
}

async function testUpload() {
    try {
        // Fazer login e obter token
        const token = await login();
        console.log('Login realizado com sucesso');
        
        // Criar uma imagem de teste usando canvas
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');

        // Desenhar um retângulo vermelho
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 200, 200);

        // Salvar a imagem temporariamente
        const buffer = canvas.toBuffer('image/png');
        const tempImagePath = path.join(__dirname, 'test.png');
        fs.writeFileSync(tempImagePath, buffer);
        
        // Criar FormData
        const formData = new FormData();
        formData.append('title', 'Teste de Upload');
        formData.append('description', 'Testando upload de imagem');
        formData.append('price', '10');
        formData.append('file', fs.createReadStream(tempImagePath));

        // Fazer requisição
        const response = await axios.post('http://localhost:3000/api/content', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload realizado com sucesso:', response.data);

        // Remover arquivo temporário
        fs.unlinkSync(tempImagePath);
    } catch (error) {
        console.error('Erro ao fazer upload:', error.response?.data || error.message);
    }
}

testUpload();
