var server_url = "http://localhost:3000/";

/**
 * description
 * @param  {Object}  bookmark_object chrome bookmarks tree node
 * @return {Boolean}
 */
function isBookmark(bookmark_object) {
	return 'url' in bookmark_object;
}

/**
 * Folder check
 * @param  {Object}  bookmark_object chrome bookmarks tree node
 * @return {Boolean}
 */
function isFolder(bookmark_object) {
	return !('url' in bookmark_object);
}

/**
 * Main function for traversing the bookmarks tree and sending it to server
 * @param  {String} key api key which is a mongo ObjectId
 */
function syncBookmarks(key) {
	var bookmarks = {};
	var folders = [];

	/**
	 * @param  {Object} folder chrome bookmarks tree node
	 * @return {Object} folder object without children array
	 */
	function folderObject(folder) {
		var _folder = {}
		_folder.dateAdded = folder.dateAdded;
		_folder.dateGroupModified = folder.dateGroupModified;
		_folder.id = folder.id;
		_folder.index = folder.index;
		_folder.parentId = folder.parentId;
		_folder.title = folder.title;

		return _folder;
	}

	/**
	 * Recursive function that extracts bookmarks from folder node in tree
	 * and creates bookmars object and populates folders array
	 * @param  {Object} folder chrome bookmarks tree node with children
	 */
	function extractFromFolder(folder) {
		if(typeof bookmarks[folder.title] === 'undefined') {
			bookmarks[folder.title] = [];
		}

		folder.children.forEach(function (child) {
			if(isFolder(child)) {
				folders.push(folderObject(child));
				extractFromFolder(child);
			}

			if(isBookmark(child)) {
				bookmarks[folder.title].push(child);
			}
		});
	}

	chrome.storage.local.set({'key': key}, function(data) {
		console.log("Storage key set: " + key);

		chrome.bookmarks.getTree(function (data) {

			var main_children = data[0].children;

			//extract first bookmark folders
			main_children.forEach(function(folder) {
				//better check
				if(isFolder(folder)) {
					//save folders to array without children
					folders.push(folderObject(folder));
					extractFromFolder(folder);
				}
			});

			//send folders array
			_.postJSON(server_url + 'folders', {key: key, folders: folders});

			//send bookmarks
			Object.keys(bookmarks).forEach(function(folder) {
				_.postJSON(server_url + 'bookmarks', {key: key, bookmarks: bookmarks[folder]});
			});
		});
	});
}

var storage_key = "";
chrome.storage.local.get('key', function(data) {
	if(data.key.length !== 0) {
		storage_key = data.key
	}
});

chrome.bookmarks.onRemoved.addListener(function (id, info) {
	_.postJSON(server_url + 'remove', {key: storage_key, id: id});
});

chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
	if(isFolder(bookmark)) {
		_.postJSON(server_url + "folder", {key: storage_key, folder: bookmark});
	} else {
		_.postJSON(server_url + "bookmark", {key: storage_key, bookmark: bookmark});
	}
});

chrome.bookmarks.onChanged.addListener(function (id, changeInfo) {
	_.postJSON(server_url + "bookmark_changed", {key: storage_key, id: id, changed: changeInfo});
});

chrome.bookmarks.onMoved.addListener(function (id, moveInfo) {
	_.postJSON(server_url + "bookmark_moved", {key: storage_key, id: id, moved: moveInfo});
});

chrome.browserAction.onClicked.addListener(function (tab) {
	syncBookmarks(storage_key);
})
