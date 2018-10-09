(function (c, d) {

  let getStoredSettings = new Promise(function (resolve, reject) { // making this a promise due to the async nature of extension storage
    chrome.storage.sync.get({
      keepRemoved: false
    }, function (items) {
      resolve(items);
    });

  });






  let docload = function (e) { // document loaded
    console.log('document loaded')
    getStoredSettings.then(function (settings) {
      //console.log(settings);
      if (settings.keepRemoved === 'true') { // user wants to remove previously removed elements
        chrome.storage.local.get({ [`ekill-replace-${document.URL}`]: [] }, function (result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
          removeSaved(result[`ekill-replace-${document.URL}`]);
          //console.log(result)
        });
      }
    })
  };


  let removeSaved = function (elementArray) {
    console.warn('removing previously removed HTML elements')
    let ekillStorage = [...elementArray];
    console.log(ekillStorage)
    for (let i = 0; i < ekillStorage.length + 1; i++) { // loop over stored HTML elements
      if (i >= ekillStorage.length) {
        checkDelayed(ekillStorage);
        break;
      } else {
        console.log(i)
        console.log(ekillStorage.length)
        let elementDump = document.getElementsByTagName(ekillStorage[i].element); // get a list of all the elements in this HTML page that is the same as the tag stored here e.g: <span> <div> etc tc
        for (let elem = 0; elem < elementDump.length; elem++) {
          //console.log(elementDump[elem])
          if (elementDump[elem].outerHTML === ekillStorage[i].outerHTML) {
            elementDump[elem].remove();
            ekillStorage.splice(i, 1); // whenever we find an element that matched we want to get rid of it to make delayed checking a bit faster
            break;
          }
        } // forloop 2
      }
    } // forloop 1
  }

  let checkDelayed = function (elementArray) {
    let ekillStorage = [...elementArray];
    let intervalCount = 0;
    let timeOutCount = 5; // how many times to try before we clear the interval?.
    let interval = setInterval(function () {
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

    }, 4000);
  }


  let active = false;
  let clickable = [
    d.getElementsByTagName("a"),
    d.getElementsByTagName("button"),
    d.querySelectorAll('[role=button]'),
  ];

  let overHandler = function (e) {
    e.target.classList.add("ekill");
    e.stopPropagation();
  };
  let outHandler = function (e) {
    e.target.classList.remove("ekill");
    e.stopPropagation();
  };


  let saveRemovedElement = function (e) {
    getStoredSettings.then(function (settings) { // getting the storage on each click so the user does not have to reload page after they change ekill's settings.
      if (settings.keepRemoved === 'true') { // we only save elements to remove if this is true
        // note .. the url is very specific .. not sure if this should be like this or apply to the whole website e.g facebook.com/*
        chrome.storage.local.get({ [`ekill-replace-${document.URL}`]: [] }, function (result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
          //console.log(result);
          let temp = result[`ekill-replace-${document.URL}`]; // temporary variable to modify
          let outerHTML_Cleanup = e.target.outerHTML.toString(); // cleanup auto-generated empty classes that cause the program to not match correctly
          let element = e.target; // only a temporary storage so we can remove the class if its empty
          if (e.target.classList.length === 0) { // empty classes seem to break matching
            element.removeAttribute('class');
            outerHTML_Cleanup = element.outerHTML.toString();
          }
          temp.push({ "element": e.target.localName, "outerHTML": outerHTML_Cleanup }); // properties we want to save from the selected HTML element
          chrome.storage.local.set( // saving
            {
              [`ekill-replace-${document.URL}`]: temp
            }, function () {
              console.info('finished saving element'); // not needed but its sparkling
            });

        });
      }
    })
  }


  let clickHandler = function (e) { // what we need
    disable();
    saveRemovedElement(e); // save the just removed element (will only save if user has the setting 'keepRemoved' to 'true')

    e.target.remove();
    e.preventDefault();
    e.stopPropagation();
  };


  let keyHandler = function (e) {
    if (e.key === "Escape") {
      disable();
    }
  }

  let enable = function () {
    active = true;

    // override click handlers on any clickable element
    clickable.forEach(function (c) {
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
  let disable = function () {
    active = false;

    clickable.forEach(function (c) {
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


  let msgHandler = function (message, callback) {
    if (active) {
      disable();
    } else {
      enable();
    }
  };

  c.runtime.onMessage.addListener(msgHandler);
  window.addEventListener("load", docload);
})(chrome, document);


