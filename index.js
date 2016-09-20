import {
  select, json,
  geoCentroid,
  geoMercator,
  geoPath
 } from 'd3';
import geojson2svg, { Renderer } from  'geojson-to-svg';

const [ width, height ]  = [ window.innerWidth, window.innerHeight];
const div = document.createElement('div');
div.id = 'vis';
document.body.appendChild(div);

const vis = select('#vis')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

json('world.geojson', (json) => {
  // create a first guess for the projection
  const center = geoCentroid(json)
  let scale  = 150;
  let offset = [width/2, height/2];
  let projection = geoMercator().scale(scale).center(center)
      .translate(offset);

  // create the path
  let path = geoPath().projection(projection);

  // using the path determine the bounds of the current map and use
  // these to determine better values for the scale and translation
  const bounds  = path.bounds(json);
  const hscale  = scale * width  / (bounds[1][0] - bounds[0][0]);
  const vscale  = scale * height / (bounds[1][1] - bounds[0][1]);
  scale   = (hscale < vscale) ? hscale : vscale;
  offset  = [width - (bounds[0][0] + bounds[1][0])/2,
                    height - (bounds[0][1] + bounds[1][1])/2];

  // new projection
  projection = geoMercator()
    .center(center)
    .scale(scale)
    .translate(offset);

  path = path.projection(projection);

  // add a rectangle to see the bound of the svg
  console.time('d3');
  vis.append('rect')
    .attr('width', width)
    .attr('height', height)
    .style('stroke', 'black')
    .style('fill', 'none');

  vis.selectAll('vis')
    .data(json.features)
    .enter()
    .append('path')
    .attr('d', path)
    .style('fill', 'red')
    .style('stroke-width', 0.25)
    .style('stroke', 'black');
  console.timeEnd('d3');

  const container = document.createElement('div');
  document.body.appendChild(container);

  console.time('gj2svg');
  const svg = geojson2svg()
    .projection(projection)
    .data(json)
    .extent([0, 0].concat(bounds[1]))
    .styles({
      Polygon: {
        fill: 'red',
        weight: 0.25,
        stroke: 'black'
      },
      MultiPolygon: {
        fill: 'brown',
        weight: 0.25,
        stroke: 'black'
      }
    })
    .render();
  console.timeEnd('gj2svg');

  container.innerHTML = svg;
});
