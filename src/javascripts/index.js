

import $ from 'jquery';
import d3 from 'd3';
import SuffixTree from 'suffix-tree';

import notes from './data/notes.json';


let tree = new SuffixTree(notes);
$('.count').text(`${notes.length.toLocaleString()} notes`)

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


function drawTree() {

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

$('button').click(drawTree);
drawTree();
