/**
 * File.js
 *
 * @description :: This model manages files in this program. Controller manages the database entry and the real file will be managed by the Lifecycle callbacks.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = {

    attributes: {
        hash: { type: "string", unique: true, required: true },
        name: { type: "string", required: true },
        type: { type: "string", enum: ["file", "directory"], required: true },
        path: { type: "string", unique: true, required: true },
        owner: { model: "user", required: true },
        parent: { model: "file" },
        children: { collection: 'file', via: 'parent' }
    },

    afterCreate: function (newFile, callback) {
        switch (newFile.type) {
            case "directory":
                mkdirp(newFile.path, function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({hash: newFile.hash}).exec(function (err_destroy) {
                            return callback(err_destroy);
                        });
                    }
                    return callback();
                });
                break;
            default:
                fs.open(newFile.path, 'w', function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({hash: newFile.hash}).exec(function (err_destroy) {
                            return callback(err_destroy);
                        });
                    }
                    return callback();
                });
        }
    },

    afterDestroy: function(destroyedFiles, callback) {
        console.log("destroyedFiles");
        console.log(destroyedFiles);
        if (destroyedFiles) {
            async.each(destroyedFiles, function (destroyedFile, callback) {
                if (destroyedFile.children) {
                    async.each(destroyedFile.children, function(child, callback) {
                        File.destroy(child);
                        callback();
                    });
                }
                rimraf(destroyedFile.path, function(err) {
                    if (err) {
                        console.error(err);
                        return callback(err);
                    }
                    else {
                        console.log("File.afterDestroy: rimraf() %o", destroyedFile);
                        return callback();
                    }
                });
            }, function (err) {
                return callback(err);
            });
        }
    }
};
