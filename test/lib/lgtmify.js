var assert = require('assert');
var Lgtmify = require('../../lib/lgtmify.js');

describe('Lgtmify', function () {
  var lgtmify;
  var expect;

  describe('createMatrix', function () {
    var faceSquaresInfo = [];
    beforeEach(function (done) {
      lgtmify = new Lgtmify();
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
      lgtmify = new Lgtmify();
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
      lgtmify = new Lgtmify();
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
        assert.ok( !error );
        assert.strictEqual(lgtmify.xl, 2);
        assert.strictEqual(lgtmify.yl, 1);
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
      lgtmify = new Lgtmify();
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
      lgtmify = new Lgtmify();
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

});
