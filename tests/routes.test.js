const request = require("supertest");
const app = require("../server.js");
const Incident = require("../server.js").models?.Incident || require("mongoose").model("Incident");

test("GET / doit répondre 200", async () => {
  Incident.find = jest.fn().mockResolvedValue([]);

  const res = await request(app).get("/");
  expect(res.status).toBe(200);
});

test("GET /connexion doit répondre 200", async () => {
  const res = await request(app).get("/connexion");
  expect(res.status).toBe(200);
});

test("GET /game doit répondre 200", async () => {
  const res = await request(app).get("/game");
  expect(res.status).toBe(200);
});

test("GET /ajout doit répondre 200", async () => {
  const res = await request(app).get("/ajout");
  expect(res.status).toBe(200);
});