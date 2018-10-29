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
   * <body>
   *   <div id="content">
   *     <div id="foo">
   *       <ul><li><p></p></li></ul>
   *     </div>
   *   </div>
   * </body>
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
  ekill.elementHierarchyToDOMString = hierarchy => {
    let selectorParts = [];
    let currentObject = hierarchy;
    let parentElement = document; // document will always be a parent
    while (currentObject !== undefined) {
      let selectorPart = "";
      let uniqueByIdInDocument = false;
      let uniqueByIdInParent = false;
      let idSelector = `#${currentObject.id}`;

      if (currentObject.id !== "") {
        uniqueByIdInDocument = document.querySelectorAll(idSelector).
          length === 1;
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
          uniqueByClassesInDocument = document.
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
            let currentObjectIndex = sameTagChildren.indexOf(currentObject.el);

            selectorPart = `${currentObject.localName}:nth-of-type(${currentObjectIndex + 1})`
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

  /**
   * Modifies the hit list in place, by adding a new hit
   *
   * @param {Object} hitList - existing hit list
   * @param {String} hostname
   * @param {String} pathname
   * @param {String} selector - DOMString as returned by
   * elementHierarchyToDOMString
   */
  ekill.addHit = (hitList, hostname, pathname, selector) => {
    hitList[hostname] = hitList[hostname] || {};
    let paths = hitList[hostname];

    /**
     * Checks if a DOMString might be a pseudo specific version of another
     *
     * @param {String} s0 - DOMString
     * @param {String} s1 - DOMString
     * @returns {Bool}
     */
    let pseudo = (s0, s1) => s0.length > s1.length && s0[s1.length] === ":";

    // 1. Check if this selector is a parent of a wildcard
    //
    // E.g. of the following two distinct selectors:
    //
    //  A: lorem > ipsum > dolor
    //  B: lorem > ipsum
    //
    // B points to a parent of A, so we only need to store B.
    let hostHasWildcards = paths.hasOwnProperty("*");
    if (hostHasWildcards) {
      let wildcards = paths["*"];

      for (let i = 0; i < wildcards.length; ++i) {
        let s = wildcards[i];

        // Note that startsWith returns true for equality and not just substring
        // match. In both cases nothing further needs to be done though, since
        // the selector is either pre-existing or being updated.
        if (s.startsWith(selector)) {
          if(!pseudo(s, selector)) {
            wildcards[i] = selector;
          }
          return;
        }
      }
    }

    // 2. Do the same as in 1. but for path specific selectors
    let hostHasPath = paths.hasOwnProperty(pathname);
    if (hostHasPath) {
      let selectors = paths[pathname];

      for (let i = 0; i < selectors.length; ++i) {
        let s = selectors[i];

        if (s.startsWith(selector)) {
          if(!pseudo(s, selector)) {
            selectors[i] = selector;
          }
          return;
        }
      }
    }

    // 3. Selector is neither for a parent, nor pre-existing so we go ahead and
    // add it
    paths[pathname] = paths[pathname] || [];

    // If the same element has been killed under the same domain but for
    // different pathnames, hoist it to be a wildcard match
    let selectors = paths[pathname];
    let addToWildcard = false;
    for (let p in paths) {
      if (p === "*") continue;
      if (p === pathname) continue;

      if (paths.hasOwnProperty(p)) {
        let selectorIndex = paths[p].indexOf(selector);
        if (selectorIndex !== -1) {
          addToWildcard = true;

          // Remove from all other paths, since it's now a wildcard match
          paths[p].splice(selectorIndex, 1);
        }
      }
    }

    if (addToWildcard) {
      if (!hostHasWildcards)
        paths["*"] = [];
      paths["*"].push(selector);
    } else {
      // Only append selector if it's not already there
      if (selectors.indexOf(selector) === -1)
        selectors.push(selector);

    }

    // Clean up potentially empty paths
    for (let p in paths) {
      if (paths.hasOwnProperty(p)) {
        if (paths[p].length === 0)
          delete paths[p];
      }
    }
  }

  /**
   * Modifies the hit list in place, by removing new hit
   *
   * @param {Object} hitList - existing hit list
   * @param {String} hostname
   * @param {String} pathname
   * @param {String} selector - DOMString as returned by
   * elementHierarchyToDOMString
   */
  ekill.removeHit = (hitList, hostname, pathname, selector) => {
    let paths = hitList[hostname];
    let selectorIndex = paths[pathname].indexOf(selector);
    paths[pathname].splice(selectorIndex, 1);

    // Cleanup empty paths
    if (paths[pathname].length === 0)
      delete paths[pathname];

    // Cleanup empty hosts
    if (Object.keys(paths).length === 0)
      delete hitList[hostname];
  };
})(window.ekill)
