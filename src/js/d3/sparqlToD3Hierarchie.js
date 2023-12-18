function transformSPARQLtoD3Hierarchie(json) {
  const nodes = new Map();

  // Fill the map with all conceptnodes, since each concept can be a parent and can have childs.
  json.results.bindings.forEach(item => {
    const parent = item.conceptName.value;
    const parentId = item.conceptID.value;
    const nodeColour = item.nodeColour.value;
    const showLabel = item.showLabel.value;
    const labelSize = item.labelSize.value;

    //console.log(parent, parentId, nodeColour, showLabel);

    if (!nodes.has(parent)) {
      nodes.set(parent, {
        name: parent,
        id: parentId,
        nodeColour: nodeColour,
        showLabel: showLabel,
        labelSize: labelSize,
        children: [],
      });
    }
  });

  // Then check if parent nodes have childs and push these nodes into the childrenArray.
  json.results.bindings.forEach(item => {
    const parent = item.conceptName.value;
    const nodeColour = item.nodeColour.value;
    const showLabel = item.showLabel.value;
    const labelSize = item.labelSize.value;
    const child = item.childName ? item.childName.value : null; // not all concepts have childs. so without child equals null
    const childId = item.childID ? item.childID.value : null;

    //console.log(parent, child, childId, nodeColour, showLabel);

    if (child !== null && !nodes.has(child)) {
      nodes.set(child, {
        name: child,
        id: childId,
        nodeColour: nodeColour,
        showLabel: showLabel,
        labelSize: labelSize,
      });
    }

    if (child !== null) {
      const parentNode = nodes.get(parent);
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(nodes.get(child));
    }
  });

  // Creates an array from all nodes.values and then find the root node / most top concept, through looping through this list. The rootnode is the node that has no parent. and thus is no child for any node in this list. // For the EO4GEO BoK this is always 'GIST' // so it is basically looking for the object with the name GIST and using that object as the full and complete datastrucutre, since GIST has all children nodes.
  const d3DataStructure = Array.from(nodes.values()).find(
    node =>
      !json.results.bindings.some(
        binding => binding.childName && binding.childName.value === node.name
      )
  );
  //console.log(d3DataStructure);
  return d3DataStructure;
}

export { transformSPARQLtoD3Hierarchie };
