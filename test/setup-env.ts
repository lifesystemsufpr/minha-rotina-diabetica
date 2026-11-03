// Variáveis mínimas para a app subir nos testes e2e mesmo sem um .env local.
// Valores reais (de um .env) têm prioridade.
process.env.JWT_SECRET ??= 'segredo-somente-para-teste';
process.env.JWT_EXPIRATION ??= '15m';
// Nunca permite SMTP real nos testes e2e, mesmo com .env local configurado.
process.env.PASSWORD_RESET_MAIL_MODE = 'disabled';
