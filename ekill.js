(function (c, d) {

  let getStoredSettings = new Promise(function (resolve, reject) { // making this a promise due to the async nature of extension storage
    chrome.storage.sync.get({
      keepRemoved: false
    }, function (items) {
      resolve(items);
    });

  });

  if (!localStorage.getItem('ekill-replace')) {
    localStorage.setItem('ekill-replace', JSON.stringify({
      "elements": []
    }));
  }








  let docload = function (e) { // document loaded
    getStoredSettings.then(function (settings) {
      //console.log(settings);
      if (settings.keepRemoved === 'true') { // user wants to remove previously removed elements
        chrome.storage.local.get({[`ekill-replace-${document.URL}`]: []}, function(result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
          removeSaved(result[`ekill-replace-${document.URL}`]);
          //console.log(result)
        });
      }
    })
  };


  let removeSaved = function (elementArray) { // removed saved elements 
    console.warn('removing previously removed HTML elements')
    let ekillStorage = elementArray;
    
   
    for (let i = 0; i < ekillStorage.length; i++) {
      /* TODO:
            1. this loop can be made better (efficiency) by replacing the modified page AFTER the whole loop has run..
            2. change the matching ('include(etc etc)') to be more loose.. currently it checks the exact string that was removed.. this allows pages to defeat this with randomisation.
            3. there's probably a better way to do this!!. not sure about looping over html elements. this is by far the easiest i can think of
      */
      let _document = d.body;
      let old_body_class = _document.className; // since we re-construct the body we should add these back.
      let old_body_id = _document.id;
      let old_body_style = document.style;
      //console.log(old_body_class)
      let documentString = _document.outerHTML.toString();
      console.log(ekillStorage[i]);
      if (documentString.includes(ekillStorage[i])) {

        let newHTMLstring = documentString.replace(ekillStorage[i], '');
        //console.log(ekillStorage[i]);
        let element = document.createElement("body");
        element.innerHTML = `${newHTMLstring}`;
        element.className = old_body_class;
        element.id = old_body_style;
        element.style = old_body_style;
        var oldChild = d.documentElement.replaceChild(element, d.body);

      } else {
        //console.log('element to remove was not found on the page')
      }


    }

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
    chrome.storage.local.get({[`ekill-replace-${document.URL}`]: []}, function(result) { // try and get data for this URL.. if nothing is there we get [] (empty array)
      //console.log(result);
      let temp = result[`ekill-replace-${document.URL}`]
      temp.push(e.target.outerHTML.toString());
      chrome.storage.local.set(
        {
          [`ekill-replace-${document.URL}`]: temp
        }, function () {
          console.info('finished saving element')
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


