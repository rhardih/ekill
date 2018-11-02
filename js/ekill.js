((c, d, l, ekill) => {
  c.runtime.sendMessage('pageLoading');

  let contentAction = settings => {
    let killCount = 0;

    // No need to wait for a 'DOMContentLoaded' event since the manifest
    // specifies:
    //
    //   "run_at": "document_end"
    //
    if (settings.holdsGrudge === "true") {
      c.storage.local.get({
        "ekillHitlistV2": "{}"
      }, item => {
        if (c.runtime.lastError) {
          console.error(c.runtime.lastError);
        } else {
          // Remove all elements ekill currently holds a grudge against on the
          // current page

          let hitList = JSON.parse(item.ekillHitlistV2);

          // Clean up old hit list
          c.storage.local.remove("ekillHitlist");

          let paths = hitList[l.hostname];

          if (paths !== undefined) {
            let selectors = [];

            if (paths[l.pathname] !== undefined) {
              paths[l.pathname].forEach(item => {
                selectors.push(item.selector);
              });
            }

            if (paths["*"] !== undefined) {
              paths["*"].forEach(item => {
                selectors.push(item.selector);
              });
            }

            if (selectors.length !== 0) {
              killCount = 0;

              selectors.forEach(s => {
                // We have to consider, that the hit might not be present in the
                // page until later, so we null guard it here
                let target = document.querySelector(s);
                if (target !== null) {
                  target.remove()
                  killCount++;
                }
              });

              c.runtime.sendMessage('killCountUpdated');

              // If not all selectors had a match, maybe some of them targets
              // elements that load onto the page later.
              //
              // In that case we monitor page changes
              //
              // (Obviously it can simply be that the page changed as well.)
              if (killCount !== selectors.length) {
                console.info("ekill still holds a grudge and will lie in wait...");

                let body = d.querySelector('body');
                let config = { attributes: true, childList: true, subtree: true };
                let observer = new MutationObserver((mutationsList, observer) => {
                  selectors.forEach(s => {
                    let target = document.querySelector(s);
                    if (target !== null) {
                      target.remove()
                      killCount++;
                    }

                    // When all targets have been found and killed, we can be at
                    // peace
                    if (killCount === selectors.length) {
                      observer.disconnect();
                      console.info("ekill satisfied");
                    }
                  });

                  c.runtime.sendMessage('killCountUpdated');
                });

                observer.observe(body, config);
              }
            }
          }
        }
      });

      let msgHandler = (message, sender, sendResponse) => {
        if (message === "queryKillCount")
          sendResponse(killCount);
      };

      c.runtime.onMessage.addListener(msgHandler);
    }

    let active = false;
    let clickable = [
      d.getElementsByTagName("a"),
      d.getElementsByTagName("button"),
      d.querySelectorAll('[role=button]'),
    ];

    let overHandler = e => {
      e.target.classList.add("ekill");
      e.stopPropagation();
    };
    let outHandler = e => {
      e.target.classList.remove("ekill");
      e.stopPropagation();
    };

    let saveRemovedElement = (element, callback) => {
      c.storage.local.get({
        "ekillHitlistV2": "{}"
      }, item => {
        if (c.runtime.lastError) {
          console.error(c.runtime.lastError);
        } else {
          let hitList = JSON.parse(item.ekillHitlistV2);
          let hierarchy = ekill.generateElementHierarchy(element);
          let selector = ekill.elementHierarchyToDOMString(hierarchy);

          ekill.addHit(hitList, l.hostname, l.pathname, selector);

          c.storage.local.set({
            "ekillHitlistV2": JSON.stringify(hitList)
          }, _ => {
            if (c.runtime.lastError) {
              console.error(c.runtime.lastError);
            } else {
              callback();
            }
          });
        }
      });
    }

    let clickHandler = e => {
      disable();

      if (settings.holdsGrudge === "true") {
        saveRemovedElement(e.target, () => e.target.remove());
      } else {
        e.target.remove();
      }

      e.preventDefault();
      e.stopPropagation();
    };

    let keyHandler = e => {
      if (e.key === "Escape") {
        disable();
      }
    }

    let enable = _ => {
      active = true;

      // override click handlers on any clickable element
      clickable.forEach(c => {
        for (var i = 0; i < c.length; i++) {
          c[i].onclickBackup = c[i].onclick;
          c[i].addEventListener("click", clickHandler);
        }
      });

      d.documentElement.classList.add("ekill-cursor");
      d.addEventListener("mouseover", overHandler);
      d.addEventListener("mouseout", outHandler);
      d.addEventListener("click", clickHandler);
      d.addEventListener("keydown", keyHandler, true);
    };

    let disable = _ => {
      active = false;

      clickable.forEach(c => {
        for (var i = 0; i < c.length; i++) {
          c[i].removeEventListener("click", clickHandler);
          c[i].addEventListener("click", c[i].onclickBackup);
          delete c[i].onclickBackup;
        }
      });

      d.documentElement.classList.remove("ekill-cursor");

      // clean any orphaned hover applied class
      let orphan = d.querySelector('.ekill');
      if (orphan !== null) {
        orphan.classList.remove("ekill");
      }

      d.removeEventListener("mouseover", overHandler);
      d.removeEventListener("mouseout", outHandler);
      d.removeEventListener("click", clickHandler);
      d.removeEventListener("keydown", keyHandler, true);
    };

    let msgHandler = (message, sender, sendResponse) => {
      if (message === "toggle") {
        if (active) {
          disable();
        } else {
          enable();
        }
      }
    };

    c.runtime.onMessage.addListener(msgHandler);
  }

  // Note even though Firefox uses promises, it supports the 'chrome' object and
  // callbacks as well:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities#Firefox_supports_both_chrome_and_browser_namespaces
  c.storage.sync.get({
    "ekillSettings": {
      holdsGrudge: "false"
    }
  }, item => {
    if (c.runtime.lastError) {
      console.error(c.runtime.lastError);
    } else {
      contentAction(item.ekillSettings);
    }
  });
})(chrome, document, location, window.ekill);
