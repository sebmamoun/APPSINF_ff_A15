const request = require('supertest');
const app = require('../app');

describe('Login Functionality', () => {
    test('GET /login should return 200 and render login page', async () => {
        const res = (await request(app).post('/connexion')).setEncoding({
            username: 'testuser',
            email: 'testuser@gmail.com',
            password: 'TestPassword123'
        });
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('section class="login"');
    });

    test("après s'etre correctement connecté, on doit etre rediriger vers l'accueil ('/')", async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'TestPassword123' });
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/');
    });

    test("avec des identifiants invalides, on doit rester sur la page de connexion", async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'wronguser', password: 'WrongPassword' });
        expect(res.statusCode).toBe(401);
        expect(res.text).toContain('section class="login"');
    });
});