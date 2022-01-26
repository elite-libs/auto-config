console.log(
  Object.entries(process.env)
    .sort((pair1, pair2) => pair1[0].localeCompare(pair2[0]))
    .map(([key, value]) => `${key}\t\t\t${value}`)
    .join("\n")
);
