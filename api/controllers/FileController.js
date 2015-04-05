/**
 * FileController
 *
 * @description :: Server-side logic for managing Files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');

function create(name, type, owner, parentpath, callback) {
    var newname = name;
    var newtype = type;
    var newpath = null;
    var parentfile = null;

    async.waterfall([
        function (callback) {
            File.findOne({ path: parentpath }).exec(function(err, foundFile) {
                if (err) {
                    callback(err, undefined);
                }
                else {
                    callback(err, foundFile);
                }
            });
        },
        function (arg1, callback) {
            parentfile = arg1; // Finalize parentfile

            if (parentfile && parentfile.type == "directory") {
                newpath = parentfile.path + "/" + newname; // Finalize newpath
                callback(undefined, undefined);
            }
            else if (parentpath == "NEW_PROJECT_fLi1GutAbO4aMveH") {
                newpath = "/" + newname; // This is a project name. Use hash as the directory name
                newtype = 'directory'; // We are creating a new project root directory
                callback(undefined, undefined);
            }
            else {
                callback({ error: "E_NOPARENT" }, undefined)
            }
        },
        function (arg1, callback) {
            File.create({
                type: newtype,
                path: newpath,
                owner: owner,
                parent: parentfile
            }, function (err, newfile) {
                callback(err, newfile);
            });
        }
    ], function (err, result) {
        if (err) {
            console.error(err);
            callback(err, undefined);
        }
        else {
            callback(undefined, result);
        }
    });
}

function createFile(path, name, owner, callback) {
    create(name, "file", owner, path, function (err, file) {
        if (err) {
            callback(err);
        }
        else {
            callback(undefined, file);
        }
    });
}

function createDirectory(path, name, owner, callback) {
    create(name, "directory", owner, path, function (err, file) {
        if (err) {
            callback(err);
        }
        else {
            callback(undefined, file);
        }
    });
}

function deleteFile(path, user, callback) {
    if (path == undefined) {
        callback({error: "E_NOPATH"});
    }
    else {
        // ToDo: Check ownership properly
        File.destroy({ path: path, owner: user }).exec(function (err) {
            callback(err);
        });
    }
}

function actionApi(req, res) {
    var path = req.param('path') || req.options.path;
    var action = req.param('action') || req.options.action;
    var actionparam = req.param('actionparam') || req.options.actionparam;
    var user = req.session.passport.user || req.options.user;

    console.log("FileController.actionApi");

    if (path == undefined) {
        res.json(500, { error: "E_NOPATH" });
    }
    else if (action == undefined) {
        res.json(500, { error: "E_NOACTION" });
    }
    else {
        switch (action) {
            case "delete":
                deleteFile(path, user, function (err) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else {
                        res.json(200, {err: null});
                    }
                });
                break;
            case "createfile":
                createFile(path, actionparam, user, function (err, file) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else {
                        res.json(200, {err: null, result: file});
                    }
                });
                break;
            case "createdirectory":
                createDirectory(path, actionparam, user, function (err, file) {
                    if (err) {
                        res.json(500, {err: err});
                    }
                    else {
                        res.json(200, {err: null, result: file});
                    }
                });
                break;
            default:
                res.json(500, {error: "E_UNKNOWNACTION_" + action})
        }
    }
}

function viewApi(req, res) {
    var path = req.param('path');

    if (path ==  undefined) {
        res.json(500, { error: "E_NOFILE", cause: "FileController.viewApi" });
    }
    else {
        File.findOne({ path: path }).exec(function(err, foundFile) {
            if (err) {
                res.json(500, {err: err});
            }
            else if (foundFile == undefined) {
                res.json(500, {err: new Error("E_NOFILE")});
            }
            else {
                File.populate(foundFile, function (err) {
                    if (err) {
                        res.json(500, {err: err})
                    }
                    else if (foundFile.type == "directory") {
                        var data = { data: foundFile.items };
                        res.json(200, {err: null, data: data});
                    }
                    else {
                        res.sendfile(sails.config.myconf.projectsroot + foundFile.path, {}, function (err) {
                            if (err) {
                                res.json(500, {err: err});
                            }
                            else {
                                res.json(200, {err: null});
                            }
                        });
                    }
                });
            }
        });
    }
}

var FileController = {
    action: actionApi,
    createDirectory: createDirectory,
    view: viewApi
};

module.exports = FileController;
