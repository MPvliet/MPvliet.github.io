import { createRadialClusterTreeChartForMatching } from './d3/radialClusterTree-Matching.js';
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

    const footprintEntityFirst = document.getElementById(
      'dropdownFootprintEntityFirst'
    ).value;

    const footprintEntitySecond = document.getElementById(
      'dropdownFootprintEntitySecond'
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

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?matched ?nodeValue ?nodeValueFirstEntity ?nodeValueSecondEntity WHERE {
        {
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValueFirstEntity) (IF(?knownBySecondEntity, 1 , 0 ) AS ?nodeValueSecondEntity) WHERE {
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
              FILTER(CONTAINS(STR(?expertName), "${footprintEntityFirst}"))
            } AS ?knownByFirstEntity)
            BIND(EXISTS {
              ?expertURI rdf:type boka:Expert;
                foaf:name ?expertName;
                boka:hasKnowledgeOf ?concept.
              FILTER(CONTAINS(STR(?expertName), "${footprintEntitySecond}"))
            } AS ?knownBySecondEntity)
          }
        }
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "Match", "noMatch") AS ?matched)
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "#7E10E1", IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 1 , "#ff4c4c", "#ffd966")) AS ?nodeColour)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?nodeValue)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 16 , 0 ) AS ?labelSize)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?showLabel)
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

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?matched ?nodeValue ?nodeValueFirstEntity ?nodeValueSecondEntity WHERE {
        { # returns all concepts with a possible direct childConcept
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValueFirstEntity) (IF(?knownBySecondEntity, 1 , 0 ) AS ?nodeValueSecondEntity) WHERE {
            ?concept rdf:type obok:Concept;
              rdfs:label ?conceptName;
              skos:notation ?conceptID.
            OPTIONAL {
              ?concept skos:narrower ?child.
              ?child rdfs:label ?childName;
                skos:notation ?childID.
            }
                  
            # Checks whether the first entity has knowledge of a ?concept if true, return true. The bind does this for every ?concept 
            BIND(EXISTS {
              ?organisationURI rdf:type org:Organization;
                rdfs:label ?organisationName;
                org:hasMember ?membersOfOrganisationURI.
              FILTER(CONTAINS(STR(?organisationName), "${footprintEntityFirst}"))
              ?membersOfOrganisationURI boka:hasKnowledgeOf ?concept.
            } AS ?knownByFirstEntity)
                  
            # Checks whether the second entity has knowledge of a ?concept if true, return true. The bind does this for every ?concept 
            BIND(EXISTS {
              ?organisationURI rdf:type org:Organization;
                rdfs:label ?organisationName;
                org:hasMember ?membersOfOrganisationURI.
              FILTER(CONTAINS(STR(?organisationName), "${footprintEntitySecond}"))
              ?membersOfOrganisationURI boka:hasKnowledgeOf ?concept.
            } AS ?knownBySecondEntity)
          }
        }
        # applies the logic needed to create footprint matching.
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "Match", "noMatch") AS ?matched)
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "#7E10E1", IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 1 , "#ff4c4c", "#ffd966")) AS ?nodeColour)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?nodeValue)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 16 , 0 ) AS ?labelSize)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?showLabel)
      } ORDER BY ?conceptName
      `;
    }

    // Defines which function to call to generate the chosen visualisationType
    const visualisationFunction = {
      'Radial-Cluster-Tree': createRadialClusterTreeChartForMatching,
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
    document.getElementById('dropdownFootprintEntityFirst').innerHTML =
      '<option></option>';
    document.getElementById('dropdownFootprintEntitySecond').innerHTML =
      '<option></option>';
  } else {
    let options = '';
    for (const entity of list) {
      options += '<option>' + entity + '</option>';
    }
    document.getElementById('dropdownFootprintEntityFirst').innerHTML = options;
    document.getElementById('dropdownFootprintEntitySecond').innerHTML =
      options;
  }
}
