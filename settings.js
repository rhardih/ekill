function saveOptions() {
  let keepRemovedStringValue = document.getElementById('keepRemoved').value;

  let settings = {
    ekillSettings: {
      keepRemoved: keepRemovedStringValue
    }
  }

  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      console.error(browser.runtime.lastError);
    }
  });
}

function previousSettings() {
  chrome.storage.sync.get({
    "ekillSettings": {
      keepRemoved: false
    }
  }, function(item) {
    if (chrome.runtime.lastError) {
      console.error(browser.runtime.lastError);
    } else {
      let settings = item.ekillSettings;

      document.getElementById('keepRemoved').value = settings.keepRemoved;
    }
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
