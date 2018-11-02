document.addEventListener('DOMContentLoaded', _ => {
  let stringVersion = chrome.runtime.getManifest().version.toString();
  $("#version").text(stringVersion);

  chrome.storage.sync.get({
    "ekillVersion": {
      shownChangesFor: "0.0"
    }
  }, item => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      let ekillVersion = item.ekillVersion;

      // Mark each version header not previously show with a "New" badge
      $("h2.version-header").each((index, header) => {
        let showBadge = ekill.isNewerVersion(
          $(header).data("version").toString(),
          ekillVersion.shownChangesFor);

        if (showBadge) {
          $(header).html(`${$(header).text()} <span class="badge">New</span>`);
        }
      });

      // Update 'shownChangesFor' to indicate newly shown version
      item.ekillVersion.shownChangesFor = stringVersion;

      chrome.storage.sync.set(item, _ => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        }
      });
    }
  });
});
