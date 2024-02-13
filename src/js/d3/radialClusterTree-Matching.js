// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork
import { createLegend } from './addD3Legend.js';
import { radialClusterOuterDoughnut } from './radialClusterTree-outerDoughnut.js';
import {
  showDetails,
  showLabel,
  hideLabel,
} from './interactiveD3Functionalities.js';

function createRadialClusterTreeChartForMatching(data) {
  const svgd3Footprint = document.getElementById('svgFootprint');
  if (svgd3Footprint) {
    // Checks if it exists, if so remove the svg before generating a new one.
    svgd3Footprint.remove();
  }

  const height = 1420; //930; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) / 2 - 20;

  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 5])
    .on('zoom', e => {
      chartGroup.attr('transform', e.transform);
    });

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
    .attr('style', 'width: auto; height: auto;')
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
  const chartGroup = svg.append('g');

  // Append links
  chartGroup
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.2)
    .attr('stroke-width', 2)
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
      const linksToNode = root.links().filter(d => d.target === currentNode); // Find all links that lead to the current node
      if (color === 'green') {
        linksToNode.forEach(link => {
          chartGroup
            .append('path')
            .data([link])
            .join('path')
            .attr(
              'd',
              d3
                .linkRadial()
                .angle(d => d.x - 0.0025)
                .radius(d => d.y - 2)
            )
            .attr('stroke', color)
            .attr('fill', 'none')
            .attr('stroke-width', 2.5)
            // .style('stroke-dasharray', '0, 2, 2, 2')
            .attr('stroke-opacity', 1);
        });
      } else if (color === 'orange') {
        linksToNode.forEach(link => {
          chartGroup
            .append('path')
            .data([link])
            .join('path')
            .attr(
              'd',
              d3
                .linkRadial()
                .angle(d => d.x + 0.0025)
                .radius(d => d.y + 2)
            )
            .attr('stroke', color)
            .attr('fill', 'none')
            .attr('stroke-width', 2.5)
            // .style('stroke-dasharray', '0, 2, 2, 2')
            // .style('stroke-dashoffset', 2)
            .attr('stroke-opacity', 1);
        });
      }
      currentNode = currentNode.parent; // Move to the parent node
    }
  }

  root
    .descendants()
    .sort((a, b) => d3.descending(a.depth, b.depth)) // Fixes drawing order, ensures it starts drawing paths from the outside to the root node. Ensuring paths that both organisations 'color' don't overdraw.
    .forEach(node => {
      // loops through each childnode from the rootnode. And checks whether the path needs to be coloured.
      if (
        parseInt(node.data.nodeValueFirstEntity) === 1 // && node.data.matched === 'noMatch'
      ) {
        colorPathToRoot(node, 'green');
      }
      if (
        parseInt(node.data.nodeValueSecondEntity) === 1 // && node.data.matched === 'noMatch'
      ) {
        colorPathToRoot(node, 'orange');
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
    .attr('font-size', d => 0) //`${d.data.labelSize}`
    .attr('dy', '0.31em')
    .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    .attr('fill', 'white') // 'currentColor'
    .style('opacity', '0') //.style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .attr('class', d => (parseInt(d.data.showLabel) === 1 ? 'hasLabel' : ''))
    .text(d => d.data.name);

  // Enables the interacive functions when hovering over a circle/ node in the graph. Only works for the radial cluster tree nodes, since selectAll 'circle'
  chartGroup
    .selectAll('circle')
    .on('mouseover.details', showDetails)
    .on('mouseover.label', showLabel)
    .on('mouseout.label', hideLabel);

  //https://stackoverflow.com/questions/70559083/allow-zoom-with-buttons-only-allow-pan-with-mouse-drag
  d3.select('#zoomOutButton').on('click', function () {
    zoom.scaleBy(svg.transition(), 1 / 1.3);
  });

  d3.select('#zoomInButton').on('click', function () {
    zoom.scaleBy(svg.transition(), 1.3);
  });

  const legendData = [
    {
      color: '#008000',
      label: 'Knowledge Path First Entity',
      type: 'line',
      rowHeight: 0,
    },
    {
      color: '#FFA500',
      label: 'Knowledge Path Second Entity',
      type: 'line',
      rowHeight: 20,
    },
    {
      color: '#FFFF00',
      label: 'EO4GEO Concepts',
      type: 'circle',
      rowHeight: 40,
    },
    {
      color: '#008000',
      label: 'Knowledge of First Entity',
      type: 'circle',
      rowHeight: 60,
    },
    {
      color: '#FFA500',
      label: 'Knowledge of Second Entity',
      type: 'circle',
      rowHeight: 80,
    },
    {
      color: '#FF0000',
      label: 'Matched Knowledge of EO4GEO Concept',
      type: 'circle',
      rowHeight: 100,
    },
    {
      color: '#a3d8f4',
      label: '[AM] Analytical Methods',
      type: 'rect',
      rowHeight: 135,
    },
    {
      color: '#ff6f61',
      label: '[CF] Conceptual Foundations',
      type: 'rect',
      rowHeight: 155,
    },
    {
      color: '#dab894',
      label: '[CV] Cartography and Visualization',
      type: 'rect',
      rowHeight: 175,
    },
    {
      color: '#54AAAF',
      label: '[DA] Design and Setup of Geographic Information Systems',
      type: 'rect',
      rowHeight: 210,
    },
    {
      color: '#fffdd0',
      label: '[DM] Data Modeling, Storage and Exploitation',
      type: 'rect',
      rowHeight: 265,
    },
    {
      color: '#36454f',
      label: '[GC] Geocomputation',
      type: 'rect',
      rowHeight: 300,
    },
    {
      color: '#40e0d0',
      label: '[GD] Geospatial Data',
      type: 'rect',
      rowHeight: 320,
    },
    {
      color: '#fadadd',
      label: '[GS] GI and Society',
      type: 'rect',
      rowHeight: 340,
    },
    {
      color: '#009473',
      label: '[IP] Image Processing and Analysis',
      type: 'rect',
      rowHeight: 360,
    },
    {
      color: '#93C572',
      label: '[OI] Organizational and Institutional Aspects',
      type: 'rect',
      rowHeight: 390,
    },
    {
      color: '#c0c0c0',
      label: '[PP] Physical Principles',
      type: 'rect',
      rowHeight: 420,
    },
    {
      color: '#F47D4D',
      label: '[PS] Platforms, Sensors and Digital Imagery',
      type: 'rect',
      rowHeight: 440,
    },
    {
      color: '#D7837F',
      label: '[TA] Thematic and Application Domains',
      type: 'rect',
      rowHeight: 470,
    },
    {
      color: '#98ff98',
      label: '[WB] Web-based GI',
      type: 'rect',
      rowHeight: 500,
    },
  ];

  // calls the createLegend function and creates a legend.
  createLegend(legendData, `#d3Legend`);
  // Creates the outerDoughnut d3 chart
  radialClusterOuterDoughnut(root, radius, chartGroup);
}

export { createRadialClusterTreeChartForMatching };
