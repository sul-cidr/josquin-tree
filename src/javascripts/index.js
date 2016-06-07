/** index.js    K. Grossner, D. McClure
  * interface to load API data, render trees
  */

var url = require('url'),
    querystring = require('querystring'),
    parsedUrl = url.parse(window.location.href, true, true)
window.searchParams = querystring.parse(parsedUrl.search.substring(1));
console.log('searchParams',isEmpty(searchParams)?'empty':searchParams);

// w=work,q=root,f=pitch || rhythm || ??,

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
    layout = ''

import $ from 'jquery';
import d3 from 'd3';
import _ from 'lodash';
// linked module from https://github.com/davidmcclure/suffix-tree
import SuffixTree from 'suffix-tree';

// expose d3, jquery functions to console
window.d3 = d3;
window.$ = $;
window._ = _;

/**
  * svg orientation
  */
var margin = {top: 5, right: 5, bottom: 5, left: 5}
, width = parseInt(d3.select('#svg_A').style('width'), 10)
, width = width - margin.left - margin.right
, percent = d3.format('%')
, navWidth = parseInt(d3.select('#nav').style('width'), 10);

var w = width - navWidth;
// var h = 300;
var h = window.innerHeight -200; // active window - (dropdowns + footer)
// var h = window.innerHeight - 230; // active window - (dropdowns + footer)

let cluster = d3.layout.cluster()
  .size([w, h]);
  // .size([h, w-220]);

/**
  * selection = 'A' or 'B';
  * filter one of [c,g,w,v] composer, genre, work, voice
  */

function loadData(selection, filter = false) {
  // console.log('loadData()',selection,filter)
  let c = searchParams['w'] ? searchParams['w'].substring(0,3) : $('select[id="composer_'+selection+'"]').val()
  // let c = $('select[id="composer_'+selection+'"]').val()
  let g = $('select[id="genre_'+selection+'"]').val()
  let w = searchParams['w'] ? searchParams['w']: $('select[id="work_'+selection+'"]').val()
  let v = $('select[id="voice_'+selection+'"]').val()
  let d = $('input[name="dim_display"]:checked').val()
  // console.log('load '+d+' for '+c+' -> genre:'+g+'; works:'+w+'; voices:'+v+' into '+selection)

  // always get all works for composer/genre
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a='+d+'tree&f=' + c + '&genre='
  if (g !='') {url += g} else g='all'
  console.log('url:', url);
  d3.json(url, function(error, raw) {
    // url sent a work
    if(searchParams['w']) {
      filter = 'w';
      workArray = getWorks(raw,selection);
    }
    // initial load or composer or genre changed:
    if(filter == false || filter == 'c' || filter == 'g') {
      // set work & genre to 'all' if necessary
      if(w != 'all' || g != 'all') {
        // console.log('filter =',filter)
        w = 'all';
        g = 'all';
        v = 'all';
      }
      /**
        * clear works & voices dropdown, re-populate
        */
      workArray = getWorks(raw,selection);
      // clear, then re-populate works dropdown
      $("#work_"+selection).find('option').remove()
      $("#work_"+selection).append('<option value="all">All</option>')
      // for(let i in getWorks(raw,selection)){
      for(let i in workArray){
        $("#work_"+selection).append(
          // "<option value="+i.jrpid+">"+i.title+"</option>"
          "<option value="+workArray[i].jrpid+">"+workArray[i].title+"</option>"
          // "<option value="+works[i].jrpid+">"+works[i].title+"</option>"
        )
      }
      voiceArray = getVoices(workArray,selection);
    } // end if(filter == false)

    if(w != 'all') {
      // a single work, by url or dropdown
      // ensure composer, genre, work options selected
      $('select[id="composer_'+selection+'"]').val(c);
      // TODO: look up genre and set dropdown
      $('select[id="genre_'+selection+'"]').val(g);
      $('select[id="work_'+selection+'"]').val(w);

      raw = raw.filter(function(d){
        return d.jrpid == w;
      });
      // if(raw[0].features.pitch[0].indexOf($('input[name="root"]').val() < 0)){
      //   console.log('selected root not in features, resetting to first')
      //   $('input[name="root"]').val(raw[0].features.pitch[0][0])
      // }
      // TODO: change root to first note: raw[0].features.pitch[0][0]
      // data is sparse, not ensured the existing root is in the work
      // $('input[name="root"]').val(raw[0].features.pitch[0][0])
      // console.log('c,g,w,1st pitch:',c,g,w,raw[0].features.pitch[0][0]) //.features[0].pitch[0][0])
      // console.log('pitch features',raw[0].features.pitch[0])

      // always set min-count = 1 for single work
      $('input[name="min-count"]').val(1)
      workArray = getWorks(raw,selection);
      voiceArray = getVoices(workArray,selection);
      // console.log('workArray, voiceArray',workArray,voiceArray)
    }

    // console.log(raw.length+' of '+works.length + ' works; '+voices.length + ' voices')
    // console.log(c,g,w,v,d)
    if(v != 'all'){
      sequence = buildSeq(raw,d,v)
      $("select[id='voice_A'] option[value='"+v+"']").prop('selected',true)
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      // always set min-count = 1 for single work
      $('input[name="min-count"]').val(1)
      }
    else {
      sequence = buildSeq(raw,d);
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      // drawTree(selection, sequence);
    }
    // test whether root is in sequence
    if(sequence.indexOf($('input[name="root"]').val()) < 0){
      console.log('selected root not in sequence, resetting to',sequence[0])
      $('input[name="root"]').val(sequence[0])
    }
    // if any depth 1 elements have no children, set min-count = 1
    // if(_.filter(,function(elem){return elem.depth==1;}).every(elem => (elem.children))){
    //   $('input[name="min-count"]').val(1)
    // }
    // render sequence
    drawTree(selection, sequence);
    window.seq = sequence;
  })
}

