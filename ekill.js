(function(c, d, l, ekill) {
  let contentAction = function(settings) {
    // No need to wait for a 'DOMContentLoaded' event since the manifest
    // specifies:
    //
    //   "run_at": "document_end"
    //
    if (settings.keepRemoved === "true") {
      c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result) {
        removeSaved(result[`ekill-replace-${window.location.hostname}`]);
      });
    }

    let removeSaved = function(elementArray) {
      console.warn('removing previously removed HTML elements')
      let ekillStorage = [...elementArray];
      for (let i = 0; i < ekillStorage.length + 1; i++) {
        if (i >= ekillStorage.length) {
          checkDelayed(ekillStorage);
          break;
        } else {
          let elementDump = document.getElementsByTagName(ekillStorage[i].element); // ekillStorage[i].element's value is usually a span, div etc tec
          for (let elem = 0; elem < elementDump.length; elem++) {
            if (elementDump[elem].outerHTML === ekillStorage[i].outerHTML) {
              elementDump[elem].remove();
              ekillStorage.splice(i, 1); // whenever we find an element that matched we want to get rid of it to make delayed checking a bit faster
              break;
            }
          }
        }
      }
    }

    let checkDelayed = function(elementArray) {
      let ekillStorage = [...elementArray];
      let intervalCount = 0;
      let timeOutCount = 18; // times interval will run before it gives up
      let interval = setInterval(function() {
        if (intervalCount >= timeOutCount) {
          clearInterval(interval);
        } else if (ekillStorage.length === 0) { // already found & removed all elements
          clearInterval(interval);
        } else {
          for (let i = 0; i < ekillStorage.length; i++) {
            let elementDump = document.getElementsByTagName(ekillStorage[i].element);
            for (let elem = 0; elem < elementDump.length; elem++) {
              if (elementDump[elem].outerHTML === ekillStorage[i].outerHTML) {
                elementDump[elem].remove();
                ekillStorage.splice(i, 1);
                break;
              }
            }
          }
          intervalCount++;
        }

      }, 1000);
    }

    let active = false;
    let clickable = [
      d.getElementsByTagName("a"),
      d.getElementsByTagName("button"),
      d.querySelectorAll('[role=button]'),
    ];

    let overHandler = function(e) {
      e.target.classList.add("ekill");
      e.stopPropagation();
    };
    let outHandler = function(e) {
      e.target.classList.remove("ekill");
      e.stopPropagation();
    };

    /**
     * Generates a selector string from a element hierarchy produced by
     * generateElementHierarchy. The selector string will uniquely return the
     * bottom most element in the hierarchy, when passed to .querySelector().
     *
     * The selector is fully qualified. This means each node in the path from
     * 'element' up the DOM tree, to the first uniquely identifiable node, is
     * referenced within the selector.
     *
     * E.g. this snippet:
     *
     * <div id="foo"><ul><li><p></p></li></ul></div>
     *
     * Will yield the following DOMString:
     *
     * #foo > ul > li > p
     *
     * To determine uniqueness, id, classes and sibling index is considered,
     * according this order of precedence:
     *
     * 1. id
     * 2. classes
     * 3. index
     *
     * @param {Object} hierarchy - Hierarchy object returned by
     * generateElementHierarchy
     * @returns {String} Selector DOMString
     */
    let elementHierarchyToDOMString = hierarchy => {
      let selectorParts = [];
      let currentObject = hierarchy;
      let parentElement = d; // document will always be a parent
      while (currentObject !== undefined) {
        let selectorPart = "";
        let uniqueByIdInDocument = false;
        let uniqueByIdInParent = false;
        let idSelector = `#${currentObject.id}`;

        if (currentObject.id !== "") {
          uniqueByIdInDocument = d.querySelectorAll(idSelector).length === 1;
          // Will be the same in first iteration since d === parentElement
          uniqueByIdInParent = parentElement.querySelectorAll(idSelector).
            length === 1;
        }

        if (uniqueByIdInDocument) {
          selectorPart = idSelector;

          // Since this element is *globally* unique by id, any parts of the
          // selector created until now can be disregarded
          selectorParts = [];
        } else if (uniqueByIdInParent) {
          selectorPart = idSelector;
        } else {
          // Try with classes when id fails
          let uniqueByClassesInDocument = false;
          let uniqueByClassesInParent = false;

          if (currentObject.classes !== "") {
            uniqueByClassesInDocument = d.
              querySelectorAll(currentObject.classes).length === 1;
            uniqueByClassesInParent = parentElement.
              querySelectorAll(currentObject.classes).length === 1;
          }

          if (uniqueByClassesInDocument) {
            selectorPart = currentObject.classes;

            // Same as above; if classes can uniquely target the element,
            // previous parts of the selector can be thrown away
            selectorParts = [];
          } else if (uniqueByClassesInParent) {
            selectorPart = currentObject.classes;
          } else {
            // In case both id and class based selectors are non-viable, use
            // nth-of-type instead where needed

            // Find all siblings of the same tag
            let childrenArray = ekill.toArray(parentElement.children);
            let sameTagChildren = childrenArray.
              filter(child => child.localName === currentObject.localName);

            if (sameTagChildren.length > 1) {
              let currentObjectIndex = childrenArray.indexOf(currentObject.el);

              selectorPart = `${currentObject.localName}:nth-of-type(${currentObjectIndex})`
            } else {
              selectorPart = currentObject.localName;
            }
          }
        }

        selectorParts.push(selectorPart);
        parentElement = currentObject.el;
        currentObject = currentObject.child;
      }

      return selectorParts.join(" > ");
    };

    let saveRemovedElement = function(element) {
      // note .. the url is very specific .. not sure if this should be like this or apply to the whole website e.g facebook.com/*
      c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
        let temp = result[`ekill-replace-${window.location.hostname}`];
        let outerHTML_Cleanup = element.outerHTML.toString();
        if (element.classList.length === 0) { // fix for:  'empty classes seem to break matching'
          element.removeAttribute('class');
          outerHTML_Cleanup = element.outerHTML.toString();
        }
        temp.push({ "element": element.localName, "outerHTML": outerHTML_Cleanup }); // properties we want to save from the selected HTML element
        c.storage.local.set(
          {
          [`ekill-replace-${window.location.hostname}`]: temp
        }, function() {
        });
      });

      c.storage.local.get({
        "ekillHitlist": "{}"
      }, function(item) {
        if (c.runtime.lastError) {
          console.error(c.runtime.lastError);
        } else {
          let hitList = JSON.parse(item.ekillHitlist);
          let hierarchy = ekill.generateElementHierarchy(element);
          let selector = elementHierarchyToDOMString(hierarchy);

          hitList[l.hostname] = hitList[l.hostname] || {};
          hitList[l.hostname][l.pathname] = selector;

          c.storage.local.set({
            "ekillHitlist": JSON.stringify(hitList)
          }, function() {
            if (c.runtime.lastError) {
              console.error(c.runtime.lastError);
            }
          });

        }
      });
    }

    let clickHandler = function(e) {
      disable();

      if (settings.keepRemoved === "true")
        saveRemovedElement(e.target);

      e.target.remove();
      e.preventDefault();
      e.stopPropagation();
    };

    let keyHandler = function(e) {
      if (e.key === "Escape") {
        disable();
      }
    }

    let enable = function() {
      active = true;

      // override click handlers on any clickable element
      clickable.forEach(function(c) {
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

    let disable = function() {
      active = false;

      clickable.forEach(function(c) {
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

    let msgHandler = function(message, callback) {
      if (active) {
        disable();
      } else {
        enable();
      }
    };

    c.runtime.onMessage.addListener(msgHandler);
  }

  // Note even though Firefox uses promises, ie supports the 'chrome' object and
  // callbacks as well:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities#Firefox_supports_both_chrome_and_browser_namespaces
  c.storage.sync.get({
    "ekillSettings": {
      keepRemoved: "false"
    }
  }, function(item) {
    if (c.runtime.lastError) {
      console.error(c.runtime.lastError);
    } else {
      contentAction(item.ekillSettings);
    }
  });
})(chrome, document, location, window.ekill);
