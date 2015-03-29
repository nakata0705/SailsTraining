/**
 * FileController
 *
 * @description :: Server-side logic for managing Files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid');
var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var async = require('async');
var ProjectController = require('./ProjectController');

function createFileHash(callback, results) {
    var newhash = crypto.createHash('md5').update(uuid.v1()).digest('hex');
    File.find({hash: newhash}).exec(function (err, files) {
        if (err) {
            console.error(err);
            callback(err, undefined);
        }
        else if (files.length != 0) {
            console.error("The new hash is not unique");
            callback("error", undefined);
        }
        else {
            callback(null, newhash);
        }
    });
}

function createUniqueHash(callback) {
    var newhash = undefined;
    async.whilst(
        function () {
            return newhash == undefined
        },
        function (callback_whilst) {
            newhash = crypto.createHash('md5').update(uuid.v1()).digest('hex');
            File.find({hash: newhash}).exec(function (err, files) {
                if (err) {
                    newhash = undefined;
                    console.log('File.find error');
                    callback_whilst(err);
                }
                else if (files.length != 0) {
                    newhash = undefined;
                    console.log('The new hash already exists');
                    callback_whilst({required: 'The hash already in use.'});
                }
                else {
                    // Success. newhash has a valid value
                    callback_whilst();
                }
            });
        },
        function (err) {
            // Return to async.waterfall
            callback(err, newhash);
        }
    );
}

function findFile(hash, callback) {
    if (hash == undefined) {
        // Return to async.waterfall without any file.
        callback(undefined, undefined);
    }
    else {
        File.findOne({hash: hash}).exec(function (err, file) {
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
                callback({ error: "E_NOTFOUND", summary: "File.findFile couldn't find the specified hash." }, undefined);
            }
        });
    }
}

function createFile(req, res) {
    console.log("createFile");

    var newhash = undefined;
    var newname = req.param('name') || req.options.name; // Finalize newname
    var newtype = 'file';
    var newpath = undefined;
    var owner = req.session.passport.user; // Finalize owner
    var parentfile = undefined;
    var project = undefined;

    if (req.param('isdir') || req.options.isdir != undefined) {
        newtype = 'directory'; // Finalize newtype
    }

    var parenthash = req.param('parenthash') || req.options.parenthash;
    var projecthash = req.param('projecthash') || req.options.projecthash;

    console.log("projecthash %o", projecthash);

    async.waterfall([
        function (callback) {
            console.log("createuniquehash");
            createUniqueHash(callback);
        },
        function (arg1, callback) {
            newhash = arg1;
            console.log("newhash %o", newhash);
            findFile(parenthash, callback);
        },
        function (arg1, callback) {
            parentfile = arg1; // Finalize parentfile
            console.log("parentfile %o", parentfile);
            if (parentfile) {
                newpath = parentfile.path + "/" + newhash; // Finalize newpath
                project = parentfile.project; // Finalize project
                callback(undefined, undefined);
            }
            else {
                newpath = sails.config.myconf.projectsroot + "/" + newhash; // Finalize newpath
                newtype = 'directory'; // We are creating a new project root directory
                ProjectController.find(projecthash, function(err, result) {
                    if (err) {
                        project = undefined;
                        callback(err, undefined);
                    }
                    else if (result) {
                        project = result;
                        callback(undefined, undefined);
                    }
                    else {
                        console.log("projecthash " + projecthash + " not found");
                        project = undefined;
                        callback({ error: "E_NOTFOUND", summary: "Couldn't find parent project from the project hash." }, undefined);
                    }
                });
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
                project: project
            }, function (err, newfile) {
                console.log("File.create %o", newfile);
                callback(err, newfile);
            });
        }
    ], function (err, result) {
        if (err) {
            res.json(500, err);
        }
        else {
            res.json(200, result);
        }
    });
}

var FileController = {
    create: createFile,
    find: findFile
};

module.exports = FileController;
