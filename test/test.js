let assert = chai.assert;
let expect = chai.expect;

describe('ekill', function() {
  describe('#toArray', function() {
    it('should convert NodeList to array', function() {
      let list = document.querySelectorAll('#toArrayTest div');
      let arr = ekill.toArray(list);

      expect(arr).to.be.an.instanceOf(Array);
      expect(arr).to.have.a.lengthOf(3);
      expect(arr).to.satisfy(arr => arr.every(
        node => node.nodeType === Node.ELEMENT_NODE &&
        node.localName === 'div'));
    });

    it('should convert DOMTokenList to array', function() {
      let list = document.querySelector('#toArrayTest').classList;
      let arr = ekill.toArray(list);

      expect(arr).to.be.an.instanceOf(Array);
      expect(arr).to.have.a.lengthOf(3);
      expect(arr).to.have.members(["lorem", "ipsum", "dolor"]);
    });
  });

  describe('#generateElementHierarchy', function() {
    it('should return an object hierarchy', function() {
      let target = document.querySelector("[data-target=geh-00-target]");
      let hierarchy = ekill.generateElementHierarchy(target);

      expect(hierarchy).to.include({
        localName: "body"
      });
      expect(hierarchy.child).to.include({
        localName: "div",
        id: "fixtures"
      });
      expect(hierarchy.child.child).to.include({
        localName: "div",
        id: ""
      });
      expect(hierarchy.child.child.child).to.include({
        localName: "div",
        id: "geh-00"
      });
      expect(hierarchy.child.child.child.child).to.include({
        localName: "p",
        classes: ""
      });
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
  });
});
