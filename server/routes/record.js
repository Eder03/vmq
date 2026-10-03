const express = require("express");


// Wird genutzt um die API Endpoint Routen zu setzen und sich zu verbinden
const recordRoutes = express.Router();

// DB Connection
const dbo = require("../db/conn");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;


// Alle Datenbank Einträge werden mittels GET zurückgegeben
recordRoutes.route("/getAll").get(function (req, res) {
  let db_connect = dbo.getDb("VMQ");
  db_connect
    .collection("Music")
    .find().sort({game: 1}).collation({locale: "en"})
    .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

//Alle Namen der Spiele wird zurückgegeben
recordRoutes.route("/getGames").get(function (req, res) {
  let db_connect = dbo.getDb("VMQ");
  db_connect
    .collection("Music")
    .find().sort({game: 1}).project({game:1, _id:0})
    .toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
    });
});

// POST request um Datenbankeinträge hinzuzufügen
recordRoutes.route("/addMusic").post(function (req, response) {
    let db_connect = dbo.getDb();
    let musicObj = {
      //Strings
      game: req.body.game,
      series: req.body.series,

      //Songs Object
      songs: req.body.songs,

      //Arrays
      platforms: req.body.platforms,
      genres: req.body.genres,

      //Strings + Boolean
      publisher: req.body.publisher,
      developer: req.body.developer,
      approved: false

    };
    //InsertOne
    db_connect.collection("Music").insertOne(musicObj, function (err, res) {
      if (err) throw err;
      response.json(res);
    });
  });

  //Neues Songobjekt wird einem Spiel hinzugefügt
  recordRoutes.route("/update").post(function (req, response) {
    let db_connect = dbo.getDb();
    //Daten der Datenbank
    let myquery = { game: req.body.game};
    //Neues Songobjekt
    let newvalues = {
      $push: {
        songs: req.body.songs
      },
    };
    //UpdateOne
    db_connect
      .collection("Music")
      .updateOne(myquery, newvalues, function (err, res) {
        if (err) throw err;
        console.log("1 document updated");
        response.json(res);
      });
  });

  // NEUE ROUTE: Bestehenden Song bearbeiten
  recordRoutes.route("/editSong").post(function (req, response) {
    let db_connect = dbo.getDb();
    
    // Finde das Spiel und den spezifischen Song im Array.
    // Damit das Überschreiben klappt, falls die YouTube-ID (link) im Frontend 
    // geändert wird, sollte idealerweise `oldLink` vom Frontend mitgeschickt werden.
    let myquery = { 
      game: req.body.game, 
      "songs.link": req.body.oldLink || req.body.songs.link 
    };
    
    // Aktualisiere die Werte des gefundenen Array-Elements mittels Positionsoperator ($)
    let newvalues = {
      $set: {
        "songs.$.name": req.body.songs.name,
        "songs.$.link": req.body.songs.link,
        "songs.$.composers": req.body.songs.composers,
        "songs.$.songapproved": req.body.songs.songapproved
      },
    };

    db_connect
      .collection("Music")
      .updateOne(myquery, newvalues, function (err, res) {
        if (err) throw err;
        console.log("1 song edited");
        response.json(res);
      });
  });

  // NEUE ROUTE: Game Info bearbeiten
  recordRoutes.route("/editGameInfo").post(function (req, response) {
    let db_connect = dbo.getDb();
    
    let myquery = { game: req.body.oldGame };
    
    let newvalues = {
      $set: {
        game: req.body.newGameData.game,
        series: req.body.newGameData.series,
        publisher: req.body.newGameData.publisher,
        developer: req.body.newGameData.developer,
        platforms: req.body.newGameData.platforms,
        genres: req.body.newGameData.genres
      },
    };

    db_connect
      .collection("Music")
      .updateOne(myquery, newvalues, function (err, res) {
        if (err) throw err;
        console.log("1 game info updated");
        response.json(res);
      });
  });

  //Approve all games
  recordRoutes.route("/approveGame").post(function (req, response) {
    let db_connect = dbo.getDb();
    //Alle Spiele, wo approved false ist
    let myquery = { approved: false};
    let newvalues = {
      $set: {
        approved: true
      },
    };
    //Update All
    db_connect
      .collection("Music")
      .updateMany(myquery, newvalues, function (err, res) {
        if (err) throw err;
        console.log(res.modifiedCount + " games succesfully approved");
        response.json(res);
      });
  });

  //Delete all unapproved games
  recordRoutes.route("/del").delete((req, response) => {

    let db_connect = dbo.getDb();
    //Alle Spiele, wo approved false ist
    let myquery = { approved: false};
    db_connect.collection("Music").deleteMany(myquery, function (err, obj) {
      if (err) throw err;
      console.log("1 document deleted");
      response.json(obj);
    });
  });

  

module.exports = recordRoutes;