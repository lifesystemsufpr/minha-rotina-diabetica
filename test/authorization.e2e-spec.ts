const rotasPrivadas: Array<[string, string]> = [
  ['get', '/api/users/me'],
  ['delete', '/api/users/me'],
  ['get', '/api/profile'],
  ['patch', '/api/profile'],
  ['post', '/api/glycemias'],
  ['get', '/api/glycemias'],
  ['get', `/api/glycemias/${UUID}`],
  ['patch', `/api/glycemias/${UUID}`],
  ['delete', `/api/glycemias/${UUID}`],
  ['post', '/api/insulin-applications'],
  ['get', '/api/insulin-applications'],
  ['get', `/api/insulin-applications/${UUID}`],
  ['patch', `/api/insulin-applications/${UUID}`],
  ['delete', `/api/insulin-applications/${UUID}`],
];

it.each(rotasPrivadas)('%s %s sem token retorna 401', async (metodo, rota) => {
  await request(app.getHttpServer())[metodo](rota).expect(401);
});

it.each(rotasPrivadas)('%s %s com token inválido retorna 401', async (metodo, rota) => {
  await request(app.getHttpServer())
    [metodo](rota)
    .set('Authorization', 'Bearer token.invalido.aqui')
    .expect(401);
});