(c => {
  c.storage.sync.get({
    "ekillVersion": {
      shownChangesFor: "0.0"
    }
  }, item => {
    if (c.runtime.lastError) {
      console.error(c.runtime.lastError);
    } else {
      let ekillVersion = item.ekillVersion;
      let stringVersion = c.runtime.getManifest().version.toString();
      let showChanges = ekillVersion.shownChangesFor < stringVersion;

      if (showChanges) {
        c.browserAction.setBadgeBackgroundColor({ color: "#000000" });
        c.browserAction.setBadgeText({text: "New"});
      }

      c.browserAction.onClicked.addListener(tab => {
        if (showChanges) {
          c.tabs.create({ url: c.extension.getURL("changelog.html") });

          showChanges = false;
          c.browserAction.setBadgeText({text: ""});

        } else {
          c.tabs.sendMessage(tab.id, {});
        }
      });
    }

  });
})(chrome);
