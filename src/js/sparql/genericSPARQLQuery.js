async function genericSPARQLQuery(query) {
  try {
    const response = await fetch(
      `https://graphdb.gch.utwente.nl/repositories/EO4GEOKG?query=${encodeURIComponent(
        query
      )}`,
      {
        method: 'GET',
        headers: { Accept: 'application/sparql-results+json' },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

export { genericSPARQLQuery };
