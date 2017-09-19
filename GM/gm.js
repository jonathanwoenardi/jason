// This script has one specific use case: to transform a geographical coordinates to metric coordinates
// To run this script
//     node <input-file> <output-file> <longitute-reference> <latitude-reference>
//
// This script follows the general structure of ~/transform.js and will be ported there in the future.

// CONTENT

// Handling of geojson Format

function objTransform(obj, affine) {

  if(obj.constructor === Array) {
    if(obj.length === 0) {
      return [];
    } else {
      if(obj[0].constructor === Array) {
        obj.map(function(x){return objTransform(x, affine);});
      } else {
        affine(obj);
      }
    }
  } else {
    return obj;
  }
}

function ftTransform(feature, affine) {
  if(feature
      && feature['geometry']
      && feature['geometry']['coordinates']) {
    var obj = feature['geometry']['coordinates'];
    if(obj && obj.constructor === Array) {
      objTransform(obj, affine);
    }
  }
}

function fcTransform(featureCollection, affine) {
  if(featureCollection 
      && featureCollection['features'] 
      && featureCollection.constructor !== Array) {
    featureCollection['features'].map(function(x){return ftTransform(x, affine);});
  }
}

function scTransform(scenarioJSON, affine) {
  // scenarioJSON can be a FeatureCollection or RootJSON
  if(scenarioJSON) {
    if(scenarioJSON['type'] && scenarioJSON['type'] == 'FeatureCollection') {
      fcTransform(scenarioJSON, affine);
    } else {
      if(scenarioJSON['geometry']) {
        fcTransform(scenarioJSON['geometry'], affine);
      }
    }
  }
}

// Main

function transform(data, args) {
  var lon = args[0];
  var lat = args[1];
  var transformFunc = gm$createWGS84toUTMTransform(lon, lat);
  scTransform(data, function(s){return transformFunc(s);});
}

// jonathanwoenardi : I got this from qua-view base, 
// but instead of returning a new value array, it actually changes the original array.
function gm$createWGS84toUTMTransform(lon0, lat0) {
 'use strict'
  var a = 6378137 // equatorial radius - Semi-major axis of reference ellipsoid
    , f = 1 / 298.257223563 // Ellipsoidal flattening
    , k = 1  // Central meridian scale factor
    , b = a * (1 - f)
    , e2 = (2 - f) * f
    , e4 = e2*e2
    , e6 = e4*e2
    , A0 = 1 - e2*0.25 - e4*3/64 - e6*5/256
    , A2 = 0.375 * (e2 + e4/4 + e6*15/128)
    , A4 = 15/256 * ( e4 + 0.75*e6)
    , A6 = e6 * 35/3072
    , xr0 = lon0 * Math.PI / 180
    , yr0 = lat0 * Math.PI / 180
    , fm = function(y) { return a * ( A0 * y - A2 * Math.sin(2 * y) 
                                + A4 * Math.sin(4 * y) - A6 * Math.sin(6 * y) ); }
    , m0 = fm(yr0);
  return function(xs) {
    var xr = xs[0] * Math.PI / 180
      , yr = xs[1] * Math.PI / 180
      , siny = Math.sin(yr)
      , cosy = Math.cos(yr)
      , p = a * (1 - e2) / Math.pow(1 - e2 * siny*siny, 1.5)
      , v = a / Math.sqrt(1 - e2 * siny * siny)
      , psi = v / p
      , t = Math.tan(yr)
      , w = xr - xr0
      , w2 = w * w
      , w4 = w2*w2
      , w6 = w4*w2
      , w8 = w4*w4;
    xs[0] = k * v * w * cosy * ( 1
            + w2 / 6 * cosy * cosy * (psi - t*t)
            + w4 / 120 * Math.pow(cosy, 4) * ( 4*psi*psi*psi + ( 1 - 6*t*t ) + psi*psi*(1+8*t*t) - psi*2*t*t + Math.pow(t,4) )
            + w6 / 5040 * Math.pow(cosy,6) * ( 61 - 479*t*t + 179 * Math.pow(t,4) - Math.pow(t,6) )
            )
    xs[1] = k * ( fm(yr) - m0
            + w2 * 0.5 * v * siny * cosy
            + w4/24 * v * siny * cosy*cosy*cosy * ( 4*psi*psi + psi - t*t)
            + w6/720* v * siny * Math.pow(cosy, 5) * ( 8 * Math.pow(psi, 4) * (11 - 24*t*t) - 28*Math.pow(psi, 3)*(1-6*t*t) + psi*psi*(1 - 32*t*t) - psi*2*t*t + Math.pow(t,4) )
            + w8/40320*v* siny * Math.pow(cosy, 7) * (1285 - 3111 * t*t + 543 * Math.pow(t,4) - Math.pow(t,6) )
            )
  };
}

var input = process.argv[2];
var output = process.argv[3];
var args = process.argv.slice(4);
var fs = require('fs');
var obj;

fs.readFile(input, 'utf8', function(err, data) {
  if (err) throw err;
  obj = JSON.parse(data);
  transform(obj, args);
  fs.writeFile(output, JSON.stringify(obj, null, 2), function(err) {
    if(err) {
      return console.log(err);
    }
  });
});