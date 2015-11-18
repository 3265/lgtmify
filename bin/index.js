#!/usr/bin/env node

var async = require('async');
var program = require('commander');
var Progress = require('progress');
var Lgtmify = require( __dirname + '/../lib/lgtmify.js');
var pkg = require( __dirname + '/../package.json');

var green = '\u001b[42m \u001b[0m';
var red = '\u001b[41m \u001b[0m';

var cmdValue;
program
  .version(pkg.version)
  .parse(process.argv)
  .action(function (cmd) {
    cmdValue = cmd;
  });

program.parse(process.argv);

var bar = new Progress('process[:bar]:percent :etas', {
  complete: green,
  incomplete: red,
  width: 20,
  total: 5
});

var lgtmify = new Lgtmify(cmdValue);

// main process flow
async.waterfall( [
  function ( next ) {
    lgtmify.setImageInfo( function ( error ) {
      if ( error ) return next( error );
      bar.tick();
      next( error );
    });
  },
  function ( next ) {
    lgtmify.getFaceSquaresInfo( function ( error, faceSquaresInfo ) {
      bar.tick();
      next( error, faceSquaresInfo );
    });
  },
  function ( faceSquaresInfo, next ) {
    var matrix = lgtmify.createMatrix( faceSquaresInfo );
    var histograms = lgtmify.createHistograms( matrix );
    bar.tick();
    next( null, histograms );
  },
  function ( histograms, next ) {
    lgtmify.getLargestHistogram( histograms, function ( error, maxRect ) {
      bar.tick();
      next( error, maxRect );
    });
  },
  function ( maxRect, next ) {
    var lgtminfo = lgtmify.getLGTMInfo( maxRect );
    lgtmify.paintLGTM( lgtminfo, function ( error ) {
      bar.tick();
      next( error );
    });
  }
], function ( error ) {
  if ( error) return new Error( error );
  console.log( 'LGTMify Sccessful!' );
});
