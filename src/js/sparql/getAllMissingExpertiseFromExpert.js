import { genericSPARQLQuery } from './genericSPARQLQuery.js';

async function getAllMissingExpertiseFromExpert(expert) {
  const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX boka: <http://example.org/BOKA/>
    PREFIX obok: <http://example.org/OBOK/>

    SELECT ?conceptName WHERE {
      ?conceptURI rdf:type obok:Concept;
        rdfs:label ?conceptName.
      MINUS {
        ?expertURI rdf:type boka:Expert;
          foaf:name ?expertName;
          boka:hasKnowledgeOf ?conceptURI.
        ?conceptURI rdfs:label ?conceptName.
        FILTER(CONTAINS(STR(?expertName), "${expert}"))
      }
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

export { getAllMissingExpertiseFromExpert };
