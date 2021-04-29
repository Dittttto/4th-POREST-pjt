var width = 500;
var height = 500;
var forkProb = 0.5;
var branchScalar = 50;
var x0 = width / 2;
var y0 = height - 65;
var limbAnimationScalar = .25;
//Input is in degrees but value is converted to radians
var angleBranchDeviation = 60 * Math.PI / 180;
var resetFlag = false;

function degToAngle(deg) {
  return deg * Math.PI / 180;
}

function getLimbAngle(limb) {
  var angle = Math.atan2(limb.attr('y2') - limb.attr('y1'), limb.attr('x2') - limb.attr('x1'));
  return angle;
}

function euclideanDist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getLimbLength(limb) {
  return euclideanDist(limb.attr('x1'), limb.attr('y1'), limb.attr('x2'), limb.attr('y2'));
}

function extendLimb(branch, callback) {
  var angle = getLimbAngle(branch);
  var length = getLimbLength(branch);
  var x2 = parseFloat(branch.attr('x2'));
  var y2 = parseFloat(branch.attr('y2'));
  var lengthPrime = length + (Math.random() * branchScalar);
  var yPrimeLength = Math.sin(angle) * lengthPrime;
  var xPrimeLength = Math.cos(angle) * lengthPrime;
  branch
    .transition()
    .duration(length / limbAnimationScalar)
    .attr({
      x2: parseFloat(branch.attr('x1')) + xPrimeLength,
      y2: parseFloat(branch.attr('y1')) + yPrimeLength
    })
    .each('end', function () {
      callback(d3.select(this));
    });
}

function growNewLimb(parentLimb, callback) {
  var mult = Math.random() > .5 ? 1 : -1;
  var newAngle = getLimbAngle(parentLimb) + (Math.random() * angleBranchDeviation * mult);
  var newLength = Math.random() * branchScalar;
  var xPrime = parseFloat(parentLimb.attr('x2'));
  var yPrime = parseFloat(parentLimb.attr('y2'));
  var angleCos, angleSin;
  angleCos = Math.cos(newAngle);
  newAngle < 0 ? angleSin = Math.sin(newAngle) : angleSin = Math.sin(newAngle)

  var x2 = parseFloat(parentLimb.attr('x2')) + angleCos * newLength;
  var y2 = parseFloat(parentLimb.attr('y2')) + angleSin * newLength;

  var line = d3.select('svg').insert('line', '#leaves')
    .attr({
      x1: xPrime,
      y1: yPrime,
      x2: xPrime + 1,
      y2: yPrime + 1,
      class: 'branch'
    });
  line.transition()
    .duration(newLength / limbAnimationScalar)
    .attr({
      x2: x2,
      y2: y2
    })
    .each('end', function () {
      callback(d3.select(this));
    });
}

function treeLeaf(endingBranch) {
  var branchAngle = getLimbAngle(endingBranch) * 180 / Math.PI;
  var leafAngleDeviation = 90;
  var leafScale = 0.5;
  var rotate = 'rotate(' + (branchAngle + 90 + (Math.random() * leafAngleDeviation) - leafAngleDeviation / 2) + ' ' + endingBranch.attr('x2') + ' ' + endingBranch.attr('y2') + ')';
  d3.select('#leaves').insert('use', '.leaf-item')
    .attr({
      'xlink:href': '#leaf--master',
      class: 'leaf-item',
      x: 0,
      y: 0,
      transform: 'translate(' + (endingBranch.attr('x2')) + ' ' + (endingBranch.attr('y2')) + ') scale(0) ' + rotate
    })
    .transition()
    .duration(500)
    .attr({
      x: 0,
      y: 0,
      transform: rotate + ' scale(' + leafScale + ') translate(' + (endingBranch.attr('x2') - 12) * 2 + ' ' + (endingBranch.attr('y2') - 20) * 2 + ')'
    });

}

function treeRecur(incomingBranch) {
  var fork = function (incomingBranch) {
    growNewLimb(incomingBranch, treeRecur);
    growNewLimb(incomingBranch, treeRecur);
  }

  var branch = function (incomingBranch) {
    extendLimb(incomingBranch, treeRecur);
    growNewLimb(incomingBranch, treeRecur);
  }
  var termProb = (euclideanDist(x0, y0, parseFloat(incomingBranch.attr('x2')), parseFloat(incomingBranch.attr('y2'))) + 0) / euclideanDist(0, 0, width / 2, height / 2);
  var incomingAngle = getLimbAngle(incomingBranch);
  if (((incomingAngle < 0) || ((incomingAngle < (Math.PI * .25)) && (incomingAngle > (Math.PI * .75)))) && (Math.random() > termProb)) {
    //if (Math.random() > termProb){
    if (Math.random() < forkProb) {
      fork(incomingBranch);
    } else {
      branch(incomingBranch);
    }
  } else {
    treeLeaf(incomingBranch);
  }
}

function svgSetup() {
  var tree = d3.select('body').insert('svg', '#controls')
    .attr('height', height)
    .attr('width', width);


  var root = tree.append('line')
    .attr('y1', y0)
    .attr('x1', x0)
    .attr('y2', function () {
      return y0 - Math.random() * branchScalar
    })
    .attr('x2', function () {
      return x0
    })
    .attr('class', 'branch');

  var pot = tree.append('g')
    .attr('transform', 'translate(' + ((width / 2) - 37.5) + ' ' + (height - 68) + ')');

  pot.append('polygon')
    .attr({
      points: '60.02 67.69 15.38 67.96 5.26 11.61 0.5 11.61 0.5 0.5 74.89 0.5 74.89 11.61 70.13 11.61 60.02 67.69',
      class: 'pot'
    });

  pot.append('line')
    .attr({
      x1: 5.26,
      y1: 11.61,
      x2: 70.13,
      y2: 11.61,
      class: 'pot-line'
    });

  var leaf = d3.select('svg').append('defs').append('g')
    .attr({
      id: 'leaf--master'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__body',
      d: 'M32.68,41.29c5.5-3.42,5.13-11.21,5.13-13.95,0-9.12-7.18-25.28-9.5-26.3C26.44,0.22,14.68,12,15,28.31c0.15,7.53,1.73,11.47,7.24,14.22C25.58,44.18,29.27,43.41,32.68,41.29Z'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--main',
      d: 'M27.1,43.66c-1.56-6.85-2.14-17.19-1.33-28A89.48,89.48,0,0,1,28,1.36'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M26.06,13c4.1,0.22,5.43-5.44,5.52-6.92'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M26,13a4.7,4.7,0,0,1-2.46-1.85c-1.27-1.69-1-4.58-.92-5.27'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M25.39,24.33c5.06-.05,9.07-8.5,9.22-11.1'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M25.39,24.33c-3.51-.22-7.15-6.11-7.27-10.84'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M25.81,34.22C32.87,34,36.89,24.3,37,21.7'
    });

  leaf.append('path')
    .attr({
      class: 'leaf__stem--branch',
      d: 'M25.81,34.22A11.18,11.18,0,0,1,15.33,23.87'
    });

  d3.select('svg')
    .append('g')
    .attr({
      id: 'leaves',
      width: width,
      height: height
    });
  return root;
}

document.querySelector('#grow').addEventListener('click', function () {
  resetFlag = false;
  this.innerHTML = 'Grow Some More!';
  treeRecur(root);
});

document.querySelector('#newGrow').addEventListener('click', function () {
  document.querySelector('body').removeChild(document.querySelector('svg'));
  document.querySelector('#grow').innerHTML = 'Start Growing!'
  root = svgSetup();
});


var root = svgSetup();
