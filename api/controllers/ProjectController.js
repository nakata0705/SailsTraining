/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

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

function deleteProject(hash, callback) {
    Project.destroy({ hash: hash }).exec(function (err, deletedProjects) {
        callback(err, deletedProjects);
    });
}

function deleteApi(req, res) {
    var hash = req.param('hash') || req.options.id;
    if (hash == undefined) {
        res.json(500, {result: 'error', error: "id isn't specified."})
    }

    deleteProject(hash, function(err, deletedProjects) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(200, deletedProjects);
        }
    });
}

function createProject(name, owner, callback) {
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

    FileController.createDirectory("NEW_PROJECT_fLi1GutAbO4aMveH", hash, owner, function(err, newfile) { // Use temporary project ID "0" here
        if (err) {
            callback(err, undefined);
        }
        else {
            Project.create({ name: name, hash: hash, root: newfile }).exec(function (err, newproject) {
                if (err) {
                    File.delete(newfile.id, function (err) {
                        callback(err, undefined);
                    });
                }
                else {
                    callback(undefined, newproject);
                }
            });
        }
    });
}

function createApi(req, res) {
    var newname = req.param('name') || req.options.name;
    var owner = req.session.passport.user || req.options.user;

    createProject(newname, owner, function(err, project) {
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
    delete: deleteApi,
    deleteProject: deleteProject,
    create: createApi,
    createProject: createProject
};

module.exports = ProjectController;

