function isBookmark(bookmark_object) {
	return !('children' in bookmark_object);
}

function isFolder(bookmark_object) {
	return 'children' in bookmark_object;
}

function extractFromFolder(folder, key) {
	var length = folder.children.length;

	for(var j=0; j<length; j++){
		var bookmark = folder.children[j];

		sendBookmark(bookmark, key);
		sendFolder(bookmark, key);

		if(isFolder(bookmark)) {	
			extractFromFolder(bookmark, key);
		}
	}
}

function sendBookmark (bookmark, key) {
	if(isBookmark(bookmark)) {
		_.postJSON("http://localhost:3000/bookmark", {key: key, bookmark: bookmark});
	}
}

function sendFolder (folder, key) {
	if(isFolder(folder)) {
		var _folder = {}
		_folder.dateAdded = folder.dateAdded;
		_folder.dateGroupModified = folder.dateGroupModified;
		_folder.id = folder.id;
		_folder.index = folder.index;
		_folder.parentId = folder.parentId;
		_folder.title = folder.title;

		_.postJSON("http://localhost:3000/folder", {key: key, folder: _folder});
	} 
}

function syncBookmarks(key) {
	chrome.storage.local.set({'key': key}, function(data) {});

	chrome.bookmarks.getTree(function (data) {

		var main_children = data[0].children;
		var length = data[0].children.length

		for(var i=0; i<length; i++) {
			var bookmark_object = data[0].children[i];

			sendBookmark(bookmark_object, key);
			sendFolder(bookmark_object, key);

			if(isFolder(bookmark_object)) {
				extractFromFolder(bookmark_object, key);
			}
		}
	});
}

var storage_key = "";
chrome.storage.local.get('key', function(data) {
  if(data.key.length !== 0) {
    storage_key = data.key
  }
});

chrome.bookmarks.onRemoved.addListener(function (id, info) {
	var request = new XMLHttpRequest();
	request.open('POST', 'http://localhost:3000/remove', true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({key: storage_key, id: id}));
});

chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
	var request = new XMLHttpRequest();
	request.open('POST', "http://localhost:3000/bookmark", true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({key: storage_key, bookmark: bookmark}));
});

chrome.bookmarks.onChanged.addListener(function (id, changeInfo) {
	var request = new XMLHttpRequest();
	request.open('POST', "http://localhost:3000/bookmark_changed", true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({key: storage_key, id: id, changed: changeInfo}));
})

chrome.bookmarks.onMoved.addListener(function (id, moveInfo) {
	var request = new XMLHttpRequest();
	request.open('POST', "http://localhost:3000/bookmark_moved", true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({key: storage_key, id: id, moved: moveInfo}));
})