var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    fs = require('fs'),
    readline = require('readline'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

/* Call to synchronize events. */
router.route('/sync').get(function(req, res) {
    syncWithGoogle();
    res.json("success");
});

// Search events by location and Date ( code for searching by date is pending) 
router.get('/search/:location', function(req, res) {
        if (req.params.location) {
         mongoose.model('Event').find({ location: req.params.location }, function (err, event) {
             if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving event based on location: ' + event.location);
        res.format({
          html: function(){
              res.render('events/search', {
                "description" : event.description,
                "starttime" : event.starttime,
                "endtime" : event.endtime,
                "location" : event.location,
                "name" : event.name
              });

	         },
        	  json: function(){
              	res.json(event);
         	 }
         });
        }

        });
	  }
	});
          

//build the REST operations at the base for events
//this will be accessible from http://130.233.42.130:8080/events if the default route for / is left unchanged
router.route('/')
    //GET all events
    .get(function(req, res, next) {
        //retrieve all events from MongoDB
        mongoose.model('Event').find({}, function (err, events) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                   // JSON response will show all blobs in JSON format
                    json: function(){
                        res.json(events);
                    }
                });
              }     
        });
    })
    //POST a new event
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var description = req.body.description;
        var starttime = req.body.starttime;
        var endtime = req.body.endtime;
        var location = req.body.location;
        var name = req.body.name;
        //call the create function for our database
        mongoose.model('Event').create({
            description : description,
            starttime : starttime,
            endtime : endtime,
            location : location,
            name : name
        }, function (err, event) {
              if (err) {
                  res.send("There was a problem adding the information to the databse.");
              } else {
                  //Event has been created
                  console.log('POST creating new event: ' + event);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("events");
                        // And forward to success page
                        res.redirect("/events");
                    },
                    //JSON response will show the newly created event
                    json: function(){
                        res.json(event);
                    }
                });
              }
        })
    });

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Event').findById(id, function (err, event) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(event);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Event').findById(req.id, function (err, event) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + event._id);
        res.format({
          html: function(){
              res.render('events/show', {
                "description" : event.description,
                "starttime" : event.starttime,
                "endtime" : event.endtime,
                "location" : event.location,
                "name" : event.name
              });
          },
          json: function(){
              res.json(event);
          }
        });
      }
    });
  });

router.route('/:id/edit')
	//GET the individual event by Mongo ID
	.get(function(req, res) {
	    //search for the event within Mongo
	    mongoose.model('Event').findById(req.id, function (err, event) {
	        if (err) {
	            console.log('GET Error: There was a problem retrieving: ' + err);
	        } else {
	            //Return the event
	            console.log('GET Retrieving ID: ' + event._id);
	            res.format({
	                //HTML response will render the 'edit.jade' template
	                html: function(){
	                       res.render('events/edit', {
                               		"description" : event.description,
                               		"starttime" : event.starttime,
                               		"endtime" : event.endtime,
                               		"location" : event.location,
                               		"name" : event.name
	                      });
	                 },
	                 //JSON response will return the JSON output
	                json: function(){
	                       res.json(event);
	                 }
	            });
	        }
	    });
	})
	//PUT to update an event by ID
	.put(function(req, res) {
	    // Get our REST or form values. These rely on the "name" attributes
            var description = req.body.description;
            var starttime = req.body.starttime;
            var endtime = req.body.endtime;
            var location = req.body.location;
            var name = req.body.name;

	    //find the document by ID
	    mongoose.model('Event').findById(req.id, function (err, event) {
	        //update it
	        event.update({
	            description : description,
	            starttime : starttime,
	            endtime : endtime,
	            location : location,
	            name : name
	        }, function (err, eventID) {
	          if (err) {
	              res.send("There was a problem updating the information to the database: " + err);
	          } 
	          else {
	                  //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
	                  res.format({
	                     //JSON responds showing the updated values
	                    json: function(){
	                           res.json(event);
	                     }
	                  });
	           }
	        })
	    });
	})
	//DELETE an Event by ID
	.delete(function (req, res){
	    //find event by ID
	    mongoose.model('Event').findById(req.id, function (err, event) {
	        if (err) {
	            return console.error(err);
	        } else {
	            //remove it from Mongo
	            event.remove(function (err, event) {
	                if (err) {
	                    return console.error(err);
	                } else {
	                    //Returning success messages saying it was deleted
	                    console.log('DELETE removing ID: ' + event._id);
	                    res.format({
	                        //HTML returns us back to the main page, or you can create a success page
	                          html: function(){
	                               res.redirect("/events");
	                         },
	                         //JSON returns the item with the message that is has been deleted
	                        json: function(){
	                               res.json({message : 'deleted',
	                                   item : event
	                               });
	                         }
	                      });
	                }
	            });
	        }
	    });
	});

// Load client secrets from a local file.
function syncWithGoogle() {
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), syncEvents);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        console.log(code);
        rl.close();
        
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Synchronizes events between google calendar and party calendar
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function syncEvents(auth) {
    var calendar = google.calendar('v3');
    
    // get Google calendar events.
    calendar.events.list({
        auth: auth,
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 99999,
        singleEvents: true,
        orderBy: 'startTime'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var googleEvents = response.items;

        // get mongo events.
        mongoose.model('Event').find({}, function (err, mongoEvents) {
            if (googleEvents.length == 0) {
                console.log('No Google events found.');
            } else {
                console.log('Found Google events:');

                // add google events to mongo if not exists already.
                for (var i = 0; i < googleEvents.length; i++) {
                    var googleEvent = googleEvents[i];
                    var start = googleEvent.start.dateTime || googleEvent.start.date;
                    var end = googleEvent.end.dateTime || googleEvent.end.date;
                    console.log('%s - %s', start, googleEvent.summary);

                    var exists = false;
                    for (var j = 0; j < mongoEvents.length; j++) {
                        if (mongoEvents[j].name === googleEvent.summary) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        mongoose.model('Event').create({
                            name: googleEvent.summary,
                            description: googleEvent.description,
                            starttime: start,
                            endtime: end,
                            location: googleEvent.location
                        }, function (err, event) {
                            if (err) {
                                console.log("Error synchronizing.");
                            } else {
                                console.log("Synchronized event from Google calendar to party calendar.");
                            }
                        });
                    }
                }
                // add mongo events to mongo if not exists already.
                for (var i = 0; i < mongoEvents.length; i++) {
                    var mongoEvent = mongoEvents[i];

                    var exists = false;
                    for (var j = 0; j < googleEvents.length; j++) {
                        if (googleEvents[j].summary === mongoEvent.name) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        var event = {
                            'summary': mongoEvent.name,
                            'location': mongoEvent.location,
                            'description': mongoEvent.description,
                            'start': {
                                'dateTime': mongoEvent.starttime,
                                'timeZone': 'Europe/Helsinki',
                            },
                            'end': {
                                'dateTime': mongoEvent.starttime,
                                'timeZone': 'Europe/Helsinki',
                            }
                        };
                        calendar.events.insert({
                            auth: auth,
                            calendarId: 'primary',
                            resource: event,
                        }, function (err, event) {
                            if (err) {
                                console.log('There was an error contacting the Calendar service: ' + err);
                                return;
                            }
                            console.log('Event %s created.', event.summary);
                            console.log(event.htmlLink);
                        });
                    }                    
                }
            }
        });
    });
}

module.exports = router;
