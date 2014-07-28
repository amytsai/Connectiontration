/****** LANDING AND AUTHORIZATION *******/

//logic for Log in / play button
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

//callback for linkedin api load
function onLinkedInLoad() {
  Render.hideLoading()
  Render.loginButton();
  Render.highScore();
}

//callback for linked in authorization
function onLinkedInAuth() {
  IN.API.Connections("me")
    .fields("firstName", "lastName", "id", "pictureUrl")
    .result(filterConnections);
}

//filter for connections that have a public first and last name and a profile picture
function filterConnections(profiles) {
  var filteredConnections = [];
  members = profiles.values;
  if(!members) {
    Render.notEnoughConnections();
  } else {
    for(var i = 0; i < members.length; i++) {
      member = members[i];
      if(member.firstName != "private" && member.lastName != "private" && member.pictureUrl) {
        filteredConnections.push(member)
      }
    }
    Game.initialize(filteredConnections);
  }
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

  //initialize game for the first time
  //creates a deck of all filtered connectiosn for this session
  initialize: function(connections) {
    if(connections.length < 12) {
      Render.notEnoughConnections();
    } else {
      this.connections = this.shuffle(connections);
      this.newDeck();
      Render.cards(this.cards);
      Render.score(this.score);
      Render.highScore();
    }
  },

  //sets a new "Deck" of 24 cards for this game
  newDeck: function() {
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
  },

  //gets the next n people from the array of all connections
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

  //logic for when a card has been clicked
  selectCard: function(cardEl) {
    cardEl = cardEl.firstChild;
    if(!$(cardEl).hasClass("cleared") && this.oldSelected != cardEl) {

      //cardEl.firstChild.style.visibility = "visible";
      $(cardEl).toggleClass("flipped");
      var id = this.parseId(cardEl);
      var newCard = this.cards[id];

      //Render.sidebarAdd(newCard);
      if(this.oldSelected) {
        this.score -= 10;
        //unbind card click events for next click
        $(".card-container").unbind("click");
        var oldCard = this.cards[this.parseId(this.oldSelected)];
        if(newCard.name === oldCard.name) {
          this.matchCount++;

          if(this.matchCount == this.peoplePerGame) {
            this.setHighScore(this.score);
            Render.overlayWin();
          }
          Render._match();
          Render.sidebarSuccess();
          $(document).bind("click", $.proxy(function() {
            this.successfulMatch(this.oldSelected, cardEl);
          }, this));
        } else {
          Render._nomatch();
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

  //clear successfully matched cards
  successfulMatch: function(card1, card2) {
    $(card1).empty();
    $(card2).empty();
    $(card1).hide(300);
    $(card2).hide(300);
    this.cleanup();
  },

  //re-hide card back for non-matched cards
  failedMatch: function(card1, card2) {
    $(card1).toggleClass("flipped");
    $(card2).toggleClass("flipped");
    this.cleanup();
  },

  //parse what position this card is in the array using its id
  parseId: function(cardEl) {
    var id = cardEl.id;
    return parseInt(id.substring(5));
  },

  //clean up after attempted match
  cleanup: function() {
    this.oldSelected = null;
    Render.sidebarClear();
    $(document).unbind("click");
    $(".card-container").bind("click", function() {
      Game.selectCard(this);
      return false;
    })
  },

  //reset board to play again
  playAgain: function() {
    Render.hideOverlay();
    Render.highScore();
    this.matchCount = 0;
    this.clickCount = 0;
    this.score = 1240;
    Render.score(this.score);
    this.oldSelected = null;
    this.cards = [];
    this.newDeck();

    Render.clearCards();
    Render.cards(this.cards);
  },

  //set high score in local storage
  setHighScore: function(n) {
    var curScore = localStorage.getItem("_highscore");
    curScore = curScore ? curScore : 0;
    if (n > curScore) {
      localStorage.setItem("_highscore", n);
    }
  }
}

/******* RENDERING HELPERS ********/

Render =  {
  rows: 4,
  cols: 6,

  SELECTORS: {
    loginButton: "#loginButton",
    loading: "#floatingBarsG",
    overlay: ".overlay",
    modal: ".modal",
    game: "#table",
    sidebar: "#sidebar-content",
    score: "#score",
    highscore: "#high-score",
    bannermatch: "#banner-match",
    bannernomatch: "#banner-nomatch"
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
    $(this.SELECTORS.overlay).fadeOut(200);
  },

  hideLoading: function() {
    $(this.SELECTORS.loading).hide();
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

      //fade in cards individually and randomly
      $(".card-container").each(function() {
        window.setTimeout($.proxy(function() {
          $(this).fadeIn(generateRandom(300, 400));
        }, this), generateRandom(0, 200))
      })
    }

    $(".card-container").bind("click", function() {
      Game.selectCard(this);
      return false;
    })
  },

  card: function(card, n) {
    var cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.id = "card-" + n;

    var cardFront = document.createElement("div");
    cardFront.className = "card-front";
    cardEl.appendChild(cardFront);
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

    var cardContainer = document.createElement("div");
    cardContainer.className = "card-container";
    $(cardContainer).css("display", "none");
    cardContainer.appendChild(cardEl);

    return cardContainer;
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
    $(this.SELECTORS.overlay).fadeIn(300);
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
    $(this.SELECTORS.overlay).fadeIn(300);
  },

  _match: function() {
    window.setTimeout(function(self) {
      $(self.SELECTORS.bannermatch).fadeIn(300, function() {
        $('#banner-match').fadeOut(700);
      })},
      400,
      this
    );
  },

  _nomatch: function() {
    window.setTimeout(function(self) {
      $(self.SELECTORS.bannernomatch).fadeIn(300, function() {
        $('#banner-nomatch').fadeOut(700);
      })},
      400,
      this
    );

  }

}

/******** RANDOM UTIL FUNCTIONS ***********/

function generateRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(document).ready (function() {
  if(typeof(Storage) == "undefined") {
    alert("Your browser does not support local storage, this may mean some features of connectiontration will be broken :(");
  }
})