function affine1(m, b) {
  return function(x){return m*x+b;};
}

function affine2(m11, m12, m21, m22, b1, b2) {
  return function(x, y){return [m11*x+m12*y+b1, m21*x+m22*y+b2];};
}

function f(x) {
  return x + 4;
}

function test(coord) {
  coord[0] += 1;
  coord[1] += 2;
  return coord;
}

function objTransform(obj, a) {
  if(obj.constructor === Array) {
    if(obj.length === 0) {
      return [];
    } else {
      if(obj[0].constructor === Array) {
        obj.map(function(x){return objTransform(x,a);});
      } else {
        a(obj);
      }
    }
  } else {
    return obj;
  }
}

function ftTransform(feature, a) {
  if(feature
      && feature['geometry']
      && feature['geometry']['coordinates']) {
    objTransform(feature['geometry']['coordinates'], a);
  }
}

function fcTransform(featureCollection, a) {
  if(featureCollection 
      && featureCollection['features'] 
      && featureCollection.constructor !== Array) {
    featureCollection['features'].map(function(x){return ftTransform(x, a);});
  }
}

function scTransform(scenarioJSON, a) {
  // scenarioJSON can be a FeatureCollection or RootJSON
  if(scenarioJSON) {
    if(scenarioJSON['type'] && scenarioJSON['type'] == 'FeatureCollection') {
      fcTransform(scenarioJSON, a);
    } else {
      if(scenarioJSON['geometry']) {
        fcTransform(scenarioJSON['geometry'], a);
      }
    }
  }
}

function cTranslateZ(coord, b) {
  if(coord && coord.constructor === Array && coord.length === 3) {
    coord[2] += b;
  }
}

function translateZ(data, args) {
  b = parseInt(args[0]);
  scTransform(data, function(x){return cTranslateZ(x, b);});
}

function transform(data, action, args) {
  if(action === "translateZ") {
    translateZ(data, args);
  }
}

// test
var input = process.argv[2];
var output = process.argv[3];
var action = process.argv[4];
var args = process.argv.slice(5);
var fs = require('fs');
var obj;

fs.readFile(input, 'utf8', function(err, data) {
  if (err) throw err;
  obj = JSON.parse(data);
  transform(obj, action, args);
  fs.writeFile(output, JSON.stringify(obj, null, 2), function(err) {
    if(err) {
      return console.log(err);
    }
  });
});