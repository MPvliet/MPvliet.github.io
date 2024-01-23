// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork
import { createLegend } from './addD3Legend.js';
import { radialClusterOuterDoughnut } from './radialClusterTree-outerDoughnut.js';
import {
  showDetails,
  showLabel,
  hideLabel,
} from './interactiveD3Functionalities.js';

function createRadialClusterTreeChart(data) {
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
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .attr('style', 'width: auto; height: auto;')
    .call(
      // enables zoom and pann
      d3
        .zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', e => {
          chartGroup.attr('transform', e.transform);
          labelGroup.attr('transform', e.transform);
        })
    );

  // Group to hold all chart elements, paths, nodes and labels.
  const chartGroup = svg.append('g').attr('name', 'chartGroup');
  const labelGroup = svg.append('g').attr('name', 'labelGroup');

  // Append links
  chartGroup
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.1)
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
    .attr('fill-opacity', d => (parseInt(d.data.showLabel) === 1 ? 1 : 0.1)) // using showLabel here might be a bit weird, but it tells me the node should be coloured aswell.
    .attr('id', d => `${d.data.id}`)
    .attr('class', d => `concept-${d.data.id}`)
    .attr('r', 2.5);

  // // Append labels
  // chartGroup
  //   .append('g')
  //   //.attr('stroke-linejoin', 'round')
  //   //.attr('stroke-width', 3)
  //   .selectAll()
  //   .data(root.descendants())
  //   .join('text')
  //   .attr(
  //     'transform',
  //     d =>
  //       `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
  //         d.x >= Math.PI ? 180 : 0
  //       })`
  //   )
  //   .attr('font-family', 'Segoe UI')
  //   .attr('font-size', d => `${d.data.labelSize}`)
  //   .attr('dy', '0.31em')
  //   .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
  //   .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
  //   //.attr('paint-order', 'stroke')
  //   //.attr('stroke', 'white')
  //   .attr('fill', 'white') // 'currentColor'
  //   .style('opacity', d => `${d.data.showLabel}`)
  //   .attr('id', d => `label-${d.data.id}`)
  //   .attr('class', d => (parseInt(d.data.showLabel) === 1 ? 'hasLabel' : ''))
  //   .text(d => d.data.name);

  // Creating the datastructure for force directed nodes/labels.
  let nodesThatNeedALabel = [];
  root.descendants().forEach(node => {
    if (node.data.showLabel === '1') {
      const nodeLabel = {
        id: node.data.id,
        name: node.data.name,
        x: node.x,
        y: node.y,
      };
      nodesThatNeedALabel.push(nodeLabel);
    }
  });

  const simulation = d3
    .forceSimulation(nodesThatNeedALabel)
    .force('collision', d3.forceCollide())
    .force('charge', d3.forceManyBody().strength(0.5))
    .force('x', d3.forceX())
    .force('y', d3.forceY())
    .alphaTarget(0);

  const nodeLabelText = labelGroup
    .append('g')
    .selectAll('text')
    .data(nodesThatNeedALabel)
    .join('text')
    .attr(
      'transform',
      d =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr('fill', 'white')
    .attr('class', 'hasLabel')
    .attr('text-anchor', d => (d.x < Math.PI ? 'start' : 'end'))
    .text(d => d.name)
    .call(drag(simulation));

  simulation.on('tick', () => {
    nodeLabelText.attr('x', d => d.x).attr('y', d => d.y);
  });

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

  document.getElementById('right-side').appendChild(svg.node());
}

const drag = simulation => {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

export { createRadialClusterTreeChart };
