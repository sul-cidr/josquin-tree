import $ from 'jquery';
import d3 from 'd3';
import SuffixTree from 'suffix-tree';

import raw from './data/notes_JosSongs.json';
import notes from './data/notes_abbrev.json';
// console.log('notes',notes)
var apitree = ''

function loadApiSample() {
  let apinotes = new Array;
  for(let r of raw) {
    for(let f of r.features.pitch) {
      for(let p of f) {
        // console.log(p)
        apinotes.push(p)
      }
    }
  }
  apitree = new SuffixTree(apinotes);
  $('.count').text(`${apinotes.length.toLocaleString()} notes`)
  console.log('loadApiSamle() apitree',apitree)
  drawTree(apitree)
}

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

function loadData() {
  let c = $('select[name="composer"]').val()
  let g = $('select[name="genre"]').val()
  console.log('load '+ $('select[name="genre"]').val() +' data for '+
    $('select[name="composer"]').val())
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a=notetree&f=' + c + '&genre='
  if (g !='') {url += g}
  console.log('from ' + url)

  // when cross-domain not in issue:
  // d3.json(url_pre, function(error, data) {
  //   // parse payload
  //   let notes = []
  //   // for each piece push elements of each array within features.pitch to notes[]
  // })
}

function drawTree(tree) {
  console.log('drawTree() apitree',tree)
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
$('#b_render').click(drawTree);
loadApiSample();
// drawTree();
