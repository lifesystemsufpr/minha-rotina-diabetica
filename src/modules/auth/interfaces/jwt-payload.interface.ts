export interface JwtPayload {
  ver: number;
  sub: string; // id do usuário (ajuste o tipo se o seu id for number)
}

export interface AuthUser {
  id: string;
}
