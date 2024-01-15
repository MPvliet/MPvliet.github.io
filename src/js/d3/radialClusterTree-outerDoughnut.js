function radialClusterOuterDoughnut(root, radius, chartGroup) {
  // Creates the outer piechart/doughnut chart outside of the radialClusterTree chart.

  /* 
  const counted = root.copy().count(); // counts all leafnodes under each child from the root.
  const pieDataAutoGenerate = counted.children.map(child => ({
    // creates an array with objects for each KnowledgeArea or child from the root of the data used in this vis. // -- But this does not give the expected output.
    name: child.data.id,
    fullName: child.data.name,
    value: child.value,
  }));
  */

  const pieData = [
    // Manually adjusted
    {
      name: 'AM',
      fullName: '[AM] Analytical Methods',
      value: 32,
    },
    {
      name: 'CF',
      fullName: '[CF] Conceptual Foundations',
      value: 17,
    },
    {
      name: 'CV',
      fullName: '[CV] Cartography and Visualization',
      value: 17,
    },
    {
      name: 'DA',
      fullName: '[DA] Design and Setup of Geographic Information Systems',
      value: 8,
    },
    {
      name: 'DM',
      fullName: '[DM] Data Modeling, Storage and Exploitation',
      value: 16,
    },
    {
      name: 'GC',
      fullName: '[GC] Geocomputation',
      value: 34,
    },
    {
      name: 'GD',
      fullName: '[GD] Geospatial Data',
      value: 19,
    },
    {
      name: 'GS',
      fullName: '[GS] GI and Society',
      value: 9,
    },
    {
      name: 'IP',
      fullName: '[IP] Image Processing and Analysis',
      value: 56,
    },
    {
      name: 'OI',
      fullName: '[OI] Organizational and Institutional Aspects',
      value: 15,
    },
    {
      name: 'PP',
      fullName: '[PP] Physical Principles',
      value: 60,
    },
    {
      name: 'PS',
      fullName: '[PS] Platforms, Sensors and Digital Imagery',
      value: 31,
    },
    {
      name: 'TA',
      fullName: '[TA] Thematic and Application Domains',
      value: 34,
    },
    {
      name: 'WB',
      fullName: '[WB] Web-based GI',
      value: 12,
    },
  ];

  // copied and adjusted from: https://observablehq.com/@d3/donut-chart/2?intent=fork
  const arc = d3
    .arc()
    .innerRadius(radius + 25)
    .outerRadius(radius + 75);

  const pie = d3
    .pie()
    .padAngle(null)
    .sort(null)
    .value(d => d.value);

  // const color = d3
  //   .scaleOrdinal()
  //   .domain(pieData.map(d => d.name))
  //   .range(
  //     d3
  //       .quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), pieData.length)
  //       .reverse()
  //   );

  const customColor = {
    // I want a qualitative color palette for the 14 KA's the above color code from d3, is diverging.
    AM: '#a3d8f4',
    CF: '#ff6f61',
    CV: '#dab894',
    DA: '#54AAAF',
    DM: '#fffdd0',
    GC: '#36454f',
    GD: '#40e0d0',
    GS: '#fadadd',
    IP: '#009473',
    OI: '#93C572',
    PP: '#c0c0c0',
    PS: '#F47D4D',
    TA: '#D7837F',
    WB: '#98ff98',
  };

  chartGroup
    .append('g')
    .selectAll()
    .data(pie(pieData))
    .join('path')
    .attr('fill', d => customColor[d.data.name])
    .attr('fill-opacity', 0.6)
    .attr('d', arc)
    .append('title')
    .text(d => `${d.data.fullName}`);

  chartGroup
    .append('g')
    .attr('font-family', 'segoe UI')
    .attr('text-anchor', 'middle')
    .selectAll()
    .data(pie(pieData))
    .join('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .call(text =>
      text
        .append('tspan')
        .attr('y', '0em')
        .attr('font-weight', 'bold')
        .attr('font-size', 20)
        .text(d => d.data.name)
    );
}

export { radialClusterOuterDoughnut };
