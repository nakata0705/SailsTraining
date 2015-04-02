/**
 * Entrance.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName: "projects",
    attributes: {
        hash: {type: "string", unique: true, required: true },
        name: {type: "string", required: true },
        root: {model: 'file', required: true}
    },

    afterDestroy: function (destroyedProjects, callback) {
        async.each(destroyedProjects, function (project, callback) {
            File.destroy(project.file.id).exec(function (err) {
                return callback(err);
            });
        }, function (err) {
            return callback(err);
        });
    }
};
