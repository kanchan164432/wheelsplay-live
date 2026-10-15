/* Static replacement for the Gravity Forms submit handler.
   - Set WEB3FORMS_KEY (free key from https://web3forms.com) to deliver submissions by email.
   - With no key, the enquiry is handed over to WhatsApp so no lead is lost. */
(function () {
	var WEB3FORMS_KEY = '';
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
		var rows = collect(f);
		if (WEB3FORMS_KEY) {
			var data = { access_key: WEB3FORMS_KEY, subject: 'WheelsPlay quote request' };
			rows.forEach(function (r) { data[r[0]] = r[1]; });
			fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
				.then(function (r) { return r.json(); })
				.then(function (j) { notice(f, j.success ? 'Thank you! We will contact you shortly.' : 'Could not send. Please call 9430965064.'); if (j.success) f.reset(); })
				.catch(function () { notice(f, 'Could not send. Please call 9430965064.'); });
		} else {
			var text = 'Quote request from website:\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
			window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
			notice(f, 'Opening WhatsApp to send your request. You can also call 9430965064.');
		}
	}, true);
})();
