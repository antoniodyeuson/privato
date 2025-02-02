const WebSocket = require('ws');

exports.initializeWebSocket = (wss) => {
    wss.on('connection', (ws) => {
        console.log('Nova conexão WebSocket estabelecida');

        ws.on('message', (message) => {
            console.log('Mensagem recebida:', message);
        });

        ws.on('close', () => {
            console.log('Conexão WebSocket fechada');
        });
    });
};
