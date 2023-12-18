import { genericSPARQLQuery } from '../../../src/js/sparql/genericSPARQLQuery.js';

function createRadialClusterTreeChart(data) {
  const width = 1780;
  const height = width;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) / 2 - 190;

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
    .attr('style', 'width: 100%; height: auto; font: 10px sans-serif;')
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
    .attr('stroke-opacity', 0.4)
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
    );

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
    .attr('id', d => `${d.data.id}`)
    .attr('r', 3.5);

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
    .attr('fill', 'white')
    .style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .text(d => d.data.name);

  // Functions to show and hide label text
  function showLabel(d) {
    d3.selectAll(`#label-${this.id}`).style('opacity', 1).attr('font-size', 20);
  }

  function hideLabel(d) {
    d3.selectAll(`#label-${this.id}`).style('opacity', 0).attr('font-size', 0);
  }

  async function showDetails(d) {
    const detailQuery = `
    PREFIX obok: <http://example.org/OBOK/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX boka: <http://example.org/BOKA/>
    PREFIX org: <http://www.w3.org/ns/org#>

    SELECT ?description ?fullConceptName (GROUP_CONCAT(DISTINCT ?expertName; SEPARATOR = " || ") AS ?expertList) (GROUP_CONCAT(DISTINCT ?organisationName; SEPARATOR = " || ") AS ?organisationList) WHERE {
      ?concept rdf:type obok:Concept;
        rdfs:label ?fullConceptName;
        dcterms:description ?description.
      OPTIONAL {
        ?concept boka:personWithKnowledge ?expert.
        ?expert rdfs:label ?expertName ;
               	org:memberOf ?organisation .
        ?organisation rdfs:label ?organisationName .
      }
      FILTER(CONTAINS(str(?concept),"${this.id}"))
    }
    GROUP BY ?fullConceptName ?description
    `;
    const sparqlResponse = await genericSPARQLQuery(detailQuery);

    const description = sparqlResponse.results.bindings[0].description.value;
    const fullConceptName =
      sparqlResponse.results.bindings[0].fullConceptName.value;

    const expertList =
      sparqlResponse.results.bindings[0].expertList.value.split(' || ');

    let expertHtmlList = '<ul>';
    expertList.forEach(expert => {
      expertHtmlList += `<li>${expert}</li>`;
    });
    expertHtmlList += '</ul>';

    const organisationList =
      sparqlResponse.results.bindings[0].organisationList.value.split(' || ');

    let organisationHtmlList = '<ul>';
    organisationList.forEach(organisation => {
      organisationHtmlList += `<li>${organisation}</li>`;
    });
    organisationHtmlList += '</ul>';

    let detailsHtml = `<h2>${fullConceptName}</h2>
    <h4>People with knowledge of this concept:</h4>
    ${expertHtmlList}
    <h4>Organisations with knowledge of this concept:</h4>
    ${organisationHtmlList}
    <h4>Description:</h4>
    <p>${description}</p>
    `;
    document.getElementById('detailsSection').innerHTML = detailsHtml;
  }

  chartGroup
    .selectAll('circle')
    .on('mouseover.details', showDetails)
    .on('mouseover.label', showLabel)
    .on('mouseout.label', hideLabel);

  document.getElementById('right-side').appendChild(svg.node());
}

export { createRadialClusterTreeChart };
