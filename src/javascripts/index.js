/** index.js    K. Grossner, D. McClure
  * interface to load API data, render trees
  */

var url = require('url'),
    querystring = require('querystring'),
    parsedUrl = url.parse(window.location.href, true, true),
    searchParams = querystring.parse(parsedUrl.search.substring(1))
    // console.log('searchParams',searchParams)

var root = '',
    apitreeA = '',
    apitreeB = '',
    apinotesA = new Array,
    apinotesB = new Array,
    sequence = '', workArray = [], voiceArray = [],
    notesSet = '',
    svgSet = '',
    counterClass = '',
    reverseTree = '',
    svgX = '',
    svgY = '',
    raw = '',
    newRoot=[],
    dim = ''

import $ from 'jquery';
import d3 from 'd3';
import _ from 'lodash';
// linked module from https://github.com/davidmcclure/suffix-tree
import SuffixTree from 'suffix-tree';

// expose d3, jquery functions to console
window.d3 = d3;
window.$ = $;

/**
  * svg orientation
  */
let w = 950;
let h = 200;
// let w = 200;
// let h = 720;

let cluster = d3.layout.cluster()
  .size([w, h]);
  // .size([h, w-220]);

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

/**
  * selection = 'A' or 'B';
  * filter one of [c,g,w,v] composer, genre, work, voice
  */
// var loadData = function(selection, filter = false) {
function loadData(selection, filter = false) {
  let c = $('select[id="composer_'+selection+'"]').val()
  let g = $('select[id="genre_'+selection+'"]').val()
  let w = searchParams['w'] ? searchParams['w']: $('select[id="work_'+selection+'"]').val()
  let v = $('select[id="voice_'+selection+'"]').val()
  let d = $('input[name="dim_display"]:checked').val()
  console.log('load '+d+' for '+c+' -> genre:'+g+'; works:'+w+'; voices:'+v+' into '+selection)

  // always get all works for composer/genre
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a='+d+'tree&f=' + c + '&genre='
  if (g !='') {url += g} else g='all'
  console.log('url:', url);
  d3.json(url, function(error, raw) {
    // initial load or composer or genre changed:
    if(filter == false || filter == 'c' || filter == 'g') {
      // set work & genre to 'all' if necessary
      if(w != 'all' || g != 'all') {
        console.log('filter =',filter)
        w = 'all';
        g = 'all';
        v = 'all';
      }
      /**
        * clear works dropdown, re-populate
        */
      workArray = [];
      $("#work_"+selection).find('option').remove()
      $("#work_"+selection).append('<option value="all">All</option>')

      // raw is all works in composer/genre set
      for(let r of raw) {
        if(workArray.indexOf(r) == -1) {
          workArray.push(r)
        }
      };
      window.works = workArray.sort(sortByTitle)
      // populate works dropdown
      for(let i in workArray){
        $("#work_"+selection).append(
          "<option value="+works[i].jrpid+">"+works[i].title+"</option>"
        )
      }

      /**
        * clear voices dropdown, re-populate
        */
      voiceArray = [];
      $("#voice_"+selection).find('option').remove()
      $("#voice_"+selection).append('<option value="all">All</option>')
      for(let i in workArray){
        for(let v of workArray[i].voices) {
          if(voiceArray.indexOf(v) == -1) {
            voiceArray.push(v)
          }
        }
      }
      window.voices = voiceArray.sort(sortBy)
      // console.log(works.length + ' works; '+voices.length + ' voices')
      for(let i in voiceArray){
        $("#voice_"+selection).append(
          "<option value="+voiceArray[i]+">"+voiceArray[i]+"</option>"
        )
      }

    }

    if(w != 'all') {
      // console.log('raw length bef',raw.length);
      raw = raw.filter(function(d){
        return d.jrpid == w;
      });
      // raw = raw[0]
      // set min-count = 1 for single work
      $('input[name="min-count"]').val(1)

      voiceArray=[]
      $("#voice_"+selection).find('option').remove()
      $("#voice_"+selection).append('<option value="all">All</option>')
      console.log('filtered raw for ', w,raw)
      for(let v in raw[0].voices) {
        if(voiceArray.indexOf(v) == -1) {
          voiceArray.push(raw[0].voices[v])
        }
      }
      window.voices = voiceArray.sort(sortBy)
      console.log('filtered voiceArray:', voices)
      for(let i in voices){
        $("#voice_"+selection).append(
          "<option value="+voices[i]+">"+voices[i]+"</option>"
        )
      }
    }

    console.log(raw.length+' of '+works.length + ' works; '+voices.length + ' voices')
    console.log(c,g,w,v,d)
    if(v != 'all'){
      sequence = buildSeq(raw,d,v)
      $("select[id='voice_A'] option[value='"+v+"']").prop('selected',true)
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      drawTree(selection, sequence);
    }
    else {
      sequence = buildSeq(raw,d);
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      drawTree(selection, sequence);
    }
    window.seq = sequence;
  })
}

