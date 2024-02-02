// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork
import { createLegend } from './addD3Legend.js';
import { radialClusterOuterDoughnut } from './radialClusterTree-outerDoughnut.js';
import {
  showDetails,
  showLabel,
  hideLabel,
} from './interactiveD3Functionalities.js';

function createRadialClusterTreeChart(data) {
  const svgd3Footprint = document.getElementById('svgFootprint');
  if (svgd3Footprint) {
    // Checks if it exists, if so remove the svg before generating a new one.
    svgd3Footprint.remove();
  }

  const height = 1420; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) / 2 - 20;

  const tree = d3
    .cluster()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = tree(d3.hierarchy(data));

  const svg = d3
    .select('.right-side')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .attr('style', 'width: 100%; height: auto;')
    .attr('id', 'svgFootprint')
    .call(
      // enables zoom and pann
      d3
        .zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', e => {
          chartGroup.attr('transform', e.transform);
        })
    );

  // Group to hold all chart elements, paths, nodes and labels.
  const chartGroup = svg.append('g').attr('name', 'chartGroup');

  // const radialPath = d3
  //   .linkRadial()
  //   .angle(d => d.x)
  //   .radius(d => d.y);

  // Append links
  chartGroup
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.2)
    .attr('stroke-width', 2.5)
    .selectAll()
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
    )
    // .attr('d', function (d) {
    //   // https://stackoverflow.com/questions/58100069/d3-j-mixing-radial-tree-with-link-straight-tree
    //   let adjust = 1.5708; //90 degrees in radians

    //   // calculate the start and end points of the path, using trig
    //   let sourceX = d.source.y * Math.cos(d.source.x - adjust);
    //   let sourceY = d.source.y * Math.sin(d.source.x - adjust);
    //   let targetX = d.target.y * Math.cos(d.target.x - adjust);
    //   let targetY = d.target.y * Math.sin(d.target.x - adjust);

    //   // if the source node is at the centre, depth = 0, then create a straight path using the L (lineto) SVG path. Else, use the radial path
    //   if (d.source.depth == 0) {
    //     return (
    //       'M' + sourceX + ' ' + sourceY + ' ' + 'L' + targetX + ' ' + targetY
    //     );
    //   } else {
    //     return radialPath(d);
    //   }
    // })
    .attr('source', d => `${d.source.data.name}`)
    .attr('target', d => `${d.target.data.name}`);

  function colorPathToRoot(node, color) {
    let currentNode = node;
    while (currentNode.parent) {
      // While currentNode has a parent, select the currentNode and change the path stroke colour.
      chartGroup
        .selectAll('path')
        .filter(d => d.target === currentNode)
        .attr('stroke', color)
        .attr('stroke-opacity', 1);

      currentNode = currentNode.parent; // Move to the parent node
    }
  }

  root.descendants().forEach(node => {
    // loops through each childnode from the rootnode.
    if (parseInt(node.data.showLabel) === 1) {
      colorPathToRoot(node, 'green');
    }
  });

  // Append nodes
  chartGroup
    .append('g')
    .selectAll()
    .data(root.descendants())
    .join('circle')
    .attr(
      'transform',
      d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .attr('fill', d => (d.children ? d.data.nodeColour : d.data.nodeColour))
    .attr('fill-opacity', d => (parseInt(d.data.showLabel) === 1 ? 1 : 0.2)) // using showLabel here might be a bit weird, but it tells me the node should be coloured aswell.
    .attr('id', d => `${d.data.id}`)
    .attr('class', d => `concept-${d.data.id}`)
    .attr('name', d => `${d.data.name}`)
    .attr('r', d => (parseInt(d.data.showLabel) === 1 ? 3.5 : 2.5));

  // Append labels
  chartGroup
    .append('g')
    //.attr('stroke-linejoin', 'round')
    //.attr('stroke-width', 3)
    .selectAll()
    .data(root.descendants())
    .join('text')
    .attr(
      'transform',
      d =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr('font-family', 'Segoe UI')
    .attr('font-size', d => `${d.data.labelSize}`)
    .attr('dy', '0.31em')
    .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    //.attr('paint-order', 'stroke')
    //.attr('stroke', 'white')
    .attr('fill', 'white') // 'currentColor'
    .style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .attr('class', d => (parseInt(d.data.showLabel) === 1 ? 'hasLabel' : ''))
    .text(d => d.data.name);

  // Enables the interacive functions when hovering over a circle/ node in the graph.
  chartGroup
    .selectAll('circle')
    .on('mouseover.details', showDetails)
    .on('mouseover.label', showLabel)
    .on('mouseout.label', hideLabel);

  const legendData = [
    { color: 'green', label: 'Knowledge path', type: 'line', rowHeight: 0 },
    {
      color: '#ffd966',
      label: 'EO4GEO Concepts',
      type: 'circle',
      rowHeight: 20,
    },
    {
      color: '#ff4c4c',
      label: 'Knowledge of EO4GEO Concept',
      type: 'circle',
      rowHeight: 40,
    },
    {
      color: '#a3d8f4',
      label: '[AM] Analytical Methods',
      type: 'rect',
      rowHeight: 80,
    },
    {
      color: '#ff6f61',
      label: '[CF] Conceptual Foundations',
      type: 'rect',
      rowHeight: 100,
    },
    {
      color: '#dab894',
      label: '[CV] Cartography and Visualization',
      type: 'rect',
      rowHeight: 125,
    },
    {
      color: '#54AAAF',
      label: '[DA] Design and Setup of Geographic Information Systems',
      type: 'rect',
      rowHeight: 165,
    },
    {
      color: '#fffdd0',
      label: '[DM] Data Modeling, Storage and Exploitation',
      type: 'rect',
      rowHeight: 215,
    },
    {
      color: '#36454f',
      label: '[GC] Geocomputation',
      type: 'rect',
      rowHeight: 245,
    },
    {
      color: '#40e0d0',
      label: '[GD] Geospatial Data',
      type: 'rect',
      rowHeight: 265,
    },
    {
      color: '#fadadd',
      label: '[GS] GI and Society',
      type: 'rect',
      rowHeight: 285,
    },
    {
      color: '#009473',
      label: '[IP] Image Processing and Analysis',
      type: 'rect',
      rowHeight: 305,
    },
    {
      color: '#93C572',
      label: '[OI] Organizational and Institutional Aspects',
      type: 'rect',
      rowHeight: 335,
    },
    {
      color: '#c0c0c0',
      label: '[PP] Physical Principles',
      type: 'rect',
      rowHeight: 365,
    },
    {
      color: '#F47D4D',
      label: '[PS] Platforms, Sensors and Digital Imagery',
      type: 'rect',
      rowHeight: 385,
    },
    {
      color: '#D7837F',
      label: '[TA] Thematic and Application Domains',
      type: 'rect',
      rowHeight: 415,
    },
    {
      color: '#98ff98',
      label: '[WB] Web-based GI',
      type: 'rect',
      rowHeight: 445,
    },
  ];

  // calls the createLegend function and creates a legend.
  createLegend(legendData, `#d3Legend`);

  // Creates the outerDoughnut d3 chart
  radialClusterOuterDoughnut(root, radius, chartGroup);
}

export { createRadialClusterTreeChart };
