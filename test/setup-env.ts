// Variáveis mínimas para a app subir nos testes e2e mesmo sem um .env local.
// Valores reais (de um .env) têm prioridade.
process.env.JWT_SECRET ??= 'segredo-somente-para-teste';
process.env.JWT_EXPIRATION ??= '15m';
// Nunca permite SMTP real nos testes e2e, mesmo com .env local configurado.
process.env.PASSWORD_RESET_MAIL_MODE = 'disabled';
// A regressão funcional não esgota limites entre cenários. A suíte de proteção
// injeta limites pequenos explicitamente e exercita o mesmo guard e banco.
for (const key of [
  'AUTH_LOGIN_IP_LIMIT',
  'AUTH_LOGIN_ACCOUNT_LIMIT',
  'AUTH_FORGOT_IP_LIMIT',
  'AUTH_FORGOT_ACCOUNT_LIMIT',
  'AUTH_RESET_IP_LIMIT',
])
  process.env[key] = '10000';
process.env.AUTH_RATE_WINDOW_SECONDS = '900';
