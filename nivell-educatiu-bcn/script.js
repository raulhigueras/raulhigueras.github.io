var bcn_map;
var evoPlots;
var barCharts;

const colors= [
  ['#ffa600', '#FFF1D6'],
  ['#ff6e54', '#FFDCD6'],
  ['#dd5182', '#F8DDE6'],
  ['#955196', '#F1E4F1']
]


//
//  FUNCIÓN MAIN
//  Esta es la función que hay que editar
//
//
function main() {
  const folder = 'vega_files';
  const nEvoPlots = 10;
  const nDfs = 1;
  const nPiePlots = 1;
  
  evoPlots = new Array(nEvoPlots).fill(undefined).map((val,idx) => `evo${idx+1}.json`);
  evoPlots = evoPlots.map( x => fetch(`${folder}/${x}`) );
  
  let dfs = ["https://cdn.glitch.com/8d6e3a35-83bc-4f34-8cad-803cbb9155c5%2Fno_ed_oblig.csv?v=1603625903435", "https://cdn.glitch.com/8d6e3a35-83bc-4f34-8cad-803cbb9155c5%2Fsexe_uni%20(3).csv?v=1607795709045", "https://cdn.glitch.com/8d6e3a35-83bc-4f34-8cad-803cbb9155c5%2Fsexe_bachi.csv?v=1607795413511", "https://cdn.glitch.com/8d6e3a35-83bc-4f34-8cad-803cbb9155c5%2Fsexe_eso%20(1).csv?v=1607796044986"];
  dfs = dfs.map( x => d3.csv(x) );
  
  var viz1 = fetch('vega_files/renda.json');
  
  bcn_map = d3.json("https://raw.githubusercontent.com/martgnz/bcn-geodata/master/barris/barris.geojson");
  
  let piePlots = new Array(1).fill(undefined).map((val,idx) => `pie${idx+1}.json`);
  piePlots = piePlots.map( x => fetch(`${folder}/${x}`) );
  
  //Promise.all([evo1, df1, viz1, bcn_map, pie1]).then(res => {
  Promise.all([bcn_map, viz1, ...evoPlots, ...dfs, ...piePlots]).then( res => {
    bcn_map = res[0]
    bcn_map.features = bcn_map.features.sort( (x, y) => x.properties['BARRI'] - y.properties['BARRI'])
    evoPlots = res.slice(2,2+nEvoPlots).map( x => x.json() )
    Promise.all(evoPlots).then( rres => {
      evoPlots = rres;
      vegaEmbed('#plot1', evoPlots[0])
    } );
    res[1].json().then( r => vegaEmbed('#plot2', r) )
    drawMap('#map1', res[2+nEvoPlots], 'Percentatge')
    drawMap('#map-sexe-1', res[2+nEvoPlots+1], '%_d', false, 1)
    drawMap('#map-sexe-2', res[2+nEvoPlots+2], '%_d', false, 1)
    drawMap('#map-sexe-3', res[2+nEvoPlots+3], '%_d', true, 1)
    

    //res[2+nDfs+nEvoPlots].json().then( r => vegaEmbed('#pie-chart-map', r) )
  });
  
  let bar_charts = fetch('vega_files/bar_charts.json').then(res => {
    res.json().then( r =>{
      barCharts = r;
      changeBarChart(2)
    });
  });
}


function changeEvoPlot(i) {
  vegaEmbed('#plot1', evoPlots[i])
}

function changeBarChart(i) {
  let c = JSON.parse(barCharts[i])
  vegaEmbed('#bar-chart-map', c);
  
  
  for (let j = 0; j < 73; j++) {
    document.getElementById(`barri-map-${parseInt(j)}`).classList.remove('continent-selected')
  }
  
  document.getElementById(`barri-map-${parseInt(i)}`).classList.add('continent-selected');
}



//
// A partir de aquí es todo para pintar mapas
//

