// index.js
// interface to load data, render tree
// from Josquin Research Project notetree API ()

import $ from 'jquery';
import d3 from 'd3';
import SuffixTree from 'suffix-tree';

window.d3 = d3;

// load sample data from files
import raw from './data/notes_JosSongs.json';

var apitree = ''
var apinotes = new Array;

function loadApiSample() {
  for(let r of raw) {
    for(let f of r.features.pitch) {
      for(let p of f) {
        // console.log(p)
        apinotes.push(p)
      }
      apinotes.push("X")
    }
  }
  drawTree(apinotes)
}

let w = 1000;
let h = 1000;

let cluster = d3.layout.cluster()
  .size([h, w-220]);

let diagonal = d3.svg.diagonal()
  .projection(function(d) {
    return [d.y, d.x];
  });

let svg = d3.select('#root')
  .append('svg')
  .attr('id', 'tree')
  .attr('width', w)
  .attr('height', h)
  .append('g')
  .attr('transform', 'translate(60,0)');

function loadData() {
  let c = $('select[name="composer"]').val()
  let g = $('select[name="genre"]').val()
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a=notetree&f=' + c + '&genre='
  if (g !='') {url += g} else g='all'
  console.log('load '+ g +' data for ' + c)
  console.log('from ' + url)

  // once cross-domain not an issue:
  // d3.json(url_pre, function(error, raw) {
  //   // parse payload
  //   for(let r of raw) {
  //     for(let f of r.features.pitch) {
  //       for(let p of f) {
  //         // console.log(p)
  //         apinotes.push(p)
  //       }
  //     }
  //   }
  //   drawTree(apinotes)
  // })
}

function drawTree(notes) {
  // console.log('drawTree() notes', notes)
  let tree = new SuffixTree(notes);
  $('.count').text(`${apinotes.length.toLocaleString()} notes`)

  svg.text('');

  let root = $('input[name="root"]').val();
  let depth = Number($('input[name="depth"]').val());
  let maxChildren = Number($('input[name="max-children"]').val());

  let data = tree.query(root, depth, maxChildren);

  let nodes = cluster.nodes(data);
  let links = cluster.links(nodes);

  let link = svg.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', diagonal);

  let node = svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      return `translate(${d.y},${d.x})`;
    });

  node.append('circle')
    .attr('r', 4);

  node.append('text')
    .attr('dx', function(d) {
      return d.children ? -8 : 8;
    })
    .attr('dy', 3)
    .classed('leaf', function(d) {
      return !d.children;
    })
    .html(function(d) {
      return `${d.name} (${d.count.toLocaleString()})`;
    });

};

$('#b_data').click(loadData);
$('#b_render').click(function(){
  drawTree(apinotes);
})

loadApiSample();
// loadData();
