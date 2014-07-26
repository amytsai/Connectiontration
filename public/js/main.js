
/******* RENDERING HELPERS ********/

Render =  {
	SELECTORS: {
		loginButton: "#loginButton",
		overlay: ".overlay"
	},

	loginButton: function() {
		if(IN.User && IN.User.isAuthorized()) {
			$(this.SELECTORS.loginButton).html("Play");
		} else {
			$(this.SELECTORS.loginButton).html("Log in with LinkedIn");
		}
	},

	connection: function(member) {
		result = "<p id=\"" + member.id + "\">";
		result += "<img src=\"" + member.pictureUrl + "\"/>";
		result += member.firstName + " "  + member.lastName + "</p>";
		return result;
	},

	hideOverlay: function() {
		$(SELECTORS.overlay).hide(200);
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

var myConnections = [];

function filterConnections(profiles) {
	members = profiles.values;
	for(var i = 0; i < members.length; i++) {
		member = members[i];
		if(member.firstName != "private" && member.lastName != "private" && member.pictureUrl) {
			myConnections.push(member)
		}
	}
	displayConnections(myConnections)
}

function displayConnections(connections) {
	var members = connections;
	var el = document.getElementById("profiles");
	var resultHTML = "";
	for(var i = 0; i < members.length; i++) {
		var member = members[i];
		resultHTML += Render.Connection(member);
	}
	el.innerHTML = resultHTML;
}

$(document).ready(function() {

});