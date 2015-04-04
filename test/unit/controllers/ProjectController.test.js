var ProjectController = require('../../../api/controllers/ProjectController');
var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

describe('The Project Model', function () {
    var agent;

    before(function (callback) {
        agent = request.agent("http://localhost:1337");
        agent.get("/auth/google/callback")
            .end(callback);
    });

    describe('When the project is created', function () {
        var parsed;

        it ('A new project must be returned as JSON', function (callback) {
            agent.get("/projects/!create/Test")
                .expect(200)
                .end(function(err, res) {
                    parsed = JSON.parse(res.text);
                    if (parsed.hash == undefined) {
                        callback(new Error("E_INVALIDJSON"));
                    }
                    else if (err) {
                        callback(err);
                    }
                    else {
                        console.log(parsed);
                        callback();
                    }
                });
        });
    });

    describe('When the project with an existing name is created', function () {
        var parsed;

        it ('Error should be returned as JSON', function (callback) {
            agent.get("/projects/!create/Test")
                .expect(500)
                .end(function(err, res) {
                    parsed = JSON.parse(res.text);
                    if (parsed.error == undefined) {
                        callback(new Error("E_INVALIDJSON" ));
                    }
                    else if (err) {
                        callback(err);
                    }
                    else {
                        console.log(parsed);
                        callback();
                    }
                });
        });
    });
});