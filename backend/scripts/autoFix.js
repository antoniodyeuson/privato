const eslint = require('eslint');
const { CLIEngine } = eslint;

const cli = new CLIEngine({
  fix: true,
  ignorePath: '.gitignore'
});

const report = cli.executeOnFiles(['.']);
CLIEngine.outputFixes(report);
