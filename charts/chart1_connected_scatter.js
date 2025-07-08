d3.csv("data/cleaned_sustainable_energy_data.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d.gdp_per_capita = +d.gdp_per_capita;
    d.renew_share = +d["Renewable energy share in the total final energy consumption (%)"];
  });

  const countries = Array.from(new Set(data.map(d => d.Entity))).sort();

  const margin = { top: 50, right: 40, bottom: 60, left: 80 };
  const width = 900 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const container = d3.select("#connectedScatterPlot");
  container.html(""); // clear if reloaded

  // UI for selecting number of countries
  container.append("label")
    .text("Step 1: Select how many countries to compare")
    .style("font-weight", "bold");

  container.append("select")
    .attr("id", "countryCount")
    .style("margin-left", "10px")
    .style("margin-bottom", "20px")
    .selectAll("option")
    .data(d3.range(1, 11))
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // Container for the n country selectors
  container.append("div")
    .attr("id", "countryDropdowns")
    .style("margin-bottom", "20px");

  // SVG container
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.gdp_per_capita)])
    .nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.renew_share)])
    .nice()
    .range([height, 0]);

  // Axes
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("GDP per Capita (US$)");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Renewable Energy Share (%)");

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "#222")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("opacity", 0)
    .style("font-size", "13px");

  // Function to draw the chart
  function updateChart(selectedCountries) {
    svg.selectAll(".line, .dot").remove();

    const line = d3.line()
      .x(d => x(d.gdp_per_capita))
      .y(d => y(d.renew_share))
      .curve(d3.curveMonotoneX);

    selectedCountries.forEach((country, index) => {
      const values = data
        .filter(d => d.Entity === country && d.gdp_per_capita > 0 && d.renew_share > 0)
        .sort((a, b) => a.Year - b.Year);

      if (values.length < 3) return;

      svg.append("path")
        .datum(values)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", color(country))
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .attr("d", line);

      svg.selectAll(`.dot-${index}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.gdp_per_capita))
        .attr("cy", d => y(d.renew_share))
        .attr("r", 4)
        .attr("fill", color(country))
        .attr("opacity", 0.9)
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`
            <strong>${d.Entity}</strong><br>
            Year: ${d.Year}<br>
            GDP/capita: $${d.gdp_per_capita.toFixed(0)}<br>
            Renewable share: ${d.renew_share.toFixed(1)}%
          `)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
    });
  }

  // Rebuild dropdowns based on selected count
  d3.select("#countryCount").on("change", function () {
    const count = +this.value;
    const dropdownContainer = d3.select("#countryDropdowns");
    dropdownContainer.html("");

    for (let i = 0; i < count; i++) {
      const label = dropdownContainer.append("label")
        .text(`Select country #${i + 1}`)
        .style("display", "block")
        .style("margin-top", i === 0 ? "0" : "10px");

      dropdownContainer.append("select")
        .attr("class", "countryDropdown")
        .style("margin-bottom", "10px")
        .style("width", "300px")
        .selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
    }

    // Trigger chart update when any dropdown changes
    d3.selectAll(".countryDropdown").on("change", () => {
      const selected = d3.selectAll(".countryDropdown").nodes().map(node => node.value);
      updateChart(selected);
    });
  });

  // Trigger default selection = 3 countries
  d3.select("#countryCount").property("value", 3).dispatch("change");
});
