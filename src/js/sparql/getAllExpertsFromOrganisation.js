import { genericSPARQLQuery } from './genericSPARQLQuery.js';

async function getAllExpertsFromOrganisation(organisation) {
  let query;
  if (organisation === '') {
    query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX boka: <http://example.org/BOKA/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  
    SELECT ?expertName WHERE {
      ?expertURI rdf:type boka:Expert;
        foaf:name ?expertName.
    } 
    `;
  } else {
    query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX boka: <http://example.org/BOKA/>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  
    select DISTINCT ?expertName where { 
        ?expertURI rdf:type boka:Expert ;
                  foaf:name ?expertName ;
                  org:memberOf ?organisationURI.
        ?organisationURI rdfs:label ?organisationName.
        FILTER(CONTAINS(STR(?organisationName), "${organisation}"))
    } 
    `;
  }

  try {
    const data = await genericSPARQLQuery(query);
    const expertList = data['results']['bindings'].map(
      expert => expert.expertName.value
    );
    return expertList.sort();
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

export { getAllExpertsFromOrganisation };
