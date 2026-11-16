/* ============================================================
   contact.js — Contact form: custom validation (email, optional
   phone, required fields), loading state, message saved locally.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var f = {
    name: document.getElementById('cName'),
    email: document.getElementById('cEmail'),
    phone: document.getElementById('cPhone'),
    message: document.getElementById('cMessage')
  };
  var status = document.getElementById('contactStatus');
  var submitBtn = document.getElementById('contactSubmit');

  var binding = AstroForms.bind(form, [
    { input: f.name, validator: Validators.name },
    { input: f.email, validator: Validators.email },
    { input: f.phone, validator: Validators.optional(Validators.phone) },
    { input: f.message, validator: Validators.message }
  ]);

  // Pre-fill name/email for logged-in users
  var user = window.Auth && Auth.current();
  if (user) { f.name.value = user.name; f.email.value = user.email; f.phone.value = user.phone; }

  // Live character counter
  var counter = document.getElementById('cCounter');
  f.message.addEventListener('input', function () { counter.textContent = f.message.value.length + ' / 500'; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';

    if (!binding.validateAll()) {
      status.className = 'form-status error';
      status.textContent = 'Please fix the highlighted fields.';
      return;
    }

    // Simulated network request with a loading state
    var original = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Sending…';

    setTimeout(function () {
      var inbox = Store.get('astronomad-messages', []);
      inbox.push({
        name: f.name.value.trim(), email: f.email.value.trim(),
        phone: f.phone.value.trim(), message: f.message.value.trim(),
        sent: new Date().toISOString()
      });
      Store.set('astronomad-messages', inbox);

      submitBtn.disabled = false;
      submitBtn.textContent = original;
      status.textContent = '✅ Message sent! I will reply within 24 hours.';
      showToast('Message sent successfully!', 'success');
      binding.reset();
      counter.textContent = '0 / 500';
    }, 1500);
  });
});
