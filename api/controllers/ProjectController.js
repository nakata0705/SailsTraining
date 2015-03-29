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

function createProject (req, res) {
    var newname = req.param('name') || req.options.name;
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

    Project.find({hash: hash}).exec(function (err, projects) {
        if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
        }
        else if (projects.length > 0) {
            console.log("Project already exists.");
            res.json(500, projects);
        }
        else {
            Project.create({hash: hash, name: newname, owner: req.session.passport.user}).exec(function (err, project) {
                if (err) {
                    console.error(err);
                    res.json(500, {result: "error", error: err});
                }

                req.options.parenthash = undefined;
                req.options.projecthash = hash;
                req.options.isdir = true;

                // This function returns JSON response
                console.log("FileController.create");
                FileController.create(req, res);
            });
        }
    });
}

var ProjectController = {
    find: findProject,
    list: listProject,
    delete: deleteProject,
    create: createProject
}

module.exports = ProjectController;

