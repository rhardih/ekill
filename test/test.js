let assert = chai.assert;
let expect = chai.expect;

describe('ekill', function() {
  describe('#toArray', function() {
    it('should convert NodeList to array', function() {
      let list = document.querySelectorAll('#toArrayTest div');
      let arr = ekill.toArray(list);

      assert.isArray(arr);
      assert.lengthOf(arr, 3);
    });

    it('should convert DOMTokenList to array', function() {
      let list = document.querySelector('#toArrayTest').classList;
      let arr = ekill.toArray(list);

      assert.isArray(arr);
      assert.lengthOf(arr, 3);
    });
  });

  describe('#generateElementHierarchy', function() {
    it('should return an object hierarchy', function() {
      let target = document.querySelector('#gehTarget');
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
        id: "generateElementHierarchyTest"
      });
      expect(hierarchy.child.child.child).to.include({
        localName: "div",
        classes: ".foo"
      });
      expect(hierarchy.child.child.child.child).to.include({
        localName: "div",
        classes: ".bar"
      });
      expect(hierarchy.child.child.child.child.child).to.include({
        localName: "p",
        id: "gehTarget"
      });
    });
  });

  describe('#elementHierarchyToDOMString', function() {
    it('should return selector for element', function() {
      let target = document.querySelector('p[data-name=gehTarget]');
      let hierarchy = ekill.generateElementHierarchy(target);
      let ds = ekill.elementHierarchyToDOMString(hierarchy);

      expect(ds).to.equal('.foo > div:nth-of-type(0) > p');
    });
  });
});
