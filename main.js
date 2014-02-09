document.addEventListener('DOMContentLoaded', function() {

	var storage_key = "";
	chrome.storage.local.get('key', function (data) {
		if(data.key.length !== 0) {
			storage_key = data.key
			_.id("key").value = storage_key;
		}
	});


	_.id("key-form").addEventListener('submit', function (event) {
		event.preventDefault();

		var key = _.id("key").value.trim();

		if(key.length === 0) {
			console.log("No key")
		} else {
			_.postJSON("http://localhost:3000/initial_remove", {key: storage_key});
			chrome.extension.getBackgroundPage().syncBookmarks(key);
		}
	});
	
	_.id("remove").addEventListener('click', function (event) {
		event.preventDefault();

		_.postJSON("http://localhost:3000/initial_remove", {key: storage_key});
	})
});




