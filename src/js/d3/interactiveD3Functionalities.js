import { genericSPARQLQuery } from '../../../src/js/sparql/genericSPARQLQuery.js';

// Functions to show and hide label text
function showLabel() {
  d3.selectAll(`#label-${this.id}`).style('opacity', 1).attr('font-size', 16);
}

function hideLabel() {
  d3.selectAll(`#label-${this.id}`).style('opacity', 0).attr('font-size', 0); //if font-size stays 20 the label is just hidden, but lays over other nodes, that then become unhoverable..
}

async function showDetails() {
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

  // Performs a rest call to graphDB with the above query.
  const sparqlResponse = await genericSPARQLQuery(detailQuery);

  // Concept description
  const description = sparqlResponse.results.bindings[0].description.value;
  // Titel from each concept.
  const fullConceptName =
    sparqlResponse.results.bindings[0].fullConceptName.value;

  const expertList =
    sparqlResponse.results.bindings[0].expertList.value.split(' || ');

  // Creates an HTML bullet point style list for each expert in the expertList.
  let expertHtmlList = '<ul style="margin-top: 0;">';
  expertList.forEach(expert => {
    expertHtmlList += `<li>${expert}</li>`;
  });
  expertHtmlList += '</ul>';

  const organisationList =
    sparqlResponse.results.bindings[0].organisationList.value.split(' || ');

  // Creates an HTML bullet point style list for each organisation in the organisationList.
  let organisationHtmlList = '<ul style="margin-top: 0;">';
  organisationList.forEach(organisation => {
    organisationHtmlList += `<li>${organisation}</li>`;
  });
  organisationHtmlList += '</ul>';

  let detailsHtml = `
  <h2 style="margin-bottom: 0;">${fullConceptName}</h2>
  <h4 style="margin-bottom: 1;">People with knowledge of this concept:</h4>
  ${expertHtmlList}
  <h4 style="margin-bottom: 1;">Organisations with knowledge of this concept:</h4>
  ${organisationHtmlList}
  <h4 style="margin-bottom: 0;">Description:</h4>
  <p style="margin-top: 0;">${description}</p>
  `;
  document.getElementById('detailsSection').innerHTML = detailsHtml;
}

function searchConceptInD3Vis(searchQuery) {
  if (searchQuery.length >= 2) {
    let d3NodeID = searchQuery;
    let d3Nodes = document.querySelectorAll('.concept-' + d3NodeID);

    d3Nodes.forEach(function (d3Node) {
      d3Node.style.stroke = 'darkorange';
      d3Node.style.strokeWidth = '7px';
      d3Node.style.strokeOpacity = 0.7;

      setTimeout(function () {
        if (d3Node) {
          d3Node.style.strokeOpacity = 0;
        }
      }, 5000);
    });
  }
}

export { showDetails, showLabel, hideLabel, searchConceptInD3Vis };
