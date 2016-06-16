/** index.js    K. Grossner, D. McClure
  * interface to load API data, render trees
  */
import $ from 'jquery';
import d3 from 'd3';
import _ from 'lodash';
import SuffixTree from 'suffix-tree'; // linked module from https://github.com/davidmcclure/suffix-tree
// expose library functions to console
window.d3 = d3;
window.$ = $;
window._ = _;
window.q = querystring;
window.u = url;

// defaults
var params = {
  "c":"Ock","g":"all","w":"all","v":"all",
  // "c2":"Pip","g2":"all","w2":"all","v2":"all",
  "a":"pitch","root":"C","depth":2,"maxchil":6,"mincount":3,"reverse": false,
  "quant":"raw","display":"1up","filter":false
}
window.params = params;

// parse url
var url = require('url'),
  querystring = require('querystring'),
  parsedUrl = url.parse(window.location.href, true, true)
window.searchParams = querystring.parse(parsedUrl.search.substring(1));
if(isEmpty(searchParams)){
  searchParams.c = params.c //need at least one composer
  location.href = location.href + '?'+querystring.stringify(searchParams)
}
// if(searchParams.a == 'rhythm'){
//   $(".toggle-add").addClass("hidden");
//   searchParams.root = 'w_b';
// } else {
//   delete searchParams.root;
// }

// put values from url into params
_.each(searchParams, function(val,key){
  params[key] = val;
})

var root = '',
    apitreeA = '', apitreeB = '',
    apinotesA = new Array, apinotesB = new Array,
    sequence = '', workArray = [], voiceArray = [], filteredWorkArray = [],
    notesSet = '', svgSet = '',
    counterClass = '', reverseTree = '',
    raw = '', svgX = '', svgY = '',
    newRoot=[],
    layout = '', filter = 'c'

/**
  * svg orientation
  */
var margin = {top: 5, right: 5, bottom: 5, left: 5}
  , width = parseInt(d3.select('#svg_A').style('width'), 10)
  , width = width - margin.left - margin.right
  , percent = d3.format('%')
  , navWidth = parseInt(d3.select('#nav').style('width'), 10);

width = width - navWidth;
// var h = 300;
var height = window.innerHeight -200; // active window - (dropdowns + footer)
// var h = window.innerHeight - 230; // active window - (dropdowns + footer)

let cluster = d3.layout.cluster()
  .size([width, height]);
  // .size([h, w-220]);

/**
  * selection = 'A' or 'B';
  * filter one of [c,g,w,v] composer, genre, work, voice
  */

