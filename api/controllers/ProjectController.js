/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');
var FileController = require('./FileController');

function viewApi(req, res) {
    var owner = req.session.passport.user || req.options.user;

    Project.find({ where: { owner: owner } }).exec(function (err, projects) {
        console.log(projects);
        if (err) {
            console.error(err);
            res.json(500, {});
        }
        res.json(200, projects);
    });
}

function deleteProject(hash, owner, callback) {
    Project.destroy({ hash: hash, owner: owner }).exec(function (err, deletedProjects) {
        callback(err, deletedProjects);
    });
}

function createProject(name, owner, callback) {
    var hash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

    FileController.createDirectory("NEW_PROJECT_fLi1GutAbO4aMveH", hash, owner, function(err, newfile) { // Use temporary project ID "0" here
        if (err) {
            callback(err, undefined);
        }
        else {
            Project.create({ name: name, hash: hash, owner: owner, rootdir: newfile }).exec(function (err, newproject) {
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

function actionApi(req, res) {
    var action = req.param('action') || req.options.action;
    var actionparam = req.param('actionparam') || req.options.actionparam;
    var user = req.session.passport.user || req.options.user;

    if (action == undefined) {
        res.json(500, { error: "E_NOACTION" });
    }

    switch (action) {
        case "delete":
            deleteProject(actionparam, user, function(err) {
                if (err) {
                    res.json(500, err);
                }
                else {
                    res.json(200, {});
                }
            });
            break;
        case "create":
            createProject(actionparam, user, function(err, project) {
                if (err) {
                    res.json(500, err);
                }
                else {
                    res.json(200, project);
                }
            });
            break;
        default:
            res.json(500, { error: "E_UNKNOWNACTION_" + action })
    }

}

var ProjectController = {
    action: actionApi,
    view: viewApi
};

module.exports = ProjectController;

