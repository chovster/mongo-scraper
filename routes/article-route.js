var db = require("../models");


// Routes
// =============================================================

module.exports = function(app) {

    // Retrieve results from mongo
    app.get("/api/articles", function(req, res) {
        // Find all notes in the notes collection
        db.Article.find({}, function(error, found) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        else {
            // Otherwise, send json of the notes back to user
            // This will fire off the success function of the ajax request
            res.json(found);
            console.log("found is " + found);
        }
        });
    });



}