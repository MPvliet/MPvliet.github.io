async function insertSPARQLStatement(insertQuery) {
  const formData = new FormData();
  formData.append('update', insertQuery);

  try {
    const response = await fetch(
      `https://graphdb.gch.utwente.nl/repositories/EO4GEOKG/statements`,
      {
        method: 'POST',
        body: formData,
      }
    );
    return response.status;
  } catch (error) {
    console.error('Insert error:', error);
  }
}

export { insertSPARQLStatement };
