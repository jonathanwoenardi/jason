// Current assumption:
// Coordinates is 2D or 3D
// ScenarioJSON follow qua-kit standard
// https://github.com/achirkin/qua-kit

// Primitives

function affine1(m, b) {
  return function(x){return m*x+b;};
}

function affine2(m11, m12, m21, m22, b1, b2) {
  return function(x, y){return [m11*x+m12*y+b1, m21*x+m22*y+b2];};
}

// Coordinate Transformation

function cTranslateX(coord, b) {
  if(coord && coord.constructor === Array) {
    coord[0] += b;
  }
}

function cTranslateY(coord, b) {
  if(coord && coord.constructor === Array) {
    coord[1] += b;
  }
}

function cTranslateZ(coord, b) {
  if(coord && coord.constructor === Array && coord.length === 3) {
    coord[2] += b;
  }
}

// Checker

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

// Action Wrapper
function translateX(data, args) {
  b = parseInt(args[0]);
  scTransform(data, function(s){return cTranslateX(s, b);});
}

function translateY(data, args) {
  b = parseInt(args[0]);
  scTransform(data, function(s){return cTranslateY(s, b);});
}

function translateZ(data, args) {
  b = parseInt(args[0]);
  scTransform(data, function(s){return cTranslateZ(s, b);});
}

// Main

function transform(data, action, args) {
  switch (action) {
    case "translateX": translateX(data, args); break;
    case "translateY": translateY(data, args); break;
    case "translateZ": translateZ(data, args); break;
  }
}

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