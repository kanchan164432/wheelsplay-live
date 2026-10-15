/* Static replacement for the Gravity Forms submit handler (GitHub Pages has no server).
   Each submission is sent to every channel below in parallel; it counts as sent if any one succeeds.
   - Web3Forms: delivers to the inbox bound to WEB3FORMS_KEY in the Web3Forms dashboard.
   - FormSubmit: delivers to the addresses in form-config.json (edit at /form-admin/). */
(function () {
	var WEB3FORMS_KEY = '85264447-85c8-4c50-b20e-038bd2fc85e4';
	var base = document.currentScript.src.replace(/[^\/]*$/, '');
	var configPromise = fetch(base + 'form-config.json', { cache: 'no-store' })
		.then(function (r) { return r.json(); })
		.then(function (c) { return (c.emails || []).filter(Boolean); })
		.catch(function () { return []; });

	var NAMES = [['name', 'Customer_Name'], ['phone', 'Phone_Number'], ['location', 'Service_Location'], ['model', 'Car_Model'], ['fuel', 'Fuel_Type'], ['email', 'Email'], ['message', 'Message']];

	function labelFor(f, el) {
		var l = el.id && f.querySelector('label[for="' + el.id + '"]');
		return (l ? l.textContent : el.name).replace(/\(Required\)|\*/g, '').trim();
	}
	function cleanName(label) {
		var l = label.toLowerCase();
		for (var i = 0; i < NAMES.length; i++) if (l.indexOf(NAMES[i][0]) !== -1) return NAMES[i][1];
		return label;
	}
	function collect(f) {
		var rows = [], first = '';
		f.querySelectorAll('input[name^="input_"],select[name^="input_"],textarea[name^="input_"]').forEach(function (el) {
			if (el.type === 'hidden' || el.type === 'file' || !el.value) return;
			var label = labelFor(f, el);
			if (label.toLowerCase() === 'first') { first = el.value; return; }  // first-name part of a Name field
			rows.push([cleanName(label), el.value]);
		});
		if (first) { var n = rows.filter(function (r) { return r[0] === 'Customer_Name'; })[0]; if (n) n[1] = first + ' ' + n[1]; else rows.unshift(['Customer_Name', first]); }
		return rows;
	}
	function notice(f, msg, ok) {
		var n = f.parentNode.querySelector('.static-form-msg');
		if (!n) { n = document.createElement('div'); n.className = 'static-form-msg'; f.parentNode.insertBefore(n, f); }
		n.style.cssText = 'padding:12px;margin:10px 0;border:1px solid ' + (ok === false ? '#c00' : ok ? '#2a8a2a' : '#888') + ';color:' + (ok === false ? '#c00' : 'inherit');
		n.textContent = msg;
	}
	function post(url, data) {
		return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
			.then(function (r) { return r.json(); })
			.then(function (j) { if (j.success !== true && j.success !== 'true') throw new Error(j.message || 'failed'); });
	}
	function any(promises) {
		return new Promise(function (resolve, reject) {
			var left = promises.length;
			promises.forEach(function (p) { p.then(resolve, function () { if (--left === 0) reject(new Error('all failed')); }); });
		});
	}
	function isGform(f) { return f && f.id && f.id.indexOf('gform_') === 0; }
	function missingRequired(f) {
		var bad = null;
		f.querySelectorAll('.gfield_contains_required input[name^="input_"],.gfield_contains_required select[name^="input_"],.gfield_contains_required textarea[name^="input_"]').forEach(function (el) {
			if (!bad && el.type !== 'hidden' && !el.value.trim()) bad = el;
		});
		return bad;
	}
	function send(f) {
		var rows = collect(f), btn = f.querySelector('input[type=submit],button[type=submit]');
		if (btn) btn.disabled = true;
		notice(f, 'Sending...');
		var fields = function (d) { rows.forEach(function (r) { d[r[0]] = r[1]; }); return d; };
		configPromise.then(function (emails) {
			var jobs = [post('https://api.web3forms.com/submit', fields({ access_key: WEB3FORMS_KEY, subject: 'WheelsPlay quote request', from_name: 'WheelsPlay website' }))];
			if (emails.length) {
				var d = { _subject: 'WheelsPlay quote request', _template: 'table', _captcha: 'false' };
				if (emails.length > 1) d._cc = emails.slice(1).join(',');
				jobs.push(post('https://formsubmit.co/ajax/' + encodeURIComponent(emails[0]), fields(d)));
			}
			return any(jobs);
		}).then(function () {
			notice(f, 'Thank you! We have received your request and will contact you shortly.', true);
			f.reset();
		}).catch(function () {
			notice(f, 'Sorry, your request could not be sent. Please try again or call 9430965064.', false);
		}).then(function () { if (btn) btn.disabled = false; });
	}
	// Never let these forms POST to the static host (it answers 405).
	var nativeSubmit = HTMLFormElement.prototype.submit;
	HTMLFormElement.prototype.submit = function () {
		if (isGform(this)) { send(this); return; }
		return nativeSubmit.apply(this, arguments);
	};
	// Gravity Forms' own button handler calls form.submit() directly, so intercept the click too.
	document.addEventListener('click', function (e) {
		var b = e.target.closest && e.target.closest('input[type=submit],button[type=submit]');
		var f = b && b.form;
		if (!isGform(f)) return;
		e.preventDefault(); e.stopImmediatePropagation();
		var bad = missingRequired(f);
		if (bad) { notice(f, 'Please fill in all required fields.', false); bad.focus(); return; }
		send(f);
	}, true);
	document.addEventListener('submit', function (e) {
		if (!isGform(e.target)) return;
		e.preventDefault(); e.stopImmediatePropagation();
		send(e.target);
	}, true);
})();
