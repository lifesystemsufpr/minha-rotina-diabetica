import { ConfigService } from '@nestjs/config';

export const AUTH_RATE_POLICY = Symbol('AUTH_RATE_POLICY');
export type AuthRateAction = 'login' | 'forgot' | 'reset';
export type AuthRatePolicy = {
  windowSeconds: number;
  loginIp: number;
  loginAccount: number;
  forgotIp: number;
  forgotAccount: number;
  resetIp: number;
};

export function authRatePolicy(config: ConfigService): AuthRatePolicy {
  const integer = (key: string, fallback: number, maximum: number) => {
    const raw = config.get<string>(key);
    const value = raw === undefined ? fallback : Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
      throw new Error(
        `Configuração inválida: ${key} deve ser um inteiro entre 1 e ${maximum}.`,
      );
    }
    return value;
  };
  return {
    windowSeconds: integer('AUTH_RATE_WINDOW_SECONDS', 900, 86400),
    loginIp: integer('AUTH_LOGIN_IP_LIMIT', 30, 100000),
    loginAccount: integer('AUTH_LOGIN_ACCOUNT_LIMIT', 10, 100000),
    forgotIp: integer('AUTH_FORGOT_IP_LIMIT', 10, 100000),
    forgotAccount: integer('AUTH_FORGOT_ACCOUNT_LIMIT', 3, 100000),
    resetIp: integer('AUTH_RESET_IP_LIMIT', 20, 100000),
  };
}
