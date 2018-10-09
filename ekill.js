(function(c, d){
  function lookupElementByXPath(path){
    return new Promise(resolve => {
      var evaluator = new XPathEvaluator();
      var result = evaluator.evaluate(path, document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      let x = result.singleNodeValue;
      resolve(x);
    })
  }


  function createXPathFromElement(elm){
    return new Promise(resolve => {
      var allNodes = document.getElementsByTagName('*');
      for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode){
        if (elm.hasAttribute('id')){
          var uniqueIdCount = 0;
          for (var n = 0; n < allNodes.length; n++){
            if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
            if (uniqueIdCount > 1) break;
          };
          if (uniqueIdCount == 1){
            segs.unshift('id("' + elm.getAttribute('id') + '")');
            resolve(segs.join('/'));
          } else {
            segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
          }
        } else if (elm.hasAttribute('class')){
          segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
        } else {
          for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling){
            if (sib.localName == elm.localName) i++;
          };
          segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
        };
      };
      let x = segs.length ? '/' + segs.join('/') : null
      resolve(x);

    })
  };


  let getStoredSettings = new Promise(function(resolve, reject){ // making this a promise due to the async nature of extension storage
    chrome.storage.sync.get({
      keepRemoved: false
    }, function(items){
      if (!items){
        resolve({ keepRemoved: false }); // firefox does not seem to support default variables??
      } else {
        resolve(items);
      }
    });
  });


  let docload = function(e){ // document loaded
    console.log('document loaded')
    getStoredSettings.then(function(settings){
      if (settings.keepRemoved === 'true' || settings.keepRemoved === true){
        c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result){ // the "value" in this pair is the default value we get when nothing has been stored yet
          removeSavedFromDOM(result[`ekill-replace-${window.location.hostname}`]);
        });
      }
    })
  };


  let removeSavedFromDOM = function(elementArray){
    console.log(elementArray);
    console.warn('removing previously removed HTML elements')
    let ekillStorage = [...elementArray];
    for (let i = 0; i < ekillStorage.length + 1; i++){
      if (i === ekillStorage.length+1){
        console.log(ekillStorage)
        checkDelayed(ekillStorage);
        break;
      } else {  
        lookupElementByXPath(ekillStorage[i].xpath).then((element) => {
          if (!element){
          } else {
            element.remove();
            ekillStorage.splice(i, 1);
            console.warn('removed element from the page')
          }
        })
      }
    } // forloop 1
  }

  let checkDelayed = function(elementArray){
    let ekillStorage = [...elementArray];
    let intervalCount = 0;
    let timeOutCount = 18; // times interval will run before it gives up
    let interval = setInterval(function(){
      if (intervalCount >= timeOutCount){
        clearInterval(interval);
      } else if (ekillStorage.length === 0){ // already found & removed all elements
        clearInterval(interval);
      } else {
        for (let i = 0; i < ekillStorage.length; i++){
          lookupElementByXPath(ekillStorage[i].xpath).then((element) => {
            //console.log(element)
            if (!element){

            } else {
              element.remove();
              ekillStorage.splice(i, 1);
              console.warn('removed element from the page')
            }
          })

        } // forloop 1
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

  let overHandler = function(e){
    e.target.classList.add("ekill");
    e.stopPropagation();
  };
  let outHandler = function(e){
    e.target.classList.remove("ekill");
    e.stopPropagation();
  };


  let saveRemovedElement = function(e){
    return new Promise((resolve) => {
      let element = e.toElement;
      if (e.target.classList.length === 0){ // fix for:  'empty classes seem to break matching'
            element.removeAttribute('class');
      }
      getStoredSettings.then(function(settings){
        if (settings.keepRemoved === 'true'){
          // note .. the url is very specific .. not sure if this should be like this or apply to the whole website e.g facebook.com/*
          c.storage.local.get({ [`ekill-replace-${window.location.hostname}`]: [] }, function(result){ // try and get data for this URL.. if nothing is there we get [] (empty array)
            createXPathFromElement(element).then(function(path){
              let temp = result[`ekill-replace-${window.location.hostname}`];
              temp.push({ "element": e.localName, "xpath": path }); // properties we want to save from the selected HTML element
              c.storage.local.set( // saving
                {
                  [`ekill-replace-${window.location.hostname}`]: temp
                }, function(){
                  resolve();
                });
            })
          });
        } else {
          resolve();
        }
      })
    })
  }


  let clickHandler = function(e){
    disable();
    saveRemovedElement(e).then(() => {
      e.target.remove();
    });
    e.preventDefault();
    e.stopPropagation();
  };


  let keyHandler = function(e){
    if (e.key === "Escape"){
      disable();
    }
  }

  let enable = function(){
    active = true;

    // override click handlers on any clickable element
    clickable.forEach(function(c){
      for (var i = 0; i < c.length; i++){
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
  let disable = function(){
    active = false;

    clickable.forEach(function(c){
      for (var i = 0; i < c.length; i++){
        c[i].removeEventListener("click", clickHandler);
        c[i].addEventListener("click", c[i].onclickBackup);
        delete c[i].onclickBackup;
      }
    });

    d.documentElement.classList.remove("ekill-cursor");

    // clean any orphaned hover applied class
    let orphan = d.querySelector('.ekill');
    if (orphan !== null){
      orphan.classList.remove("ekill");
    }

    d.removeEventListener("mouseover", overHandler);
    d.removeEventListener("mouseout", outHandler);
    d.removeEventListener("click", clickHandler);
    d.removeEventListener("keydown", keyHandler, true);
  };


  let msgHandler = function(message, callback){
    if (active){
      disable();
    } else {
      enable();
    }
  };

  c.runtime.onMessage.addListener(msgHandler);
  window.addEventListener("load", docload);
})(chrome, document);


