// Load energy data and world map
Promise.all([
  d3.csv("data/cleaned_sustainable_energy_data.csv"),
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(([data, world]) => {
  // Manual country name mapping
  const nameFixes = {
    "United States of America": "United States",
    "Democratic Republic of the Congo": "Congo, Dem. Rep.",
    "Republic of the Congo": "Congo",
    "Myanmar": "Burma",
    "Czechia": "Czech Republic",
    "North Macedonia": "Macedonia",
    "Eswatini": "Swaziland",
    "Russian Federation": "Russia",
    "Korea, South": "South Korea",
    "Korea, North": "North Korea",
    "Viet Nam": "Vietnam",
    "Iran (Islamic Republic of)": "Iran",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Lao People's Democratic Republic": "Laos",
    "Syrian Arab Republic": "Syria",
    "Bolivia (Plurinational State of)": "Bolivia",
    "United Republic of Tanzania": "Tanzania"
  };

  const width = 960, height = 540;

  const svg = d3.select("#chart6_map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const color = d3.scaleSequential(d3.interpolatePlasma)
    .domain([0, 100]);

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#222")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "6px")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("font-size", "13px");

  // Create year dropdown
  const years = [...new Set(data.map(d => +d.Year))].sort((a, b) => a - b);

  const select = d3.select("#chart6")
    .insert("select", ":first-child")
    .attr("id", "yearSelect")
    .style("margin", "10px")
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const mapLayer = svg.append("g");

  function updateMap(year) {
    const renewByCountry = d3.rollup(
      data.filter(d => +d.Year === year && d["Renewables (% equivalent primary energy)"] !== ""),
      v => d3.mean(v, d => +d["Renewables (% equivalent primary energy)"] || 0),
      d => d.Entity.trim()
    );

    mapLayer.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const country = d.properties.name;
        const lookup = nameFixes[country] || country;
        const value = renewByCountry.get(lookup);
        return value != null ? color(value) : "#222";
      })
      .attr("stroke", "#333")
      .on("mouseover", function(event, d) {
        const country = d.properties.name;
        const lookup = nameFixes[country] || country;
        const value = renewByCountry.get(lookup);
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <strong>${country}</strong><br>
          Renewable Share: ${value != null ? value.toFixed(1) + "%" : "No data"}<br>
          Year: ${year}
        `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
  }

  // Initialize with default year
  const defaultYear = 2015;
  d3.select("#yearSelect").property("value", defaultYear);
  updateMap(defaultYear);

  // Update on dropdown change
  d3.select("#yearSelect").on("change", function() {
    const selectedYear = +this.value;
    updateMap(selectedYear);
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Chart 6: Global Renewable Energy Share (% of Primary Energy)");
});