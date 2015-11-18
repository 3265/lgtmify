/**
 * @module lgtmify
 */

var path = require('path');
var opencv = require('opencv');
var gm = require('gm');
var _ = require('underscore');

/**
 * Setup function for lgtmify params
 * @constructor
 * @param {object} params
 */
var Lgtmify = function (params) {
  if (!_.isObject(params)) params = {};

  this.FACE_BLOCK_INNER = 0;
  this.FACE_BLOCK_OUTER = 1;

  this.xl = 0;
  this.yl = 0;
  this.opencv;
  this.image;

  // optional params
  this.font = params.font || 'glyphicons-halflings-regular.ttf';
  this.filename = params.filename || path.join( __dirname, '../sample/Lenna.png');
  this.saveName = 'lgtm-' + path.basename(this.filename);

  this.setOpencv(opencv);
};

// Accessor
Lgtmify.prototype.setOpencv = function (opencv) {
  this.opencv = opencv;
};
Lgtmify.prototype.getOpencv = function () {
  return this.opencv;
};
Lgtmify.prototype.setImage = function (image) {
  this.image = image;
};
Lgtmify.prototype.getImage = function () {
  return this.image;
};

/**
 * Get face info
 * @param {function} callback
 */
Lgtmify.prototype.setImageInfo = function (callback) {
  var self = this;
  self.getOpencv().readImage(this.filename, function(error, image){
    self.setImage(image);
    self.xl = self.getImage().size()[1];
    self.yl = self.getImage().size()[0];
    callback(error);
  });
};

/**
 * Get rectangular coordinates of face
 * @param {function} callback
 */
Lgtmify.prototype.getFaceSquaresInfo = function (callback) {
  var self = this;
  var faceSquaresInfo = [];
  self.getImage().detectObject(self.getOpencv().FACE_CASCADE, {}, function (error, faces) {
    _.each( faces, function (v, i) {
      faceSquaresInfo[i] = {};
      faceSquaresInfo[i] = {
        minx: faces[i].x,
        maxx: faces[i].x + faces[i].width,
        miny: faces[i].y,
        maxy: faces[i].y + faces[i].height
      };
    });
    callback( error, faceSquaresInfo );
  });
};

/**
 * Compare rectabgular area of the face
 * @param {array} histograms
 * @param {function} callback
 */
Lgtmify.prototype.getLargestHistogram = function ( histograms, callback ) {
  if (_.isEmpty(histograms)) return callback(null, []);
  var self = this;
  var maxRect = {};
  var candidate;
  maxRect.maxv = 0;
  _.each( histograms, function ( histogram, index ) {
    candidate = self.getLargestRectangularArea( index, histogram );
    if ( candidate.width < candidate.height ) return;
    if ( candidate.maxv >= maxRect.maxv ) {
      maxRect = candidate;
    }
  } );
  callback( null, maxRect );
};

/**
 * Find the Larget Rectangular area
 * @param {number} rowNo
 * @param {array} histogram
 * @return {object} square
 * Reference {@link http://www.geeksforgeeks.org/largest-rectangle-under-histogram/}
 */
Lgtmify.prototype.getLargestRectangularArea = function ( rowNo, histogram ) {
  var stack = [];
  var square = {};
  var maxv = 0;
  rowNo++;
  histogram[histogram.length] = 0;
  _.each( histogram, function (value, index) {
    var rect = {};
    rect.height = value;
    rect.pos = index;
    if (_.isEmpty(stack) && rect.height <= rowNo) return stack.push( rect );
    if ( _.last(stack).height < rect.height ) return stack.push( rect );
    if ( _.last(stack).height > rect.height ) {
      var target = index;
      while ( !_.isEmpty(stack) && _.last(stack).height >= rect.height){
        var pre = _.last(stack);
        stack.pop();
        var area = pre.height * (index - pre.pos);
        if ( area > maxv ) {
          maxv = area;
          square = {
            minx: pre.pos,
            miny: rowNo - pre.height,
            maxy: rowNo,
            maxx: index,
            height: pre.height,
            width: index - pre.pos
          };
        }
        target = pre.pos;
      }
      rect.pos = target;
      stack.push(rect);
    }
  });
  square.maxv = maxv;
  return square;
};

