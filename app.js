/* Creator Engine — Active Shows Overview
   Standalone version: reads/writes Firebase Firestore directly.
   No claude.ai dependency — deploy this folder anywhere (e.g. Vercel). */

(function(){
  var PRODUCER_ORDER = ["Pranav","Newel","Nilaj","Rahul"];
  var PRODUCER_VAR = {Pranav:"--p-pranav",Newel:"--p-newel",Nilaj:"--p-nilaj",Rahul:"--p-rahul"};
  var state = [];
  var db = null;
  var showsCol = null;
  var editing = false;

  var ICONS = {
    tracker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    schedule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
  };

  var MAX_IMAGE_BYTES = 700 * 1024; // keep well under Firestore's 1MiB-per-document cap

  function isActiveShow(s){ return !!(s.tracker || s.schedule || s.image); }

  function initials(name){
    var parts = (name || '').trim().split(/\s+/);
    if(!parts[0]) return '?';
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function findShow(id){
    for(var i=0;i<state.length;i++) if(state[i].id === id) return state[i];
    return null;
  }

  function docRow(show, field){
    var isTracker = field === 'tracker';
    var url = show[field];
    var label = isTracker ? 'Tracker' : 'Schedule';
    var icon = isTracker ? ICONS.tracker : ICONS.schedule;
    var cls = 'doc-row ' + (url ? 'live ' + field : 'pending');
    var sub = url ? 'Live document' : 'Yet to be made';
    var action = url ? ICONS.arrow : ICONS.plus;
    return '<button type="button" class="' + cls + '" data-show="' + show.id + '" data-field="' + field + '">' +
      '<span class="doc-icon">' + (url ? icon : ICONS.clock) + '</span>' +
      '<span class="doc-text"><span class="doc-title">' + label + '</span><span class="doc-sub">' + sub + '</span></span>' +
      '<span class="doc-action">' + action + '</span>' +
    '</button>';
  }

  function cardLogoMarkup(show){
    var logo = show.logo;
    return '<div class="card-logo" data-show="' + show.id + '" data-role="logo">' +
      (logo ? '<img src="' + logo + '" alt="">' : '') +
      '<span class="logo-edit-veil">' + (logo ? '✎' : '+') + '</span>' +
    '</div>';
  }

  function buildCard(show){
    var mediaStyle = show.image ? ' style="background-image:url(' + show.image + ')"' : '';
    var titleAttrs = editing ? ' contenteditable="true" spellcheck="false"' : '';
    return '<div class="card" data-show-card="' + show.id + '">' +
      '<div class="card-media" data-show="' + show.id + '" data-role="image"' + mediaStyle + '>' +
        (show.type === 'shorts' ? '<span class="shorts-pill">Shorts</span>' : '') +
        (show.image ? '' : '<div class="media-placeholder"><span>🎬</span><span>No image yet</span></div>') +
        '<div class="upload-hint"><span class="upload-chip">📷 ' + (show.image ? 'Change image' : 'Add banner image') + '</span></div>' +
        '<div class="card-title-row">' + cardLogoMarkup(show) +
          '<span class="card-title" data-show="' + show.id + '" data-role="title"' + titleAttrs + '>' + escapeHtml(show.name) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="doc-label">Project documents</div>' +
        docRow(show, 'tracker') +
        docRow(show, 'schedule') +
      '</div>' +
    '</div>';
  }

  function buildAddCard(producer){
    return '<button type="button" class="card add-card" data-add-for="' + producer + '">' +
      '<span class="add-card-icon">' + ICONS.plus + '</span>' +
      '<span class="add-card-label">Add a show</span>' +
    '</button>';
  }

  function renderMain(){
    var main = document.getElementById('main');
    main.innerHTML = '';
    var producers = {};
    var activeShowCount = 0;
    state.forEach(function(s){
      if(isActiveShow(s)){ producers[s.producer] = true; activeShowCount++; }
    });
    setStat('statProducers', Object.keys(producers).length);
    setStat('statShows', activeShowCount);

    PRODUCER_ORDER.forEach(function(producer){
      var shows = state.filter(function(s){ return s.producer === producer; })
        .sort(function(a,b){ return (a.order||0) - (b.order||0); });
      if(!shows.length && !editing) return;
      var activeCount = shows.filter(isActiveShow).length;
      var section = document.createElement('section');
      section.className = 'producer-group';
      section.innerHTML =
        '<div class="producer-head">' +
          '<div class="avatar" style="background:var(' + PRODUCER_VAR[producer] + ')">' + producer[0] + '</div>' +
          '<div><h2>' + producer + "'s Pod</h2><p class=\"sub\">" + activeCount + ' Active Show' + (activeCount!==1?'s':'') + '</p></div>' +
        '</div>' +
        '<hr class="producer-divider">' +
        '<div class="pod-grid">' +
          shows.map(buildCard).join('') +
          (editing ? buildAddCard(producer) : '') +
        '</div>';
      main.appendChild(section);
    });

    // Entrance animation plays on the first render only, so live Firestore
    // updates don't make every card flash in again.
    if(state.length && !document.body.classList.contains('ready')){
      document.body.classList.add('intro');
      setTimeout(function(){
        document.body.classList.remove('intro');
        document.body.classList.add('ready');
      }, 1600);
    }
  }

  function setStat(id, value){
    var el = document.getElementById(id);
    var from = parseInt(el.textContent, 10) || 0;
    if(from === value || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      el.textContent = value;
      return;
    }
    var start = null, duration = 650;
    function tick(ts){
      if(start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function openAdmin(focusId, focusField){
    editing = true;
    document.body.classList.add('editing');
    document.getElementById('adminToggle').classList.add('is-active');
    document.getElementById('adminScrim').hidden = false;
    document.getElementById('adminPanel').hidden = false;
    renderMain();
    renderAdminList();
    if(focusId){
      var target = document.getElementById((focusField === 'schedule' ? 's-' : 't-') + focusId);
      if(target){
        setTimeout(function(){ target.scrollIntoView({block:'center'}); target.focus(); }, 50);
      }
    }
  }

  function closeAdmin(){
    editing = false;
    document.body.classList.remove('editing');
    document.getElementById('adminToggle').classList.remove('is-active');
    document.getElementById('adminScrim').hidden = true;
    document.getElementById('adminPanel').hidden = true;
    renderMain();
  }

  function toggleAdmin(){
    if(document.getElementById('adminPanel').hidden) openAdmin();
    else closeAdmin();
  }

  function renderAdminList(){
    var list = document.getElementById('adminList');
    list.innerHTML = '';
    state.forEach(function(show){
      var row = document.createElement('div');
      row.className = 'admin-row';
      row.id = 'admin-row-' + show.id;
      row.innerHTML =
        '<div class="admin-row-title"><span class="avatar" style="width:20px;height:20px;font-size:9px;background:var(' + PRODUCER_VAR[show.producer] + ')">' + show.producer[0] + '</span>' + escapeHtml(show.name) + '</div>' +
        '<label for="t-' + show.id + '">Tracker link</label>' +
        '<input id="t-' + show.id + '" type="url" placeholder="Paste tracker link" value="' + (show.tracker || '') + '">' +
        '<label for="s-' + show.id + '">Schedule link</label>' +
        '<input id="s-' + show.id + '" type="url" placeholder="Paste schedule link" value="' + (show.schedule || '') + '">';
      list.appendChild(row);
    });
    document.getElementById('saveStatus').textContent = '';
  }

  async function saveLinks(){
    var statusEl = document.getElementById('saveStatus');
    statusEl.textContent = 'Saving…';
    var batch = db.batch();
    var changed = 0;
    state.forEach(function(show){
      var t = document.getElementById('t-' + show.id);
      var s = document.getElementById('s-' + show.id);
      var newTracker = t ? t.value.trim() : show.tracker;
      var newSchedule = s ? s.value.trim() : show.schedule;
      if(newTracker !== (show.tracker || '') || newSchedule !== (show.schedule || '')){
        batch.update(showsCol.doc(show.id), { tracker: newTracker, schedule: newSchedule });
        changed++;
      }
    });
    try{
      if(changed) await batch.commit();
      statusEl.textContent = 'Saved.';
    }catch(e){
      statusEl.textContent = 'Could not save — check your connection.';
    }
  }

  function readAsDataURL(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function requestImage(showId, field){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async function(){
      var file = input.files && input.files[0];
      document.body.removeChild(input);
      if(!file) return;
      if(file.size > MAX_IMAGE_BYTES){
        alert('That image is too large (' + Math.round(file.size/1024) + 'KB). Please use one under ' + Math.round(MAX_IMAGE_BYTES/1024) + 'KB — resize or compress it first.');
        return;
      }
      var dataUrl;
      try{ dataUrl = await readAsDataURL(file); }catch(e){ return; }
      try{
        var patch = {}; patch[field] = dataUrl;
        await showsCol.doc(showId).update(patch);
      }catch(e){
        alert('Could not save that image: ' + e.message);
      }
    });
    input.click();
  }

  function randomId(prefix){
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  async function addShow(producer){
    var existing = state.filter(function(s){ return s.producer === producer; });
    var maxOrder = existing.reduce(function(m,s){ return Math.max(m, s.order||0); }, 0);
    var id = randomId(producer.toLowerCase());
    await showsCol.doc(id).set({
      name: 'New Project', producer: producer, type: 'main',
      tracker: '', schedule: '', image: null, logo: null,
      order: maxOrder + 1
    });
  }

  async function renameShow(id, name){
    await showsCol.doc(id).update({ name: name });
  }

  function wireEvents(){
    document.getElementById('adminToggle').addEventListener('click', toggleAdmin);
    document.getElementById('closeAdmin').addEventListener('click', closeAdmin);
    document.getElementById('saveLinks').addEventListener('click', saveLinks);

    document.getElementById('main').addEventListener('click', function(e){
      var titleEl = e.target.closest('[data-role="title"]');
      var mediaEl = e.target.closest('[data-role="image"]');
      var logoEl = e.target.closest('[data-role="logo"]');
      var docEl = e.target.closest('.doc-row');
      var addEl = e.target.closest('.add-card');

      if(titleEl && titleEl.isContentEditable) return;
      if(addEl){ addShow(addEl.dataset.addFor); return; }
      if(editing && (mediaEl || logoEl)){
        var target = logoEl || mediaEl;
        requestImage(target.dataset.show, logoEl ? 'logo' : 'image');
        return;
      }
      if(docEl){
        var showId = docEl.dataset.show;
        var field = docEl.dataset.field;
        var show = findShow(showId);
        if(!show) return;
        if(show[field]) window.open(show[field], '_blank', 'noopener');
        else openAdmin(showId, field);
      }
    });

    document.getElementById('main').addEventListener('focusin', function(e){
      var titleEl = e.target.closest && e.target.closest('[data-role="title"]');
      if(titleEl && titleEl.isContentEditable){
        var range = document.createRange();
        range.selectNodeContents(titleEl);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    document.getElementById('main').addEventListener('keydown', function(e){
      var titleEl = e.target.closest && e.target.closest('[data-role="title"]');
      if(titleEl && titleEl.isContentEditable && e.key === 'Enter'){
        e.preventDefault();
        titleEl.blur();
      }
    });

    document.getElementById('main').addEventListener('focusout', async function(e){
      var titleEl = e.target.closest && e.target.closest('[data-role="title"]');
      if(!titleEl || !titleEl.isContentEditable) return;
      var show = findShow(titleEl.dataset.show);
      if(!show) return;
      var newName = titleEl.textContent.replace(/\s+/g, ' ').trim() || show.name || 'Untitled project';
      if(newName !== show.name) await renameShow(show.id, newName);
    });
  }

  async function seedIfEmpty(){
    var snap = await showsCol.limit(1).get();
    if(!snap.empty) return;
    var seed = window.SEED_SHOWS || [];
    var batch = db.batch();
    seed.forEach(function(show, i){
      var data = Object.assign({}, show, { order: i });
      delete data.id;
      batch.set(showsCol.doc(show.id), data);
    });
    await batch.commit();
  }

  function boot(){
    if(!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY'){
      document.getElementById('main').innerHTML =
        '<div style="max-width:520px;margin:60px auto;text-align:center;color:var(--muted);font-size:14px;line-height:1.6;">' +
        '<b style="color:var(--ink);font-size:16px;">Firebase isn\'t configured yet.</b><br><br>' +
        'Open <code>firebase-config.js</code> in this folder and paste in your Firebase project\'s config values ' +
        '(see SETUP.md for exact steps), then reload this page.</div>';
      return;
    }
    firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.firestore();
    showsCol = db.collection('shows');

    seedIfEmpty().catch(function(e){ console.error('seed failed', e); });

    showsCol.onSnapshot(function(snapshot){
      state = snapshot.docs.map(function(d){ return Object.assign({ id: d.id }, d.data()); });
      renderMain();
      if(!document.getElementById('adminPanel').hidden) renderAdminList();
    }, function(err){
      document.getElementById('main').innerHTML =
        '<div style="max-width:520px;margin:60px auto;text-align:center;color:var(--muted);font-size:14px;">' +
        'Could not connect to the database: ' + escapeHtml(err.message) +
        '<br><br>Check your Firestore rules and config in firebase-config.js.</div>';
    });

    wireEvents();
  }

  boot();
})();
