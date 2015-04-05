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

function beforeCreate(values, callback) {
    values.path = values.path.replace(/(\n|\r|\/)+$/, '');
    callback();
}

function afterCreate(newFile, callback) {
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
}

function afterDestroy(destroyedFiles, callback) {
    async.each(destroyedFiles, function (destroyedFile, destroycallback) {
        File.destroy({ parent: destroyedFile }).exec(function(err_destroy) {
            rimraf(destroyedFile.path, function(rimraf_err) {
                destroycallback(rimraf_err);
            });
        });
    }, function (err) {
        callback(err);
    });
}

function populate(file, callback) {
    if (file.path.match(/^(.*)\/(.*)$/)) {
        file["name"] = RegExp.$2;

        if (file.type == "directory") {
            file["spriteCssClass"] = "folder";
        }
        else if (file["name"].match(/^(.*)\.(.*)$/)) {
            switch (RegExp.$2) {
                case "pdf":
                    file["spriteCssClass"] = "pdf";
                    break;
                case "jpeg":
                case "jpg":
                    file["spriteCssClass"] = "image";
                    break;
                default:
                    file["spriteCssClass"] = "html";
            }
        }
        else {
            file["spriteCssClass"] = "html";
        }
    }
    else {
        file["name"] = "";
        file["spriteCssClass"] = "html";
    }



    File.find({ parent: file.id }).exec(function(err, files) {
        if (err || files　== undefined) {
            callback(err);
        }
        else if (files.length == 0) {
            callback(undefined);
        }
        else {
            var count = 0;
            async.whilst(function() { return count < files.length },
                function(callback2) {
                    var child = Object(files[count]);
                    File.populate(child, function (err) {
                        count++;
                        callback2(err);
                    });
                },
                function(err) {
                    file["items"] = files;
                    callback(err);
                });
        }
    });
}

module.exports = {
    attributes: {
        path: { type: "string", unique: true, required: true },
        type: { type: "string", enum: ["file", "directory"], required: true },
        owner: { model: "user", required: true },
        parent: { model: "file" }
    },

    beforeCreate: beforeCreate,
    afterCreate: afterCreate,
    afterDestroy: afterDestroy,
    populate: populate
};
