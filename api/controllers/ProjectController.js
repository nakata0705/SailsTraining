/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var projectdir = "projects";

var uuid = require('node-uuid');
var crypto = require('crypto');
var FileController = require('./FileController');

function findProject(hash, callback) {
    if (hash == undefined) {
        callback({ error: "E_NOTSPECIFIED" }, undefined);
    }
    else {
        Project.findOne({hash: hash}).exec(function (err, project) {
            console.log("Project.find returns %o", project);
            console.log("Project.find returns %o", err);
            if (err) {
                console.log("returning err");
                callback(err, undefined);
            }
            else if (project) {
                console.log("returning project");
                callback(undefined, project);
            }
            else {
                console.log("returning notfound");
                callback({ error: "E_NOTFOUND" }, undefined);
            }
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

function createProject(name, hash, owner, callback) {
    Project.findOne({hash: hash}).exec(function (err, project) {
        if (err) {
            callback(err, undefined);
        }
        else if (project) {
            callback({ error: "E_ALREADYEXISTS", summary: "A project with the specified hash already exists."}, project);
        }
        else {
            Project.create({hash: hash, name: name, owner: owner}).exec(function (err, project) {
                if (err) {
                    callback(err, undefined);
                }

                FileController.createFile(name, 'directory', owner, undefined, hash, function(err, file) {
                    if (err) {
                        callback(err, undefined);
                    }
                    else {
                        callback(undefined, project);
                    }
                });
            });
        }
    });
}

function create(req, res) {
    var newname = req.param('name') || req.options.name;
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');
    var owner = req.session.passport.user || req.options.user;

    createProject(newname, hash, owner, function(err, project) {
        if (err) {
            console.error(err);
            res.json(500, err);
        }
        else {
            res.json(200, project);
        }
    });
}

var ProjectController = {
    find: findProject,
    list: listProject,
    delete: deleteProject,
    create: create,
    createProject: createProject
}

module.exports = ProjectController;

