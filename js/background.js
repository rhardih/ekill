(c => {
  c.browserAction.setBadgeBackgroundColor({ color: "#000000" });

  c.storage.sync.get({
    "ekillVersion": {
      shownChangesFor: "0.0"
    },
    "ekillSettings": {
      holdsGrudge: "false"
    }
  }, item => {
    if (c.runtime.lastError) {
      console.error(c.runtime.lastError);
    } else {
      let ekillVersion = item.ekillVersion;
      let ekillSettings = item.ekillSettings;
      let stringVersion = c.runtime.getManifest().version.toString();
      let showChanges = ekillVersion.shownChangesFor < stringVersion;

      if (showChanges) {
        c.browserAction.setBadgeText({text: "New"});
      }

      c.browserAction.onClicked.addListener(tab => {
        if (showChanges) {
          c.tabs.create({ url: c.extension.getURL("changelog.html") });

          showChanges = false;
          c.browserAction.setBadgeText({text: ""});

        } else {
          c.tabs.sendMessage(tab.id, "toggle");
        }
      });

      if (ekillSettings.holdsGrudge === "true" && !showChanges) {
        let updateKillCounter = tabId => {
          c.tabs.sendMessage(tabId, "queryKillCount", {}, response => {
            if (c.runtime.lastError) {
              console.error(c.runtime.lastError);
            } else {
              if (response === undefined || response === 0) {
                c.browserAction.setBadgeText({text: ""});
              } else {
                c.browserAction.setBadgeText({text: response.toString()});
              }
            }
          });
        }

        // Check if a kill count was set when switching to a tab, and either
        // clear the badge or re-display the count
        c.tabs.onActivated.addListener((activeInfo) => {
          updateKillCounter(activeInfo.tabId);
        });

        c.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
          if (!tab.active) return;

          if (changeInfo.status == "loading") {
            // Clear badge on page reloads
            c.browserAction.setBadgeText({text: ""});
          }
        });

        let msgHandler = (message, sender, sendResponse) => {
          if (message === "killCountUpdated")
            updateKillCounter(sender.tab.id);
        };

        c.runtime.onMessage.addListener(msgHandler);
      }
    }
  });
})(chrome);
