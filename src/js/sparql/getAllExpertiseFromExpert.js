import { genericSPARQLQuery } from './genericSPARQLQuery.js';

async function getAllExpertiseFromExpert(expert) {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX boka: <http://example.org/BOKA/>
    
    select ?conceptName 
    where { 
      ?expertURI rdf:type boka:Expert ;
                foaf:name ?expertName ;
                boka:hasKnowledgeOf ?conceptURI.
        ?conceptURI rdfs:label ?conceptName .
        filter(CONTAINS(str(?expertName), "${expert}"))
    }
    `;

  try {
    const data = await genericSPARQLQuery(query);
    const conceptList = data['results']['bindings'].map(
      concept => concept.conceptName.value
    );
    return conceptList.sort();
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

export { getAllExpertiseFromExpert };
