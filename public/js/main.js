/******* RENDERING HELPERS ********/

Render =  {
  rows: 4,
  cols: 6,

  SELECTORS: {
    loginButton: "#loginButton",
    overlay: ".overlay",
    modal: ".modal",
    game: "#table",
    sidebar: "#sidebar-content",
    score: "#score",
    highscore: "#high-score"
  },

  loginButton: function() {
    $(this.SELECTORS.loginButton).find(".loader").remove();
    if(IN.User && IN.User.isAuthorized()) {
      $(this.SELECTORS.loginButton).html("Play");
    } else {
      $(this.SELECTORS.loginButton).html("Log in with LinkedIn");
    }
  },

  hideOverlay: function() {
    $(this.SELECTORS.overlay).hide(200);
  },

  cards: function(cardArray) {
    for(var i = 0; i < this.rows; i++) {
      var row = document.createElement("div");
      row.className = "row";
      for(var j = 0; j < this.cols; j++) {
        var n = i*this.cols + j
        $(row).append(this.card(cardArray[n], n));
      }
      $(this.SELECTORS.game).append(row);
    }

    $(".card").bind("click", function() {
      Game.selectCard(this);
      return false;
    })
  },

  card: function(card, n) {
    var cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.id = "card-" + n;

    var cardBack = document.createElement("div");
    cardBack.className = "card-back";
    cardEl.appendChild(cardBack);
    if(card.isPicture) {
      imgEl = document.createElement("img");
      imgEl.src = card.pictureUrl;
      $(cardBack).append(imgEl);
    } else {
      $(cardBack).html(card.name);
    }
    return cardEl;
  },

  clearCards: function() {
    $(this.SELECTORS.game).empty();
  },

  sidebarAdd: function(card) {
    var newEl = document.createElement("div");
    newEl.className = "card-desc";
    if(card.isPicture) {
      imgEl = document.createElement("img");
      imgEl.src = card.pictureUrl;
      $(newEl).append(imgEl);
    } else {
      $(newEl).html(card.name);
    }
    $(this.SELECTORS.sidebar).append(newEl);
  },

  sidebarSuccess: function() {
    var newEl = document.createElement("div");
    newEl.className = "success";
    $(newEl).html("Its a Match!");
    $(this.SELECTORS.sidebar).append(newEl)
  },

  sidebarFail: function() {
    var newEl = document.createElement("div");
    newEl.className = "fail";
    $(newEl).html("Not a Match");
    $(this.SELECTORS.sidebar).append(newEl);
  },

  sidebarClear: function() {
    $(this.SELECTORS.sidebar).empty();
  },  

  overlayWin: function() {
    var highScore = localStorage.getItem("_highscore");
    highScore = highScore ? highScore : 0;
    $(this.SELECTORS.modal).empty();
    $(this.SELECTORS.modal).html(
        "<h1> Congratulations you win! </h1>" + 
        "<h2> Your Score:" + Game.score + "</h2>" + 
        "<h3> Your High Score:" + highScore + "</h3>" + 
        "<span id='play-again' class='button' onClick='Game.playAgain()'> Play Again </span>");
    $(this.SELECTORS.overlay).show();
  },

  score: function(n) {
    $(this.SELECTORS.score).html(n);
  },

  highScore: function() {
    if(localStorage.getItem("_highscore")) {
      $(this.SELECTORS.highscore).html(localStorage.getItem("_highscore"));
    } else {
      $(this.SELECTORS.highscore).html("0");
    }
  },

  notEnoughConnections: function() {
    $(this.SELECTORS.modal).empty();
    $(this.SELECTORS.modal).html(
      "<h2> Sorry, you don't have enough LinkedIn connections to play Connectiontration <h2>" + 
      "<h4> <a href='http://linkedin.com'> Try adding more! </a> </h4>"
      );
  }

}

/****** LANDING AND AUTHORIZATION *******/

function liLoginClick()  {
  if(IN.User && IN.User.isAuthorized()){
    Render.hideOverlay();
    onLinkedInAuth();
  } else {
    IN.User.authorize(function() {
      Render.hideOverlay();
      onLinkedInAuth();
    });
  }
}

function onLinkedInLoad() {
  Render.loginButton();
  Render.highScore();
}

function onLinkedInAuth() {
  IN.API.Connections("me")
    .fields("firstName", "lastName", "id", "pictureUrl")
    .result(filterConnections);
}

