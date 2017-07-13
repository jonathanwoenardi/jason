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
  coord[0] += b;
}

function cTranslateY(coord, b) {
  coord[1] += b;
}

function cTranslateZ(coord, b) {
  if(coord.length === 3) {
    coord[2] += b;
  }
}

function cScaleXY(coord, mx, my) {
  coord[0] *= mx;
  coord[1] *= my;
}

function cScaleXYZ(coord, mx, my, mz) {
  coord[0] *= mx;
  coord[1] *= my;
  if(coord.length === 3) {
    coord[2] *= mz;
  }
}
// Checker

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

function ftTransform(feature, affine, normal) {
  if(feature
      && feature['geometry']
      && feature['geometry']['coordinates']) {
    var obj = feature['geometry']['coordinates'];
    if(obj && obj.constructor === Array) {
      if(normal) {
        var ref = getReference(obj).slice();
        objTransform(obj, function(s){return cNormalize(s, ref.map(function(x){return x*-1;}));});
        objTransform(obj, affine);
        objTransform(obj, function(s){return cNormalize(s, ref);});
      } else {
        objTransform(obj, affine);
      }
    }
  }
}

function fcTransform(featureCollection, affine, normal) {
  if(featureCollection 
      && featureCollection['features'] 
      && featureCollection.constructor !== Array) {
    featureCollection['features'].map(function(x){return ftTransform(x, affine, normal);});
  }
}

function scTransform(scenarioJSON, affine, normal) {
  // scenarioJSON can be a FeatureCollection or RootJSON
  if(scenarioJSON) {
    if(scenarioJSON['type'] && scenarioJSON['type'] == 'FeatureCollection') {
      fcTransform(scenarioJSON, affine, normal);
    } else {
      if(scenarioJSON['geometry']) {
        fcTransform(scenarioJSON['geometry'], affine, normal);
      }
    }
  }
}

// Action Wrapper
function translateX(data, args) {
  b = parseFloat(args[0]);
  scTransform(data, function(s){return cTranslateX(s, b);}, false);
}

function translateY(data, args) {
  b = parseFloat(args[0]);
  scTransform(data, function(s){return cTranslateY(s, b);}, false);
}

function translateZ(data, args) {
  b = parseFloat(args[0]);
  scTransform(data, function(s){return cTranslateZ(s, b);}, false);
}

function scale(data, args, normal) {
  mx = parseFloat(args[0]);
  my = parseFloat(args[1]);
  if(args[2]) {
    mz = parseFloat(args[2]);
    var threeDimension = true;
  }
  if(threeDimension) {
    scTransform(data, function(s){return cScaleXYZ(s, mx, my, mz);}, normal);
  } else {
    scTransform(data, function(s){return cScaleXY(s, mx, my);}, normal);
  }
}

function translateZ(data, args) {
  b = parseFloat(args[0]);
  scTransform(data, function(s){return cTranslateZ(s, b);}, false);
}
// Helper functions

function getReference(obj) {
  if(obj.constructor === Array) {
    if(obj.length === 0) {
      return [];
    } else {
      if(obj[0].constructor === Array) {
        return getReference(obj[0]);
      } else {
        return obj
      }
    }
  } else {
    return obj;
  }
}

function cNormalize(coord, ref) {
  if(ref && ref.constructor === Array) {
    coord[0] += ref[0];
    coord[1] += ref[1];
    if(ref.length === 3) {
      coord[2] += ref[2];
    }
  }
}

// Main

function transform(data, action, args) {
  switch (action) {
    case "translateX": translateX(data, args); break;
    case "translateY": translateY(data, args); break;
    case "translateZ": translateZ(data, args); break;
    case "scaleOrigin": scale(data, args, false); break;
    case "scaleRelative": scale(data, args, true); break;
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