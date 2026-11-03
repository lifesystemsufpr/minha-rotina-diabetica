import { ConfigService } from '@nestjs/config';
import { authRatePolicy } from './auth-rate-policy';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
const config = (values: Record<string, string> = {}) =>
  ({ get: (key: string) => values[key] }) as ConfigService;

describe('Configuração dos limites', () => {
  it('inicia com limites ativos mesmo sem variáveis opcionais', () => {
    expect(authRatePolicy(config())).toEqual({
      windowSeconds: 900,
      loginIp: 30,
      loginAccount: 10,
      forgotIp: 10,
      forgotAccount: 3,
      resetIp: 20,
    });
  });
  it('permite ajustar a política sem desativar o guard', () => {
    expect(
      authRatePolicy(
        config({ AUTH_LOGIN_IP_LIMIT: '50', AUTH_RATE_WINDOW_SECONDS: '60' }),
      ),
    ).toMatchObject({ loginIp: 50, windowSeconds: 60 });
  });
  it.each(['0', '-1', '', 'NaN', '1.5', 'Infinity', '100001'])(
    'recusa cota inválida %j em vez de deixar a autenticação desprotegida',
    (value) => {
      expect(() =>
        authRatePolicy(config({ AUTH_LOGIN_IP_LIMIT: value })),
      ).toThrow('AUTH_LOGIN_IP_LIMIT');
    },
  );
  it('recusa janela excessiva ou fracionária', () => {
    for (const value of ['86401', '0.5'])
      expect(() =>
        authRatePolicy(config({ AUTH_RATE_WINDOW_SECONDS: value })),
      ).toThrow('AUTH_RATE_WINDOW_SECONDS');
  });
});