function buildSeq(raw, dim, voice = false) {
  console.log('buildSeq()',dim,voice)
  var seq = new(Array);
  if (!voice) {
    for(let r of raw) {
      for(let f of dim=='rhythm'?r.features.rhythm:r.features.pitch) {
      // for(let f of r.features.pitch) {
        for(let p of f) {
          seq.push(p);
        }
        seq.push('X');
      }
    }
  } else {
    window.r=raw
    for(let r of raw) {
      // console.log(r.voices)
      if (r.voices.indexOf(voice) > -1) {
        for(let f of dim=='rhythm'?r.features.rhythm[r.voices.indexOf(voice)]:
            r.features.pitch[r.voices.indexOf(voice)]) {
          for(let p of f) {
            seq.push(p);
          }
        }
      }
    }
    // console.log('notes for',voice, notes)
  }
  return seq
}

var root = ''
function drawTreeR() {
  //
}

var drawTree = function(selection, seq, start=null) {
  let p_or_r = $('input[name="dim_display"]:checked').val()
  console.log('drawTree() for', p_or_r )

  let diagonal = d3.svg.diagonal()
    .projection(function(d) {
      if(p_or_r == 'pitch'){
        return [d.x, d.y-h];
      } else {
        return [d.y, d.x];
      }
      });

  let diagonalR = d3.svg.diagonal()
    .projection(function(d) {
      if(p_or_r == 'pitch'){
        return [d.x, h-d.y ];
      } else {
        return [200-d.y, d.x];
      }
    });

  if(reverseTree) {
    p_or_r == 'pitch' ? svgY = 30 : svgY = 0;
    // svgY = -120;
  } else {
    p_or_r == 'pitch' ? svgY = 200 : svgY = 0;
    // p_or_r == 'pitch' ? svgY = 200 : svgY = 350;
    // svgY = 350;
  }

  // if(p_or_r == 'pitch') {
    svgA.attr('transform', 'translate(0,'+svgY+')');
    svgB.attr('transform', 'translate(0,'+svgY+')');
  // }
  // else {
  //   svgA.attr('transform', 'translate('+svgX+',0)');
  //   svgB.attr('transform', 'translate('+svgX+',0)');
  // }

  if(selection == "A"){
    svgSet = svgA
    window.notesSet = apinotesA
    counterClass = '.countA'
    } else if(selection == "B"){
    svgSet = svgB
    notesSet = apinotesB
    counterClass = '.countB'
  }

  var seqArr=[]
  seqArr.push(seq)

  // build suffix-tree
  if( reverseTree ) {
    var tree = new SuffixTree(seqArr,true);
    } else {
    var tree = new SuffixTree(seqArr,false);
    }
  window.tree = tree;
  // display counters
  let counter = `${seq.length.toLocaleString()}  `;
  // console.log(counter);
  $(counterClass).text( p_or_r=='pitch'?counter+' notes':counter+' rhythms')
  // $(counterClass).text(`${notesSet.length.toLocaleString()} notes`)

  eval(svgSet).text('');

  if(start == null) {
    if(p_or_r == 'pitch') {
        root = $('input[name="root"]').val();
        // root = $('input[name="root"]').val();
      } else {
        root = 'w_b'
        $('input[name="root"]').val(root)
      }
    } else {
    $('input[name="root"]').val(start)
    root = start;
    // console.log('start(root)', root)
    }

  let depth = Number($('input[name="depth"]').val());
  let maxChildren = Number($('input[name="max-children"]').val());
  let minCountDisplay = Number($('input[name="min-count"]').val());
  let countDisplay = $('input[name="count_display"]:checked').val();
  // console.log('countDisplay',countDisplay)

  let data = tree.query(root, depth, maxChildren, minCountDisplay);
  let nodes = cluster.nodes(data);
  let links = cluster.links(nodes);
  window.data=data
  window.l = links[7]
  window.n = nodes
  // console.log('a link', links[7].source,links[7].target)
  // find min/max counts used to scale nodes and node labels
  var maxCount = d3.max(nodes, function(d){return d.count});
  var minCount = d3.min(nodes, function(d){return d.count});

  let link = svgSet.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', reverseTree ? diagonalR : diagonal)
    .attr('stroke-width', 4)

  let node = svgSet.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      if(p_or_r == 'pitch'){
        return reverseTree ?
          `translate(${d.x}, ${h-d.y})` :
          `translate(${d.x}, ${d.y-h})`;
      } else {
        return reverseTree ?
          `translate(${200-d.y}, ${d.x})` :
          // `translate(${650-d.y}, ${d.x})` :
          `translate(${d.y}, ${d.x})`;
      }
    })
    .on('click', function(d) {
      newRoot = [];
      window.n = d;
      if (d3.event.shiftKey) {
        let rooty = recurseParents(d).reverse();
        console.log('rooty', rooty.join(','))
        drawTree(selection, seq, rooty.join(','));
      } else if (d3.event.altKey) {
        console.log('altKey');
      } else {
        drawTree(selection, seq, d.name);
      }
    });

  let circ = node.append('circle')
    .attr('r', function(d) {
      return scaleNode(d.count,[minCount,maxCount]);
    })
    .attr('fill',function() {
      return counterClass === '.countA' ? '#BC5330' : '#1F5FA2'
    })
    .append('text')

