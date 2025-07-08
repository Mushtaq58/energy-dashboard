d3.csv("data/cleaned_sustainable_energy_data.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d.intensity = +d["Energy intensity level of primary energy (MJ/$2017 PPP GDP)"];
    d.growth = +d["gdp_growth"];
  });

  const countries = Array.from(new Set(data.map(d => d.Entity))).sort();

  const margin = { top: 60, right: 70, bottom: 50, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const container = d3.select("#dualAxisChart");

  container.append("label")
    .text("Select Country: ")
    .style("font-weight", "bold")
    .style("margin-right", "10px");

  const dropdown = container.append("select")
    .attr("id", "countrySelectDual")
    .style("padding", "5px")
    .selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear().range([0, width]);
  const yLeft = d3.scaleLinear().range([height, 0]);
  const yRight = d3.scaleLinear().range([height, 0]);

  const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxisLeft = svg.append("g");
  const yAxisRight = svg.append("g").attr("transform", `translate(${width},0)`);

  const line1 = d3.line()
    .x(d => x(d.Year))
    .y(d => yLeft(d.intensity))
    .curve(d3.curveMonotoneX);

  const line2 = d3.line()
    .x(d => x(d.Year))
    .y(d => yRight(d.growth))
    .curve(d3.curveMonotoneX);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Energy Intensity vs GDP Growth");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("font-size", "12px")
    .text("Year");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .style("font-size", "12px")
    .style("fill", "steelblue")
    .text("Energy Intensity (energy per economic output)");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", width + 50)
    .style("font-size", "12px")
    .style("fill", "orangered")
    .text("GDP Growth (%)");

  function updateChart(selectedCountry) {
    const filtered = data.filter(d =>
      d.Entity === selectedCountry &&
      d.intensity > 0 &&
      d.growth > -100 && d.growth < 100
    );

    x.domain(d3.extent(filtered, d => d.Year));
    yLeft.domain([0, d3.max(filtered, d => d.intensity)]);
    yRight.domain([d3.min(filtered, d => d.growth), d3.max(filtered, d => d.growth)]);

    xAxis.transition().duration(600).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")));
    yAxisLeft.transition().duration(600).call(d3.axisLeft(yLeft));
    yAxisRight.transition().duration(600).call(d3.axisRight(yRight));

    const path1 = svg.selectAll(".line-intensity").data([filtered]);
    path1.enter()
      .append("path")
      .attr("class", "line-intensity")
      .merge(path1)
      .transition().duration(800)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line1);

    const path2 = svg.selectAll(".line-growth").data([filtered]);
    path2.enter()
      .append("path")
      .attr("class", "line-growth")
      .merge(path2)
      .transition().duration(800)
      .attr("fill", "none")
      .attr("stroke", "orangered")
      .attr("stroke-width", 2)
      .attr("d", line2);
  }

  const defaultCountry = "Pakistan";
  d3.select("#countrySelectDual")
    .property("value", defaultCountry)
    .on("change", function () {
      updateChart(this.value);
    });

  updateChart(defaultCountry);
});
