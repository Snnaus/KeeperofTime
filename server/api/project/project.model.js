'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: String,
  info: String,
  active: Boolean,
  timers: Array,
  totaltime: Number,
  timerOn: Boolean,
  contributers: Array,
  managers: Array,
  messages: Array,
});

module.exports = mongoose.model('Project', ProjectSchema);