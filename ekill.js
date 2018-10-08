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

      
      let elementDump = document.getElementsByTagName(ekillStorage[i].element);
      console.log(elementDump);
      for(let elem = 0; elem < elementDump.length; elem++){ // elem here is an html element
        console.log(elementDump[elem])
        if(elementDump[elem].outerHTML === ekillStorage[i].outerHTML){
          elementDump[elem].remove();

        }
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
      temp.push( {"element": e.target.localName, "outerHTML": e.target.outerHTML.toString()} );
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
    console.log(e.target.localName);
    
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


