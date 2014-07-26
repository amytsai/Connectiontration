var myConnections = [];

function onLinkedInLoad() {
	IN.Event.on(IN, "auth", onLinkedInAuth);
}

function onLinkedInAuth() {
	IN.API.Connections("me")
		.fields("firstName", "lastName", "id", "pictureUrl")
		.result(filterConnections);
}

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
		resultHTML += renderConnection(member);
	}
	el.innerHTML = resultHTML;
}

function renderConnection(member) {
	result = "<p id=\"" + member.id + "\">";
	result += "<img src=\"" + member.pictureUrl + "\"/>";
	result += member.firstName + " "  + member.lastName + "</p>";
	return result;
}