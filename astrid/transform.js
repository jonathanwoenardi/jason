// ASSUMPTION : ONE POLYGON CAN ONLY HAVE ONE LINEAR RING

function base(data, height) {
  data[0].map(function(e){e.push(height)});
  return [data];
}

function side(data, h1, h2) {
  for(var i = 0; i < data[0].length-1; ++i) {
    data[0][i] = [[data[0][i].concat([h1]), data[0][i+1].concat([h1]), data[0][i+1].concat([h2]), data[0][i].concat([h2]), data[0][i].concat([h1])]];
  }
  return data[0].slice(0, data[0].length-1);
}

function transform(data, action, args) {
  var h1 = parseFloat(args[0]);
  var h2 = parseFloat(args[1]);
  if(h2 === undefined) {
    h2 = 0;
  }
  switch (action) {
    case "base": return base(data, h1);
    case "side": return side(data, h1, 0);
    case "baseside": data2 = JSON.parse(JSON.stringify(data)); return base(data, h1).concat(side(data2, h1, 0));
    case "basesidebase" : data2 = JSON.parse(JSON.stringify(data)); data3 = JSON.parse(JSON.stringify(data)); return base(data, h1).concat(side(data2, h1, h2)).concat(base(data3, h2));
    case "beautify": return [data];
  }
}

function identify(data, type, action, args) {
  switch (type) {
    case "mono": return transform(data, action, args);
    case "poly": return data.reduce(function(a, e){return a.concat(transform(e, action, args));}, []);
  }
}

var input = process.argv[2];
var output = process.argv[3];
var type = process.argv[4];
var action = process.argv[5];
var args = process.argv.slice(6);
var fs = require('fs');
var obj;
var res;

fs.readFile(input, 'utf8', function(err, data) {
  if (err) throw err;
  obj = JSON.parse(data);
  res = identify(obj, type, action, args);
  fs.writeFile(output, JSON.stringify(res, null, 2), function(err) {
    if(err) {
      return console.log(err);
    }
  });
});