/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var projectdir = "projects";
var uuid = require('node-uuid');
var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = {
  list: function (req, res) {
    var default_project_limit = 20;
    var find_limit = req.param('limit');
    var find_from = req.param('from');

    if (find_limit === undefined || isNumeric(find_limit) != true) {
      find_limit = default_project_limit;
    }
    if (find_from === undefined || isNumeric(find_from) != true) {
      find_from = 0;
    }

    Project.find({where: {}, from: find_from, limit: find_limit}).exec(function (err, projects) {
      if (err) {
        console.error(err);
        res.json(500, {});
      }
      res.json(200, projects);
    });

    /*var fs = require('fs');
    var projectdir = "projects";

    // Read the project directory
    fs.realpath('./', {}, function(err, resolvedPath) {
      console.log(resolvedPath);

      fs.readdir(resolvedPath + "/" + projectdir, function(err, files) {
        if (err) {
          res.json(200, {});
        }
        else {
          res.json(200, files);
        }
      });
    });*/
  },

  delete: function(req, res) {
    var hash = req.param('id');

    Project.destroy({hash: hash}).exec(function(err) {
      if (err) {
        console.error(err);
        res.json(500, {result: "error", error: err});
      }
      fs.realpath('./', {}, function (err, resolvedPath) {
        if (err) {
          console.error(err);
          res.json(500, {result: "error", error: err});

        }
        rimraf(resolvedPath + "/" + projectdir + "/" + project_id, function (err) {
          if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
          }
          res.json(200, {result: "success"});
        });
      });
    });
  },

  create: function(req, res) {
    var newuuid = uuid.v1();
    var newname = req.param('name');
    var hash = crypto.createHash('md5').update(newuuid).digest('hex');

    Project.find({ hash: hash }).exec(function(err, projects) {
      if (err) {
        console.error(err);
        res.json(500, {result: "error", error: err});
      }
      if (projects.length > 0) {
        console.log("Project already exists.");
        res.json(500, projects);
      }
      Project.create({hash: hash, name: newname, owner: req.session.passport.user}).exec(function (err, project) {
        if (err) {
          console.error(err);
          res.json(500, {result: "error", error: err});
        }
        fs.realpath('./', {}, function (err, resolvedPath) {
          if (err) {
            console.error(err);
            res.json(500, {result: "error", error: err});
          }
          mkdirp(resolvedPath + "/" + projectdir + "/" + hash, function (err) {
            if (err) {
              console.error(err);
              Project.destroy({hash: hash}).exec(function (err) {
                if (err) {
                  console.error(err);
                  res.json(500, {result: "error", error: err});
                }
                res.json(500, {result: "error", error: err});
              });
            }
            res.json(200, {result: "success"});
          });
        });
      });
    });
  }
}

