const request = require('supertest');
const app = require('./index');

describe('GET /', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
    });
});

describe('GET /profile', ()=> {
    it('should redirect to /connexion if not logged in', async () => {
        const res = await request(app).get('/profile');
        expect(res.headers.location).toEqual('/connexion');
    }); 
});

describe('GET /ajout', ()=> {
    it('should redirect to /connexion if not logged in', async () => {
        const res = await request(app).get('/ajout');
        expect(res.headers.location).toEqual('/connexion');
    }); 
});

