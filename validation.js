/* ============================================================
   validation.js — reusable form validation (no HTML5 attributes).
   Every validator returns an error message string, or '' when OK.
   Forms use <form novalidate>; errors are shown inline on the page.
   ============================================================ */
(function () {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var Validators = {
    required: function (label) {
      return function (value) {
        return value.trim() === '' ? label + ' is required.' : '';
      };
    },

    name: function (value) {
      var v = value.trim();
      if (v === '') return 'Full name is required.';
      if (v.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[A-Za-zА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ' -]+$/.test(v)) return 'Name can contain letters only.';
      return '';
    },

    email: function (value) {
      var v = value.trim();
      if (v === '') return 'Email is required.';
      if (!EMAIL_RE.test(v)) return 'Enter a valid email, e.g. name@example.com.';
      return '';
    },

    // Password: 8+ chars, upper + lower case letter, digit
    password: function (value) {
      if (value === '') return 'Password is required.';
      if (value.length < 8) return 'Use at least 8 characters.';
      if (!/[a-z]/.test(value)) return 'Add a lowercase letter.';
      if (!/[A-Z]/.test(value)) return 'Add an uppercase letter.';
      if (!/\d/.test(value)) return 'Add a number.';
      return '';
    },

    // Kazakhstan / Russia style number: +7 777 123 45 67 or 8 777 123 45 67
    phone: function (value) {
      var v = value.trim();
      if (v === '') return 'Phone number is required.';
      if (!/^\+?[\d\s\-()]+$/.test(v)) return 'Phone can contain digits, spaces, + - ( ) only.';
      var digits = v.replace(/\D/g, '');
      if (digits.length !== 11 || (digits[0] !== '7' && digits[0] !== '8')) {
        return 'Use format +7 777 123 45 67 (11 digits).';
      }
      return '';
    },

    // Optional field: only validated when something is typed
    optional: function (validator) {
      return function (value) {
        return value.trim() === '' ? '' : validator(value);
      };
    },

    message: function (value) {
      var v = value.trim();
      if (v === '') return 'Message is required.';
      if (v.length < 10) return 'Message must be at least 10 characters.';
      return '';
    },

    match: function (getOther) {
      return function (value) {
        if (value === '') return 'Please confirm your password.';
        return value !== getOther() ? 'Passwords do not match.' : '';
      };
    }
  };

  /** Strength score 0-4 used by the password meter */
  function passwordStrength(value) {
    var score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  /**
   * Binds validation rules to a form.
   * rules: [{ input: <element>, validator: fn }]  (error element = #<input.id>Error)
   * Returns { validateAll, reset }.
   */
  function bindForm(form, rules) {
    function showError(rule, message) {
      var field = rule.input.closest('.field');
      var errEl = document.getElementById(rule.input.id + 'Error');
      if (errEl) errEl.textContent = message;
      if (field) {
        field.classList.toggle('invalid', message !== '');
        field.classList.toggle('valid', message === '' && rule.input.value.trim() !== '');
      }
      rule.input.setAttribute('aria-invalid', message !== '' ? 'true' : 'false');
    }

    function validateRule(rule) {
      var message = rule.validator(rule.input.value);
      showError(rule, message);
      return message === '';
    }

    rules.forEach(function (rule) {
      rule.touched = false;
      rule.input.addEventListener('blur', function () { rule.touched = true; validateRule(rule); });
      rule.input.addEventListener('input', function () { if (rule.touched) validateRule(rule); });
    });

    return {
      // Validates everything; focuses the first invalid field
      validateAll: function () {
        var firstBad = null;
        var allOk = true;
        rules.forEach(function (rule) {
          rule.touched = true;
          if (!validateRule(rule)) {
            allOk = false;
            if (!firstBad) firstBad = rule.input;
          }
        });
        if (firstBad) firstBad.focus();
        return allOk;
      },
      reset: function () {
        form.reset();
        rules.forEach(function (rule) {
          rule.touched = false;
          showError(rule, '');
          var field = rule.input.closest('.field');
          if (field) field.classList.remove('valid');
        });
      }
    };
  }

  window.Validators = Validators;
  window.AstroForms = { bind: bindForm, passwordStrength: passwordStrength };
})();
