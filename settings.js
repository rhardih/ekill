function saveOptions() {
  let keepRemoved_Value = document.getElementById('keepRemoved').value;
  chrome.storage.sync.set({ keepRemoved: keepRemoved_Value }, function() {

  });
}

function previousSettings() {
  chrome.storage.sync.get({
    keepRemoved: false
  }, function(items) {
    document.getElementById('keepRemoved').value = items.keepRemoved;
  });
}

function removeSinglePage(e) {
  console.warn(`removing ${e.target.id}`)
  chrome.storage.local.set({ [`${e.target.id}`]: [] }, function() {
    let removed = document.getElementById(`dynamic-${e.target.id}`).remove();
  });
}

function printAllPages() { // get all the pages we have settings for from storage and updates the DOM
  chrome.storage.local.get(null, function(result) {
    let URLBOX = document.getElementById('URLBOX');
    for (page in result) {
      if (result[page].length !== 0) {
        let newItem = document.createElement('div');
        newItem.innerHTML = `<li class="list-group-item" id='dynamic-${page}' >${page.replace('ekill-replace-', '')} --- <button class="btn btn-danger  " style='float:right;' id="${page}">Remove</button></p>
        `;
        URLBOX.appendChild(newItem);
        document.getElementById(page).addEventListener('click', removeSinglePage);
      }
    }

  });
}

function onLoad() {
  previousSettings();
  printAllPages();
}

document.getElementById('save').addEventListener('click', saveOptions);
document.addEventListener('DOMContentLoaded', onLoad);
