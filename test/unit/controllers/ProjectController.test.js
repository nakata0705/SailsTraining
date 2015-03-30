var ProjectController = require('../../../api/controllers/ProjectController');
var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

describe('The Project Model', function () {
    var agent;

    before(function (done) {
        agent = request.agent("http://localhost:1337");
        agent
            .get("/auth/google/callback")
            .end(done);
    });

    describe('when the project is created', function () {
        it ('the unique hash must be generated', function (done) {
            agent.post('/project/create')
                .send({name: 'New Project'})
                .expect(200)
                .end(done);
        });
    });
});