// index.js
// interface to load data, render tree
// from Josquin Research Project notetree API ()

import $ from 'jquery';
import d3 from 'd3';
import SuffixTree from 'suffix-tree';

window.d3 = d3;

// load sample data from files
import rawA from './data/notes_JosSongs.json';
import rawB from './data/notes_OckSongs.json';

var apitreeA = ''
var apitreeB = ''
var apinotesA = new Array;
var apinotesB = new Array;
var notesSet = ''
var svgSet = ''
var counterClass = ''

function loadApiSampleA() {
  for(let r of rawA) {
    for(let f of r.features.pitch) {
      for(let p of f) {
        // console.log(p)
        apinotesA.push(p)
      }
      apinotesA.push("X")
    }
  }
  drawTree("A", apinotesA)
}

function loadApiSampleB() {
  for(let r of rawB) {
    for(let f of r.features.pitch) {
      for(let p of f) {
        // console.log(p)
        apinotesB.push(p)
      }
      apinotesB.push("X")
    }
  }
  drawTree("B", apinotesB)
}

let w = 650;
let h = 700;

let cluster = d3.layout.cluster()
  .size([h, w-220]);

let diagonal = d3.svg.diagonal()
  .projection(function(d) {
    return [d.y, d.x];
  });

var svgA = d3.select('#rootA')
  .append('svg')
  .attr('id', 'tree')
  .attr('width', w)
  .attr('height', h)
  .append('g')
  .attr('transform', 'translate(45,0)');

var svgB = d3.select('#rootB')
  .append('svg')
  .attr('id', 'tree')
  .attr('width', w)
  .attr('height', h)
  .append('g')
  .attr('transform', 'translate(45,0)');

function scaleNode(val,range) {
  let s = d3.scale.linear()
    .domain(range)
    .range([3,15]);
  return s(val);
}

function scaleText(val,range) {
  let s = d3.scale.linear()
    .domain(range)
    .range([12,20]);
  return s(val);
}

function loadData() {
  let c = $('select[name="composer"]').val()
  let g = $('select[name="genre"]').val()
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a=notetree&f=' + c + '&genre='
  if (g !='') {url += g} else g='all'
  console.log('load '+ g +' data for ' + c)
  console.log('from ' + url)
}

function drawTree(set, notes, start=null) {
  // console.log(set)
  if(set == "A"){
    svgSet = svgA
    notesSet = apinotesA
    counterClass = '.countA'
  } else {
    svgSet = svgB
    notesSet = apinotesB
    counterClass = '.countB'
  }
  // console.log('svgSet, notesSet', svgSet, notesSet)
  let tree = new SuffixTree(notes);
  // console.log('tree', tree)
  var root = ''
  $(counterClass).text(`${notesSet.length.toLocaleString()} notes`)

  eval(svgSet).text('');
  // svgA.text('');
  if(start == null) {
    root = $('input[name="root"]').val();
  } else {
    $('input[name="root"]').val(start)
    root = start;
  }
  let depth = Number($('input[name="depth"]').val());
  let maxChildren = Number($('input[name="max-children"]').val());

  // console.log ('data for query: '+ root, depth, maxChildren)
  let data = tree.query(root, depth, maxChildren);
  let nodes = cluster.nodes(data);
  let links = cluster.links(nodes);
  // console.log('nodes',nodes)

  var maxCount = d3.max(nodes, function(d){return d.count});
  var minCount = d3.min(nodes, function(d){return d.count});
  // console.log('min, max of data: ',minCount,maxCount)

  let link = svgSet.selectAll('.link')
  // let link = svgA.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', diagonal);

  let node = svgSet.selectAll('.node')
  // let node = svgA.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      return `translate(${d.y},${d.x})`;
    })
    .on('click', function(d) {
      console.log('d siblings',d.parent.children)
      window.n = d.parent.children
      drawTree(set, notesSet, d.name)
      console.log('clicked '+ d.name)
    });

  node.append('circle')
    .attr('r', function(d) {
      return scaleNode(d.count,[minCount,maxCount]);
    })
    // .attr('fill','#993333');
    .attr('fill',function() {
      // console.log(counterClass)
      return counterClass === '.countA' ? '#993333' : '#009900'
    });

  node.append('text')
    .attr('dx', function(d) {
      // console.log(d)
      return d.depth == 0 ? -2 : d.children ? -18 : -8;
      // return d.children ? -18 : -8;
    })
    .attr('dy', -3)
    .style("font-size", function(d) {
      // scaleText(d.count,[minCount,maxCount]) //+'px'
      return d.depth == 0 ? 30 : scaleText(d.count,[minCount,maxCount]) //+'px'
    })
    .classed('leaf-text', function(d) {
      return !d.children;
    })
    .html(function(d) {
      return  d.depth == 0 ? `${d.name}` : `${d.name} (${d.count.toLocaleString()})`;
    });

};

$('#b_data').click(loadData);
$('#b_render').click(function(){
  drawTree(notesSet);
  // drawTree(apinotes);
})

loadApiSampleA();
loadApiSampleB();
// loadData();
