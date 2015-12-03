

import d3 from 'd3';
import SuffixTree from './suffix-tree';

import notes from './data/notes.json';
import flare from './flare.json';


// tree test


let w = 700;
let h = 3000;

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

let nodes = cluster.nodes(flare);
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
  .text(function(d) {
    return d.name;
  });


// suffix tree test

window.t = new SuffixTree(notes);