function drawMap(div_id, data, variable, color_legend=true, color_palette=0) {
  
  var w = 700;
  var h = 700;
  var v = `${variable}-${div_id}`;
  
  data = Object.values(data).slice(0,73)
  
  var svgMap = d3.select(div_id).append("svg").attr("preserveAspectRatio", "xMinYMin meet")
              .attr("viewBox", "0 0 " + w + " " + h)
              .classed("svg-content", true);

  // Get data
  var values = data.map(v => v[variable]);


  // TOOLTIP
  var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-5, 0])
              .html(function(d) {
                
                if (variable == "diff") {
                  if (d.properties[v] > 0) return `${d.properties.NOM} : ${d.properties[v]} dones +`;
                  else return `${d.properties.NOM} : ${-d.properties[v]} homes +`;
                }
                
                if (color_palette == 0) return `${d.properties.NOM} : ${d.properties[v]} %`;
                else                    return `${d.properties.NOM} : ${d.properties[v]} %`;
              })

  svgMap.call(tip)


  // MAP PROJECTION (NO TOCAR PORFA)
  var projection = d3.geoMercator().translate([w/2, h/2]).scale(195000).center([2.15,41.392]);
  var path = d3.geoPath().projection(projection);


  // COLOR PALETTE
  //var color = d3.scaleSequential(d3.interpolatePlasma).domain([0,Math.max(...values)]);
  var color;
  if (color_palette == 0)  color = d3.scaleSequential(d3.interpolateRgbBasis(["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"].reverse())).domain([Math.max(...values), 0]);//color = d3.scaleLinear().domain([0,Math.max(...values)]).interpolate(d3.interpolateHcl).range([ d3.hcl('#E0EEF5'), d3.hcl('#184C8C')]);
  else                     color = d3.scaleSequential(d3.interpolatePRGn).domain([65,35]);
  //var 
  // color = d3.scaleSequential(d3.interpolateBlues).domain([0,Math.max(...values)]);
  
  

  // COLOR LEGEND
  if (color_legend) continuous(`${div_id}_legend`, color)


  // DRAW MAP
  bcn_map.features.forEach( (f, i) => {
    //console.log(f.properties['BARRI'])
    f.properties[v] =  Math.round(values[i]*100)/100;
  })
  
  svgMap.selectAll("path")
     .data(bcn_map.features)
     .enter()
     .append("path")
     .attr("class", "continent")
     .attr("id", d => `barri-map-${parseInt(d.properties['BARRI'])-1}`)
     .attr("d", path)
     .attr("fill", '#EEEEEE')
     .on('mouseover', tip.show)
     .on('mouseleave', tip.hide)
     .on('click', d => {
       changeBarChart(parseInt(d.properties['BARRI'])-1)
     });
     
  
  svgMap.selectAll("path")
    .transition()
    .delay(function(d, i) { return i*8 })
    .attr("fill",(d, i) => {
       return color(d.properties[v]);
     });
}

// create continuous color legend
function continuous(selector_id, colorscale) {
  document.querySelector(selector_id).innerHTML = "";
  
  var legendheight = 200,
      legendwidth = 80,
      margin = {top: 10, right: 60, bottom: 10, left: 2};

  var canvas = d3.select(selector_id)
    .style("height", legendheight + "px")
    .style("width", legendwidth + "px")
    .style("position", "relative")
    .append("canvas")
    .attr("height", legendheight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendheight - margin.top - margin.bottom) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top", (margin.top) + "px")
    .style("left", (margin.left) + "px")
    .node();

  var ctx = canvas.getContext("2d");

  var legendscale = d3.scaleLinear()
    .range([1, legendheight - margin.top - margin.bottom])
    .domain(colorscale.domain());

  // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
  var image = ctx.createImageData(1, legendheight);
  d3.range(legendheight).forEach(function(i) {
    var c = d3.rgb(colorscale(legendscale.invert(i)));
    image.data[4*i] = c.r;
    image.data[4*i + 1] = c.g;
    image.data[4*i + 2] = c.b;
    image.data[4*i + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

  // A simpler way to do the above, but possibly slower. keep in mind the legend width is stretched because the width attr of the canvas is 1
  // See http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
  /*
  d3.range(legendheight).forEach(function(i) {
    ctx.fillStyle = colorscale(legendscale.invert(i));
    ctx.fillRect(0,i,1,1);
  });
  */

  var legendaxis = d3.axisRight()
    .scale(legendscale)
    .tickSize(6)
    .tickFormat(Math.abs)
    .ticks(8);

  var svg = d3.select(selector_id)
    .append("svg")
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
    .call(legendaxis);
};


main()


window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

if (window.mobileCheck()) {
  alert("Aquesta visualització no està optimitzada per telèfons mòbils. Per una bona experiència, obre l'enllaç des del navegador d'un ordinador :).")
}