function buildSeq(raw, dim, voice = false) {
  // console.log('buildSeq()',dim,voice)
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

function drawTree(selection, seq, start=null) {
  let p_or_r = $('input[name="dim_display"]:checked').val()

  if(selection == 'B'){
    // resize & redraw A; draw B
    console.log('resize & redraw A; draw B')
  }
  // remove existing tree, if exists
  if(svgSet != '' & selection == 'A') {
    d3.select('#svgA').remove()
  }
  // create g elements
  var svgA = d3.select('#svg_A')
    .append('svg')
    .classed('tree', true)
    .attr('id','svgA')
    .attr('width', w)
    .attr('height', h)
    .append('g')

    // .attr("preserveAspectRatio", "xMinYMin meet")
    // .attr("viewBox", "0 0 1200 800")
    // .classed("svg-content-responsive", true)

  var svgB = d3.select('#svg_B')
    .append('svg')
    .classed('tree', true)
    .attr('id','svgB')
    .attr('width', w)
    .attr('height', h/2 -100)
    .append('g')

  if(reverseTree) {
    p_or_r == 'pitch' ? svgY = 30 : svgY = 0;
  } else {
    p_or_r == 'pitch' ? svgY = h+20 : svgY = -20;
  }

  // if(p_or_r == 'pitch') {
    svgA.attr('transform', 'translate(0,'+svgY+')');
    svgB.attr('transform', 'translate(0,'+svgY+')');
  // }
  // else {
    // svgA.attr('transform', 'translate('+svgX+',0)');
    // svgB.attr('transform', 'translate('+svgX+',0)');
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

  // console.log('drawTree() for', p_or_r )
  console.log('drawTree(), selection, start:', selection, start)
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
      } else {
        root = 'w_b';
        $('input[name="root"]').val(root);
      }
    } else {
      root = validateRoot(start);
      console.log('start(root)', root);
      }

  let depth = Number($('input[name="depth"]').val());
  let maxChildren = Number($('input[name="max-children"]').val());
  let minCountDisplay = Number($('input[name="min-count"]').val());
  let countDisplay = $('input[name="count_display"]:checked').val();
  // console.log('countDisplay',countDisplay)

  // let data = tree.query(root, depth, maxChildren, 1);
  let data = tree.query(root, depth, maxChildren, minCountDisplay);
  let nodes = cluster.nodes(data);
  let links = cluster.links(nodes);
  window.data=data
  window.l = links
  window.n = nodes
  // if any depth 1 elements have no children, set min-count = 1
  if(_.filter(nodes,function(elem){return elem.depth==1;}).every(elem => (elem.children)) == false){
    console.log('one or more level 1 nodes have no children')
    $('input[name="min-count"]').val(1)
  }
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
    .attr('class', function(d){
      return 'node'
      // if(d.count < minCountDisplay && d.depth > 0) {
      //   console.log('hiding',d)
      //   return 'hidden-node'
      // } else { return 'node'}
    })
    // .attr('class', 'node')
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
        if(p_or_r == 'pitch') {
          let rooty = recurseParents(d).reverse();
          console.log('rooty', rooty.join(','))
          $('input[name="min-count"]').val(1)
          drawTree(selection, seq, rooty.join(','));
        }
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
    // console.log('try to append svg')
    node.append("svg:image")
      .attr("xlink:href", function(d){
        return d.name != 'X'? 'http://josquin.stanford.edu/images/menpat/' + d.name + '.svg' :'x.svg'
      })
      .attr("width", 110)
      .attr("height", 13)
      .attr('x', function(d) {
        return d.depth == 0 ? -20 : d.depth == 1 ?
          -(scaleNode(d.count,[minCount,maxCount])+24) : 15;
      })
      .attr('y', function(d) {
        return d.depth == 0 ? -20 : d.depth == 1 ?
          -(scaleNode(d.count,[minCount,maxCount])+12) : -5;
      })
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
}; // drawTree()

