const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
const { Query, List, User, Rank } = require("./models");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

require("dotenv").config({ path: ".config.env" });

// mongoose.connect("mongodb://localhost:27017/triviaDB");
mongoose.connect("mongodb+srv://admin-veeliw:ONt3FQ0ZmrYaCtu9@triviacluster.zcxokwx.mongodb.net/triviaDB");

// ----- Settings -----

const quiz_number = 5;
const rank_number = 3;

// ----------


app.get("/", function(req, res) {
  List.find({}, function(err, docs) {
    if (err) console.log(err);
    else res.send(docs);
  })
});

app.get("/lists/:paramID", function(req, res) {
  const id = req.params.paramID;
  List.findById(id, "-correct_answers", function(err, docs) {
    if (err) console.log(err);
    else if (!docs) res.send("Found no list with ID [" + id + "].");
    else res.send(docs);
  });
});

app.get("/ranking", function(req, res) {
  Rank.find({}, function(err, docs) {
    if (err) console.log(err);
    else res.json(docs);
  });
});


app.get("/ranking/:paramsCategory", function(req, res) {
  const category = req.params.paramsCategory;
  Rank.findOne({category: category}, function(err, docs) {
    if (err) console.log(err);
    else res.send(docs);
  });
});


app.post("/", function(req, res) {
  const category = req.body.category;
  const player = req.body.player;
  const category_url = {
    random: "",
    mythology: "&category=20",
    books: "&category=10",
    animals: "&category=27",
    film: "&category=11",
    cartoon: "&category=32",
    science: "&category=17",
    sports: "&category=21",
    computers: "&category=18",
    mathematics: "&category=19",
    geography: "&category=22",
    history: "&category=23"
  }

  Rank.findOne({category: category}, function(err, docs) {
    if (err) console.log(err);
    else if (!docs) {
      const rank_arr = [];
      for (let i = 0; i < rank_number; i++) rank_arr.push(["None", 0]);

      const new_rank = new Rank ({
        category: category,
        ranking: rank_arr
      });

      new_rank.save(function(err) {
        if (err) console.log(err);
      });
    }
  });


  const url = "https://opentdb.com/api.php?amount=" + quiz_number + "&type=multiple" + category_url[category];

  https.get(url, function(docs) {
    docs.on("data", function(data) {

      const listData = JSON.parse(data);

      const new_list = new List ({
        player: player,
        queries: [],
        correct_answers: [],
      });

      for (let i = 0; i < quiz_number; i++) {

        const new_query = new Query ({
          category: listData.results[i].category,
          form: listData.results[i].type,
          difficulty: listData.results[i].difficulty,
          question: listData.results[i].question,
          all_choices: [listData.results[i].correct_answer, ...listData.results[i].incorrect_answers]
        });

        new_query.all_choices.sort();

        new_list.queries.push(new_query);
        new_list.correct_answers.push(listData.results[i].correct_answer);
      }

      new_list.save(function(err) {
        if (err) res.send(err);
        else {
          res.send(new_list._id);
        }
      });

    });
  });
});

app.post("/lists/:paramID", function(req, res) {
  const id = req.params.paramID;
  const answers = req.body.answers;

  let data = {score: 0, correct_answers: []};

  List.findOne({_id: id}, function(err, docs) {
    if (err) console.log(err);
    else if (!docs) console.log("Not found list with ID: " + id);
    else {
      docs.correct_answers.forEach( (item, index) => {
        if (item === answers[index]) {
          data.score++;
        }
      });

      data.correct_answers = docs.correct_answers;
      res.json(data);

    }
  });

});

// RANKINGS

app.post("/ranking", function(req, res) {
  const category = req.body.category;
  const player = req.body.player;
  const score = req.body.score;

  Rank.findOne({category: category}, function(err, docs) {
    const rank_arr = docs.ranking;

    for (let i = 0; i < rank_number; i++) {
      if (score >= rank_arr[i][1]) {
        rank_arr.splice(i, 0, [player, score]);
        rank_arr.pop();
        break;
      }
    }

    docs.save(function(err) {
      if (err) console.log(err);
      else res.json(docs._id);
    });

  });
});

// ========== Disuse Codes Below ==========
// HASHING

function hash(str) {
  const mod = 1000000007;
  const power = 127;
  let ans = 0;
  for (let i = 0; i < str.length; i++) {
    ans = ((str.charCodeAt(i) + ans) * power) % mod;
  }
  return ans;
}

// REGISTERATION

app.post("/register", function(req, res) {
  const new_user = new User ({
    name: req.body.name,
    password: hash(req.body.password)
  });

console.log("Create user id: " + new_user._id);

  new_user.save(function(err) {
    if (err) console.log(err);
    else res.json({
      id: new_user._id,
      name: new_user.name
    });
  });
});

// Login

app.post("/login", function(req, res) {
  const name = req.body.name;
  const password = hash(req.body.password);

  User.findOne({name: name}, function(err, docs) {
    if (err) console.log(err);
    else {
      if (docs) {
        // console.log("Server: Checking name: " + docs.name + " [db password: " + docs.password + "] [input password: " + password + "]");
        if (docs.password === password.toString()) {
          res.json({
            id: docs._id,
            name: docs.name
          });
        }
        else {
          res.json("Incorrect name or password");
        }
      }
      else {
        res.json("Incorrect name or password");
      }
    }
  });

});

// ----------

// const PORT = process.env.PORT;
// if (PORT == null || PORT == "") PORT = 3000;
const PORT = 3000;

app.listen(PORT, function() {
  console.log("Server has started successfully.");
});
