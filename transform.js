// Current assumption:
// Coordinates is 2D or 3D
// ScenarioJSON follow qua-kit standard
// https://github.com/achirkin/qua-kit

/* Affines */

function affine1(m, b) {
  return function(x){return m*x+b;};
}

function affine2(m11, m12, m21, m22, b1, b2) {
  return function(x, y){return [m11*x+m12*y+b1, m21*x+m22*y+b2];};
}

/* Coordinate Transformation (Primary)
 * Sheer not supported yet.
 */

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

function cScaleX(coord, m) {
  coord[0] *= m;
}

function cScaleY(coord, m) {
  coord[1] *= m;
}

function cScaleZ(coord, m) {
  if(coord.length === 3) {
    coord[2] *= m;
  }
}

function cRotate(coord, a) {
  var xn = coord[0]*cos(a) - coord[1]*sin(a);
  var yn = coord[0]*sin(a) + coord[1]*cos(a);
  coord[0] = xn;
  coord[1] = yn;
}

/* Coordinate Transformation (Secondary)
 */

function cTranslateXY(coord, bx, by) {
  cTranslateX(coord, bx);
  cTranslateY(coord, by);
}

function cTranslateXYZ(coord, bx, by, bz) {
  cTranslateX(coord, bx);
  cTranslateY(coord, by);
  cTranslateZ(coord, bz);
}

function cScaleXY(coord, mx, my) {
  cScaleX(coord, mx);
  cScaleY(coord, my);
}

function cScaleXYZ(coord, mx, my, mz) {
  cScaleX(coord, mx);
  cScaleY(coord, my);
  cScaleZ(coord, mz);
}

// Relative Scale

function cScaleRelativeX(coord, m, r) {
  cTranslateX(coord, -r);
  cScaleX(coord, m);
  cTranslateX(coord, r);
}

function cScaleRelativeY(coord, m, r) {
  cTranslateY(coord, -r);
  cScaleY(coord, m);
  cTranslateY(coord, r);
}

function cScaleRelativeZ(coord, m, r) {
  cTranslateZ(coord, -r);
  cScaleZ(coord, m);
  cTranslateZ(coord, r);
}

function cScaleRelativeXY(coord, mx, my, rx, ry) {
  cTranslateXY(coord, -rx, -ry);
  cScaleXY(coord, mx, my);
  cTranslateXY(coord, rx, ry);
}

function cScaleRelativeXYZ(coord, mx, my, mz, rx, ry, rz) {
  cTranslateXYZ(coord, -rx, -ry, -rz);
  cScaleXYZ(coord, mx, my, mz);
  cTranslateXYZ(coord, rx, ry, rz);
}

// Relative Rotate

function cRotateRelativeXY(coord, a, rx, ry) {
  cTranslateXY(coord, -rx, -ry);
  cRotate(coord, a);
  cTranslateXY(coord, rx, ry);
}

function cRotateRelativeXYZ(coord, a, rx, ry, rz) {
  cTranslateXYZ(coord, -rx, -ry, -rz);
  cRotate(coord, a);
  cTranslateXYZ(coord, rx, ry, -rz);
}

function 
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
    case "beautify": data; break;
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