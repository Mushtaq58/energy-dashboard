d3.csv("data/cleaned_sustainable_energy_data.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d.fossil = +d["Electricity from fossil fuels (TWh)"];
    d.nuclear = +d["Electricity from nuclear (TWh)"];
    d.renew = +d["Electricity from renewables (TWh)"];
  });

  // Simulate resource groups
  const groups = {
    "Resource-Rich": ["United States", "Russia", "China", "Saudi Arabia"],
    "Resource-Poor": ["Pakistan", "Bangladesh", "Nepal", "Kenya"]
  };

  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const width = 350 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const stackKeys = ["fossil", "nuclear", "renew"];
  const colors = {
    fossil: "#8e5c42",
    nuclear: "#8e44ad",
    renew: "#27ae60"
  };

  const container = d3.select("#energyMixStacked");

  Object.entries(groups).forEach(([label, countries]) => {
    const filtered = data.filter(d => countries.includes(d.Entity));

    const yearlyTotals = d3.rollup(
      filtered,
      v => ({
        fossil: d3.sum(v, d => d.fossil),
        nuclear: d3.sum(v, d => d.nuclear),
        renew: d3.sum(v, d => d.renew)
      }),
      d => d.Year
    );

    const stackedData = Array.from(yearlyTotals, ([year, values]) => ({
      Year: year,
      ...values
    })).sort((a, b) => a.Year - b.Year);

    const stack = d3.stack().keys(stackKeys);
    const layers = stack(stackedData);

    const x = d3.scaleLinear()
      .domain(d3.extent(stackedData, d => d.Year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(layers[layers.length - 1], d => d[1])])
      .range([height, 0]);

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style("margin", "0 10px 30px 10px")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const area = d3.area()
      .x(d => x(d.data.Year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    svg.selectAll("path")
      .data(layers)
      .enter()
      .append("path")
      .attr("fill", d => colors[d.key])
      .attr("d", area)
      .attr("opacity", 0.85);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5));

    // X-axis Label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "12px")
      .style("fill", "#333")
      .text("Year");

    // Y-axis Label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .style("font-size", "12px")
      .style("fill", "#333")
      .text("Electricity Production (TWh)");

    // Chart Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(`${label} Countries`);

    // Legend
    const legend = svg.selectAll(".legend")
      .data(stackKeys)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${width - 100}, ${i * 18})`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => colors[d]);

    legend.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "12px")
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  });
});
