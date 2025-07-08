d3.csv("data/cleaned_sustainable_energy_data.csv").then(data => {
  // Preprocess
  const countryStats = d3.rollup(
    data,
    v => {
      const sorted = v.sort((a, b) => +a.Year - +b.Year);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const inflows = d3.sum(v, d => +d["Financial flows to developing countries (US $)"] || 0);
      const startAccess = +first["Access to electricity (% of population)"] || 0;
      const endAccess = +last["Access to electricity (% of population)"] || 0;
      const accessChange = endAccess - startAccess;
      return { inflows, accessChange };
    },
    d => d.Entity
  );

  const processed = Array.from(countryStats, ([country, stats]) => ({
    country,
    inflows: stats.inflows,
    accessChange: stats.accessChange
  })).filter(d => isFinite(d.inflows) && isFinite(d.accessChange) && d.inflows > 0);

  const margin = { top: 50, right: 40, bottom: 60, left: 80 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart5_scatter")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLog()
    .domain([1e5, d3.max(processed, d => d.inflows)])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(processed, d => d.accessChange) - 5, d3.max(processed, d => d.accessChange) + 5])
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(10, ",.0s"));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .style("font-size", "14px")
    .text("Total Financial Flows Received (US $)");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .style("font-size", "14px")
    .text("Electricity Access Increase (%)");

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "#222")
    .style("color", "#fff")
    .style("border-radius", "6px")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("font-size", "13px");

  svg.selectAll("circle")
    .data(processed)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.inflows))
    .attr("cy", d => y(d.accessChange))
    .attr("r", 6)
    .attr("fill", d => color(d.country))
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(`
        <strong>${d.country}</strong><br>
        Inflows: $${Math.round(d.inflows).toLocaleString()}<br>
        Access Change: ${d.accessChange.toFixed(1)}%
      `)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Do More Financial Flows Lead to Greater Electricity Access?");
});