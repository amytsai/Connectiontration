
/******* RENDERING HELPERS ********/

Render =  {
  rows: 4,
  cols: 6,

  SELECTORS: {
    loginButton: "#loginButton",
    overlay: ".overlay",
    game: "#game"
  },

  loginButton: function() {
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

    $(.card).bind("click", function() {
      Game.selectCard(this);
    })
  },

  card: function(card, n) {
    var cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.id = "card-" + n;

    var cardBack = document.createElement("div");
    cardBack.className = "card-back"
    cardEl.appendChild(cardBack);
    if(card.isPicture) {
      imgEl = document.createElement("img");
      imgEl.src = card.pictureUrl;
      $(cardBack).append(imgEl);
    } else {
      $(cardBack).html(card.name);
    }
    return cardEl;
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

  initialize: function(connections) {
    //TODO: Check whether the user has enough connections to start a game
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
  }

  selectCard: function(cardEl) {
    cardEl.style.visibility = "visible";
  }
}

$(document).ready(function() {

});