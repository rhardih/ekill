(function(c, d) {
  let getStoredSettings = new Promise(function(resolve, reject) { // making this a promise due to the async nature of extension storage
    chrome.storage.sync.get({
      keepRemoved: false
    }, function(items) {
      if (!items) {
        resolve({ keepRemoved: false }); // firefox does not seem to support default variables??
      } else {
        resolve(items);
      }
    });
  });

  let docload = function(e) {
    getStoredSettings.then(function(settings) {
      if (settings.keepRemoved === 'true' || settings.keepRemoved === true) {
        c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result) {
          removeSaved(result[`ekill-replace-${window.location.hostname}`]);
        });
      }
    })
  };

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

  let saveRemovedElement = function(e) {
    getStoredSettings.then(function(settings) {
      if (settings.keepRemoved === 'true') {
        // note .. the url is very specific .. not sure if this should be like this or apply to the whole website e.g facebook.com/*
        c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
          let temp = result[`ekill-replace-${window.location.hostname}`];
          let outerHTML_Cleanup = e.target.outerHTML.toString();
          let element = e.target;
          if (e.target.classList.length === 0) { // fix for:  'empty classes seem to break matching'
            element.removeAttribute('class');
            outerHTML_Cleanup = element.outerHTML.toString();
          }
          temp.push({ "element": e.target.localName, "outerHTML": outerHTML_Cleanup }); // properties we want to save from the selected HTML element
          c.storage.local.set(
            {
              [`ekill-replace-${window.location.hostname}`]: temp
            }, function() {
            });

        });
      }
    })
  }

  let clickHandler = function(e) {
    disable();
    saveRemovedElement(e);

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
  window.addEventListener("load", docload);
})(chrome, document);
