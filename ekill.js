(function(c, d){
  var clickable = [
    d.getElementsByTagName("a"),
    d.getElementsByTagName("button")
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
    e.target.remove();
    d.removeEventListener("mouseover", overHandler);
    d.removeEventListener("mouseout", outHandler);
    d.removeEventListener("click", clickHandler);
    d.documentElement.classList.remove("ekill-cursor");

    // restore click handlers
    clickable.forEach(function(c) {
      for (var i = 0; i < c.length; i++) {
        c[i].onclick= c[i].onclickBackup ;
        delete c[i].onclickBackup;
      }
    });

    e.stopPropagation();
  };

  let msgHandler = function(message, callback) {
    // override click handlers on any clickable element
    clickable.forEach(function(c) {
      for (var i = 0; i < c.length; i++) {
        c[i].onclickBackup = c[i].onclick;
        c[i].onclick = function() { return false; };
      }
    });

    d.documentElement.classList.add("ekill-cursor");
    d.addEventListener("mouseover", overHandler);
    d.addEventListener("mouseout", outHandler);
    d.addEventListener("click", clickHandler);
  };

  c.runtime.onMessage.addListener(msgHandler);
})(chrome, document);


