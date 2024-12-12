const internalLinks = new Set();
const externalLinks = new Set();

function startCrawling() {
  const url = document.getElementById("urlInput").value;
  const depth = parseInt(document.getElementById("depthInput").value);

  if (!url || isNaN(depth)) {
    alert("Please enter a valid URL and depth level.");
    return;
  }

  clearPreviousResults();
  crawl(url, depth).then(() => {
    displayResults();
    drawChart();
  });
}

async function crawl(url, depth, visited = new Set()) {
  if (depth === 0 || visited.has(url)) return;

  visited.add(url);

  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    const anchors = doc.querySelectorAll("a");
    anchors.forEach((anchor) => {
      const href = anchor.href;
      if (!href) return;

      if (href.startsWith(url) || href.startsWith("/")) {
        internalLinks.add(href.startsWith("/") ? new URL(href, url).href : href);
      } else {
        externalLinks.add(href);
      }
    });

    if (depth > 1) {
      for (let link of internalLinks) {
        await crawl(link, depth - 1, visited);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
  }
}

function displayResults() {
  const internalList = document.getElementById("internalLinks");
  internalLinks.forEach((link) => {
    const li = document.createElement("li");
    li.textContent = link;
    internalList.appendChild(li);
  });

  const externalList = document.getElementById("externalLinks");
  externalLinks.forEach((link) => {
    const li = document.createElement("li");
    li.textContent = link;
    externalList.appendChild(li);
  });

  document.getElementById("contentSummary").textContent = 
    `Total Internal Links: ${internalLinks.size}, Total External Links: ${externalLinks.size}`;
}

function clearPreviousResults() {
  document.getElementById("internalLinks").innerHTML = "";
  document.getElementById("externalLinks").innerHTML = "";
  document.getElementById("contentSummary").textContent = "";
  internalLinks.clear();
  externalLinks.clear();
}

function drawChart() {
  const ctx = document.getElementById("linkChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Internal Links", "External Links"],
      datasets: [{
        data: [internalLinks.size, externalLinks.size],
        backgroundColor: ["#4CAF50", "#FF5722"],
      }]
    },
    options: {
      responsive: true,
    }
  });
}

function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,Type,URL\n";
  internalLinks.forEach(link => {
    csvContent += `Internal,${link}\n`;
  });
  externalLinks.forEach(link => {
    csvContent += `External,${link}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "weblink_analysis.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
