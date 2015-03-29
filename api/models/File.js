/**
 * File.js
 *
 * @description :: This model manages files in this program. Controller manages the database entry and the real file will be managed by the Lifecycle callbacks.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = {

    attributes: {
        hash: {type: "string", unique: true, required: true},
        name: {type: "string", columnName: "name", defaultsTo: "New File"},
        type: {type: "string", enum: ["file", "directory"], defaultsTo: "file"},
        path: {type: "string", required: true},
        owner: {model: "user", required: true},
        parent: {model: "file"},
        project: {model: "project", required: true}
    },

    afterCreate: function (values, callback) {
        switch (values.type) {
            case "directory":
                mkdirp(values.path, function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({hash: values.hash}).exec(function (err_destroy) {
                            callback(err);
                        });
                    }
                    callback();
                });
                break;
            default:
                fs.open(values.path, 'w', function (err) {
                    if (err) {
                        console.error(err);
                        File.destroy({hash: values.hash}).exec(function (err_destroy) {
                            callback(err);
                        });
                    }
                    callback();
                });
        }
    }

}
