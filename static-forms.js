/* Static replacement for the Gravity Forms submit handler.
   Emails are sent through FormSubmit to the recipients listed in form-config.json
   (edit them at /form-admin/). */
(function () {
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
	// Never let these forms POST to the static host (it answers 405).
	var nativeSubmit = HTMLFormElement.prototype.submit;
	HTMLFormElement.prototype.submit = function () {
		if (isGform(this)) { send(this); return; }
		return nativeSubmit.apply(this, arguments);
	};
	function isGform(f) { return f && f.id && f.id.indexOf('gform_') === 0; }
	function missingRequired(f) {
		var bad = null;
		f.querySelectorAll('.gfield_contains_required input[name^="input_"],.gfield_contains_required select[name^="input_"],.gfield_contains_required textarea[name^="input_"]').forEach(function (el) {
			if (!bad && el.type !== 'hidden' && !el.value.trim()) bad = el;
		});
		return bad;
	}
	// Gravity Forms' own button handler calls form.submit() directly, so intercept the click too.
	document.addEventListener('click', function (e) {
		var b = e.target.closest && e.target.closest('input[type=submit],button[type=submit]');
		var f = b && b.form;
		if (!isGform(f)) return;
		e.preventDefault(); e.stopImmediatePropagation();
		var bad = missingRequired(f);
		if (bad) { notice(f, 'Please fill in all required fields.'); bad.focus(); return; }
		send(f);
	}, true);
	document.addEventListener('submit', function (e) {
		if (!isGform(e.target)) return;
		e.preventDefault(); e.stopImmediatePropagation();
		send(e.target);
	}, true);
	function send(f) {
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
		}).catch(function () { notice(f, 'Sorry, your request could not be sent. Please try again or call 9430965064.'); });
	}
})();
