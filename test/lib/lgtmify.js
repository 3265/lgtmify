var assert = require('assert');
var Lgtmify = require('../../lib/lgtmify.js');

describe('Lgtmify', function () {
  var lgtmify;
  var expect;
  var filename = 'aa.png';

  describe('constructor', function () {
    it('ok', function (done) {
      assert.doesNotThrow(function() { new Lgtmify(filename); }, Error);
      done();
    });
    it('ok, error', function (done) {
      assert.throws(function() { new Lgtmify(); }, Error);
      done();
    });
  });

  describe('createMatrix', function () {
    var faceSquaresInfo = [];
    beforeEach(function (done) {
      lgtmify = new Lgtmify(filename);
      faceSquaresInfo = [];
      done();
    });
    it('ok 1', function (done) {
      lgtmify.xl = 3;
      lgtmify.yl = 3;
      faceSquaresInfo = [{
        minx: 0,
        miny: 0,
        maxx: 1,
        maxy: 1
      }];
      expect = [
        [0,1,1],
        [1,1,1],
        [1,1,1]
      ];
      var result = lgtmify.createMatrix( faceSquaresInfo );
      assert.deepEqual( result, expect );
      done();
    });
    it('ok 2', function (done) {
      lgtmify.xl = 4;
      lgtmify.yl = 3;
      faceSquaresInfo = [{
        minx: 2,
        miny: 2,
        maxx: 2,
        maxy: 2
      }];
      expect = [
        [1,1,1,1],
        [1,0,1,1],
        [1,1,1,1]
      ];
      var result = lgtmify.createMatrix( faceSquaresInfo );
      assert.deepEqual( result, expect );
      done();
    });
  });

  describe('createHistograms', function () {
    var matrix = [];
    beforeEach(function (done) {
      lgtmify = new Lgtmify(filename);
      matrix = [];
      done();
    });
    it('ok', function (done) {
      lgtmify.xl = 3;
      lgtmify.yl = 3;
      matrix = [
        [1,1,1],
        [1,1,0],
        [1,1,1]
      ];
      expect = [
        [1,1,1],
        [2,2,0],
        [3,3,1]
      ];
      var result = lgtmify.createHistograms( matrix );
      assert.deepEqual( result, expect );
      done();
    });
    it('ok 2', function (done) {
      lgtmify.xl = 4;
      lgtmify.yl = 4;
      matrix = [
        [1,1,1,0],
        [1,1,0,1],
        [1,1,0,1],
        [1,1,1,1]
      ];
      expect = [
        [1,1,1,0],
        [2,2,0,1],
        [3,3,0,2],
        [4,4,1,3]
      ];
      var result = lgtmify.createHistograms( matrix );
      assert.deepEqual( result, expect );
      done();
    });
  });

  describe('setImageInfo', function () {
    beforeEach(function (done) {
      lgtmify = new Lgtmify(filename);
      lgtmify.setOpencv({
        readImage: function (a, cb) {
          var size = function() {
            return [1,2];
          };
          cb(null, { size: size });
        }
      });
      done();
    });
    it('ok', function (done) {
      lgtmify.setImageInfo(function (error) {
        assert.ok(!error);
        assert.strictEqual(lgtmify.xl, 2);
        assert.strictEqual(lgtmify.yl, 1);
        done();
      });
    });
  });

  describe('getFaceSquaresInfo', function () {
    before(function (done) {
      lgtmify = new Lgtmify(filename);
      lgtmify.setImage({
        detectObject: function (a, b, cb) {
          return cb(null, [
            {x:1,y:1,width:10,height:20},
            {x:1,y:1,width:10,height:20}
          ]);
        }
      });
      lgtmify.setOpencv({
        FACE_CASCADE: 1
      });
      done();
    });
    it('ok', function (done) {
      var expect = [
        { minx: 1, maxx: 11, miny: 1, maxy: 21 },
        { minx: 1, maxx: 11, miny: 1, maxy: 21 }
      ];
      lgtmify.getFaceSquaresInfo(function (error, faceSquaresInfo) {
        assert.ok(!error);
        assert.deepEqual(faceSquaresInfo, expect);
        done();
      });
    });
  });

  describe('getLargestRectangularArea', function () {
    var rowNo;
    var histogram;
    beforeEach(function (done) {
      lgtmify = {};
      rowNo = 0;
      histogram = [];
      expect = null;
      done();
    });
    it('ok 1', function (done) {
      lgtmify = new Lgtmify(filename);
      rowNo = 0;
      histogram = [0, 1, 1, 0];
      expect = {
        maxv: 2,
        minx: 1,
        maxx: 3,
        miny: 0,
        maxy: 1,
        height: 1,
        width: 2
      };
      var result = lgtmify.getLargestRectangularArea(rowNo, histogram );
      assert.deepEqual( result, expect );
      done();
    });
    it('ok 1', function (done) {
      lgtmify = new Lgtmify(filename);
      rowNo = 5;
      histogram = [0, 1, 1, 0, 3, 3, 5];
      expect = {
        maxv: 9,
        minx: 4,
        maxx: 7,
        miny: 3,
        maxy: 6,
        height: 3,
        width: 3
      };
      var result = lgtmify.getLargestRectangularArea(rowNo, histogram );
      assert.deepEqual( result, expect );
      done();
    });
  });

  describe('getLGTMInfo', function () {
    it('ok portrait', function (done) {
      lgtmify = new Lgtmify(filename);
      var lgtm = {
        width: 100,
        height: 300,
        mix: 0,
        miny: 0,
        maxx: 30,
        maxy: 50,
        maxv: 100
      };
      var expect = { width: 100, height: 30, offsetx: 0, offsety: -85, fontSize: 35 };
      var result = lgtmify.getLGTMInfo(lgtm);
      assert.deepEqual(result, expect);
      done();
    });
    it('ok landscape', function (done) {
      lgtmify = new Lgtmify(filename);
      var lgtm = {
        width: 300,
        height: 100,
        mix: 0,
        miny: 0,
        maxx: 30,
        maxy: 50,
        maxv: 100
      };
      var expect = { width: 300, height: 91, offsetx: 0, offsety: 45, fontSize: 107 };
      var result = lgtmify.getLGTMInfo(lgtm);
      assert.deepEqual(result, expect);
      done();
    });
    it('no face', function (done) {
      lgtmify = new Lgtmify(filename);
      var lgtm = {
        width: 0,
        height: 0,
        mix: 10,
        miny: 10,
        maxx: 20,
        maxy: 50,
        maxv: 0
      };
      lgtmify.xl = 100;
      lgtmify.yl = 100;
      var expect = { width: 100, height: 30, offsetx: 0, offsety: 65, fontSize: 35 };
      var result = lgtmify.getLGTMInfo(lgtm);
      assert.deepEqual(result, expect);
      done();
    });
  });

});