function loadData(selection) {
  // console.log('loadData() selection, filter: '+selection,params.filter)

  // ensure selections correspond to params in effect
  $('select[id="composer_'+selection+'"] option[value="'+params.c+'"]').prop('selected',true)
  $('select[id="genre_'+selection+'"] option[value="'+params.g+'"]').prop('selected',true)
  $('select[id="work_'+selection+'"] option[value="'+params.w+'"]').prop('selected',true)
  $('select[id="voice_'+selection+'"] option[value="'+params.v+'"]').prop('selected',true)
  $('#r_'+params.a).prop('checked',true)

  // url sent a work (not all), set composer
  if(searchParams.w && searchParams.w != 'all') {
      params.c = searchParams.w.substring(0,3)
    filter = 'w';
  }
  // always get all works for composer
  let url = 'http://josquin.stanford.edu/cgi-bin/jrp?a='+params.a+'tree&f=' + params.c + '&genre=';
  console.log('url:', url);
  d3.json(url, function(error, raw) {
    // console.log(raw.length +' works, filter = '+filter)
    window.r=raw;
    console.log('active params:',params)
    // hold all works for composer
    workArray = getWorks(raw,selection).sort(sortByTitle);
    // composer changed, reset genre, work, voice params
    if(filter == 'c' || filter == false) {
      params.w = 'all';
      params.v = 'all';

      /**
        * clear works & voices dropdown, re-populate
        */
      $("#work_"+selection).find('option').remove()
      $("#work_"+selection).append('<option value="all">All</option>')

      for(let i in workArray){
        $("#work_"+selection).append(
          "<option value="+workArray[i].jrpid+">"+workArray[i].title+"</option>"
        )
      }
      $('select[id="work_'+selection+'"] option[value="'+params.w+'"]').prop('selected',true);
      // workArray = getWorks(raw,selection);
      voiceArray = getVoices(workArray,selection);
    }

    if(params.g != 'all'){
      raw = raw.filter(function(d){
        return d.genre == params.g;
      });
      filteredWorkArray = getWorks(raw,selection);
      voiceArray = getVoices(filteredWorkArray,selection);
      console.log('filtered genre raw',raw)

      $("#work_"+selection).find('option').remove()
      $("#work_"+selection).append('<option value="all">All</option>')

      for(let i in filteredWorkArray){
        $("#work_"+selection).append(
          "<option value="+filteredWorkArray[i].jrpid+">"+filteredWorkArray[i].title+"</option>"
        )
      }
      $('select[id="work_'+selection+'"] option[value="'+params.w+'"]').prop('selected',true);
    }

    if(params.w != 'all' ) {
    // if(params.w != 'all' && params.g == 'all') {
      // a single work, by url or dropdown
      raw = raw.filter(function(d){
        return d.jrpid == params.w;
      });
      console.log('single work raw',raw)

      // ensure composer, genre, work options selected
      $('select[id="genre_'+selection+'"]').val(raw[0].genre);
      $('select[id="composer_'+selection+'"]').val(params.c);
      $('select[id="work_'+selection+'"]').val(params.w);

      // always set min-count = 1 for single work
      $('input[name="min-count"]').val(1)
      filteredWorkArray = getWorks(raw,selection);
      // workArray = getWorks(raw,selection);
      voiceArray = getVoices(filteredWorkArray,selection);
      // voiceArray = getVoices(workArray,selection);
      // console.log('workArray, voiceArray',workArray,voiceArray)


      // clear, then re-populate works dropdown
      $("#work_"+selection).find('option').remove()
      $("#work_"+selection).append('<option value="all">All</option>')

      for(let i in workArray){
        $("#work_"+selection).append(
          "<option value="+workArray[i].jrpid+">"+workArray[i].title+"</option>"
        )
      }
      $('select[id="work_'+selection+'"] option[value="'+params.w+'"]').prop('selected',true);
    }

    // voice
    if(params['v'] != 'all'){
      sequence = buildSeq(raw,params.a,params.v)
      $('select[id="voice_'+selection+'"] option[value="'+params.v+'"]').prop('selected',true)
      // $("select[id='voice_"+selection+"'] option[value='"+params.v+"']").prop('selected',true)
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      // always set min-count = 1 for single work
      $('input[name="min-count"]').val(1)
      }
    else {
      sequence = buildSeq(raw,params.a);
      selection == 'A' ? apinotesA = sequence : apinotesB = sequence;
      // drawTree(selection, sequence);
      }

    if(params.a == 'pitch'){
      // test whether root is in sequence
      if(sequence.indexOf($('input[name="root"]').val()) < 0){
        console.log('root',$('input[name="root"]').val())
        console.log('selected root not in sequence, resetting to',sequence[0])
        $('input[name="root"]').val(sequence[0])
      }
    } else if(params.a == 'rhythm') {
      var rooty = sequence[0];
      $('input[name="root"]').val(sequence[0]);
    }

    // if any depth 1 elements have no children, set min-count = 1
    // if(_.filter(,function(elem){return elem.depth==1;}).every(elem => (elem.children))){
    //   $('input[name="min-count"]').val(1)
    // }
    // render sequence
    drawTree(selection, sequence, rooty);
    // drawTree(selection, sequence);
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
  let featureType = params.a
  // let featureType = $('input[name="feature"]:checked').val()
  console.log('drawTree() start', start)
  if(selection == 'B'){
    // resize & redraw A; draw B
    console.log('resize & redraw A; draw B')
  }
  // remove existing tree, if exists
  if(svgSet != '' & selection == 'A') {
    d3.select('#svgA').remove()
  }
  // create svg and g elements
  var svgA = d3.select('#svg_A')
    .append('svg')
    .classed('tree', true)
    .attr('id','svgA')
    .attr('width', width)
    .attr('height', height*0.67)
    .append('g')

  var svgB = d3.select('#svg_B')
    .append('svg')
    .classed('tree', true)
    .attr('id','svgB')
    .attr('width', width)
    .attr('height', height/2 -100)
    .append('g')

  if(reverseTree) {
    featureType == 'pitch' ? svgY = 30 : svgY = 0;
  } else {
    featureType == 'pitch' ? svgY = height+20 : svgY = -20;
  }

  // if(featureType == 'pitch') {
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

  // console.log('drawTree() for', featureType )
  // console.log('drawTree(), selection, start:', selection, start)
  let diagonal = d3.svg.diagonal()
    .projection(function(d) {
      if(featureType == 'pitch'){
        return [d.x, d.y-height];
      } else {
        return [d.y, d.x];
        // return [d.y, d.x];
      }
      });

  let diagonalR = d3.svg.diagonal()
    .projection(function(d) {
      if(featureType == 'pitch'){
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
  $(counterClass).text( featureType=='pitch'?counter+' notes':counter+' rhythms')
  // $(counterClass).text(`${notesSet.length.toLocaleString()} notes`)

  eval(svgSet).text('');

  if(start == null) {
    if(featureType == 'pitch') {
      root = $('input[name="root"]').val();
    }
    // else {
    //   root = 'w_b';
    //   $('input[name="root"]').val(root);
    // }
  } else {
    root = validateRoot(start);
    // console.log('start(root)', root);
  }

  let depth = Number($('input[name="depth"]').val());
  let maxChildren = Number($('input[name="max-children"]').val());
  let minCountDisplay = Number($('input[name="min-count"]').val());
  let quantFormat = $('input[name="quant_format"]:checked').val();

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
    // .attr('class', 'link')
    .attr('class', function(d) {
      if(d.target.count < minCountDisplay && d.depth > 0) {
        return 'hidden-link'
      } else {
        return 'link'
      }
    })
    .attr('d', reverseTree ? diagonalR : diagonal)
    .attr('stroke-width', 4)

  let node = svgSet.selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', function(d){
      // return 'node'
      // experiment
      if(d.count < minCountDisplay && d.depth > 0) {
        // console.log('hiding',d)
        return 'hidden-node'
      } else { return 'node'}
    })
    // .attr('class', 'node')
    .attr('transform', function(d) {
      if(featureType == 'pitch'){
        return reverseTree ?
          `translate(${d.x}, ${height-d.y})` :
          `translate(${d.x}, ${d.y-height})`;
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
        if(featureType == 'pitch') {
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
    // .append('text')

  if(featureType == 'pitch') {
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
  // console.log('quantFormat', quantFormat)
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
      if (d.depth == 0 || quantFormat == 'none') {
        return '';
      } else if (quantFormat == 'raw') {
        return `${d.count.toLocaleString()}`;
      } else if (quantFormat == 'pct') {
        if (d.depth == 2) {
          return `${((d.count/d.parent.count)*100).toFixed(1).toLocaleString()}`;
        } else if (d.depth == 1) {
          let total = d3.sum(d.parent.children, function(d){return d.count})
          return `${((d.count/total)*100).toFixed(1).toLocaleString()}`+'%';
        }
      };
    })
}; // drawTree()

function validateRoot(entry) {
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
    // drawTree("B",apinotesB, rooty);
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

  $(".select-composer").change(function(){
    // console.clear()
    console.log('changed composer to', this.value, this.id.substr(-1));
    searchParams.c = this.value;
    searchParams.g = 'all';
    searchParams.w = 'all';
    searchParams.v = 'all';
    searchParams.filter='c';
    location.href=location.origin+'/jrp/?'+querystring.stringify(searchParams);
    // loadData(this.id.substr(-1), 'c')

  })
  $(".select-genre").change(function(){
    // console.clear()
    console.log('changed genre to', this.value);
    searchParams.g = this.value;
    searchParams.w = 'all';
    searchParams.v = 'all';
    searchParams.filter='g';
    location.href=location.origin+'/jrp/?'+querystring.stringify(searchParams);
    // loadData(this.id.substr(-1), 'g')
  })
  $(".select-work").change(function(){
    // console.clear()
    console.log('changed work to', this.value)
    searchParams.w = this.value;
    searchParams.filter='w';
    location.href=location.origin+'/jrp/?'+querystring.stringify(searchParams)
    // loadData(this.id.substr(-1), 'w')
  })
  $(".select-voice").change(function(){
    // console.clear()
    console.log('changed voice to', this.value)
    searchParams.v = this.value;
    searchParams.filter='v';
    location.href=location.origin+'/jrp?'+querystring.stringify(searchParams)

    // loadData(this.id.substr(-1), 'v')
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

  var dim = $('input[name="feature"]:checked').val()
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
  $("#feature_type").change(function(){
    let feature = $('input[name="r_feature"]:checked').val();
    console.log('feature_type',feature)
    if (feature == 'pitch') {
      searchParams.a = 'pitch'
      location.href=location.origin+'/jrp/?'+querystring.stringify(searchParams);
      // params.a = 'pitch'
      $('input[name="root"]').val('C')
      $(".toggle-add").removeClass("hidden")
    } else {
      searchParams.a = 'rhythm'
      // searchParams.root = 'w_b'
      // params.a = 'rhythm'
      location.href=location.origin+'/jrp/?'+querystring.stringify(searchParams);
      // $(".toggle-add").addClass("hidden")
    }
    // location.href=location.origin+'/?'+querystring.stringify(searchParams);
    loadData("A", false)
  })

  $(".b-load").click(function(){
    // console.log('b-load this',this.value)
    loadData(this.value);
  });
})

/**
  * initial load and draw
  * selection, filter=false
  */

loadData('A', false);
if(params.display=='2up'){
  loadData('B', false);
}

function getWorks(raw, selection){
  /**
    * clear works dropdown, re-populate
    */
  let arr = [];

  // raw is all works in composer/genre set
  for(let r of raw) {
    if(arr.indexOf(r) == -1) {
      arr.push(r)
    }
  };
  // window.workArray = workArray.sort(sortByTitle)
  return arr;
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
  console.log(works.length + ' works; '+voices.length + ' voices')
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

// c = $('select[id="composer_A"]').val(),
// g = $('select[id="genre_A"]').val(),
// w = $('select[id="work_A"]').val(),
// v = $('select[id="voice_A"]').val(),
// a = $('input[name="feature"]:checked').val() searchParams['a'].substr(0, searchParams['a'].length-4): ,
// root = $('input[name="root"]').val(),
// depth = $('input[name="depth"]').val(),
// maxchil = $('input[name="max-children"]').val(),
// mincount = $('input[name="min-count"]').val(),
// reverse = $('input[name="reverse"]').prop('checked'),
// disp = $('input[name="quant_format"]').val()
