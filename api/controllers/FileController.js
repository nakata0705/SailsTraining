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
    async.retry(5, createFileHash, function(err, result) {
        if (err) {
            console.error(err);
            calback(err, undefined);
        }
        else {
            callback(null, result);
        }
    });
}

function findFile(hash, callback) {
    console.log("hash " + hash);
    if (hash == undefined) {
        callback(null, undefined);
    }
    else {
        File.find({hash: hash}).exec(function (err, files) {
            if (err) {
                callback(err, undefined);
            }
            else if (files.length != 1) {
                callback(err, undefined);
            }
            callback(null, files[0]);
        });
    }
}

function createFile(req, res) {
    var newname = req.param('name') || req.options.name;
    var parenthash = req.param('parent') || req.options.parent;
    var projecthash = req.param('project') || req.options.project;
    var type;
    if (req.param('isdir') || req.options.isdir != undefined) {
        newtype = "directory";
    }
    else {
        newtype = "file";
    }

    createUniqueHash(function(err, newhash) {
        if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
        }
        else {
            findFile(parenthash, function(err, parentfile) {
                if (err) {
                    console.error(err);
                    res.json(500, {result: "error", error: err});
                }
                else {
                    console.log("parentfile" + parentfile);
                    var newpath = "";
                    if (parentfile == undefined) {
                        newpath = sails.config.myconf.projectsroot + "/" + newhash;
                        newtype = "directory";
                    }
                    else {
                        newpath = parentfile.path + "/" + newhash;
                    }

                    ProjectController.find(projecthash, function(err, project) {
                        if (err) {
                            console.error(err);
                            res.json(500, {result: "error", error: err});
                        }
                        else {
                            if (parentfile) {
                                project = parentfile.project;
                            }

                            File.create({
                                hash: newhash,
                                name: newname,
                                type: newtype,
                                path: newpath,
                                owner: req.session.passport.user,
                                parent: parentfile,
                                project: project
                            }).exec(function (err, newfile) {
                                if (err) {
                                    console.error(err);
                                    res.json(500, {result: "error", error: err});
                                }
                                console.log(newfile);
                                if (newtype == "directory") {
                                    mkdirp(newpath, function (err) {
                                        if (err) {
                                            console.error(err);
                                            File.destroy({hash: newhash}).exec(function (err) {
                                                if (err) {
                                                    console.error(err);
                                                    res.json(500, {result: "error", error: err});
                                                }
                                                res.json(500, {result: "error", error: err});
                                            });
                                        }
                                        res.json(200, {result: "success"});
                                    });
                                }
                                else {
                                    fs.open(newpath, 'w', function (err) {
                                        if (err) {
                                            console.error(err);
                                            File.destroy({hash: newhash}).exec(function (err) {
                                                if (err) {
                                                    console.error(err);
                                                    res.json(500, {result: "error", error: err});
                                                }
                                                res.json(500, {result: "error", error: err});
                                            });
                                        }
                                        res.json(200, {result: "success"});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

var FileController = {
    create: createFile,
    find: findFile
};

module.exports = FileController;
