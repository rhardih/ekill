(function(c, d){
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
  let clickHandler = function(e) {
    disable();
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
        c[i].addEventListener('click', function(e) {
          if (e.currentTarget === d) return;

          clickHandler(e);
        });
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
        c[i].onclick= c[i].onclickBackup ;
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
})(chrome, document);