window.validateRoot = function(entry) {
  let val = entry.replace(/ /g,',');
  return val;
}

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

function redraw(dim = null) {
  console.log('redrew')
  let rooty = validateRoot($('input[name="root"]').val())
  if(dim == 'pitch'){
    drawTree("A",apinotesA, rooty);
    drawTree("B",apinotesB, rooty);
  } else {
    drawTreeR("A",dim)
  }
}

function resize() {
  width = parseInt(d3.select('#svg_A').style('width'), 10);
  width = width - margin.left - margin.right;
  console.log('new width', width)
  location.reload()

}

$(document).ready(function() {
  d3.select(window).on('resize', _.debounce(function(){
    resize();
  }, 250 ));

  var dim = $('input[name="dim_display"]:checked').val()
  // var rooty = $('input[name="root"]').val()

  $('#b_render').click(function(){
    redraw(dim)
  })
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
    let feature = $('input[name="dim_display"]:checked').val();
    console.log('radio_dim',feature)
    if (feature == 'pitch') {
      $('input[name="root"]').val('D')
      $(".toggle-add").removeClass("hidden")
    } else {
      $(".toggle-add").addClass("hidden")
    }
    loadData("A", false)
  })
  $(".b-load").click(function(){
    // console.log('b-load this',this.value)
    loadData(this.value);
  });
  $(".select-composer").change(function(){
    loadData(this.id.substr(-1), 'c')
    console.log(this.value, this.id.substr(-1))
  })
  $(".select-genre").change(function(){
    loadData(this.id.substr(-1), 'g')
    console.log(this.value)
  })
  $(".select-work").change(function(){
    loadData(this.id.substr(-1), 'w')
    console.log(this.value)
  })
  $(".select-voice").change(function(){
    loadData(this.id.substr(-1), 'v')
    // console.log(this.value)
  })
  $(".toggle-add").on("click",function(){
    console.log('clicked to toggle add')
    if($("#sel_B").hasClass('hidden')) {
      $(".toggle-add").text("Remove comparison set")
      $("#sel_B").removeClass("hidden")
      console.log('drawTree(\'B\',seq,\'C\')')
      drawTree('B',seq,'C')
    } else {
      $(".toggle-add").text("Add comparison set")
      $("#sel_B").addClass("hidden")
    }
  })
})

/**
  * initial load and draw
  * selection, filter=false
  */
loadData('A', false);

function getWorks(raw, selection){
  /**
    * clear works dropdown, re-populate
    */
  workArray = [];

  // raw is all works in composer/genre set
  for(let r of raw) {
    if(workArray.indexOf(r) == -1) {
      workArray.push(r)
    }
  };
  window.workArray = workArray.sort(sortByTitle)
  return workArray;
}

function getVoices(works, selection) {
  // console.log('getVoices, works, selection',works, selection)
  voiceArray = [];
  $("#voice_"+selection).find('option').remove()
  $("#voice_"+selection).append('<option value="all">All</option>')
  for(let i in works){
    for(let v of works[i].voices) {
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
  return voiceArray;
}

/**
  * misc utility functions
  */
function isEmpty(obj) {
    if (obj == null) return true;

    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

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
