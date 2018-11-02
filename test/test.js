let assert = chai.assert;
let expect = chai.expect;

describe("ekill", function() {
  describe("#toArray", function() {
    it("should convert NodeList to array", function() {
      let list = document.querySelectorAll("#toArrayTest div");
      let arr = ekill.toArray(list);

      expect(arr).to.be.an.instanceOf(Array);
      expect(arr).to.have.a.lengthOf(3);
      expect(arr).to.satisfy(arr => arr.every(
        node => node.nodeType === Node.ELEMENT_NODE &&
        node.localName === "div"));
    });

    it("should convert DOMTokenList to array", function() {
      let list = document.querySelector("#toArrayTest").classList;
      let arr = ekill.toArray(list);

      expect(arr).to.be.an.instanceOf(Array);
      expect(arr).to.have.a.lengthOf(3);
      expect(arr).to.have.members(["lorem", "ipsum", "dolor"]);
    });
  });

  describe("#generateElementHierarchy", function() {
    it("should return an object hierarchy", function() {
      let target = document.querySelector("[data-target=geh-00-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let expected = {
        el: {},
        id: "",
        child: {
          child: {
            id: "",
            el: {},
            localName: "div",
            classes: "",
            child: {
              el: {},
              id: "geh-00",
              classes: "",
              child: {
                el: {},
                id: "",
                classes: "",
                localName: "p"
              },
              localName: "div"
            }
          },
          classes: "",
          localName: "div",
          el: {},
          id: "fixtures"
        },
        classes: "",
        localName: "body"
      };

      expect(hierarchy).to.shallowDeepEqual(expected);
    });
  });

  describe("#elementHierarchyToDOMString", function() {
    it("should use id as root if unique in document", function() {
      let target = document.querySelector("[data-target=ehtd-00-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.match(/^#ehtd-00/);
      expect(selected).to.equal(target);
    });

    it("should use id as sub-selector if unique in parent", function() {
      let target = document.querySelector("[data-target=ehtd-01-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.equal("#ehtd-01 > #ehtd-01-not-unique");
      expect(selected).to.equal(target);
    });

    it("should use classes as as root if unique in document", function() {
      let target = document.querySelector("[data-target=ehtd-02-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.equal(".ehtd-02");
      expect(selected).to.equal(target);
    });

    it("should use classes as sub-selector if unique in parent", function() {
      let target = document.querySelector("[data-target=ehtd-03-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.equal("#ehtd-03 > .ehtd-03-not-unique");
      expect(selected).to.equal(target);
    });

    it("should use nth-of-type if neither id or class is viable", function() {
      let target = document.querySelector("[data-target=ehtd-04-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.equal("#ehtd-04 > div:nth-of-type(3)");
      expect(selected).to.equal(target);
    });

    it("should use plain tag name if no other siblings of same type", function() {
      let target = document.querySelector("[data-target=ehtd-05-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);
      let selected = document.querySelector(ds);

      expect(ds).to.equal("#ehtd-05 > div");
      expect(selected).to.equal(target);
    });

    it("should use nth-of-type correctly", function() {
      let target = document.querySelector("[data-target=ehtd-06-target]");
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);

      let selected = document.querySelector(ds);

      expect(ds).to.equal("#ehtd-06 > p:nth-of-type(1)");
      expect(selected).to.equal(target);
    });
  });

  describe("#addHit", function() {
    before(function() {
      this.clock = sinon.useFakeTimers(42);
    });

    after(function() {
      this.clock.restore();
    });

    it("should add new hits", function() {
      let hitList = {};
      let expected = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup",
            lastUsed: 42
          }]
        }
      }

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });

    it("should append hits on the same page and only once", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }]
        }
      }
      let expected = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }, {
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-1"
      )

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-1"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });

    it("should hoist equal hits on different pages as a single wildcard", function() {
      let hitList = {}
      let expected = {
        "example.com": {
          "*": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 42
          }]
        }
      }

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-0"
      )

      ekill.addHit(
        hitList,
        "example.com",
        "/bar",
        "body > div#annoying-popup-0"
      )

      ekill.addHit(
        hitList,
        "example.com",
        "/baz",
        "body > div#annoying-popup-0"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });

    it("should collapse selectors if matching a parent of previous killed element", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0 > div.popup-content",
            lastUsed: 123
          }]
        }
      }

      let expected = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 42
          }]
        }
      }

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-0"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });

    it("should not collapse selectors if matching isn't a full parent", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "div > p:nth-of-type(1)",
            lastUsed: 42
          }]
        }
      }

      let expected = {
        "example.com": {
          "/foo": [{
            selector: "div > p:nth-of-type(1)",
            lastUsed: 42
          }]
        }
      }

      ekill.addHit(
        hitList,
        "example.com",
        "/foo",
        "div > p"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });
  });

  describe("#removeHit", function() {
    it("should remove a hit", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }, {
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }
      let expected = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }

      ekill.removeHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-0"
      )

      expect(hitList).to.shallowDeepEqual(expected);
    });

    it("should remove a hit and path if there's no other hits for path", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }],
          "/bar": [{
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }
      let expected = {
        "example.com": {
          "/bar": [{
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }

      ekill.removeHit(
        hitList,
        "example.com",
        "/foo",
        "body > div#annoying-popup-0"
      )

      expect(hitList).to.shallowDeepEqual(expected);
      expect(hitList["example.com"]).to.not.have.any.keys("/foo");
    });

    it("should remove a hit, path and host if no other...", function() {
      let hitList = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }]
        },
        "lorem.com": {
          "/ipsum": [{
            selector: "body > div#annoying-popup-1",
            lastUsed: 42
          }]
        }
      }
      let expected = {
        "example.com": {
          "/foo": [{
            selector: "body > div#annoying-popup-0",
            lastUsed: 123
          }]
        }
      }

      ekill.removeHit(
        hitList,
        "lorem.com",
        "/ipsum",
        "body > div#annoying-popup-0"
      )

      expect(hitList).to.shallowDeepEqual(expected);
      expect(hitList).to.not.have.any.keys("lorem.com");
    });
  });

  describe("#migrateHitList", function() {
    before(function() {
      this.clock = sinon.useFakeTimers(42);
    });

    after(function() {
      this.clock.restore();
    });

    it("Migrates a hitList to V2 structure", function() {
      let hitList = {
        "example.com": {
          "/foo": [
            "body > div#bar"
          ]
        }
      };
      let hitListV2 = {};
      let expected = {
        "example.com": {
          "/foo": [
            {
              "selector": "body > div#bar",
              "lastUsed": 42
            }
          ]
        }
      };

      ekill.migrateHitList(hitList, hitListV2);

      expect(hitListV2).to.shallowDeepEqual(expected);
    });
  });

  describe("#isNewerVersion", function() {
    it("returns true for greater major", function() {
      var v0 = "1.0.0"
      var v1 = "2.0.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.true;
    });

    it("returns true for greater minor", function() {
      var v0 = "1.0.0"
      var v1 = "1.1.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.true;
    });

    it("returns false for greater patch", function() {
      var v0 = "1.0.0"
      var v1 = "1.0.1"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for equal major", function() {
      var v0 = "1.0.0"
      var v1 = "1.0.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for equal minor", function() {
      var v0 = "1.1.0"
      var v1 = "1.1.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for equal patch", function() {
      var v0 = "1.0.1"
      var v1 = "1.0.1"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for lesser major", function() {
      var v0 = "2.0.0"
      var v1 = "1.0.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for lesser minor", function() {
      var v0 = "1.2.0"
      var v1 = "1.1.0"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });

    it("returns false for lesser patch", function() {
      var v0 = "1.0.2"
      var v1 = "1.0.1"

      expect(ekill.isNewerVersion(v1, v0)).to.be.false;
    });
  });
});
