var ProjectController = require('../../../api/controllers/ProjectController');
var sinon = require('sinon');
var assert = require('assert');
var request = require('supertest');

describe('The Project Model', function () {
    var agent;
    var newproject;

    before(function (callback) {
        agent = request.agent("http://localhost:1337");
        agent.get("/auth/google/callback").end(callback);
    });

    describe('When the project is created', function () {
        it ('A new project must be returned as JSON', function (callback) {
            agent.get("/projects/UnitTest/!create")
                .expect(200)
                .end(function(err, res) {
                    newproject = JSON.parse(res.text);
                    if (newproject.result.hash == undefined) {
                        console.log(res.text);
                        callback(new Error("E_INVALIDJSON"));
                    }
                    else if (err) {
                        callback(err);
                    }
                    else {
                        console.log(newproject);
                        callback();
                    }
                });
        });
    });

    describe('When the project with an existing name is created', function () {
        it ('Error should be returned as JSON', function (callback) {
            agent.get("/projects/UnitTest/!create")
                .expect(500)
                .end(function(err, res) {
                    var parsed = JSON.parse(res.text);
                    if (parsed == undefined) {
                        console.log(res.text);
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

    describe('When the non-existent project is deleted', function () {
        it('Error should be returned as JSON', function (callback) {
            agent.get("/projects/00000000000000000000000000000000/!delete")
                .expect(500)
                .end(function (err, res) {
                    var parsed = JSON.parse(res.text);
                    if (parsed == undefined) {
                        console.log(res.text);
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

    describe('When the existent project is deleted', function () {
        it('Deleted project should be returned as JSON', function (callback) {
            agent.get("/projects/" + newproject.result.hash + "/!delete")
                .expect(200)
                .end(function (err, res) {
                    var parsed = JSON.parse(res.text);
                    if (parsed == undefined) {
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

});