import { getAllOrganisations } from './sparql/getAllOrganisations.js';
import { getAllExpertsFromOrganisation } from './sparql/getAllExpertsFromOrganisation.js';
import { getAllExpertiseFromExpert } from './sparql/getAllExpertiseFromExpert.js';
import { getAllMissingExpertiseFromExpert } from './sparql/getAllMissingExpertiseFromExpert.js';
import { genericSPARQLQuery } from './sparql/genericSPARQLQuery.js';
import { insertSPARQLStatement } from './sparql/insertSPARQLStatement.js';
import { deleteSPARQLStatement } from './sparql/deleteSPARQLStatement.js';

// Fills the dropdownList with all available Organisations once the webpage is fully loaded
document.addEventListener(
  'DOMContentLoaded',
  populateOrganisationDropdown(await getAllOrganisations())
);

// Fills the HTML form with experts based on the chosen Organisation, and do that for both the delete list and the add form.
document
  .getElementById('dropdownOrganisations-Delete')
  .addEventListener('change', function () {
    populateExpertsDeleteDropDown(this.value);
  });

document
  .getElementById('dropdownOrganisations-Add')
  .addEventListener('change', function () {
    populateExpertsAddDropDown(this.value);
  });

// Fill the HTML form with concepts to chose from, based on the input from the chosen expert.
document
  .getElementById('dropdownExperts-Delete')
  .addEventListener('change', function () {
    populateConceptsDeleteDropDown(this.value);
  });

document
  .getElementById('dropdownExperts-Add')
  .addEventListener('change', function () {
    populateConceptsAddDropDown(this.value);
  });

// Processes what happens once you click Add
document
  .getElementById('submitButton-Add')
  .addEventListener('click', async event => {
    event.preventDefault(); // Without this the page refreshes once I click the submit button, but I want JS to process form input, not refresh.
    const expert = document.getElementById('dropdownExperts-Add').value;
    const concept = document.getElementById('dropdownConcepts-Add').value;
    addExpertiseAnnotation(expert, concept);
    event.target.form.reset(); // Resets the form after clicking submit.
  });

// Processes what happens once you click Delete
document
  .getElementById('submitButton-Delete')
  .addEventListener('click', async event => {
    event.preventDefault(); // Without this the page refreshes once I click the submit button, but I want JS to process form input, not refresh.
    const expert = document.getElementById('dropdownExperts-Delete').value;
    const concept = document.getElementById('dropdownConcepts-Delete').value;
    deleteExpertiseAnnotation(expert, concept);
    event.target.form.reset(); // Resets the form after clicking submit.
  });

// Fills the Dropdown menu based on the information returned by the SPARQL query
function populateOrganisationDropdown(organisationList) {
  let options = '<option value="" disabled selected>Select</option>';
  for (const organisation of organisationList) {
    options += '<option>' + organisation + '</option>';
  }
  document.getElementById('dropdownOrganisations-Delete').innerHTML = options;
  document.getElementById('dropdownOrganisations-Add').innerHTML = options;
}

// Fills the dropdown menu based on the SPARQL Query
async function populateExpertsDeleteDropDown(organisation) {
  const expertList = await getAllExpertsFromOrganisation(organisation);
  let options = '<option value="" disabled selected>Select</option>';
  for (const expert of expertList) {
    options += '<option>' + expert + '</option>';
  }
  document.getElementById('dropdownExperts-Delete').innerHTML = options;
}

async function populateExpertsAddDropDown(organisation) {
  const expertList = await getAllExpertsFromOrganisation(organisation);
  let options = '<option value="" disabled selected>Select</option>';
  for (const expert of expertList) {
    options += '<option>' + expert + '</option>';
  }
  document.getElementById('dropdownExperts-Add').innerHTML = options;
}

async function populateConceptsDeleteDropDown(expert) {
  const conceptList = await getAllExpertiseFromExpert(expert);
  let options = '<option value="" disabled selected>Select</option>';
  for (const concept of conceptList) {
    options += '<option>' + concept + '</option>';
  }
  document.getElementById('dropdownConcepts-Delete').innerHTML = options;
}

async function populateConceptsAddDropDown(expert) {
  const conceptList = await getAllMissingExpertiseFromExpert(expert);
  let options = '<option value="" disabled selected>Select</option>';
  for (const concept of conceptList) {
    options += '<option>' + concept + '</option>';
  }
  document.getElementById('dropdownConcepts-Add').innerHTML = options;
}

async function addExpertiseAnnotation(expertName, conceptName) {
  const expertID = await retrieveExpertID(expertName);
  const conceptID = await retrieveConceptID(conceptName);
  const insertQuery = `
  PREFIX eo4geo: <https://bok.eo4geo.eu/>
  PREFIX boka: <http://example.org/BOKA/>
  INSERT DATA {
    GRAPH <https://bok.eo4geo.eu/applications> {
        eo4geo:${conceptID} boka:personWithKnowledge eo4geo:${expertID}
    }
  }
  `;

  const response = await insertSPARQLStatement(insertQuery);
  if (response === 204) {
    alert(
      `${conceptName} succesvol toegevoegd als expertise aan ${expertName}`
    );
  }
}

async function deleteExpertiseAnnotation(expertName, conceptName) {
  const expertID = await retrieveExpertID(expertName);
  const conceptID = await retrieveConceptID(conceptName);
  const deleteQuery = `
  PREFIX eo4geo: <https://bok.eo4geo.eu/>
  PREFIX boka: <http://example.org/BOKA/>
  DELETE DATA {
    GRAPH <https://bok.eo4geo.eu/applications> {
        eo4geo:${conceptID} boka:personWithKnowledge eo4geo:${expertID}
    }
  }
  `;

  const response = await deleteSPARQLStatement(deleteQuery);
  if (response === 204) {
    alert(
      `${conceptName} succesvol verwijderd als expertise van ${expertName}`
    );
  }
}

async function retrieveExpertID(expertName) {
  const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX boka: <http://example.org/BOKA/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>

  select ?expertURI 
  where { 
    ?expertURI rdf:type boka:Expert ;
              foaf:name ?expertName .
      filter(CONTAINS(str(?expertName), "${expertName}")) 
  }
  `;

  try {
    const data = await genericSPARQLQuery(query);
    const expertURI = data['results']['bindings'][0].expertURI.value;
    const expertID = expertURI.replace(
      new RegExp(`^https://bok.eo4geo.eu/`),
      ''
    );
    return expertID;
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

async function retrieveConceptID(conceptName) {
  const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX obok: <http://example.org/OBOK/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  select ?conceptURI 
  where { 
    ?conceptURI rdf:type obok:Concept ;
              rdfs:label ?conceptName .
      filter(CONTAINS(str(?conceptName), "${conceptName}")) 
  }
  `;

  try {
    const data = await genericSPARQLQuery(query);
    const conceptURI = data['results']['bindings'][0].conceptURI.value;
    const conceptID = conceptURI.replace(
      new RegExp(`^https://bok.eo4geo.eu/`),
      ''
    );
    return conceptID;
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}
