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

    console.log("name " + name + " type " + type + " owner " + owner + " parentpath " + parentpath);

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
            console.log("parentfile %o " + parentfile);

            if (parentfile && parentfile.type == "directory") {
                newpath = parentfile.path + "/" + newname; // Finalize newpath
                callback(undefined, undefined);
            }
            else if (parentpath == "NEW_PROJECT_fLi1GutAbO4aMveH") {
                newpath = "/" + crypto.createHash('md5').update(uuid.v1()).digest('hex'); // This is a project name. Use hash as the directory name
                newtype = 'directory'; // We are creating a new project root directory
                callback(undefined, undefined);
            }
            else {
                callback({ error: "E_NOPARENT" }, undefined)
            }
        },
        function (arg1, callback) {
            console.log("newpath " + newpath + " newtype " + newtype + " owner " + owner + " parent " + parentfile);
            File.create({
                type: newtype,
                path: newpath,
                owner: owner,
                parent: parentfile
            }, function (err, newfile) {
                console.log("File.create %o", newfile);
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

    if (path == undefined) {
        res.json(500, { error: "E_NOPATH" });
    }
    else if (action == undefined) {
        res.json(500, { error: "E_NOACTION" });
    }

    switch (action) {
        case "delete":
            deleteFile(path, user, function(err) {
                if (err) {
                    res.json(500, err);
                }
                else {
                    res.json(200, {});
                }
            });
            break;
        case "createfile":
            createFile(path, actionparam, user, function(err, file) {
                if (err) {
                    res.json(500, err);
                }
                else {
                    res.json(200, file);
                }
            });
            break;
        case "createdirectory":
            createDirectory(path, actionparam, user, function(err, file) {
                if (err) {
                    res.json(500, err);
                }
                else {
                    res.json(200, file);
                }
            });
            break;
        default:
            res.json(500, { error: "E_UNKNOWNACTION_" + action })
    }
}

function viewApi(req, res) {
    var path = req.param('path');
    console.log("path " + path);

    if (path ==  undefined) {
        res.json(500, { error: "E_NOFILE"});
    }
    else {
        File.findOne({ path: path }).populate('children').exec(function(err, foundFile) {
            if (err) {
                res.json(500, err);
            }
            else if (foundFile == undefined) {
                res.json(500, {error: "E_NOFILE"});
            }
            else {
                if (foundFile.type == "directory") {
                    res.json(200, foundFile.children);
                }
                else {
                    res.sendfile(sails.config.myconf.projectsroot + foundFile.path);
                }
            }
        });
    }
}

var FileController = {
    createDirectory: createDirectory,
    action: actionApi,
    view: viewApi
};

module.exports = FileController;
