

import d3 from 'd3';
import data from './flare.json';


let w = 700;
let h = 1700;

let cluster = d3.layout.cluster()
  .size([h, w]);

let diagonal = d3.svg.diagonal()
  .projection(function(d) {
    return [d.y, d.x];
  });

let svg = d3.select('#root')
  .append('svg')
  .attr('width', w)
  .attr('height', h)
  .append('g');

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
  .text(function(d) {
    return d.name;
  });
