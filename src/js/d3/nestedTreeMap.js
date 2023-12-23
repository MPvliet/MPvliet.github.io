// Copied and adjusted from https://observablehq.com/@d3/nested-treemap

function createNestedTreeMap(data) {
  const height = 1590; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;
  //const color = d3.scaleSequential([8, 0], d3.interpolateMagma);
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
  // Create the treemap layout.
  const treemap = data =>
    d3
      .treemap()
      .size([width, height])
      .paddingOuter(3)
      .paddingTop(19)
      .paddingInner(1)
      .round(true)(
      d3
        .hierarchy(data)
        .sum(d => d.hasOwnProperty('nodeValue'))
        .sort((a, b) => b.height - a.height || b.value - a.value)
    );
  const root = treemap(data);

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr(
      'style',
      'max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif;'
    );

  svg
    .append('filter')
    //.attr('id', d => `shadow-${d.data.id}`)
    .append('feDropShadow')
    .attr('flood-opacity', 0.3)
    .attr('dx', 0)
    .attr('stdDeviation', 3);

  const node = svg
    .selectAll('g')
    .data(d3.group(root, d => d.height))
    .join('g')
    //.attr('filter', d => `shadow-${d.data.id}`)
    .selectAll('g')
    .data(d => d[1])
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  const format = d3.format(',d');
  node.append('title').text(
    d =>
      `${d
        .ancestors()
        .reverse()
        .map(d => d.data.name)
        .join('/')}\n${format(d.value)}`
  );

  node
    .append('rect')
    .attr('id', d => `rect-${d.data.id}`)
    .attr('fill', d => color(d.height))
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0);

  node
    .append('clipPath')
    .attr('id', d => `node-${d.data.id}`)
    .append('use');
  //.attr('xlink:href', d => d.nodeUid.href);

  node
    .append('text')
    .attr('clip-path', d => d.clipUid)
    .selectAll('tspan')
    .data(d => d.data.id.split().concat(format(d.value)))
    .join('tspan')
    .attr('fill-opacity', (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .text(d => d);

  node
    .filter(d => d.children)
    .selectAll('tspan')
    .attr('dx', 3)
    .attr('y', 13);

  node
    .filter(d => !d.children)
    .selectAll('tspan')
    .attr('x', 3)
    .attr(
      'y',
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    );
  document.getElementById('right-side').appendChild(svg.node());
}

export { createNestedTreeMap };
