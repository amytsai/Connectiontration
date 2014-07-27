
/******* RENDERING HELPERS ********/

Render =  {
  rows: 4,
  cols: 6,

  SELECTORS: {
    loginButton: "#loginButton",
    overlay: ".overlay",
    game: "#table",
    sidebar: "#sidebar"
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

    $(".card").bind("click", function() {
      Game.selectCard(this);
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
  oldSelected: null,

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
  },

  selectCard: function(cardEl) {
    cardEl.firstChild.style.visibility = "visible";
    var id = this.parseId(cardEl);
    var newCard = this.cards[id];

    Render.sidebarAdd(newCard);
    if(this.oldSelected && this.oldSelected != cardEl) {
      //unbind card click events for next click
      $(".card").unbind("click");
      var oldCard = this.cards[this.parseId(this.oldSelected)];
      if(newCard.name === oldCard.name) {
        Render.sidebarSuccess();
        $(document).bind("click", $.proxy(function() {
          this.successfulMatch(this.oldSelected, cardEl);
        }, this);
      } else {
        Render.sidebarFail()
        $(document).bind("click", $.proxy(function() {
          this.failedMatch(this.oldSelected, cardEl);
        }, this);
      }
    } else {
      this.oldSelected = cardEl;
    }
  },

  successfulMatch: function(card1, card2) {
    $(card1).empty();
    $(card2).empty();
    $(card1).addClass('cleared');
    $(card2).addClass('cleared');
    this.oldSelected = null;
    $(".card").bind("click", function() {
      Game.selectCard(this);
    })
  },

  failedMatch: function(card1, card2) {
    card1.firstChild.style.visibility = "hidden";
    card2.firstChild.style.visibility = "hidden";
    this.oldSelected = null;
    $(".card").bind("click", function() {
      Game.selectCard(this);
    })
  },

  parseId: function(cardEl) {
    var id = cardEl.id;
    return parseInt(id.substring(5));
  }
}

$(document).ready(function() {

});