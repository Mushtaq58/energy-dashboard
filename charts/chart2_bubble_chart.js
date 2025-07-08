d3.csv("data/cleaned_sustainable_energy_data.csv").then(data => {
  data.forEach(d => {
    d.Year = +d.Year;
    d.access = +d["Access to electricity (% of population)"];
    d.emissions = +d["Value_co2_emissions_kt_by_country"];
  });

  const years = Array.from(new Set(data.map(d => d.Year))).sort();

  const margin = { top: 50, right: 30, bottom: 60, left: 80 };
  const width = 900 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const container = d3.select("#animatedBubbleChart");

  // Year Slider Container
  const sliderContainer = container.append("div")
    .attr("id", "yearSliderContainer")
    .style("margin", "20px 0");

  sliderContainer.append("input")
    .attr("type", "range")
    .attr("id", "yearSlider")
    .attr("min", d3.min(years))
    .attr("max", d3.max(years))
    .attr("step", 1)
    .style("width", "100%");

  const sliderLabel = sliderContainer.append("div")
    .attr("id", "sliderLabel")
    .style("text-align", "center")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`Year: ${years[0]}`);

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const radius = d3.scaleSqrt().range([3, 15]);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);

  svg.append("g")
    .attr("class", "y-axis");

  // Axis Labels
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .style("font-size", "14px")
    .style("fill", "#444")
    .text("Access to Electricity (% of Population)");

  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .style("font-size", "14px")
    .style("fill", "#444")
    .text("CO₂ Emissions (kt)");

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

  const yearLabel = svg.append("text")
    .attr("x", width - 100)
    .attr("y", height - 10)
    .style("font-size", "32px")
    .style("fill", "#ccc")
    .style("font-weight", "bold");

  function drawFrame(year) {
    sliderLabel.text(`Year: ${year}`);
    d3.select("#yearSlider").property("value", year);

    const frameData = data.filter(d =>
      d.Year === year && d.access > 0 && d.emissions > 0
    );

    x.domain([0, 100]);
    y.domain([0, d3.max(frameData, d => d.emissions) * 1.1]);

    svg.select(".x-axis")
      .transition().duration(500)
      .call(d3.axisBottom(x));

    svg.select(".y-axis")
      .transition().duration(500)
      .call(d3.axisLeft(y));

    const bubbles = svg.selectAll("circle")
      .data(frameData, d => d.Entity);

    bubbles.enter()
      .append("circle")
      .attr("cx", d => x(d.access))
      .attr("cy", d => y(d.emissions))
      .attr("r", 0)
      .attr("fill", d => color(d.Entity))
      .attr("opacity", 0.8)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <strong>${d.Entity}</strong><br>
          Year: ${d.Year}<br>
          Access: ${d.access.toFixed(1)}%<br>
          CO₂: ${d.emissions.toLocaleString()} kt
        `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
      .merge(bubbles)
      .transition()
      .duration(600)
      .attr("cx", d => x(d.access))
      .attr("cy", d => y(d.emissions))
      .attr("r", 8);

    bubbles.exit()
      .transition()
      .duration(300)
      .attr("r", 0)
      .remove();

    yearLabel.text(year);
  }

  let currentYearIndex = 0;
  let playing = true;

  function animate() {
    if (!playing) return;
    drawFrame(years[currentYearIndex]);
    currentYearIndex = (currentYearIndex + 1) % years.length;
    setTimeout(animate, 1500);
  }

  // Start animation
  animate();

  // Control chart manually with slider
  d3.select("#yearSlider").on("input", function () {
    const year = +this.value;
    playing = false; // Pause animation if slider used
    drawFrame(year);
  });
});
