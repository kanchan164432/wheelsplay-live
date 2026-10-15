/* Shows blog posts from blog-data/posts.json above the original posts on the blogs page. */
(function () {
	var base = document.currentScript.src.replace(/[^\/]*$/, '');
	var host = document.getElementById('wp-new-posts');
	if (!host) return;
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	var css = '.wp-blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin:0 0 40px}' +
		'@media(max-width:1100px){.wp-blog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.wp-blog-grid{grid-template-columns:1fr}}' +
		'.wp-blog-card{display:flex;flex-direction:column;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.12);text-decoration:none;color:#111;transition:transform .3s,box-shadow .3s}' +
		'.wp-blog-card:hover{transform:translateY(-6px);box-shadow:0 10px 28px rgba(0,0,0,.22)}' +
		'.wp-blog-card .i{display:block;aspect-ratio:16/10;overflow:hidden;background:#111}.wp-blog-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}.wp-blog-card:hover img{transform:scale(1.08)}' +
		'.wp-blog-card .b{display:flex;flex-direction:column;gap:8px;padding:18px;flex:1}.wp-blog-card .c{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#e60000;font-weight:700}' +
		'.wp-blog-card .t{font-size:20px;font-weight:700;line-height:1.25}.wp-blog-card .e{font-size:14px;line-height:1.5;color:#555;flex:1}.wp-blog-card .m{font-size:13px;font-weight:700;color:#e60000;text-transform:uppercase}';
	fetch(base + 'blog-data/posts.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (posts) {
		posts.sort(function (a, b) { return b.date < a.date ? -1 : 1; });
		host.innerHTML = '<style>' + css + '</style><div class="wp-blog-grid">' + posts.map(function (p) {
			return '<a class="wp-blog-card" href="../blog-post/index.html?p=' + encodeURIComponent(p.slug) + '"><span class="i"><img loading="lazy" src="../' + esc(p.image) + '" alt="' + esc(p.title) + '"></span><span class="b"><span class="c">' + esc(p.category || 'Blog') + ' · ' + esc(p.date) + '</span><span class="t">' + esc(p.title) + '</span><span class="e">' + esc(p.excerpt || '') + '</span><span class="m">Read more &rarr;</span></span></a>';
		}).join('') + '</div>';
	}).catch(function () {});
})();
