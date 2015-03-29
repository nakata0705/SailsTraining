/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var projectdir = "projects";

var uuid = require('node-uuid');
var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var FileController = require('./FileController');

function findProject(hash, callback) {
    if (hash == undefined) {
        callback(null, undefined);
    }
    else {
        Project.find({hash: hash}).exec(function (err, projects) {
            if (err) {
                callback(err, undefined);
            }
            else if (projects.length != 1) {
                callback(err, undefined);
            }
            callback(null, projects[0]);
        });
    }
}

function listProject(req, res) {
    var default_project_limit = 20;
    var find_limit = req.param('limit') || req.options.limit;
    var find_from = req.param('from') || req.options.from;

    if (find_limit === undefined || isNumeric(find_limit) != true) {
        find_limit = default_project_limit;
    }
    if (find_from === undefined || isNumeric(find_from) != true) {
        find_from = 0;
    }

    Project.find({where: {}, from: find_from, limit: find_limit}).exec(function (err, projects) {
        if (err) {
            console.error(err);
            res.json(500, {});
        }
        res.json(200, projects);
    });
}

function deleteProject(req, res) {
    var hash = req.param('id') || req.options.id;
    if (hash == undefined) {
        res.json(500, {result: 'error', error: "id isn't specified."})
    }

    Project.destroy({hash: hash}).exec(function (err) {
        if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
        }
        fs.realpath('./', {}, function (err, resolvedPath) {
            if (err) {
                console.error(err);
                res.json(500, {result: "error", error: err});

            }
            rimraf(resolvedPath + "/" + projectdir + "/" + project_id, function (err) {
                if (err) {
                    console.error(err);
                    res.json(500, {result: "error", error: err});
                }
                res.json(200, {result: "success"});
            });
        });
    });
}

function createProject (req, res) {
    var newname = req.param('name') || req.options.name;
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

    Project.find({hash: hash}).exec(function (err, projects) {
        if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
        }
        if (projects.length > 0) {
            console.log("Project already exists.");
            res.json(500, projects);
        }
        Project.create({hash: hash, name: newname, owner: req.session.passport.user}).exec(function (err, project) {
            if (err) {
                console.error(err);
                res.json(500, {result: "error", error: err});
            }

            console.log("calling File.create");

            req.options.parenthash = undefined;
            req.options.project = hash;
            req.options.isdir = true;

            FileController.create(req, res);
            /*fs.realpath('./', {}, function (err, resolvedPath) {
             if (err) {
             console.error(err);
             res.json(500, {result: "error", error: err});
             }
             mkdirp(resolvedPath + "/" + projectdir + "/" + hash, function (err) {
             if (err) {
             console.error(err);
             Project.destroy({hash: hash}).exec(function (err) {
             if (err) {
             console.error(err);
             res.json(500, {result: "error", error: err});
             }
             res.json(500, {result: "error", error: err});
             });
             }
             res.json(200, {result: "success"});
             });
             });*/
        });
    });
}

var ProjectController = {
    find: findProject,
    list: listProject,
    delete: deleteProject,
    create: createProject
}

module.exports = ProjectController;