if(p_or_r == 'pitch') {
  // note letters
  node.append('text')
    // .attr('x', 0)
    // .attr('y', 0)
    .attr('dx', function(d) {
      return d.depth == 0 ? -10 : d.depth == 1 ?
        -(scaleNode(d.count,[minCount,maxCount])+4) : 0;
      // return d.depth == 0 ? -10 : d.children ? -(scaleNode(d.count,[minCount,maxCount])+4) : -8;
      // return d.depth == 0 ? -10 : d.children ? -180 : -8;
    })
    .attr('dy', function(d) {
      return d.depth == 0 ? -10 : d.depth > 1 ?
        -(scaleNode(d.count,[minCount,maxCount])+4) : ".35em";
    })
    .style("font-size", function(d) {
      return d.depth == 0 ? 30 : scaleText(d.count,[minCount,maxCount]) //+'px'
    })
    .style("text-anchor", function(d) {
      return d.depth == 0 ? "start" : d.depth > 1 ? "middle" : "end";
    })
    .classed('leaf-text', function(d) {
      return !d.children;
    })
    .html(function(d) {
      return d.name;
      // return `${d.name}`;
    })
} else {
  console.log('try to append svg')
  node.append("svg:image")
    .attr("xlink:href", function(d){
      return 'http://josquin.stanford.edu/images/menpat/' + d.name + '.svg'
    })
    // .attr("xlink:href", 'http://josquin.stanford.edu/images/menpat/q_q_q_q.svg' )
    .attr("width", 110)
    .attr("height", 13)
    .attr('dx', function(d) {
      return d.depth == 0 ? -10 : d.depth == 1 ?
        -(scaleNode(d.count,[minCount,maxCount])+4) : 0;
    })
    .attr('dy', function(d) {
      return d.depth == 0 ? -10 : d.depth > 1 ?
        -(scaleNode(d.count,[minCount,maxCount])+4) : ".35em";
    })

  //http://josquin.stanford.edu/images/menpat/q_q_q_q.svg
}

  // counts
  node.append('text')
    .attr('dx', function(d) {
      return d.depth == 0 ? 10 : d.depth == 1 ? +
        (scaleNode(d.count,[minCount,maxCount]) + 4 ) : 0;
    })
    .attr('dy', function(d) {
      return d.depth > 1 ? scaleNode(d.count,[minCount,maxCount]) +14 : ".35em";
    })
    .style("font-size", function(d) {
      return d.depth == 0 ? 30 : scaleText(d.count,[minCount,maxCount])
    })
    .style("text-anchor", function(d){
      return d.depth > 1 ? "middle" : "start"
    })
    .classed('leaf-text', function(d) {
      return !d.children;
    })
    .html(function(d) {
      if (d.depth == 0 || countDisplay == 'none') {
        return '';
      } else if (countDisplay == 'raw') {
        return `${d.count.toLocaleString()}`;
      } else if (countDisplay == 'pct') {
        if (d.depth == 2) {
          return `${((d.count/d.parent.count)*100).toFixed(1).toLocaleString()}`;
        } else if (d.depth == 1) {
          let total = d3.sum(d.parent.children, function(d){return d.count})
          return `${((d.count/total)*100).toFixed(1).toLocaleString()}`+'%';
        }
      };
    })
};

