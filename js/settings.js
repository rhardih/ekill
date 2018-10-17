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
    }
  });
}

function onLoad() {
  let convertToTreeData = hitListData => {
    var d = [];

    for (let hostname in hitListData) {
      let hostnameNode = {
        text: hostname,
        selectable: false,
        nodes: []
      }

      let hostnameObject = hitListData[hostname];

      for (let pathname in hostnameObject) {
        let pathnameNode = {
          text: pathname,
          selectable: false,
          nodes: []
        }

        let pathnameObject = hostnameObject[pathname];

        pathnameObject.forEach(selector => pathnameNode.nodes.push({
          text: selector,
          hostname: hostname,
          pathname: pathname
        }));

        hostnameNode.nodes.push(pathnameNode);
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

      let searchInput = $('#search-input');
      searchInput.on('input', function() {
        // minimum three characters typed before searching
        if (this.value.length < 3) return;

        $('#hit-list').treeview('clearSearch');
        $('#hit-list').treeview('search', [ this.value, {
          ignoreCase: true,
          exactMatch: false,
          revealResults: true,
        }]);
      });
      searchInput.focusout(function(e) {
        $('#hit-list').treeview('clearSearch');
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
        if (window.confirm("Remove selected Hit List targets?")) {
          $('#hit-list').treeview('getSelected').forEach(s => {
            ekill.removeHit(hitList, s.hostname, s.pathname, s.text);

            let settings = {
              ekillHitlist: JSON.stringify(hitList)
            };

            chrome.storage.local.set(settings, function() {
              if (chrome.runtime.lastError) {
                console.error(browser.runtime.lastError);
              } else {
                location.reload();
              }
            });
          });
        }
      });
    }

    previousSettings();
  });

  $("#version").text(chrome.runtime.getManifest().version);
}

document.addEventListener('DOMContentLoaded', onLoad);
