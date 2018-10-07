function save_options() { // la laa lalala la lalalala lala
    let keepRemoved_Value = document.getElementById('keepRemoved').value;
    //console.log(keepRemoved_Value);
    chrome.storage.sync.set({ keepRemoved: keepRemoved_Value }, function () {

    });
}

function previous_settings() {
    // keepremoved false by default? ..
    chrome.storage.sync.get({
        keepRemoved: false
    }, function (items) {
        document.getElementById('keepRemoved').value = items.keepRemoved;
    });
}


function removeSinglePage(e){
    console.warn(`removing ${e.target.id}`)
    chrome.storage.local.set({[`${e.target.id}`]: []}, function() {
       
      });

    }

function printAllPages(){ // get all the pages we have settings for from storage and updates the DOM
    chrome.storage.local.get(null, function(result) {
        //console.log(result);
        let URLBOX = document.getElementById('URLBOX');
        for(page in result){  
          
            //console.log(result[page])
            if(result[page].length !== 0){
                let newItem = document.createElement('div');
                newItem.innerHTML = `<span style='padding: 5px;background-color:grey;'>${page.replace('ekill-replace-', '')} --- <button id="${page}">Remove</button></span>`;
                URLBOX.appendChild(newItem);
                document.getElementById(page).addEventListener('click', removeSinglePage); // after we add the item we do this
            }
        }
        
        
       });
}



function onLoad(){
    previous_settings();
    printAllPages();
}



function clearStorage() {
   
}


// events
document.getElementById('save').addEventListener('click', save_options);
document.addEventListener('DOMContentLoaded', onLoad);
