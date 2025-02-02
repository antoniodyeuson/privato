# Privato - Plataforma de Conteúdo

Privato é uma plataforma de conteúdo que permite que criadores compartilhem e monetizem seu conteúdo digital, enquanto usuários podem descobrir e consumir conteúdo exclusivo.

## 🚀 Funcionalidades

### Para Criadores
- 👤 Perfil personalizado
- 📝 Upload de conteúdo (imagens e vídeos)
- 💰 Monetização de conteúdo
- 📊 Dashboard com estatísticas
- 🏷️ Sistema de tags
- 📈 Análise de visualizações

### Para Usuários
- 🔍 Descoberta de conteúdo
- ⭐ Sistema de favoritos
- 💳 Pagamentos seguros
- 🎯 Conteúdo personalizado
- 🏅 Sistema de fidelidade

### Recursos Gerais
- 🔐 Autenticação segura
- 🌐 Interface responsiva
- 🎨 Design moderno
- 📱 Compatível com dispositivos móveis
- 🔔 Notificações em tempo real

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js
- Express
- MongoDB
- JWT para autenticação
- Multer para upload de arquivos
- Mongoose para modelagem de dados

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Axios para requisições HTTP
- SweetAlert2 para notificações

## 📦 Instalação

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITÓRIO]
```

2. Instale as dependências do backend
```bash
cd backend
npm install
```

3. Configure as variáveis de ambiente
```bash
# Crie um arquivo .env na pasta backend com:
PORT=3000
MONGODB_URI=sua_url_mongodb
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=90d
```

4. Inicie o servidor backend
```bash
npm run dev
```

5. Abra o frontend em um servidor local
```bash
# Use um servidor local como Live Server do VS Code
# ou http-server
cd frontend
live-server
```

## 🔧 Configuração

### Requisitos do Sistema
- Node.js 14+
- MongoDB 4.4+
- NPM ou Yarn
- Navegador moderno com suporte a ES6+

### Estrutura de Diretórios
```
privato/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── public/
│   │   └── uploads/
│   └── temp/
└── frontend/
    ├── js/
    ├── css/
    └── img/
```

## 🔒 Segurança

- Autenticação JWT
- Proteção contra CSRF
- Sanitização de entrada
- Upload seguro de arquivos
- Validação de dados
- Rate limiting

## 📝 Convenções de Código

- Nomenclatura em inglês
- Padrão de commits semânticos
- ESLint para padronização
- Documentação JSDoc
- Testes unitários

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Antonio Dyeuson** - *Desenvolvedor Full Stack* - [GitHub](https://github.com/seugithub)

## 📞 Suporte

Para suporte, envie um email para antonio.dyeuson@gmail.com ou abra uma issue no GitHub.
