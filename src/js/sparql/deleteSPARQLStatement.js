async function deleteSPARQLStatement(deleteQuery) {
  const formData = new FormData();
  formData.append('update', deleteQuery);

  try {
    const response = await fetch(
      `http://localhost:7200/repositories/EO4GEOKG/statements`,
      {
        method: 'POST',
        body: formData,
      }
    );
    return response.status;
  } catch (error) {
    console.error('Delete error:', error);
  }
}

export { deleteSPARQLStatement };