/**
 * Create binary matrix
 * @param {array} facesquaresinfo
 * @return {array} matrix
 */
Lgtmify.prototype.createMatrix = function(faceSquaresInfo) {
  if (_.isEmpty(faceSquaresInfo)) [];
  var self = this;
  var matrix = [];
  var offset = {};
  _.each( _.range(self.yl), function ( v, yindex ) {
    offset.y = yindex + 1;
    matrix[yindex] = [];
    _.each( _.range(self.xl), function ( v, xindex ) {
      offset.x = xindex + 1;
      matrix[yindex][xindex] = 0;
      _.some( faceSquaresInfo, function ( faceSquare ) {
        if (offset.y >= faceSquare.miny &&
            offset.y <= faceSquare.maxy &&
            offset.x >= faceSquare.minx &&
            offset.x <= faceSquare.maxx) {
          matrix[yindex][xindex] = self.FACE_BLOCK_INNER;
          return true;
        } else {
          matrix[yindex][xindex] = self.FACE_BLOCK_OUTER;
          return false;
        }
      });
    });
  });
  return matrix;
};

/**
 * Create histogram list
 * @param {array} matrix
 * @return {array} histograms
 */
Lgtmify.prototype.createHistograms = function (matrix) {
  if (_.isEmpty(matrix)) return [];
  var self = this;
  var histograms = [];
  matrix = _.zip.apply(_, matrix);
  _.each( _.range(self.xl), function (v, x) {
    var sequence = 0;
    histograms[x] = [];
    _.each( _.range( self.yl ), function (v, y) {
      if (matrix[x][y] === self.FACE_BLOCK_INNER) {
        sequence = histograms[x][y] = self.FACE_BLOCK_INNER;
      } else {
        histograms[x][y] = ++sequence;
      }
    });
  });
  return _.zip.apply(_, histograms);
};

/**
 * Find the best location of the LGTM character
 * @param {object} maxRect
 * @return {object} lgtm
 */
Lgtmify.prototype.getLGTMInfo = function (maxRect) {
  var hasFace = !!maxRect.maxv;
  if (!hasFace) {
    maxRect.width = this.xl;
    maxRect.height = this.yl;
    maxRect.mix = 0;
    maxRect.miny = 0;
    maxRect.maxx = this.xl;
    maxRect.maxy = this.yl;
  }
  var lgtmThenFontSize1 = {
    width: 0.85,
    height: 0.26
  };
  var lgtmAspect = lgtmThenFontSize1.height / lgtmThenFontSize1.width;
  var lgtm = {};
  if ( lgtmAspect < (maxRect.height / maxRect.width) ) {
    lgtm.width = ~~maxRect.width;
    lgtm.height = ~~(lgtmAspect * maxRect.width);
    lgtm.offsetx = ~~maxRect.minx;
    lgtm.offsety = ~~(maxRect.maxy - (maxRect.height / 2) + (lgtm.height / 2));
    lgtm.fontSize = ~~(lgtm.height / lgtmThenFontSize1.width);
  } else {
    lgtm.height = ~~maxRect.height;
    lgtm.width = ~~(lgtmThenFontSize1.width * maxRect.height / lgtmThenFontSize1.height);
    lgtm.offsetx = ~~(maxRect.maxx - (maxRect.width / 2) - (lgtm.width / 2));
    lgtm.offsety = ~~maxRect.maxy;
    lgtm.fontSize = ~~(lgtm.height / lgtmThenFontSize1.width);
  }
  return lgtm;
};

/**
 * Paint LGTM character
 * @param {object} lgtm - lgtm coordinate
 * @param {function} callback
 */
Lgtmify.prototype.paintLGTM = function (lgtm, callback) {
  var self = this;
  gm(this.filename)
  .options({ imageMagick: true })
  .font(this.font)
  .fontSize(lgtm.fontSize)
  .fill("#ffffff")
  .stroke("#000000", [3, 15])
  .drawText(lgtm.offsetx, lgtm.offsety, "LGTM")
  .write(self.saveName, function (error) {
    if (!error) console.log('Done');
    callback();
  });
};

module.exports = Lgtmify;
