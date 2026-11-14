// Regra mínima de senha do protótipo (manual da Sprint 2, §18): pelo menos
// uma letra e um número. O tamanho (8 a 72) fica no DTO; 72 é o limite do bcrypt.
export const PASSWORD_PATTERN = /(?=.*[A-Za-z])(?=.*\d)/;
export const PASSWORD_PATTERN_MESSAGE = 'senha deve conter letras e números';
