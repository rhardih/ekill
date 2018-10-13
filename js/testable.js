window.ekill = window.ekill || {};

(function(ekill) {
  /**
   * Converts various collections, lists etc. into a pure array.
   *
   * @param {Object} notArray - Any convertible non-array type
   * @returns {Array}
   */
  ekill.toArray = notArray => Array.prototype.slice.call(notArray);

  /**
   * Generates a recursive object structure representing the subtree of the
   * DOM containing the specified element.
   *
   * The outhermost layer of the object will be for the 'body' element. Each
   * further node on the path down to 'element' will be attached via a 'child'
   * property.
   *
   * @param {Element} element - target DOM element
   * @returns {Object} Representation of the subtree in the following
   * format:
   *
   *   Stucture = {
   *     localName: {String}
   *     id: {String}
   *     classes: {String}
   *     el: {Element}
   *     child: {Structure|undefined}
   *   }
   */
  ekill.generateElementHierarchy = element => {
    let newObject = () => {
      return {
        localName: "",
        id: "",
        classes: "",
        el: undefined,
        child: undefined
      };
    }

    let currentElement = element;
    let currentObject = undefined;
    let lastObject = undefined;
    while (currentElement.localName !== "html") {
      currentObject = newObject();
      currentObject.el = currentElement;
      currentObject.localName = currentElement.localName;
      currentObject.id = currentElement.id;
      currentObject.classes = ekill.toArray(currentElement.classList).
        reduce((acc, val) => `${acc}.${val}`, "");
      currentObject.child = lastObject;

      lastObject = currentObject;
      currentElement = currentElement.parentElement;
    }

    return currentObject;
  };
})(window.ekill)
