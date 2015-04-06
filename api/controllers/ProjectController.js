/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');
//var FileController = require('./FileController');

var async = require('async');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

function getFilelist(p, callback) {
    var results = [];

    fs.readdir(p, function (err, files) {
        if (err)
            throw err;

        var pending = files.length;
        if (!pending)
            return callback(null, results);

        files.map(function (file) {
            return path.join(p, file);
        }).filter(function (file) {
            if (fs.statSync(file).isDirectory()) {
                getFilelist(file, function (err, res) {
                    results.push({
                        name: path.basename(file),
                        path: path.relative(sails.config.myconf.projectsroot, file),
                        items: res,
                        spriteCssClass: "folder"
                    });
                    if (!--pending)
                        callback(null, results);
                });
            }
            return fs.statSync(file).isFile();
        }).forEach(function (file) {
            var stat = fs.statSync(file);
            var spriteCssClass = "html";

            switch (path.extname(file)) {
                case ".pdf":
                    spriteCssClass = "pdf";
                    break;
                case ".jpeg":
                case ".jpg":
                case ".png":
                    spriteCssClass = "image";
                    break;
                case ".html":
                case ".htm":
                    spriteCssClass = "html";
                    break;
            }
            results.push({
                name: path.basename(file),
                path: path.relative(sails.config.myconf.projectsroot, file),
                size: stat.size,
                spriteCssClass: spriteCssClass
            });
            if (!--pending) callback(null, results);
        });

    });
}

function defaultActionApi(req, res) {
    var param = req.param('param') || req.options.param;
    var owner = req.session.passport.user || req.options.user;

    console.log({function: "defaultActionApi", param: param});

    if (param == undefined) {
        Project.find({where: {owner: owner}}).exec(function (err, projects) {
            console.log(projects);
            if (err) {
                console.error(err);
                res.json(500, {error: err});
            }
            res.json(200, projects);
        });
    }
    else {
        var path = sails.config.myconf.projectsroot + "/" + param;
        getFilelist(path, function (err, results) {
            if (err) {
                console.error(err);
                res.json(500, {error: err});
            }
            else {
                res.json(200, results);
            }
        });
    }

}

function deleteProject(hash, owner, callback) {
    Project.destroy({hash: hash, owner: owner}).exec(function (err, deletedProjects) {
        callback(err, deletedProjects);
    });
}

function createProject(name, owner, callback) {
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

    Project.find({where: {owner: owner, name: name}}).exec(function (err, projects) {
        if (err) {
            console.error(err);
            callback(new Error("E_PROJECT_DB_ERROR"), undefined);
        }
        else if (projects && projects.length > 0) {
            callback(new Error("E_PROJECT_ALREADY_EXISTS"), undefined);
        }
        else {
            var newDirectory = sails.config.myconf.projectsroot + "/" + hash;
            mkdirp(newDirectory, function (err) { // Use temporary project ID "0" here
                if (err) {
                    callback(new Error("E_PROJECT_FSERROR"), undefined);
                }
                else {
                    Project.create({name: name, hash: hash, owner: owner}).exec(function (err, newproject) {
                        if (err) {
                            rimraf(newDirectory, function (err) {
                                callback(new Error("E_PROJECT_FS_ERROR"), undefined);
                            });
                        }
                        else {
                            callback(undefined, newproject);
                        }
                    });
                }
            });
        }
    });
}

function actionApi(req, res) {
    var action = req.param('action') || req.options.action;
    var param = req.param('param') || req.options.param;
    var user = req.session.passport.user || req.options.user;

    console.log({function: "actionApi", action: action, param: param});

    if (action == undefined) {
        res.json(500, new Error("E_PROJECT_NOACTION"));
    }
    else {
        switch (action) {
            case "delete":
                deleteProject(param, user, function (err, deletedprojects) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else if (deletedprojects && deletedprojects.length == 0) {
                        res.json(500, {err: new Error("E_PROJECT_NODELETETARGET")});
                    }
                    else {
                        console.log(deletedprojects);
                        res.json(200, {err: null, result: deletedprojects});
                    }
                });
                break;
            case "create":
                createProject(param, user, function (err, project) {
                    if (err) {
                        console.log(err);
                        res.json(500, {err: err});
                    }
                    else if (project == undefined) {
                        res.json(500, {err: new Error("E_PROJECT_NOCREATERESULT")});
                    }
                    else {
                        res.json(200, {err: null, result: project});
                    }
                });
                break;
            default:
                res.json(500, {err: new Error("E_PROJECT_UNKNOWNACTION_" + action)});
        }
    }
}

function fileActionApi(req, res) {
    var action = req.param('action') || req.options.action;
    var param = req.param('param') || req.options.param;
    var user = req.session.passport.user || req.options.user;

    console.log({function: "fileActionApi", action: action, param: param});

    if (action == undefined) {
        res.json(500, new Error("E_PROJECT_NOACTION"));
    }
    else {
        switch (action) {
            case "delete":
                rimraf(sails.config.myconf.projectsroot + "/" + param, function (err) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else {
                        res.json(200, {err: null, result: sails.config.myconf.projectsroot + param});
                    }
                });
                break;
            case "createFile":
                fs.open(sails.config.myconf.projectsroot + "/" + param, 'w', function (err) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else {
                        res.json(200, {err: null, result: sails.config.myconf.projectsroot + param});
                    }
                });
                break;
            case "createDirectory":
                mkdirp(sails.config.myconf.projectsroot + "/" + param, function (err) {
                    if (err) {
                        res.json(500, {err: err});
                        callback(err);
                    }
                    else {
                        res.json(200, {err: null, result: sails.config.myconf.projectsroot + param});
                    }
                });
                break;
            default:
                res.json(500, {err: new Error("E_PROJECT_UNKNOWNACTION_" + action)});
        }
    }
}

var ProjectController = {
    action: actionApi,
    fileAction: fileActionApi,
    defaultAction: defaultActionApi
};

module.exports = ProjectController;

