const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');

const analyzeCode = () => {
  exec('eslint . --format json --output-file ./logs/linter-report.json', (error) => {
    if (error) {
      fs.appendFileSync('./logs/analysis.log', `[${new Date().toISOString()}] Erros encontrados:\n${error}\n\n`);
    } else {
      fs.appendFileSync('./logs/analysis.log', `[${new Date().toISOString()}] Análise concluída sem erros críticos\n`);
    }
  });
};

// Agendar para rodar diariamente às 2AM
cron.schedule('0 2 * * *', analyzeCode);

module.exports = analyzeCode;
