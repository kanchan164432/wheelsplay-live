/* Static replacement for the Gravity Forms submit handler.
   Emails are sent through FormSubmit to the recipients listed in form-config.json
   (edit them at /form-admin/). If sending fails, the enquiry falls back to WhatsApp. */
(function () {
	var WHATSAPP_NUMBER = '919430965064';
	var base = document.currentScript.src.replace(/[^\/]*$/, '');
	var configPromise = fetch(base + 'form-config.json', { cache: 'no-store' })
		.then(function (r) { return r.json(); })
		.then(function (c) { return (c.emails || []).filter(Boolean); })
		.catch(function () { return []; });

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
	function whatsapp(f, rows) {
		var text = 'Quote request from website:\n' + rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
		window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
		notice(f, 'We could not send your request by email, so WhatsApp is opening instead. You can also call 9430965064.');
	}
	document.addEventListener('submit', function (e) {
		var f = e.target;
		if (!f.id || f.id.indexOf('gform_') !== 0) return;
		e.preventDefault(); e.stopImmediatePropagation();
		var rows = collect(f);
		notice(f, 'Sending...');
		configPromise.then(function (emails) {
			if (!emails.length) throw new Error('no recipients');
			var data = { _subject: 'WheelsPlay quote request', _template: 'table', _captcha: 'false' };
			if (emails.length > 1) data._cc = emails.slice(1).join(',');
			rows.forEach(function (r) { data[r[0]] = r[1]; });
			return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(emails[0]), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify(data)
			});
		}).then(function (r) { return r.json(); }).then(function (j) {
			if (String(j.success) !== 'true') throw new Error(j.message || 'failed');
			notice(f, 'Thank you! We have received your request and will contact you shortly.');
			f.reset();
		}).catch(function () { whatsapp(f, rows); });
	}, true);
})();
