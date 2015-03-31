/**
 * FileController
 *
 * @description :: Server-side logic for managing Files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');

function findFile(hash, callback) {
    if (hash == undefined) {
        // Return to async.waterfall without any file.
        callback(undefined, undefined);
    }
    else {
        File.findOne({ hash: hash }).exec(function (err, file) {
            if (err) {
                // Return to async.waterfall without any file.
                callback(err, undefined);
            }
            else if (file) {
                // Return to async.waterfall without any file.
                callback(undefined, file);
            }
            else {
                // Return to async.waterfall with a file.
                callback({error: "E_NOTFOUND", summary: "File.findFile couldn't find the specified hash."}, undefined);
            }
        });
    }
}

function createFile(name, type, owner, parenthash, projectid, callback) {
    var newhash = undefined;
    var newtype = type;
    var newpath = undefined;
    var parentfile = undefined;
    var project = projectid;

    async.waterfall([
        function (callback) {
            newhash = crypto.createHash('md5').update(uuid.v1()).digest('hex');
            console.log("newhash %o", newhash);
            File.findOne({ hash: parenthash }, function(err, foundFile) {
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
            console.log("parentfile %o", parentfile);
            if (parentfile) {
                newpath = parentfile.path + "/" + newhash; // Finalize newpath
                project = parentfile.project; // Finalize project
                callback(undefined, undefined);
            }
            else if (projectid != undefined) {
                newpath = sails.config.myconf.projectsroot + "/" + newhash; // Finalize newpath
                newtype = 'directory'; // We are creating a new project root directory
                project = projectid;
                callback(undefined, undefined);
            }
            else {
                callback({ error: "E_NOTSPECIFIED" }, undefined);
            }
        },
        function (arg1, callback) {
            console.log("project " + project);
            File.create({
                hash: newhash,
                name: name,
                type: newtype,
                path: newpath,
                owner: owner,
                parent: parentfile,
                project: project
            }, function (err, newfile) {
                console.log("File.create %o", newfile);
                callback(err, newfile);
            });
        }
    ], function (err, result) {
        if (err) {
            callback(err, undefined);
        }
        else {
            callback(undefined, result);
        }
    });
}

function create(req, res) {
    var name = req.param('name') || req.options.name; // Finalize newname
    var type;
    var owner = req.session.passport.user || req.options.user; // Finalize owner
    var parenthash = req.param('parenthash') || req.options.parenthash;
    var projectid = req.param('projectid') || req.options.projectid;

    if (req.param('isdir') || req.options.isdir) {
        newtype = 'directory'
    }
    else {
        type = 'file';
    }

    createFile(name, type, owner, parenthash, projectid, function (err, file) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(200, file);
        }
    });
}

function deleteFile(hash, callback) {
    File.destroy({hash: hash}).exec(function (err) {
        callback(err);
    });
}

function deleteApi(req, res) {
    var hash = req.param('hash') || req.options.hash; // Finalize newname

    deleteFile(hash, function (err) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(200, file);
        }
    });
}

var FileController = {
    create: create,
    createFile: createFile,
    find: findFile,
    delete: deleteApi,
    deleteFile: deleteFile
};

module.exports = FileController;