function filterConnections(profiles) {
  var filteredConnections = [];
  members = profiles.values;
  for(var i = 0; i < members.length; i++) {
    member = members[i];
    if(member.firstName != "private" && member.lastName != "private" && member.pictureUrl) {
      filteredConnections.push(member)
    }
  }
  Game.initialize(filteredConnections);
}

/********* GAME LOGIC *********/
Game = {
  connections: [],
  cards: [],
  location: 0,
  peoplePerGame: 12,
  oldSelected: null,
  matchCount: 0,
  clickCount: 0,
  score: 1240,

  initialize: function(connections) {
    if(this.connections.length < 12) {
      Render.notEnoughConnections();
    }

    this.connections = this.shuffle(connections);
    var people = this.getNextPeople(this.peoplePerGame);

    for(var i = 0; i < this.peoplePerGame; i++) {
      var person = people[i];
      var card1 = {
        isPicture: false,
        name: person.firstName + " " + person.lastName,
        pictureUrl: person.pictureUrl
      }
      this.cards.push(card1);
      var card2 = jQuery.extend({}, card1);
      card2.isPicture = true;
      this.cards.push(card2);
    }
    this.cards = this.shuffle(this.cards);
    Render.cards(this.cards);
    Render.score(this.score);
    Render.highScore();
  },

  getNextPeople: function(n) {
    //if we're out of cards, shuffle again
    if(location + n > this.connections.length) {
      this.connections = this.shuffle(this.connections);
      this.location = 0;
    }
    var result = this.connections.slice(this.location, this.location + n)
    this.location = this.location + n;
    return result;
  },

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/array/shuffle [v1.0]
  shuffle: function(o) { 
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  },

  selectCard: function(cardEl) {
    if(!$(cardEl).hasClass("cleared")) {

      cardEl.firstChild.style.visibility = "visible";
      var id = this.parseId(cardEl);
      var newCard = this.cards[id];

      //Render.sidebarAdd(newCard);
      if(this.oldSelected && this.oldSelected != cardEl) {
        this.score -= 10;
        //unbind card click events for next click
        $(".card").unbind("click");
        var oldCard = this.cards[this.parseId(this.oldSelected)];
        if(newCard.name === oldCard.name) {
          this.matchCount++;

          if(this.matchCount == this.peoplePerGame) {
            this.setHighScore(this.score);
            Render.overlayWin();
          }

          Render.sidebarSuccess();
          $(document).bind("click", $.proxy(function() {
            this.successfulMatch(this.oldSelected, cardEl);
          }, this));
        } else {
          Render.sidebarFail()
          $(document).bind("click", $.proxy(function() {
            this.failedMatch(this.oldSelected, cardEl);
          }, this));
        }
      } else {
        this.score -= 10;
        this.oldSelected = cardEl;
      }
      Render.score(this.score);
    }
  },

  successfulMatch: function(card1, card2) {
    $(card1).empty();
    $(card2).empty();
    $(card1).addClass('cleared');
    $(card2).addClass('cleared');
    this.cleanup();
  },

  failedMatch: function(card1, card2) {
    card1.firstChild.style.visibility = "hidden";
    card2.firstChild.style.visibility = "hidden";
    this.cleanup();
  },

  parseId: function(cardEl) {
    var id = cardEl.id;
    return parseInt(id.substring(5));
  },

  cleanup: function() {
    this.oldSelected = null;
    Render.sidebarClear();
    $(document).unbind("click");
    $(".card").bind("click", function() {
      Game.selectCard(this);
      return false;
    })
  },

  playAgain: function() {
    Render.hideOverlay();
    Render.highscore();
    this.matchCount = 0;
    this.clickCount = 0;
    this.score = 1240;
    Render.score(this.score);
    this.oldSelected = null;
    this.cards = []
    var people = this.getNextPeople(this.peoplePerGame);

    for(var i = 0; i < this.peoplePerGame; i++) {
      var person = people[i];
      var card1 = {
        isPicture: false,
        name: person.firstName + " " + person.lastName,
        pictureUrl: person.pictureUrl
      }
      this.cards.push(card1);
      var card2 = jQuery.extend({}, card1);
      card2.isPicture = true;
      this.cards.push(card2);
    }
    this.cards = this.shuffle(this.cards);
    Render.clearCards();
    Render.cards(this.cards);
  },

  setHighScore: function(n) {
    var curScore = localStorage.getItem("_highscore");
    curScore = curScore ? curScore : 0;
    if (n > curScore) {
      localStorage.setItem("_highscore", n);
    }
  }
}

$(document).ready (function() {
  if(typeof(Storage) == "undefined") {
    alert("Your browser does not support local storage, this may mean some features of connectiontration will be broken :(");
  }
})