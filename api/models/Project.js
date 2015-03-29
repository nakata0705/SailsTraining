/**
* Entrance.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  tableName: "projects",
  attributes: {
    hash: { type: "string", unique: true, columnName: "hash", required: true },
    name: { type: "string", columnName: "name", defaultsTo: "New Project", columnName: "name" },
    owner: { model: "user", required: true }
  }

}
