var express = require("express");
var bodyParser = require("body-parser");
//scaping tools
var cheerio = require("cheerio");
var request = require("request");
var mongoose = require("mongoose");
//var mongojs = require("mongojs");
//var axios = require("axios");
var logger = require("morgan");
var expressHandlebars = require("express-handlebars");


var PORT = 3000;

//Initialize Express 
var app = express();

var db = require("./models");
//routing the page 
require("./routes/html-route.js")(app);
require("./routes/article-route.js")(app);

//var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("MONGODB_URI", {
  useMongoClient: true
});

// Configure middleware

// Use morgan logger for logging requests
//app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


var databaseUrl = "espnScraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
// var db = mongojs(databaseUrl, collections);
// db.on("error", function(error) {
//   console.log("Database Error:", error);
// });

app.get("scrape", function (req, res){
// Making a request for reddit's "webdev" board. The page's HTML is passed as the callback's third argument
request("http://www.espn.com/", function(error, response, html) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);

  // An empty array to save the data that we'll scrape
  var results = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("section.contentItem__content--story").each(function(i, element) {

    // Save the text of the element in a "title" variable
    var title = $(element).find("h1").text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).children("a").attr("href");

    const summary = $(element).find("p").text();



    // Save these results in an object that we'll push into the results array we defined earlier
    results.push({
      title: title,
      summary: summary,
      link: link
      
    });
  });



        // Create a new Article using the `result` object built from scraping
         db.Article.create(results)
           .then(function(dbArticle) {
             // View the added result in the console
             console.log(dbArticle);
           })
           .catch(function(err) {
             // If an error occurred, send it to the client
             return res.json(err);
           });
       });

  console.log(results);
});


// ---------Route for getting all Articles from the db
 app.get("/articles", function(req, res) {
//   --------Grab every document in the Articles collection
   db.Article.find({})
     .then(function(dbArticle) {
//       ------If we were able to successfully find Articles, send them back to the client
       res.json(dbArticle);
     })
     .catch(function(err) {
//       ------------If an error occurred, send it to the client
       res.json(err);
     });
 });

app.get("/saved/articles", function(req, res){
  db.Save.find({})
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});

// --------------Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Article.findOne({_id: req.params.id})
    .then(function(dbArticle) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      //return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    console.log(dbArticle);
    db.Save.create({title:dbArticle.title})
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
     res.json(err);
    });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/note/:id", function(req, res) {
  let id = req.params.id
  // ------------Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Save.findOne({ _id:id })
    //..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // -----------If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // -------------If an error occurred, send it to the client
      res.json(err);
    });
});

app.post('/note/:id', function(req,res){
  db.Note.create(req.body)
  .then(function(dbNote){
    return db.Save.findOneAndUpdate({_id:req.params.id}, {notes: dbNote._id}, {new:true});
  })
  .then(function(dbArticle){
    console.log(dbArticle)
  })
  .catch(function(err){
    res.json(err)
  })
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});