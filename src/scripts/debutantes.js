/* GERADO por tools/build-page.mjs a partir de design/debutantes.html
   Interações visuais da LP. O envio do formulário NÃO está aqui: vive em src/scripts/forms.ts. */
/* Interações visuais da LP (sem envio de formulário e sem tracking) */
(function(){
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function(v, a, b){ return Math.min(b, Math.max(a, v)); };
  var vh = function(){ return window.innerHeight; };
  var vw = function(){ return document.documentElement.clientWidth; };

  /* ---------- holofote do hero ---------- */
  var hero = $('#topo');
  if (hero && !reduz){
    var alvoX = .56, alvoY = .4, atualX = .56, atualY = .4, ultimoMovimento = -1e9, rodando = false;
    hero.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      alvoX = (e.clientX - r.left) / r.width;
      alvoY = (e.clientY - r.top) / r.height;
      ultimoMovimento = performance.now();
    });
    var luz = function(t){
      if (!rodando) return;
      if (t - ultimoMovimento > 2600){
        alvoX = .52 + Math.sin(t / 3400) * .24;
        alvoY = .4 + Math.sin(t / 2500) * .1;
      }
      atualX += (alvoX - atualX) * .055;
      atualY += (alvoY - atualY) * .055;
      hero.style.setProperty('--sx', (atualX * 100).toFixed(2) + '%');
      hero.style.setProperty('--sy', (atualY * 100).toFixed(2) + '%');
      requestAnimationFrame(luz);
    };
    var celular = window.matchMedia('(max-width: 560px)'), heroVisivel = false;
    var ligaLuz = function(){
      var deve = heroVisivel && !celular.matches;
      if (deve && !rodando){ rodando = true; requestAnimationFrame(luz); }
      if (!deve) rodando = false;
    };
    new IntersectionObserver(function(ent){ heroVisivel = ent[0].isIntersecting; ligaLuz(); }).observe(hero);
    if (celular.addEventListener) celular.addEventListener('change', ligaLuz);
  }

  /* ---------- efeitos de rolagem ---------- */
  var cabecalho = $('#cabecalho');
  var janelas = $$('.janela-fixa');
  var continua = $('[data-foto-continua]');
  var continuaFundo = continua && $('.foto-continua-fundo', continua);
  var continuaDesfoque = continua && $('.desfocada', continua);
  var continuaVeu = continua && $('.foto-continua-veu', continua);
  var continuaDepo = continua && $('#depoimentos', continua);
  var pin = $('.galeria-pin');
  var trilho = $('[data-galeria]');
  var barra = $('.galeria-progresso span');
  var modoPin = false, distancia = 0;

  function emTela(el){
    var r = el.getBoundingClientRect();
    return r.bottom > -100 && r.top < vh() + 100 ? r : null;
  }

  /* Parallax 1 e 2: a foto fica fixa via CSS (position:fixed + clip-path no bloco),
     sem mover por script, para não tremer na rolagem do celular */
  function atualizaJanela(){}

  /* Parallax 2 + Depoimentos: foto parada que desfoca e escurece quando os depoimentos sobem */
  function atualizaContinua(){
    if (!continua || reduz) return;
    var r = emTela(continua); if (!r) return;
    var h = vh();
    var d = continuaDepo.getBoundingClientRect();
    var p = clamp((h * .95 - d.top) / (h * .6), 0, 1);
    continuaDesfoque.style.opacity = p.toFixed(3);
    continuaVeu.style.opacity = (p * .72).toFixed(3);
  }

  function configuraGaleria(){
    if (!pin || !trilho) return;
    modoPin = !reduz && window.innerWidth > 900;
    pin.classList.toggle('pin-ativo', modoPin);
    if (modoPin){
      trilho.style.transform = '';
      distancia = Math.max(0, trilho.scrollWidth - vw());
      pin.style.height = (vh() + distancia * .72) + 'px';
    } else {
      pin.style.height = '';
      trilho.style.transform = '';
    }
    atualizaGaleria();
  }
  function atualizaGaleria(){
    if (!pin || !trilho) return;
    var p;
    if (modoPin){
      var r = pin.getBoundingClientRect();
      p = clamp(-r.top / Math.max(1, r.height - vh()), 0, 1);
      trilho.style.transform = 'translate3d(' + (-p * distancia).toFixed(1) + 'px,0,0)';
    } else {
      var max = trilho.scrollWidth - trilho.clientWidth;
      p = max > 0 ? trilho.scrollLeft / max : 0;
    }
    if (barra) barra.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  var pendente = false;
  function quadro(){
    pendente = false;
    if (cabecalho) cabecalho.classList.toggle('rolado', window.scrollY > 40);
    atualizaJanela();
    atualizaContinua();
    atualizaGaleria();
  }
  function pedeQuadro(){ if (!pendente){ pendente = true; requestAnimationFrame(quadro); } }
  window.addEventListener('scroll', pedeQuadro, { passive: true });
  window.addEventListener('resize', function(){ configuraGaleria(); pedeQuadro(); });
  window.addEventListener('load', function(){ configuraGaleria(); pedeQuadro(); });
  if (trilho) trilho.addEventListener('scroll', pedeQuadro, { passive: true });
  configuraGaleria();
  quadro();

  /* ---------- infraestrutura: lista que troca a foto ---------- */
  $$('[data-estrutura]').forEach(function(bloco){
    var itens = $$('.estrutura-item', bloco), fotos = $$('.estrutura-tela img', bloco);
    var comMouse = window.matchMedia('(hover: hover)');
    function ativa(i){
      itens.forEach(function(b, j){
        b.classList.toggle('ativo', i === j);
        b.setAttribute('aria-pressed', i === j ? 'true' : 'false');
      });
      fotos.forEach(function(f, j){ f.classList.toggle('ativa', i === j); });
    }
    itens.forEach(function(b, i){
      b.addEventListener('click', function(){ ativa(i); });
      b.addEventListener('focus', function(){ ativa(i); });
      b.addEventListener('mouseenter', function(){ if (comMouse.matches) ativa(i); });
    });
  });

  /* ---------- ambientes no celular: foto destaque + miniaturas ---------- */
  var ambMob = $('[data-amb-mobile]');
  if (ambMob){
    var ambFotos = $$('.amb-tela img', ambMob), ambMinis = $$('.amb-mini button', ambMob);
    var ambBento = $$('.bento .foto'), ambI = 0, ambTimer, ambVisivel = false;
    function ambMostra(n){
      ambI = (n + ambFotos.length) % ambFotos.length;
      ambFotos.forEach(function(f, j){ f.classList.toggle('ativa', j === ambI); });
      ambMinis.forEach(function(m, j){ m.classList.remove('ativa'); if (j === ambI){ void m.offsetWidth; m.classList.add('ativa'); } });
      ambAgenda();
    }
    function ambAgenda(){
      clearTimeout(ambTimer);
      if (!reduz && ambVisivel && ambMob.offsetParent !== null) ambTimer = setTimeout(function(){ ambMostra(ambI + 1); }, 5000);
    }
    ambMinis.forEach(function(m, j){ m.addEventListener('click', function(){ ambMostra(j); }); });
    /* tocar na foto grande abre a foto ampliada (mesma galeria do desktop) */
    $('.amb-tela', ambMob).addEventListener('click', function(){ if (ambBento[ambI]) ambBento[ambI].click(); });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(ent){
        ambVisivel = ent[0].isIntersecting;
        if (ambVisivel) ambMostra(ambI); else clearTimeout(ambTimer);
      }, { threshold: .3 }).observe(ambMob);
    }
  }

  /* ---------- gastronomia: pilha de fotos ---------- */
  var pilha = $('[data-pilha]');
  if (pilha){
    var cartas = $$('.gastro-carta', pilha), contPilha = $('.gastro-cont', pilha);
    var ordem = cartas.map(function(_, n){ return n; }), giros = [-4, 3, -2, 5, -5, 2];
    var timerPilha, ocupada = false, pilhaVisivel = false;
    function arrumaPilha(){
      ordem.forEach(function(idx, pos){
        var carta = cartas[idx];
        carta.style.zIndex = cartas.length - pos;
        carta.style.transform = 'translate3d(' + (pos * 10) + 'px,' + (pos * 8) + 'px,0) rotate(' + (pos === 0 ? 0 : giros[idx]) + 'deg) scale(' + (1 - pos * .03).toFixed(3) + ')';
        carta.style.opacity = pos > 3 ? 0 : 1;
        carta.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
      contPilha.textContent = ('0' + (ordem[0] + 1)).slice(-2) + ' / ' + ('0' + cartas.length).slice(-2);
    }
    function agendaPilha(){
      clearTimeout(timerPilha);
      if (!reduz && pilhaVisivel) timerPilha = setTimeout(proximaCarta, 4000);
    }
    function proximaCarta(){
      if (ocupada) return;
      ocupada = true;
      var topo = cartas[ordem[0]];
      topo.classList.add('saindo');
      setTimeout(function(){
        topo.classList.remove('saindo');
        ordem.push(ordem.shift());
        arrumaPilha();
        ocupada = false;
      }, 650);
      agendaPilha();
    }
    function cartaAnterior(){
      if (ocupada) return;
      ordem.unshift(ordem.pop());
      arrumaPilha();
      agendaPilha();
    }
    $('[data-prox]', pilha).addEventListener('click', proximaCarta);
    /* tocar na pilha também passa para a próxima foto (no celular não há setas) */
    $('.gastro-pilha', pilha).addEventListener('click', proximaCarta);
    $('[data-ant]', pilha).addEventListener('click', cartaAnterior);
    arrumaPilha();
    /* só troca sozinha enquanto a seção está na tela */
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(ent){
        pilhaVisivel = ent[0].isIntersecting;
        if (pilhaVisivel) agendaPilha(); else clearTimeout(timerPilha);
      }, { threshold: .3 }).observe(pilha);
    }
  }

  /* ---------- estrutura no celular: acordeão (um aberto por vez) ---------- */
  $$('[data-acordeao]').forEach(function(lista){
    var itensAc = $$('.ac-item', lista);
    itensAc.forEach(function(item){
      $('.ac-botao', item).addEventListener('click', function(){
        itensAc.forEach(function(outro){
          var abre = outro === item;
          outro.classList.toggle('aberto', abre);
          $('.ac-botao', outro).setAttribute('aria-expanded', abre ? 'true' : 'false');
        });
      });
    });
  });

  /* ---------- depoimentos ---------- */
  var abas = $$('.depo-nav [role="tab"]');
  function mostraDepo(i, foco){
    abas.forEach(function(a, j){
      var sel = i === j;
      a.setAttribute('aria-selected', sel ? 'true' : 'false');
      a.tabIndex = sel ? 0 : -1;
      var painel = document.getElementById(a.getAttribute('aria-controls'));
      if (painel) painel.classList.toggle('ativo', sel);
    });
    if (foco) abas[i].focus();
  }
  abas.forEach(function(a, i){
    a.addEventListener('click', function(){ mostraDepo(i); });
    a.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); mostraDepo((i + 1) % abas.length, true); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); mostraDepo((i - 1 + abas.length) % abas.length, true); }
    });
  });

  /* ---------- Galeria no celular: stories ----------
     passa sozinha só quando está na tela; toque à direita avança, à esquerda volta, segurar pausa */
  var story = $('[data-story]');
  if (story){
    var sFotos = $$('.story-foto', story), sBarras = $$('.story-barras i', story), sIdx = 0, S_DUR = 4500;
    var sGasto = 0, sUltimo = null, sVisivel = false, sPausado = false, sSegurou = false, sTimer = null;
    function sVai(i){
      sIdx = (i + sFotos.length) % sFotos.length; sGasto = 0;
      sFotos.forEach(function(f, k){
        f.classList.toggle('ativa', k === sIdx);
        if (k === sIdx){ f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
      });
      sBarras.forEach(function(b, k){ b.style.transform = 'scaleX(' + (k < sIdx ? 1 : 0) + ')'; });
      var prox = sFotos[(sIdx + 1) % sFotos.length];
      if (prox.loading === 'lazy') prox.loading = 'eager';
    }
    function sQuadro(t){
      if (sUltimo !== null && sVisivel && !sPausado && !reduz){
        sGasto += t - sUltimo;
        if (sGasto >= S_DUR) sVai(sIdx + 1);
        sBarras[sIdx].style.transform = 'scaleX(' + Math.min(sGasto / S_DUR, 1).toFixed(4) + ')';
      }
      sUltimo = t;
      requestAnimationFrame(sQuadro);
    }
    story.addEventListener('pointerdown', function(){
      sSegurou = false;
      sTimer = setTimeout(function(){ sSegurou = true; sPausado = true; story.classList.add('pausado'); }, 260);
    });
    function sSolta(){ clearTimeout(sTimer); sPausado = false; story.classList.remove('pausado'); }
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(ev){ story.addEventListener(ev, sSolta); });
    $('.story-ant', story).addEventListener('click', function(){ if (!sSegurou) sVai(sIdx - 1); });
    $('.story-prox', story).addEventListener('click', function(){ if (!sSegurou) sVai(sIdx + 1); });
    story.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ sVisivel = e.isIntersecting; }); }, {threshold:.5}).observe(story);
    } else sVisivel = true;
    sVai(0);
    requestAnimationFrame(sQuadro);
  }

  /* ---------- lightbox ---------- */
  var caixa = $('#lightbox');
  var ampliaveis = $$('[data-grupo]');
  if (caixa && ampliaveis.length){
    var caixaImg = $('img', caixa), contador = $('.lb-contador', caixa), indice = 0, grupo = [];
    function mostra(i){
      indice = (i + grupo.length) % grupo.length;
      var img = $('img', grupo[indice]);
      caixaImg.src = img.getAttribute('src');
      caixaImg.alt = img.getAttribute('alt');
      contador.textContent = (indice + 1) + ' / ' + grupo.length;
    }
    ampliaveis.forEach(function(f){
      f.addEventListener('click', function(){
        grupo = $$('[data-grupo="' + f.getAttribute('data-grupo') + '"]');
        mostra(grupo.indexOf(f));
        if (typeof caixa.showModal === 'function') caixa.showModal(); else caixa.setAttribute('open', '');
      });
    });
    $('.lb-fechar', caixa).addEventListener('click', function(){ caixa.close(); });
    $('.lb-ant', caixa).addEventListener('click', function(){ mostra(indice - 1); });
    $('.lb-prox', caixa).addEventListener('click', function(){ mostra(indice + 1); });
    caixa.addEventListener('click', function(e){ if (e.target === caixa || e.target.classList.contains('lightbox-corpo')) caixa.close(); });
    caixa.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') mostra(indice + 1);
      if (e.key === 'ArrowLeft') mostra(indice - 1);
    });
  }

})();
