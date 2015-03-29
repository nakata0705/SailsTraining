var ProjectController = require('../../../api/controllers/ProjectController');
var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

describe('The Project Model', function () {
    describe('when the project is created', function () {
        it ('the unique hash must be generated', function (done) {
            request(sails.hooks.http.app).post('/project/create')
                .send({name: 'New Project'})
                .expect(200, done);
        });
    });
});