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
        path: { type: "string", unique: true, required: true },
        type: { type: "string", enum: ["file", "directory"], required: true },
        owner: { model: "user", required: true },
        parent: { model: "file" },
        children: { collection: 'file', via: 'parent' }
    },

    afterCreate: function (newFile, callback) {
        switch (newFile.type) {
            case "directory":
                mkdirp(sails.config.myconf.projectsroot + newFile.path, function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({ path: newFile.path }).exec(function (err_destroy) {
                            callback(err_destroy);
                        });
                    }
                    callback();
                });
                break;
            default:
                fs.open(sails.config.myconf.projectsroot + newFile.path, 'w', function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({ path: newFile.path }).exec(function(err_destroy) {
                            callback(err_destroy);
                        });
                    }
                    callback();
                });
        }
    },

    afterDestroy: function(destroyedFiles, callback) {
        async.each(destroyedFiles, function (destroyedFile, destroycallback) {
            console.log("destroyedFile: " + destroyedFile.id);
            File.destroy({ parent: destroyedFile }).exec(function(err_destroy) {
                rimraf(destroyedFile.path, function(rimraf_err) {
                    destroycallback(rimraf_err);
                });
            });
        }, function (err) {
            callback(err);
        });
    }
};
