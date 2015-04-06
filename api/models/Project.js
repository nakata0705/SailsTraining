/**
 * Entrance.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = {

    tableName: "projects",
    attributes: {
        hash: {type: "string", unique: true, required: true },
        name: {type: "string", required: true },
        owner: { model: "user", required: true },
    },

    afterDestroy: function (destroyedProjects, callback) {
        async.each(destroyedProjects, function (project, callback) {
            var target = sails.config.myconf.projectsroot + "/" + project.hash;
            rimraf(target, function (err) {
                return callback(err);
            });
        }, function (err) {
            return callback(err);
        });
    }
};
