((c, d, l, w) => {
  c.runtime.sendMessage('pageLoading');
  let ekill = w.ekill;

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
    let iframeOverlays = [];

    let overHandler = e => {
      e.target.classList.add("ekill");

      if (e.target.classList.contains("ekill-overlay")) {
        let iframe = iframeOverlays[e.target.dataset.index].iframe;
        iframe.classList.add("ekill");
      }

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

          try {
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
          } catch (e) {
            console.log("ekill: removed element not saved");
            console.error(e);
          }
        }
      });
    }

    let clickHandler = e => {
      disable();

      let target = e.target;

      if (target.classList.contains("ekill-overlay")) {
        target = iframeOverlays[target.dataset.index].iframe;
      }

      if (settings.holdsGrudge === "true") {
        saveRemovedElement(target, () => target.remove());
      } else {
        target.remove();
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

      let iframes = d.querySelectorAll('iframe');

      iframes.forEach(i => {
        let overlay = d.createElement('div');
        let iframeClientRect = i.getBoundingClientRect();
        let offsetX = iframeClientRect.left + w.scrollX;
        let offsetY = iframeClientRect.top + w.scrollY;

        overlay.classList.add("ekill-overlay");
        overlay.style.top = `${offsetY}px`;
        overlay.style.left = `${offsetX}px`;
        overlay.style.width = `${iframeClientRect.width}px`;
        overlay.style.height = `${iframeClientRect.height}px`;

        overlay.dataset.index = iframeOverlays.length;

        iframeOverlays.push({
          iframe: i,
          overlay: overlay
        });

        d.body.appendChild(overlay);
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

      iframeOverlays.forEach(o => o.overlay.remove());

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

    let updateOverlayPositions = e => {
      iframeOverlays.forEach(o => {
        let iframe = o.iframe;
        let iframeClientRect = iframe.getBoundingClientRect();
        let overlay = o.overlay;
        let offsetX = iframeClientRect.left + w.scrollX;
        let offsetY = iframeClientRect.top + w.scrollY;

        overlay.style.top = `${offsetY}px`;
        overlay.style.left = `${offsetX}px`;
      });
    };

    c.runtime.onMessage.addListener(msgHandler);
    w.addEventListener('scroll', updateOverlayPositions);
    w.addEventListener('resize', updateOverlayPositions);
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
})(chrome, document, location, window);
