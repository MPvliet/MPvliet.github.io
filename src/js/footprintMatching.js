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

// Search bar functionality - Highlight node - After hitting enter
document
  .getElementById('searchBar')
  .addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      searchConceptInD3Vis(event.target.value);
    }
  });

// Search bar functionality - Hightlight node after pressing search button.
document.getElementById('searchButton').addEventListener('click', function () {
  const searchedConcept = document.getElementById('searchBar').value;
  searchConceptInD3Vis(searchedConcept);
});

// Fills the HTML form based on type of footprint input.
document
  .getElementById('typeOfFootprintDropDown')
  .addEventListener('change', function () {
    // createEntityDropDownList(this.value); // Enable this if we want to go back to a predefined list of all org or persons in the KG.
    if (this.value === 'Paper') {
      document.getElementById('dropdownFootprintEntityFirstLabel').innerHTML =
        'Footprint for the first Paper?';
      document.getElementById('dropdownFootprintEntityFirst').placeholder =
        'ex: doi.org/10.5194/agile-giss-2-25-2021';
      document.getElementById('dropdownFootprintEntitySecondLabel').innerHTML =
        'Footprint for the second Paper?';
      document.getElementById('dropdownFootprintEntitySecond').placeholder =
        'ex: doi.org/10.5194/agile-giss-2-21-2021';
    } else if (this.value === 'Individual') {
      document.getElementById('dropdownFootprintEntityFirstLabel').innerHTML =
        'Footprint for the first Person?';
      document.getElementById('dropdownFootprintEntityFirst').placeholder =
        'ex: John Doe';
      document.getElementById('dropdownFootprintEntitySecondLabel').innerHTML =
        'Footprint for the second Person?';
      document.getElementById('dropdownFootprintEntitySecond').placeholder =
        'ex: Jane Doe';
    } else if (this.value === 'Organisational') {
      document.getElementById('dropdownFootprintEntityFirstLabel').innerHTML =
        'Footprint for the first Organisation?';
      document.getElementById('dropdownFootprintEntityFirst').placeholder =
        'ex: University of Twente';
      document.getElementById('dropdownFootprintEntitySecondLabel').innerHTML =
        'Footprint for the second Organisation?';
      document.getElementById('dropdownFootprintEntitySecond').placeholder =
        'ex: Utrecht University';
    }
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

    const namedGraphDecision =
      document.getElementById('chooseDataVersion').value;

    let namedGraph;
    if (namedGraphDecision === 'Original') {
      namedGraph = 'FROM eo4geo:applications FROM eo4geo:concepts';
    } else if (namedGraphDecision === 'Revised') {
      namedGraph = 'FROM eo4geo:applications-revised FROM eo4geo:concepts';
    }

    let query;
    if (footprintType === 'Individual') {
      query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX obok: <http://example.org/OBOK/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX boka: <http://example.org/BOKA/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX eo4geo: <https://bok.eo4geo.eu/>

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?matched ?nodeValue ?nodeValueFirstEntity ?nodeValueSecondEntity ${namedGraph} WHERE {
        {
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValueFirstEntity) (IF(?knownBySecondEntity, 1 , 0 ) AS ?nodeValueSecondEntity) WHERE {
            ?concept rdf:type skos:Concept;
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
              FILTER(CONTAINS(LCASE(STR(?expertName)), LCASE("${footprintEntityFirst}")))
            } AS ?knownByFirstEntity)
            BIND(EXISTS {
              ?expertURI rdf:type boka:Expert;
                foaf:name ?expertName;
                boka:hasKnowledgeOf ?concept.
              FILTER(CONTAINS(LCASE(STR(?expertName)), LCASE("${footprintEntitySecond}")))
            } AS ?knownBySecondEntity)
          }
        }
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "Match", "noMatch") AS ?matched)
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "#FF0000", IF(?nodeValueFirstEntity = 1, "#008000", IF(?nodeValueSecondEntity = 1, "#FFA500" , "#FFFF00"))) AS ?nodeColour)
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
      PREFIX eo4geo: <https://bok.eo4geo.eu/>

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?matched ?nodeValue ?nodeValueFirstEntity ?nodeValueSecondEntity ${namedGraph} WHERE {
        { # returns all concepts with a possible direct childConcept
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValueFirstEntity) (IF(?knownBySecondEntity, 1 , 0 ) AS ?nodeValueSecondEntity) WHERE {
            ?concept rdf:type skos:Concept;
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
              FILTER(CONTAINS(LCASE(STR(?organisationName)), LCASE("${footprintEntityFirst}")))
              ?membersOfOrganisationURI boka:hasKnowledgeOf ?concept.
            } AS ?knownByFirstEntity)
                  
            # Checks whether the second entity has knowledge of a ?concept if true, return true. The bind does this for every ?concept 
            BIND(EXISTS {
              ?organisationURI rdf:type org:Organization;
                rdfs:label ?organisationName;
                org:hasMember ?membersOfOrganisationURI.
              FILTER(CONTAINS(LCASE(STR(?organisationName)), LCASE("${footprintEntitySecond}")))
              ?membersOfOrganisationURI boka:hasKnowledgeOf ?concept.
            } AS ?knownBySecondEntity)
          }
        }
        # applies the logic needed to create footprint matching.
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "Match", "noMatch") AS ?matched)
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "#FF0000", IF(?nodeValueFirstEntity = 1, "#008000", IF(?nodeValueSecondEntity = 1, "#FFA500" , "#FFFF00"))) AS ?nodeColour)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?nodeValue)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 16 , 0 ) AS ?labelSize)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?showLabel)
      } ORDER BY ?conceptName
      `;
    } else if (footprintType === 'Paper') {
      query = `
      PREFIX eo4geo: <https://bok.eo4geo.eu/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX bibo: <http://purl.org/ontology/bibo/>
      PREFIX boka: <http://example.org/BOKA/>

      SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel ?labelSize ?matched ?nodeValue ?nodeValueFirstEntity ?nodeValueSecondEntity ${namedGraph} WHERE {
        { # returns all concepts with a possible direct childConcept
          SELECT ?concept ?conceptName ?childName ?conceptID ?childID (IF(?knownByFirstEntity, 1 , 0 ) AS ?nodeValueFirstEntity) (IF(?knownBySecondEntity, 1 , 0 ) AS ?nodeValueSecondEntity) WHERE {
            ?concept rdf:type skos:Concept;
              rdfs:label ?conceptName;
              skos:notation ?conceptID.
            OPTIONAL {
              ?concept skos:narrower ?child.
              ?child rdfs:label ?childName;
                skos:notation ?childID.
            }
                  
            # Checks whether the first entity has knowledge of a ?concept if true, return true. The bind does this for every ?concept 
            BIND(EXISTS {
              ?paperURI rdf:type bibo:Report;
                bibo:doi ?DOIPaper.
              FILTER(CONTAINS(LCASE(STR(?DOIPaper)), LCASE("${footprintEntityFirst}")))
              ?concept boka:describedIn ?paperURI.
            } AS ?knownByFirstEntity)
                  
            # Checks whether the second entity has knowledge of a ?concept if true, return true. The bind does this for every ?concept 
            BIND(EXISTS {
              ?paperURI rdf:type bibo:Report;
                bibo:doi ?DOIPaper.
              FILTER(CONTAINS(LCASE(STR(?DOIPaper)), LCASE("${footprintEntitySecond}")))
              ?concept boka:describedIn ?paperURI.
            } AS ?knownBySecondEntity)
          }
        }
        # applies the logic needed to create footprint matching.
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "Match", "noMatch") AS ?matched)
        BIND(IF((?nodeValueFirstEntity + ?nodeValueSecondEntity) = 2 , "#FF0000", IF(?nodeValueFirstEntity = 1, "#008000", IF(?nodeValueSecondEntity = 1, "#FFA500" , "#FFFF00"))) AS ?nodeColour)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?nodeValue)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 16 , 0 ) AS ?labelSize)
        BIND(IF((?nodeValueFirstEntity = 1 ) || (?nodeValueSecondEntity = 1 ), 1 , 0 ) AS ?showLabel)
      } ORDER BY ?conceptName
      `;
    }

    let queryIncludedEntities;
    if (footprintType === 'Individual') {
      queryIncludedEntities = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX boka: <http://example.org/BOKA/>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>

        SELECT DISTINCT ?expertName WHERE {
          ?expertURI rdf:type boka:Expert;
            foaf:name ?expertName .
          FILTER(CONTAINS(LCASE(STR(?expertName)), LCASE("${footprintEntityFirst}")) || (CONTAINS(LCASE(STR(?expertName)), LCASE("${footprintEntitySecond}"))))
        } ORDER BY ?expertName
        `;
    } else if (footprintType === 'Organisational') {
      queryIncludedEntities = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX org: <http://www.w3.org/ns/org#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?organisationName WHERE {
          ?organisationURI rdf:type org:Organization;
            rdfs:label ?organisationName.
          FILTER(CONTAINS(LCASE(STR(?organisationName)), LCASE("${footprintEntityFirst}")) || (CONTAINS(LCASE(STR(?organisationName)), LCASE("${footprintEntitySecond}"))))
        } ORDER BY ?organisationName
        `;
    } else if (footprintType === 'Paper') {
      queryIncludedEntities = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX boka: <http://example.org/BOKA/>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX bibo: <http://purl.org/ontology/bibo/>
      
      SELECT DISTINCT ?expertName WHERE {
        ?expertURI rdf:type boka:Expert;
          foaf:name ?expertName;
          boka:authorOf ?paperURI.
        ?paperURI bibo:doi ?paperDOI.
        FILTER((CONTAINS(LCASE(STR(?paperDOI)), LCASE("${footprintEntityFirst}"))) || (CONTAINS(LCASE(STR(?paperDOI)), LCASE("${footprintEntitySecond}"))))
      }
      ORDER BY (?expertName)
      `;
    }

    // Defines which function to call to generate the chosen visualisationType
    const visualisationFunction = {
      'Radial-Cluster-Tree': createRadialClusterTreeChartForMatching,
    };

    try {
      const sparqlResponse = await genericSPARQLQuery(query);
      const data = transformSPARQLtoD3Hierarchie(sparqlResponse);

      const uniqueEntities = await genericSPARQLQuery(queryIncludedEntities);
      if (uniqueEntities.results.bindings.length === 0) {
        alert(
          'This footprint contains no entities, double check if you spelled the paper/organisation or expert correctly.'
        );
      }
      let includedEntityList = '<ul style="margin-top: 0;">';
      uniqueEntities.results.bindings.forEach(entitiy => {
        if (footprintType === 'Individual') {
          includedEntityList += `<li>${entitiy.expertName.value}</li>`;
        } else if (footprintType === 'Organisational') {
          includedEntityList += `<li>${entitiy.organisationName.value}</li>`;
        } else if (footprintType === 'Paper') {
          includedEntityList += `<li>${entitiy.expertName.value}</li>`;
        }
      });
      includedEntityList += '</ul>';

      let includedEntities;
      if (footprintType === 'Individual') {
        includedEntities = `
        <h4 style="margin-bottom: 1;">Included individuals in this footprint</h4>
        ${includedEntityList}
        `;
      } else if (footprintType === 'Organisational') {
        includedEntities = `
        <h4 style="margin-bottom: 1;">Included organisations  in this footprint</h4>
        ${includedEntityList}
        `;
      } else if (footprintType === 'Paper') {
        includedEntities = `
        <h4 style="margin-bottom: 1;">Included authors in this footprint</h4>
        ${includedEntityList}
        `;
      }

      document.getElementById('includedEntitySection').innerHTML =
        includedEntities;

      visualisationFunction[visualisationType](data);

      // Some color setting for clarity.
      document.getElementById(
        'dropdownFootprintEntityFirst'
      ).style.backgroundColor = '#008000';
      document.getElementById(
        'dropdownFootprintEntitySecond'
      ).style.backgroundColor = '#FFA500';
    } catch (error) {
      console.error('Error creating D3 visualisation: ', error);
    }
  });

/* Enable this if we want to go back to a predefined list of all org or persons in the KG.

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

*/
