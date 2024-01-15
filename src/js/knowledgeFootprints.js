import { createRadialClusterTreeChart } from './d3/radialClusterTree.js';
import { createRadialTidyTreeChart } from './d3/radialTidyTree.js';
import { createTreeMap } from './d3/treeMap.js';
import { createZoomableTreeMap } from './d3/zoomableTreeMap.js';
import { createNestedTreeMap } from './d3/nestedTreeMap.js';
import { createForceDirectedTree } from './d3/forceDirectedTree.js';
import { createCirclePacking } from './d3/circlePacking.js';
import { transformSPARQLtoD3Hierarchie } from './sparql/sparqlToD3Hierarchie.js';
import { genericSPARQLQuery } from './sparql/genericSPARQLQuery.js';
import { getAllOrganisations } from './sparql/getAllOrganisations.js';
import { getAllExpertsFromOrganisation } from './sparql/getAllExpertsFromOrganisation.js';
import { searchConceptInD3Vis } from './d3/interactiveD3Functionalities.js';

// Show or Hide labels switch in the form.
document
  .getElementById('switchShowLabel')
  .addEventListener('change', function () {
    if (this.checked) {
      d3.selectAll(`.hasLabel`).style('opacity', 1).attr('font-size', 16);
    } else {
      d3.selectAll(`.hasLabel`).style('opacity', 0).attr('font-size', 0);
    }
  });

// Search bar functionality - Highlight node.
document
  .getElementById('searchBar')
  .addEventListener('input', function (event) {
    searchConceptInD3Vis(event.target.value);
  });

// Fills the HTML form based on type of footprint input.
document
  .getElementById('typeOfFootprintDropDown')
  .addEventListener('change', function () {
    createEntityDropDownList(this.value);
  });

// Processes what happens once you click Generate Footprint
document
  .getElementById('submitButton-Generate-Footprint')
  .addEventListener('click', async event => {
    event.preventDefault(); // Without this the page refreshes once I click the submit button, but I want JS to process form input, not refresh.

    const visualisationType = document.getElementById(
      'typeOfVisualisationDropDown'
    ).value;
    const footprintType = document.getElementById(
      'typeOfFootprintDropDown'
    ).value;
    const footprintEntity = document.getElementById(
      'dropdownFootprintEntity'
    ).value;

    let query;
    if (footprintType === 'Individual') {
      query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX obok: <http://example.org/OBOK/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX boka: <http://example.org/BOKA/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?nodeValue WHERE {
        {
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValue) WHERE {
            ?concept rdf:type obok:Concept;
              rdfs:label ?conceptName;
              skos:notation ?conceptID.
            OPTIONAL {
              ?concept skos:narrower ?child.
              ?child rdfs:label ?childName;
                skos:notation ?childID.
            }
            BIND(EXISTS {
              ?expertURI rdf:type boka:Expert;
                foaf:name ?expertName;
                boka:hasKnowledgeOf ?concept.
              FILTER(CONTAINS(STR(?expertName), "${footprintEntity}"))
            } AS ?knownByFirstEntity)
          }
        }
        BIND(IF(?nodeValue = 1 , "#f03502", "#f0cd02") AS ?nodeColour)
        BIND(IF(?nodeValue = 1 , 16 , 0 ) AS ?labelSize)
        BIND(IF(?nodeValue = 1 , 1 , 0 ) AS ?showLabel)
      }
      ORDER BY (?conceptName)
      `;
    } else if (footprintType === 'Organisational') {
      query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX obok: <http://example.org/OBOK/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX org: <http://www.w3.org/ns/org#>
      PREFIX boka: <http://example.org/BOKA/>

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?nodeValue WHERE {
        {
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValue) WHERE {
            ?concept rdf:type obok:Concept;
              rdfs:label ?conceptName;
              skos:notation ?conceptID.
            OPTIONAL {
              ?concept skos:narrower ?child.
              ?child rdfs:label ?childName;
                skos:notation ?childID.
            }
            BIND(EXISTS {
              ?organisationURI rdf:type org:Organization;
                rdfs:label ?organisationName;
                org:hasMember ?membersOfOrganisationURI.
              FILTER(CONTAINS(STR(?organisationName), "${footprintEntity}"))
              ?membersOfOrganisationURI boka:hasKnowledgeOf ?concept.
            } AS ?knownByFirstEntity)
          }
        }
        BIND(IF((?nodeValue = 1 ), "#f03502", "#f0cd02" ) AS ?nodeColour)
        BIND(IF((?nodeValue = 1 ), 16 , 0 ) AS ?labelSize)
        BIND(IF((?nodeValue = 1 ), 1 , 0 ) AS ?showLabel)
      }
      ORDER BY (?conceptName)
      `;
    }

    // Defines which function to call to generate the chosen visualisationType
    const visualisationFunction = {
      'Radial-Cluster-Tree': createRadialClusterTreeChart,
      'Radial-Tidy-Tree': createRadialTidyTreeChart,
      'Tree-Map': createTreeMap,
      'Zoomable-Tree-Map': createZoomableTreeMap,
      'Nested-Tree-Map': createNestedTreeMap,
      'Force-Directed-Tree': createForceDirectedTree,
      'Circle-Packing': createCirclePacking,
    };

    try {
      const sparqlResponse = await genericSPARQLQuery(query);
      const data = transformSPARQLtoD3Hierarchie(sparqlResponse);
      visualisationFunction[visualisationType](data);
    } catch (error) {
      console.error('Error creating D3 visualisation: ', error);
      document.getElementById('right-side').innerText =
        'Error creating D3 visualisation: ' + error.message;
    }
  });

async function createEntityDropDownList(footprintType) {
  if (footprintType === 'Individual') {
    try {
      const organisation = ''; // For this one I want to return all Experts from every org.
      const expertList = await getAllExpertsFromOrganisation(organisation);
      fillOrganisationAndPersonList(footprintType, expertList);
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    try {
      const organisationList = await getAllOrganisations();
      fillOrganisationAndPersonList(footprintType, organisationList);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

function fillOrganisationAndPersonList(footprintType, list) {
  if (footprintType.length == 0) {
    document.getElementById('dropdownFootprintEntity').innerHTML =
      '<option></option>';
  } else {
    let options =
      '<option value="">' + 'Agile / All organisations' + '</option>';
    for (const entity of list) {
      options += '<option>' + entity + '</option>';
    }
    document.getElementById('dropdownFootprintEntity').innerHTML = options;
  }
}
