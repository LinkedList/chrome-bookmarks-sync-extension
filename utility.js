var _ = {}

_.postJSON = function (url, json) {
	var request = new XMLHttpRequest();
	request.open('POST', url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify(json, true));
}

_.id = function (id) {
	return document.getElementById(id);
}
