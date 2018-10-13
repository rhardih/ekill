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
      keepRemoved: "false"
    }
  }, function(item) {
    if (chrome.runtime.lastError) {
      console.error(browser.runtime.lastError);
    } else {
      let settings = item.ekillSettings;


      if (settings.keepRemoved === "true") {
        $("input#optionsOn").prop("checked", true);
        $('#hit-list').treeview('enableAll', { silent: true });
        $("input#optionsOff").prop("checked", false);
        $("#search-input").prop("disabled", false);
      } else {
        $("input#optionsOn").prop("checked", false);
        $('#hit-list').treeview('disableAll', { silent: true });
        $("input#optionsOff").prop("checked", true);
        $("#search-input").prop("disabled", true);
      }

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
  let convertToTreeData = hitListData => {
    var d = [];

    for (let hostname in hitListData) {
      let hostnameNode = {
        text: hostname,
        hostname: hostname,
        nodes: [],
        level: 0
      }

      let hostnameObject = hitListData[hostname];

      for (let pathname in hostnameObject) {
        let pathNode = {
          text: pathname,
          hostname: hostname,
          nodes: [
            {
              text: hostnameObject[pathname],
              hostname: hostname,
              pathname: pathname
            }
          ],
          level: 1
        }

        hostnameNode.nodes.push(pathNode);
      }

      d.push(hostnameNode);
    }

    return d;
  }

  chrome.storage.local.get({
    ekillHitlist: "{}"
  }, function(item) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      let hitList = JSON.parse(item.ekillHitlist);
      let treeData = convertToTreeData(hitList);

      $('#hit-list').treeview({
        data: treeData,
        levels: 0,
        multiSelect: true
      });

      $('#search-input').on('input', function() {
        // minimum three characters typed before searching
        if (this.value.length < 3) return;

        $('#hit-list').treeview('clearSearch');
        $('#hit-list').treeview('search', [ this.value, {
          ignoreCase: true,
          exactMatch: false,
          revealResults: true,
        }]);
      });

      $('#hit-list').on('nodeSelected', function(event, data) {
        let queue = [data];

        $('button#remove-button').prop("disabled", false);

        // select every node in sub-tree
        while (queue.length !== 0) {
          let currentNode = queue.pop();
          $('#hit-list').treeview('selectNode', [ currentNode.nodeId, { silent: true } ]);
          if (currentNode.nodes !== undefined) {
            queue.push(...currentNode.nodes);
          }
        }
      });

      $('#hit-list').on('nodeUnselected', function(event, data) {
        let queue = [data];

        // unselect every node in sub-tree
        while (queue.length !== 0) {
          let currentNode = queue.pop();
          $('#hit-list').treeview('unselectNode', [ currentNode.nodeId, { silent: true } ]);
          if (currentNode.nodes !== undefined) {
            queue.push(...currentNode.nodes);
          }
        }

        if($('#hit-list').treeview('getSelected').length === 0) {
          $('button#remove-button').prop("disabled", true);
        }
      });

      $('input[type=radio][name=grudge]').change(function() {
        let keepRemoved;

        if (this.value === "on") {
          keepRemoved = "true";

          $('#hit-list').treeview('enableAll', { silent: true });
          $("#search-input").prop("disabled", false);
        } else {
          keepRemoved = "false";
          $('#hit-list').treeview('disableAll', { silent: true });
          $("#search-input").prop("disabled", true);
        }

        let settings = {
          ekillSettings: {
            keepRemoved: keepRemoved
          }
        }

        chrome.storage.sync.set(settings, function() {
          if (chrome.runtime.lastError) {
            console.error(browser.runtime.lastError);
          }
        });
      });

      $('button#remove-button').click(function() {
        //if (window.confirm("Remove selected Hit List targets?")) {
          var selected = $('#hit-list').treeview('getSelected');

          selected.forEach(s => {
            if (hitList[s.hostname]) {
              console.log("foo", hitList[s.hostname], s.pathname);
              if (hitList[s.hostname][s.pathname]) {
                console.log("deleting", hitList[s.hostname][s.pathname]);
                delete hitList[s.hostname][s.pathname];
              }
              //delete hitList[s.hostname];
            }

            let settings = {
              ekillHitlist: JSON.stringify(hitList)
            }

            console.log(settings);

            chrome.storage.local.set(settings, function() {
              if (chrome.runtime.lastError) {
                console.error(browser.runtime.lastError);
              } else {
                location.reload();
              }
            });
          });
        //}
      });
    }

    previousSettings();
    printAllPages();
  });

}

document.getElementById('save').addEventListener('click', saveOptions);
document.addEventListener('DOMContentLoaded', onLoad);
