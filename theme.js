// Theme picker: palette + light/dark/auto mode, remembered per browser.
// Loaded in <head> so the saved theme is applied before first paint.
(function(){
  var PALETTES = ['aurora','violet','sunset','forest','rose','graphite'];
  var root = document.documentElement;

  function read(key){ try { return localStorage.getItem(key); } catch(e){ return null; } }
  function write(key, value){ try { localStorage.setItem(key, value); } catch(e){} }

  function applyPalette(p){
    if(PALETTES.indexOf(p) < 0) p = 'aurora';
    root.setAttribute('data-palette', p);
    return p;
  }
  function applyMode(m){
    if(m === 'light' || m === 'dark') root.setAttribute('data-theme', m);
    else { root.removeAttribute('data-theme'); m = 'auto'; }
    return m;
  }

  var palette = applyPalette(read('ce-palette'));
  var mode = applyMode(read('ce-mode'));

  document.addEventListener('DOMContentLoaded', function(){
    var toggle = document.getElementById('themeToggle');
    var panel = document.getElementById('themePanel');
    if(!toggle || !panel) return;

    function syncPressed(){
      Array.prototype.forEach.call(panel.querySelectorAll('[data-palette]'), function(b){
        b.setAttribute('aria-pressed', String(b.getAttribute('data-palette') === palette));
      });
      Array.prototype.forEach.call(panel.querySelectorAll('[data-mode]'), function(b){
        b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode));
      });
    }
    function setOpen(open){
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', function(e){ e.stopPropagation(); setOpen(panel.hidden); });
    panel.addEventListener('click', function(e){
      e.stopPropagation();
      var p = e.target.closest('[data-palette]');
      var m = e.target.closest('[data-mode]');
      if(p){ palette = applyPalette(p.getAttribute('data-palette')); write('ce-palette', palette); }
      if(m){ mode = applyMode(m.getAttribute('data-mode')); write('ce-mode', mode); }
      syncPressed();
    });
    document.addEventListener('click', function(){ setOpen(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !panel.hidden){ setOpen(false); toggle.focus(); }
    });

    syncPressed();
  });
})();
