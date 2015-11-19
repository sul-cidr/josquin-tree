

import d3 from 'd3';
import data from './flare.json';


let h = 1000;
let w = 1000;

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
