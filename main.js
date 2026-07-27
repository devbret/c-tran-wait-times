const map = L.map("map").setView([45.64, -122.55], 12);

const light = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "© CARTO, © OpenStreetMap contributors",
    maxZoom: 20,
  },
);

const street = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
).addTo(map);

const dark = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "© CARTO, © OpenStreetMap contributors",
    maxZoom: 20,
  },
);

L.control.layers({ Street: street, Light: light, Dark: dark }).addTo(map);
map.on("baselayerchange", (e) =>
  document.body.classList.toggle("dark", e.name === "Dark"),
);

const svgLayer = L.svg({ clickable: true }).addTo(map);
const g = d3.select(svgLayer._container).select("g");

const tooltip = d3.select("#tooltip");
const panelEl = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelWait = document.getElementById("panelWait");
const panelRank = document.getElementById("panelRank");
const panelPct = document.getElementById("panelPct");
const panelMeter = document.getElementById("panelMeter");
document.getElementById("panelClose").onclick = closePanel;
map.on("click", closePanel);

function openPanel() {
  panelEl.classList.add("open");
}
function closePanel() {
  panelEl.classList.remove("open");
}

function debounce(fn, wait = 50) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

d3.csv("wait_time_per_stop.csv")
  .then((raw) => {
    document.getElementById("loading").style.display = "none";

    const data = raw
      .map((d) => ({
        stop_id: d.stop_id ?? `${d.stop_lat},${d.stop_lon}`,
        lat: +d.stop_lat,
        lon: +d.stop_lon,
        wait: +d.wait_time,
      }))
      .filter(
        (d) =>
          Number.isFinite(d.lat) &&
          Number.isFinite(d.lon) &&
          Number.isFinite(d.wait),
      );

    const waits = data.map((d) => d.wait).sort((a, b) => a - b);
    const minWait = d3.min(waits),
      maxWait = d3.max(waits);
    const meanWait = d3.mean(waits);
    const medianWait = d3.median(waits);

    const color = d3
      .scaleLinear()
      .domain([minWait, meanWait, maxWait])
      .range(["#3fb950", "#eec331", "#d73a49"])
      .clamp(true);

    const baseRadius = d3.scaleSqrt().domain([minWait, maxWait]).range([3, 33]);

    function zoomRadius(wait) {
      return baseRadius(wait) * Math.pow(2, map.getZoom() - 12);
    }

    function project(lat, lon) {
      const p = map.latLngToLayerPoint([lat, lon]);
      return { x: p.x, y: p.y };
    }

    const groups = g
      .selectAll("g.stop")
      .data(data, (d) => d.stop_id)
      .join((enter) => {
        const s = enter.append("g").attr("class", "stop");
        s.append("circle").attr("class", "bubble");
        s.append("circle").attr("class", "hit");
        s.append("text")
          .attr("class", "stop-label")
          .text((d) => d.stop_id);
        return s;
      });

    function render() {
      const labelsVisible = map.getZoom() >= 15;
      g.classed("labels-visible", labelsVisible);

      groups.each(function (d) {
        const p = project(d.lat, d.lon);
        const r = zoomRadius(d.wait);

        d3.select(this)
          .select(".bubble")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", r)
          .attr("fill", color(d.wait));

        d3.select(this)
          .select(".hit")
          .attr("cx", p.x)
          .attr("cy", p.y)
          .attr("r", Math.max(14, r * 0.8));

        d3.select(this)
          .select(".stop-label")
          .attr("x", p.x)
          .attr("y", p.y - (r + 6));
      });
    }

    const debouncedRender = debounce(render, 30);
    map.on("move", debouncedRender);
    map.on("zoom", debouncedRender);
    map.on("resize", debouncedRender);
    render();

    groups
      .select(".hit")
      .on("mouseenter", function () {
        d3.select(this.parentNode).classed("hovered", true);
      })
      .on("mousemove", function (event, d) {
        tooltip
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 10 + "px")
          .style("opacity", 1)
          .html(
            `<strong>Stop ${
              d.stop_id
            }</strong><br/>Avg wait: <strong>${d.wait.toFixed(1)} min</strong>`,
          );
      })
      .on("mouseleave", function () {
        tooltip.style("opacity", 0);
        d3.select(this.parentNode).classed("hovered", false);
      })
      .on("click", function (event, d) {
        event.stopPropagation();

        const rankIndex = d3.bisectLeft(waits, d.wait);
        const rank = rankIndex + 1;
        const pct = 100 * (rankIndex / (waits.length - 1));
        panelTitle.textContent = `Stop ${d.stop_id}`;
        panelWait.textContent = `${d.wait.toFixed(2)} min`;
        panelRank.textContent = `${rank} of ${waits.length}`;
        panelPct.textContent = `${pct.toFixed(1)}%`;
        panelMeter.style.width = `${pct}%`;
        openPanel();
      });

    const Legend = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd: function () {
        const div = L.DomUtil.create("div", "legend leaflet-control");
        div.innerHTML = `
              <h4>Wait time</h4>
              <div class="ramp"></div>
              <div class="labels">
                <span>${minWait.toFixed(1)}m</span>
                <span>avg ${meanWait.toFixed(1)}m</span>
                <span>${maxWait.toFixed(1)}m</span>
              </div>
              <div class="sizes">
                <div style="text-align:center;">
                  <span class="dot" style="width:${
                    baseRadius(minWait) * 2
                  }px;height:${baseRadius(minWait) * 2}px;"></span>
                  <div class="lab">${minWait.toFixed(1)}m</div>
                </div>
                <div style="text-align:center;">
                  <span class="dot" style="width:${
                    baseRadius(medianWait) * 2
                  }px;height:${baseRadius(medianWait) * 2}px;"></span>
                  <div class="lab">${medianWait.toFixed(1)}m</div>
                </div>
                <div style="text-align:center;">
                  <span class="dot" style="width:${
                    baseRadius(maxWait) * 2
                  }px;height:${baseRadius(maxWait) * 2}px;"></span>
                  <div class="lab">${maxWait.toFixed(1)}m</div>
                </div>
              </div>
            `;
        L.DomEvent.disableClickPropagation(div);
        return div;
      },
    });
    map.addControl(new Legend());
  })
  .catch((err) => {
    const el = document.getElementById("loading");
    el.textContent = "Failed to load data";
    console.error(err);
  });
