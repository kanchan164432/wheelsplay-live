/* Static replacement for the Gravity Forms submit handler.
   Delivery order: FormSubmit (email to PRIMARY_EMAIL, copy to CC_EMAILS), then Web3Forms,
   then WhatsApp if both fail. */
(function () {
	var ACCESS_KEY = '85264447-85c8-4c50-b20e-038bd2fc85e4';
	var PRIMARY_EMAIL = 'spvats487@gmail.com';
	var CC_EMAILS = 'info@wheelsplay.in';
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
		var btn = f.querySelector('input[type=submit],button[type=submit]');
		if (btn) btn.disabled = true;
		notice(f, 'Sending...');
		function post(url, data) {
			return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
				.then(function (r) { return r.json(); })
				.then(function (j) { if (String(j.success) !== 'true') throw new Error(j.message || 'failed'); });
		}
		function fields(extra) { var d = extra; rows.forEach(function (r) { d[r[0]] = r[1]; }); return d; }
		post('https://formsubmit.co/ajax/' + encodeURIComponent(PRIMARY_EMAIL),
			fields({ _subject: 'WheelsPlay quote request', _template: 'table', _captcha: 'false', _cc: CC_EMAILS }))
		.catch(function () {
			return post('https://api.web3forms.com/submit',
				fields({ access_key: ACCESS_KEY, subject: 'WheelsPlay quote request', from_name: 'WheelsPlay website' }));
		}).then(function () {
			notice(f, 'Thank you! We have received your request and will contact you shortly.');
			f.reset();
		}).catch(function () { whatsapp(f, rows); })
		.then(function () { if (btn) btn.disabled = false; });
	}, true);
})();
