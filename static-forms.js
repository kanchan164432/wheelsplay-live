/* Static replacement for the Gravity Forms submit handler.
   GitHub Pages has no server, so the enquiry is sent to WhatsApp with the details pre-filled. */
(function () {
	var WHATSAPP_NUMBER = '919430965064';

	function labelFor(f, el) {
		var l = el.id && f.querySelector('label[for="' + el.id + '"]');
		return (l ? l.textContent : el.name).replace(/\(Required\)|\*/g, '').trim();
	}
	function collect(f) {
		var rows = [];
		f.querySelectorAll('input[name^="input_"],select[name^="input_"],textarea[name^="input_"]').forEach(function (el) {
			if (el.type === 'hidden' || el.type === 'file' || !el.value) return;
			rows.push([labelFor(f, el), el.value]);
		});
		return rows;
	}
	function notice(f, msg) {
		var n = f.parentNode.querySelector('.static-form-msg');
		if (!n) { n = document.createElement('div'); n.className = 'static-form-msg'; n.style.cssText = 'padding:12px;margin:10px 0;border:1px solid #888'; f.parentNode.insertBefore(n, f); }
		n.textContent = msg;
	}
	document.addEventListener('submit', function (e) {
		var f = e.target;
		if (!f.id || f.id.indexOf('gform_') !== 0) return;
		e.preventDefault(); e.stopImmediatePropagation();
		var text = 'Quote request from website:\n' + collect(f).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
		window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
		notice(f, 'Opening WhatsApp to send your request. You can also call 9430965064.');
	}, true);
})();
