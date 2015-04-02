/**
 * FileController
 *
 * @description :: Server-side logic for managing Files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');

function infoApi(req, res) {
    var hash = req.param('hash');
    var path = req.param('path');

    if (hash) {
        File.findOne({ hash: hash }).populate('children').exec(function (err, file) {
            if (err) {
                // Return to async.waterfall without any file.
                res.json(500, err);
            }
            else if (file) {
                // Return to async.waterfall without any file.
                res.json(200, file);
            }
            else {
                res.json(500, {});
            }
        });
    }
    else if (path) {
        File.findOne({ path: path }).populate('children').exec(function (err, file) {
            if (err) {
                // Return to async.waterfall without any file.
                res.json(500, err);
            }
            else if (file) {
                // Return to async.waterfall without any file.
                res.json(200, file);
            }
            else {
                res.json(500, {});
            }
        });
    }
}

function createFile(name, type, owner, parenthash, callback) {
    var newname = name;
    var newhash = undefined;
    var newtype = type;
    var newpath = undefined;
    var parentfile = undefined;

    async.waterfall([
        function (callback) {
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
            newhash = crypto.createHash('md5').update(uuid.v1()).digest('hex');

            if (parentfile && parentfile.type == "directory") {
                newpath = parentfile.path + "/" + newname; // Finalize newpath
                callback(undefined, undefined);
            }
            else if (parenthash == "NEW_PROJECT_fLi1GutAbO4aMveH") {
                newname = newhash;
                newpath = sails.config.myconf.projectsroot + "/" + newname; // This is a project name. Use hash as the directory name
                newtype = 'directory'; // We are creating a new project root directory
                callback(undefined, undefined);
            }
            else {
                callback({ error: "E_NOPARENT" }, undefined)
            }
        },
        function (arg1, callback) {
            File.create({
                hash: newhash,
                name: newname,
                type: newtype,
                path: newpath,
                owner: owner,
                parent: parentfile,
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

function create(req, res) {
    var name = req.param('name') || req.options.name; // Finalize newname
    var type = req.param('type') || req.options.type;
    var owner = req.session.passport.user || req.options.user; // Finalize owner
    var parenthash = req.param('parenthash') || req.options.parenthash;

    if (type == undefined) {
        type = 'file';
    }

    createFile(name, type, owner, parenthash, function (err, file) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(200, file);
        }
    });
}

function deleteApi(req, res) {
    var hash = req.param('hash') || req.options.hash;
    var name = req.param('path') || req.options.path;

    if (hash) {
        File.destroy({hash: hash}).exec(function (err) {
            if (err) {
                res.json(500, err);
            }
            else {
                res.json(200, file);
            }
        });
    }
    else if (name) {
        File.destroy({name: path}).exec(function (err) {
            if (err) {
                res.json(500, err);
            }
            else {
                res.json(200, file);
            }
        });

    }
}

var FileController = {
    create: create,
    createFile: createFile,
    info: infoApi,
    delete: deleteApi,
};

module.exports = FileController;
