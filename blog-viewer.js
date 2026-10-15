/* Renders a single blog post from blog-data/posts.json, selected with ?p=<slug>. */
(function () {
	var base = document.currentScript.src.replace(/[^\/]*$/, '');
	var slug = new URLSearchParams(location.search).get('p');
	var title = document.getElementById('wp-post-title'), body = document.getElementById('wp-post-body'), rel = document.getElementById('wp-related');
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	fetch(base + 'blog-data/posts.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (posts) {
		var p = posts.filter(function (x) { return x.slug === slug; })[0];
		if (!p) { title.textContent = 'Post not found'; body.innerHTML = '<p>Sorry, we could not find that article. <a href="../blogs/index.html">See all blogs</a>.</p>'; return; }
		document.title = p.title + ' - WheelsPlay';
		title.textContent = p.title;
		body.innerHTML = '<p style="color:#777;font-size:14px">' + esc(p.category || 'Blog') + ' · ' + esc(p.date) + '</p>' +
			(p.image ? '<p><img src="../' + esc(p.image) + '" alt="' + esc(p.title) + '" style="width:100%;max-height:460px;object-fit:cover;border-radius:8px"></p>' : '') + p.html;
		var others = posts.filter(function (x) { return x.slug !== slug; }).sort(function (a, b) { return b.date < a.date ? -1 : 1; }).slice(0, 3);
		rel.innerHTML = '<ul>' + others.map(function (o) { return '<li><a href="index.html?p=' + encodeURIComponent(o.slug) + '">' + esc(o.title) + '</a></li>'; }).join('') + '</ul><p><a href="../blogs/index.html">All blogs &rarr;</a></p>';
	}).catch(function () { title.textContent = 'Unable to load article'; });
})();
