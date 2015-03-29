/**
* File.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      hash: { type: "string", unique: true },
      name: { type: "string", columnName: "name", defaultsTo: "New File" },
      type: { type: "string", enum: ["file", "directory"] },
      path: { type: "string" },
      owner: { model: "user" },
      parent: { model: "file" },
      project: { model: "project" }
  }
};

