// copied and adjusted from: https://observablehq.com/@d3/treemap/2?intent=fork

function createTreeMap(data) {
  console.log(data);

  const height = 1930; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;

  // Specify the color scale.
  const color = d3.scaleOrdinal(
    data.children.map(d => d.name),
    [
      '#8dd3c7',
      '#ffffb3',
      '#bebada',
      '#fb8072',
      '#80b1d3',
      '#fdb462',
      '#b3de69',
      '#fccde5',
      '#d9d9d9',
      '#bc80bd',
      '#ccebc5',
      '#ffed6f',
    ]
  );

  // Compute the layout.
  const root = d3
    .treemap()
    .tile(d3.treemapSquarify) // e.g., d3.treemapSquarify
    .size([width, height])
    .padding(1)
    .round(true)(
    d3
      .hierarchy(data)
      .sum(d => d.hasOwnProperty('nodeValue'))
      .sort((a, b) => b.height - a.height || b.value - a.value)
  );

  console.log(root);

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

  // Add a cell for each leaf of the hierarchy.
  const leaf = svg
    .selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  // Append a tooltip.
  const format = d3.format(',d');
  leaf.append('title').text(
    d =>
      `${d
        .ancestors()
        .reverse()
        .map(d => d.data.name)
        .join('.')}\n${format(d.value)}`
  );

  // Append a color rectangle.
  leaf
    .append('rect')
    .attr('id', d => `leaf-${d.data.id}`)
    .attr('fill', d => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr('fill-opacity', 0.6)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0);

  // Append a clipPath to ensure text does not overflow.
  leaf
    .append('clipPath')
    .attr('id', d => `clip-${d.data.id}`)
    .append('use');
  //.attr('xlink:href', d => d.leafUid.href);

  // Append multiline text. The last line shows the value and has a specific formatting.
  leaf
    .append('text')
    .attr('clip-path', d => d.clipUid)
    .selectAll('tspan')
    .data(d => d.data.id.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value)))
    .join('tspan')
    .attr('x', 3)
    .attr(
      'y',
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .attr('fill-opacity', (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .attr('font-family', 'Segoe UI')
    .attr('font-size', '5')
    .text(d => d);

  document.getElementById('right-side').appendChild(svg.node());
}

export { createTreeMap };
