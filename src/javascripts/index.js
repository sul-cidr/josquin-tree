/** index.js    D. McClure, K. Grossner
  * interface to load data, render tree
  * static files here;
  * dynamic from JRP notetree API () in 'deploy' branch
  */

import $ from 'jquery';
import d3 from 'd3';
import SuffixTree from 'suffix-tree';

window.d3 = d3;

// load sample data from files
import rawA from './data/notes_JosSongs.json';
import rawB from './data/notes_OckSongs.json';

var apitreeA = '',
 apitreeB = '',
 apinotesA = new Array,
 apinotesB = new Array,
 notesSet = '',
 svgSet = '',
 counterClass = '',
 reverseTree = '',
 svgX = 45

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

let diagonalR = d3.svg.diagonal()
  .projection(function(d) {
    return [w-d.y, d.x];
  });

var svgA = d3.select('#rootA')
  .append('svg')
  .attr('id', 'tree')
  .attr('width', w)
  .attr('height', h)
  .append('g')

var svgB = d3.select('#rootB')
  .append('svg')
  .attr('id', 'tree')
  .attr('width', w)
  .attr('height', h)
  .append('g')

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

function loadData(selection) {
  let c = $('select[id="composer_'+selection+'"]').val()
  let g = $('select[id="genre_'+selection+'"]').val()
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a=notetree&f=' + c + '&genre='
  if (g !='') {url += g} else g='all'
  console.log('load '+c+' '+g+' data into graph '+selection)
  console.log('url: ' + url)
}

function drawTree(set, notes, start=null) {
  if(reverseTree) {
    console.log(reverseTree);
    svgX = -120;
  } else {
    svgX = 45;
  }
  svgA.attr('transform', 'translate('+svgX+',20)');
  svgB.attr('transform', 'translate('+svgX+',20)');

  var notesArr=[]
  notesArr.push(notes)

  if(set == "A"){
    svgSet = svgA
    notesSet = apinotesA
    counterClass = '.countA'
  } else if(set == "B"){
    svgSet = svgB
    notesSet = apinotesB
    counterClass = '.countB'
  }

  if( reverseTree ) {
    var tree = new SuffixTree(notesArr,true);
  } else {
    var tree = new SuffixTree(notesArr,false);
  }

  var root = ''
  $(counterClass).text(`${notesSet.length.toLocaleString()} notes`)

  eval(svgSet).text('');
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

  var maxCount = d3.max(nodes, function(d){return d.count});
  var minCount = d3.min(nodes, function(d){return d.count});

  let link = svgSet.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', reverseTree ? diagonalR : diagonal);

  let node = svgSet.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      return reverseTree ?
        `translate(${650-d.y},${d.x})` :
        `translate(${d.y},${d.x})`;
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
    .attr('fill',function() {
      return counterClass === '.countA' ? '#993333' : '#009900'
    });

  node.append('text')
    .attr('dx', function(d) {
      return d.depth == 0 ? 10 : d.children ? -18 : -8;
    })
    .attr('dy', function(d) {
      return d.depth == 0 ? -10 : -3;
    })
    .style("font-size", function(d) {
      return d.depth == 0 ? 30 : scaleText(d.count,[minCount,maxCount]) //+'px'
    })
    .classed('leaf-text', function(d) {
      return !d.children;
    })
    .html(function(d) {
      return  d.depth == 0 ? `${d.name}` : `${d.name} (${d.count.toLocaleString()})`;
    });

};

$(document).ready(function() {
  $('#rcheck').change(function (){
    if(this.checked) {
      reverseTree = true;
    } else { reverseTree = false;}

  })
  $('.b-load').click(function(){
    // console.log(this.value)
    loadData(this.value);
  });
  $('#b_render').click(function(){
    // console.log('render:click',$('input[name="root"]').val())
    drawTree("A",notesSet,$('input[name="root"]').val());
    drawTree("B",notesSet,$('input[name="root"]').val());
  })
})

//set, notes, start=null
loadApiSampleA();
loadApiSampleB();
// loadData();