function recurseParents(node) {
  if(node) {
    // console.log('parent name', node.name)
    newRoot.push(node.name)
    // console.log('newRoot', newRoot)
    recurseParents(node.parent)
  }
  // console.log('newRoot', newRoot)
  return newRoot;
}

function redraw(dim) {
  if(dim == 'pitch'){
    drawTree("A",apinotesA,$('input[name="root"]').val());
    // drawTree("B",apinotesB,$('input[name="root"]').val());
  } else {
    drawTreeR("A",dim)
    // drawTreeR("A",apirhythmsA,$('input[name="root"]').val());
  }
}

$(document).ready(function() {
  // reverseTree = true;
  var dim = $('input[name="dim_display"]:checked').val()

  $("#rcheck").change(function (){
    if(this.checked) {
      reverseTree = true;
    } else { reverseTree = false;}
    redraw(dim)
  })
  $("#radio_count").change(function(){
    redraw(dim)
  })
  $("#radio_dim").change(function(){
    if ($('input[name="dim_display"]:checked').val() == 'pitch') {
      $('input[name="root"]').val('D')
    }
    //
    loadData("A", false)
    // redraw(dim)
    // redraw($('input[name="dim_display"]:checked').val())
  })
  $(".b-load").click(function(){
    // console.log('b-load this',this.value)
    loadData(this.value);
  });
  $(".select-composer").change(function(){
    loadData(this.id.substr(-1), 'c')
    // console.log(this.value, this.id.substr(-1))
  })
  $(".select-genre").change(function(){
    loadData(this.id.substr(-1), 'g')
    // console.log(this.value)
  })
  $(".select-work").change(function(){
    loadData(this.id.substr(-1), 'w')
    // console.log(this.value)
  })
  $(".select-voice").change(function(){
    loadData(this.id.substr(-1), 'v')
    // console.log(this.value)
  })
  $('#b_render').click(function(){
    redraw(dim)
    // drawTree("A",apinotesA,$('input[name="root"]').val());
    // drawTree("B",apinotesB,$('input[name="root"]').val());
  })
  $(".toggle-add").on("click",function(){
    console.log('clicked to toggle add')
    if($("#rootB").hasClass('hidden')) {
      $(".toggle-add").text("Remove comparison set")
      $("#rootB").removeClass("hidden")
    } else {
      $(".toggle-add").text("Add comparison set")
      $("#rootB").addClass("hidden")
    }
  })
})

/**
  * initial load and draw
  * selection, filter=false
  */
loadData('A', false);


/**
  * misc utility functions
  */
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

function sortByTitle(a,b) {
  let aTitle = a.title.toLowerCase();
  let bTitle = b.title.toLowerCase();
  return ((aTitle < bTitle) ? -1 : ((aTitle > bTitle) ? 1 : 0));
}

function sortBy(a,b) {
  let aWhat = a.toLowerCase();
  let bWhat = b.toLowerCase();
  return ((aWhat < bWhat) ? -1 : ((aWhat > bWhat) ? 1 : 0));
}
