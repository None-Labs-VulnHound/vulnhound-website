let feedData = [];

async function loadFeed() {
  try {
    const res = await fetch('feed.json');
    const data = await res.json();
    feedData = data.items || [];
    updateStats(feedData);
    renderFeed(feedData);
  } catch (err) {
    document.getElementById('feed-container').innerHTML = `<p class="error">Failed to load live threat feed: ${err.message}</p>`;
  }
}

function updateStats(items) {
  document.getElementById('total-alerts').textContent = items.length;
  document.getElementById('critical-count').textContent = items.filter(i => i.severity === 'CRITICAL').length;
  document.getElementById('exploit-count').textContent = items.filter(i => i.has_exploit).length;
}

function renderFeed(items) {
  const container = document.getElementById('feed-container');
  if (items.length === 0) {
    container.innerHTML = '<p class="empty">No security alerts matching filter.</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const isCritical = item.severity === 'CRITICAL';
    const tagClass = isCritical ? 'tag-critical' : 'tag-high';
    const exploitTag = item.has_exploit ? '<span class="tag-pill tag-exploit">⚔️ Exploit Ready</span>' : '';

    return `
      <div class="feed-card">
        <div class="card-top">
          <span class="tag-pill ${tagClass}">${item.id} · CVSS ${item.cvss_score.toFixed(1)}</span>
          ${exploitTag}
        </div>
        <a href="${item.url}" target="_blank" class="card-title">${escapeHTML(item.title)}</a>
        <p class="card-summary">${escapeHTML(item.summary)}</p>
        <div class="card-bottom">
          <span>Type: <strong>${item.type}</strong></span>
          <a href="${item.url}" target="_blank" class="detail-link">Inspect Vulnerability →</a>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// Search and filter handling
document.getElementById('search-input').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = feedData.filter(i =>
    i.id.toLowerCase().includes(query) ||
    i.title.toLowerCase().includes(query) ||
    i.summary.toLowerCase().includes(query)
  );
  renderFeed(filtered);
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    if (filter === 'all') {
      renderFeed(feedData);
    } else if (filter === 'exploit') {
      renderFeed(feedData.filter(i => i.has_exploit));
    } else if (filter === 'critical') {
      renderFeed(feedData.filter(i => i.cvss_score >= 9.0));
    }
  });
});

loadFeed();
