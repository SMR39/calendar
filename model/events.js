var mongoose = require('mongoose');
var eventSchema = new mongoose.Schema({
  description: String,
  location: String,  
  starttime: Date,
  endtime: Date,
  name: String
});
mongoose.model('Event', eventSchema);
