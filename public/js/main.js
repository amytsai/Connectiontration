
/******* RENDERING HELPERS ********/

Render =  {
  rows: 5,
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
        $(row).append(this.card(cardArray[i*j + j]));
      }
      $(this.SELECTORS.game).append(row);
    }
  },

  card: function(card) {
    var cardEl = document.createElement("div");
    cardEl.className = "card";
    if(card.isPicture) {
      imgEl = document.createElement("img");
      imgEl.src = card.content;
      $(cardEl).append(imgEl);
    } else {
      $(cardEl).html(card.content);
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
  peoplePerGame: 15,

  initialize: function(connections) {
    //TODO: Check whether the user has enough connections to start a game
    this.connections = this.shuffle(connections);
    var people = this.getNextPeople(peoplePerGame);

    for(var i = 0; i < peoplePerGame; i++) {
      var person = people[i];
      card1 = {
        isPicture: false,
        content: person.firstName + " " + person.lastName
      }
      this.cards.push(card1);

      card2= {
        isPicture: true,
        content: person.pictureUrl
      }
      this.cards.push(card2);
    }
    Render.cards(this.cards);
  },

  getNextPeople: function(n) {
    //if we're out of cards, shuffle again
    if(location + n > connections.length) {
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
}

$(document).ready(function() {

});