const fs = require("fs");
const csv = require("csv-parser");

function loadCSVData(filePath) {
  return new Promise((resolve) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results));
  });
}

module.exports = { loadCSVData };
