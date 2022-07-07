const mongoose = require("mongoose");

const querySchema = {
  category: String,
  form: String,
  difficulty: String,
  question: String,
  all_choices: [String]
};

const Query = mongoose.model("Query", querySchema);


const listSchema = new mongoose.Schema ({
  player: String,
  queries: [querySchema],
  correct_answers: [String],
  expireAt: {
      type: Date,
      /* Defaults 7 days from now */
      default: new Date(new Date().valueOf() + 86400000),
      /* Remove doc 60 seconds after specified date */
      expires: 60
    }
});

const List = mongoose.model("List", listSchema);


const userSchema = {
  name: String,
  password: String
};

const User = new mongoose.model("User", userSchema);


const rankSchema = {
  category: String,
  ranking: [[]]  // array [ "player", "score" ]
};

const Rank = mongoose.model("Rank", rankSchema);


// -----------Exports-----------

exports.Query = Query;
exports.List = List;
exports.User = User;
exports.Rank = Rank;
