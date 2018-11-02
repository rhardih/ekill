((c, d, l, ekill) => {
  let getSettings = callback => {
    c.storage.sync.get({
      "ekillSettings": {
        holdsGrudge: "false"
      }
    }, item => {
      if (c.runtime.lastError) {
        console.error(c.runtime.lastError);
      } else {
        callback(item.ekillSettings);
      }
    });
  }

  let onLoad = _ => {
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

          pathnameObject.forEach(item => pathnameNode.nodes.push({
            text: item.selector,
            hostname: hostname,
            pathname: pathname
          }));

          hostnameNode.nodes.push(pathnameNode);
        }

        d.push(hostnameNode);
      }

      return d;
    }

    c.storage.local.get({
      "ekillHitlistV2": "{}"
    }, item => {
      if (c.runtime.lastError) {
        console.error(c.runtime.lastError);
      } else {
        let hitList = JSON.parse(item.ekillHitlistV2);
        let treeData = convertToTreeData(hitList);

        $('#hit-list').treeview({
          data: treeData,
          levels: 0,
          multiSelect: true
        });

        let searchInput = $('#search-input');
        searchInput.on('input', e => {
          let value = e.target.value;

          // Min three characters typed before searching
          if (value.length < 3) return;

          $('#hit-list').treeview('clearSearch');
          $('#hit-list').treeview('search', [ value, {
            ignoreCase: true,
            exactMatch: false,
            revealResults: true,
          }]);
        });
        searchInput.focusout(e => {
          $('#hit-list').treeview('clearSearch');
        });


        $('#hit-list').on('nodeSelected', (event, data) => {
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

        $('#hit-list').on('nodeUnselected', (event, data) => {
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

        $('input[type=radio][name=grudge]').change(e => {
          let holdsGrudge;

          if (e.target.value === "on") {
            holdsGrudge = "true";

            $('#hit-list').treeview('enableAll', { silent: true });
            $("#search-input").prop("disabled", false);
          } else {
            holdsGrudge = "false";
            $('#hit-list').treeview('disableAll', { silent: true });
            $("#search-input").prop("disabled", true);
          }

          let settings = {
            ekillSettings: {
              holdsGrudge: holdsGrudge
            }
          }

          c.storage.sync.set(settings, _ => {
            if (c.runtime.lastError) {
              console.error(c.runtime.lastError);
            }
          });
        });

        $('button#remove-button').click(_ => {
          if (window.confirm("Remove selected Hit List targets?")) {
            $('#hit-list').treeview('getSelected').forEach(s => {
              ekill.removeHit(hitList, s.hostname, s.pathname, s.text);

              let settings = {
                "ekillHitlistV2": JSON.stringify(hitList)
              };

              c.storage.local.set(settings, _ => {
                if (c.runtime.lastError) {
                  console.error(c.runtime.lastError);
                } else {
                  l.reload();
                }
              });
            });
          }
        });
      }

      getSettings(settings => {
        if (settings.holdsGrudge === "true") {
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
      });
    });

    $("#version").text(c.runtime.getManifest().version);
  }

  d.addEventListener('DOMContentLoaded', onLoad);
})(chrome, document, location, ekill);
