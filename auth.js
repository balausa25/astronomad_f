/* ============================================================
   auth.js — authentication SIMULATION with localStorage.
   (No backend: passwords are stored as plain text purely for the
   assignment. A real site must hash passwords on a server.)

   Keys:  astronomad_users    -> array of { name, email, phone, password, created }
          astronomad_session  -> email of the logged-in user
   ============================================================ */
(function () {
  var USERS_KEY = 'astronomad_users';
  var SESSION_KEY = 'astronomad_session';

  var Auth = {
    users: function () { return Store.get(USERS_KEY, []); },

    findByEmail: function (email) {
      var target = email.trim().toLowerCase();
      return this.users().find(function (u) { return u.email.toLowerCase() === target; }) || null;
    },

    current: function () {
      var email = Store.get(SESSION_KEY, null);
      return email ? this.findByEmail(email) : null;
    },

    signup: function (data) {
      if (this.findByEmail(data.email)) {
        return { ok: false, field: 'regEmail', message: 'An account with this email already exists.' };
      }
      var users = this.users();
      users.push({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        created: new Date().toISOString()
      });
      Store.set(USERS_KEY, users);
      return { ok: true };
    },

    login: function (email, password) {
      var user = this.findByEmail(email);
      if (!user) return { ok: false, field: 'loginEmail', message: 'No account found with this email.' };
      if (user.password !== password) return { ok: false, field: 'loginPassword', message: 'Incorrect password.' };
      Store.set(SESSION_KEY, user.email);
      return { ok: true, user: user };
    },

    logout: function () { Store.remove(SESSION_KEY); },

    deleteAccount: function () {
      var me = this.current();
      if (!me) return;
      Store.set(USERS_KEY, this.users().filter(function (u) { return u.email !== me.email; }));
      this.logout();
    }
  };
  window.Auth = Auth;

  document.addEventListener('DOMContentLoaded', function () {
    var user = Auth.current();

    /* ---------- Navbar: Login <-> user name ---------- */
    var authLink = document.getElementById('authLink');
    if (authLink) {
      if (user) {
        authLink.href = 'profile.html';
        authLink.textContent = '👨‍🚀 ' + user.name.split(' ')[0];
      } else {
        authLink.href = 'login.html';
        authLink.textContent = '🔐 Login';
      }
    }

    /* ---------- login.html ---------- */
    var signupForm = document.getElementById('signupForm');
    var loginForm = document.getElementById('loginForm');
    if (signupForm && loginForm) initAuthPage(user);

    /* ---------- profile.html ---------- */
    if (document.getElementById('profileRoot')) initProfilePage(user);
  });

  /* ======================================================== */
  function initAuthPage(user) {
    // Already logged in -> go straight to the profile
    if (user) { window.location.replace('profile.html'); return; }

    var signupForm = document.getElementById('signupForm');
    var loginForm = document.getElementById('loginForm');
    var tabSignup = document.getElementById('tabSignup');
    var tabLogin = document.getElementById('tabLogin');

    function showTab(which) {
      var isLogin = which === 'login';
      loginForm.classList.toggle('hidden', !isLogin);
      signupForm.classList.toggle('hidden', isLogin);
      tabLogin.classList.toggle('active', isLogin);
      tabSignup.classList.toggle('active', !isLogin);
      tabLogin.setAttribute('aria-selected', isLogin);
      tabSignup.setAttribute('aria-selected', !isLogin);
    }
    tabSignup.addEventListener('click', function () { showTab('signup'); });
    tabLogin.addEventListener('click', function () { showTab('login'); });
    if (window.location.hash === '#login') showTab('login');

    /* --- Sign up --- */
    var f = {
      name: document.getElementById('regName'),
      email: document.getElementById('regEmail'),
      phone: document.getElementById('regPhone'),
      pass: document.getElementById('regPassword'),
      confirm: document.getElementById('regConfirm')
    };
    var signupBinding = AstroForms.bind(signupForm, [
      { input: f.name, validator: Validators.name },
      { input: f.email, validator: Validators.email },
      { input: f.phone, validator: Validators.phone },
      { input: f.pass, validator: Validators.password },
      { input: f.confirm, validator: Validators.match(function () { return f.pass.value; }) }
    ]);

    // Password strength meter
    var meter = document.querySelector('#signupForm .strength span');
    var colors = ['#ef4444', '#ef4444', '#f59e0b', '#84cc16', '#22c55e'];
    f.pass.addEventListener('input', function () {
      var score = AstroForms.passwordStrength(f.pass.value);
      meter.style.width = (f.pass.value ? score * 25 : 0) + '%';
      meter.style.background = colors[score];
    });

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('signupStatus');
      status.textContent = '';
      if (!signupBinding.validateAll()) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'form-status error'; return; }

      var result = Auth.signup({
        name: f.name.value, email: f.email.value, phone: f.phone.value, password: f.pass.value
      });
      if (!result.ok) {
        document.getElementById('regEmailError').textContent = result.message;
        f.email.closest('.field').classList.add('invalid');
        f.email.focus();
        return;
      }
      var email = f.email.value.trim();
      signupBinding.reset();
      meter.style.width = '0';
      showToast('Account created! Please log in.', 'success');
      showTab('login');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').focus();
    });

    /* --- Log in --- */
    var lEmail = document.getElementById('loginEmail');
    var lPass = document.getElementById('loginPassword');
    var loginBinding = AstroForms.bind(loginForm, [
      { input: lEmail, validator: Validators.email },
      { input: lPass, validator: Validators.required('Password') }
    ]);

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('loginStatus');
      status.textContent = '';
      if (!loginBinding.validateAll()) return;

      var result = Auth.login(lEmail.value, lPass.value);
      if (!result.ok) {
        var errEl = document.getElementById(result.field + 'Error');
        errEl.textContent = result.message;
        document.getElementById(result.field).closest('.field').classList.add('invalid');
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Welcome back, ' + result.user.name.split(' ')[0] + '! Redirecting…';
      setTimeout(function () { window.location.href = 'profile.html'; }, 700);
    });

    // Show / hide password buttons
    document.querySelectorAll('.pw-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.dataset.target);
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? '🙈' : '👁️';
      });
    });
  }

  /* ======================================================== */
  function initProfilePage(user) {
    // Guard: profile is for logged-in users only
    if (!user) { window.location.replace('login.html#login'); return; }

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('detailName').textContent = user.name;
    document.getElementById('detailEmail').textContent = user.email;
    document.getElementById('detailPhone').textContent = user.phone;
    document.getElementById('detailJoined').textContent =
      new Date(user.created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('detailTheme').textContent =
      window.AstroTheme.get() === 'dark' ? 'Dark' : 'Light';

    // Saved planets (added on the Planets page)
    var list = document.getElementById('favList');
    var empty = document.getElementById('favEmpty');
    function renderFavs() {
      var favs = Store.get('astronomad-favorites', []);
      list.innerHTML = '';
      empty.classList.toggle('hidden', favs.length > 0);
      favs.forEach(function (name) {
        var li = document.createElement('li');
        var span = document.createElement('span');
        span.textContent = '🪐 ' + name;
        var btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.addEventListener('click', function () {
          Store.set('astronomad-favorites', Store.get('astronomad-favorites', []).filter(function (n) { return n !== name; }));
          renderFavs();
        });
        li.appendChild(span);
        li.appendChild(btn);
        list.appendChild(li);
      });
      document.getElementById('statFavs').textContent = favs.length;
    }
    renderFavs();

    // Last saved searches
    var lastPlanet = Store.get('astronomad-planet-search', null);
    var lastGallery = Store.get('astronomad-gallery-search', null);
    document.getElementById('detailPlanetSearch').textContent = (lastPlanet && lastPlanet.query) || '—';
    document.getElementById('detailGallerySearch').textContent = lastGallery || '—';

    document.getElementById('logoutBtn').addEventListener('click', function () {
      Auth.logout();
      window.location.href = 'index.html';
    });
    document.getElementById('deleteBtn').addEventListener('click', function () {
      if (window.confirm('Delete your account? This cannot be undone.')) {
        Auth.deleteAccount();
        window.location.href = 'index.html';
      }
    });
  }
})();
