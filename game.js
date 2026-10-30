(() => {
  const TOTAL = 10;
  const NAMES = {comb:["⛽ Combustible","b-comb"], ener:["⚡ Energía","b-ener"], mor:["💚 Moral","b-mor"]};
  const EVENTS = [
    {t:"Un barco pide auxilio",x:"La radio crepita: un pesquero a la deriva ve tu luz como única guía.",
     o:[["Encender el reflector a máxima potencia",{comb:-2,ener:-1,mor:2},"El barco te ve y llega a salvo. La tripulación saluda desde cubierta."],
        ["Mantener la luz normal y guiarlos por radio",{ener:-1,mor:1},"Llegan con algo de dificultad, pero llegan."],
        ["Ignorar la llamada",{mor:-3},"El silencio de la radio te pesa toda la noche."]]},
    {t:"Falla el generador",x:"Un chispazo y las luces del cuarto se apagan. El motor tose.",
     o:[["Repararlo en plena tormenta",{ener:2,mor:-1},"Te empapas, pero el motor vuelve a rugir."],
        ["Usar las baterías de respaldo",{ener:-2,comb:1},"Ganas tiempo, pero las baterías quedan casi vacías."],
        ["Esperar a que se arregle solo",{ener:-3},"No se arregla solo. Qué sorpresa."]]},
    {t:"Una ola golpea la base",x:"El agua sube por la escalera y se filtra en el depósito.",
     o:[["Sellar la grieta con lo que haya",{comb:-1,mor:1},"Lo logras, aunque pierdes algo de combustible."],
        ["Mover el combustible al piso alto",{ener:-1,comb:1},"Cargar tanques cansa, pero se salvan."],
        ["Dejar que el agua baje sola",{comb:-3,ener:-1},"El agua arruina buena parte de las reservas."]]},
    {t:"Un visitante misterioso",x:"Alguien golpea la puerta empapado. Dice ser náufrago, pero evita tu mirada.",
     o:[["Dejarlo entrar y darle de comer",{comb:-1,mor:2},"Resulta ser un viejo marino. Te cuenta historias hasta que se seca."],
        ["Darle una manta por la ventana",{mor:0,ener:-1},"Se va agradecido, o eso crees."],
        ["Cerrar con llave",{mor:-2},"Escuchas pasos alejarse. Dudas de tu decisión."]]},
    {t:"Se escucha un ruido en la lámpara",x:"El mecanismo rotatorio chirría y la luz se vuelve irregular.",
     o:[["Engrasar el mecanismo",{comb:-1,ener:1},"Vuelve a girar suave y constante."],
        ["Girarlo a mano un rato",{mor:-1,ener:2},"Brazos cansados, pero la luz brilla."],
        ["Apagar y esperar",{ener:-2,mor:-1},"La oscuridad en el mar te inquieta."]]},
    {t:"Llega un mensaje de casa",x:"La radio trae la voz de tu familia, entre estática: preguntan si estás bien.",
     o:[["Responder y tranquilizarlos",{ener:-1,mor:3},"Se te alivia el pecho. Puedes seguir."],
        ["Mensaje corto para ahorrar batería",{mor:1},"Algo es algo."],
        ["No responder",{mor:-2},"Te quedas mirando la radio un buen rato."]]},
    {t:"Un rayo cae cerca",x:"El estruendo sacude la torre. Saltan chispas en el tablero.",
     o:[["Desconectar todo y reiniciar",{ener:-2,mor:1},"Pierdes energía, pero evitas un incendio."],
        ["Apagar las chispas con un extintor",{comb:-1,mor:1},"Susto grande, daño pequeño."],
        ["Mirar y rezar",{ener:-2,comb:-1},"Algo se quemó. Algo importante."]]},
    {t:"Se acaba el café",x:"Llevas horas despierto y el termo está vacío.",
     o:[["Calentar agua con el combustible",{comb:-1,mor:2},"Un té caliente hace milagros."],
        ["Aguantar sin nada",{mor:-1},"Los ojos pesan cada vez más."],
        ["Dormir 15 minutos",{ener:-1,mor:1},"Despiertas renovado, con la luz aún encendida."]]},
    {t:"Una gaviota entra por la ventana",x:"Aletea desesperada por la sala de máquinas, tirando papeles.",
     o:[["Atraparla con cuidado",{mor:2,ener:-1},"La sueltas al cielo. Te sientes mejor."],
        ["Dejarla estar",{mor:1},"Se acomoda en una repisa, resignada."],
        ["Perseguirla con una escoba",{ener:-1,mor:-1},"Se rompe un panel solar de repuesto."]]},
    {t:"La tormenta arrecia",x:"Es la hora más oscura. El viento aúlla y el faro tiembla.",
     o:[["Reforzar las ventanas",{comb:-1,ener:-1,mor:2},"Aguantas el golpe del viento."],
        ["Encender todas las luces",{comb:-2,ener:-2,mor:2},"El faro brilla como nunca. Cuesta caro."],
        ["Esperar con calma",{mor:-1,comb:-1},"El viento no perdona."]]}
  ];

  const $ = id => document.getElementById(id);
  let state, queue, hour, locked;
  const BEST_KEY = "faro_best";

  // Lluvia
  const rain = $("rain");
  for (let i = 0; i < 60; i++) {
    const d = document.createElement("div");
    d.className = "drop";
    d.style.left = Math.random() * 100 + "%";
    d.style.animationDuration = (0.5 + Math.random() * 0.7) + "s";
    d.style.animationDelay = (-Math.random() * 2) + "s";
    rain.appendChild(d);
  }

  // Sonido con Web Audio (sin archivos externos)
  let ctx, muted = false;
  try { muted = localStorage.getItem("faro_muted") === "1"; } catch {}
  function audio() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = "sine", vol = 0.15, delay = 0) {
    const c = muted ? null : audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
  }
  function rumble() {
    const c = muted ? null : audio(); if (!c) return;
    const len = c.sampleRate * 1.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "lowpass"; f.frequency.value = 220; g.gain.value = 0.5;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  function thunder() {
    const f = $("flash");
    f.classList.remove("on"); void f.offsetWidth; f.classList.add("on");
    setTimeout(rumble, 250);
  }
  const sfx = {
    click: () => tone(520, 0.12, "triangle"),
    good: () => { tone(660, 0.15, "triangle", 0.12); tone(880, 0.2, "triangle", 0.12, 0.1); },
    bad: () => tone(160, 0.35, "sawtooth", 0.1),
    win: () => [523, 659, 784, 1047].forEach((n, i) => tone(n, 0.5, "triangle", 0.13, i * 0.15)),
    lose: () => [330, 262, 196].forEach((n, i) => tone(n, 0.6, "sawtooth", 0.1, i * 0.25))
  };
  const muteBtn = $("btn-mute");
  function paintMute() { muteBtn.textContent = muted ? "🔇" : "🔊"; muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar"); }
  muteBtn.onclick = () => {
    muted = !muted;
    try { localStorage.setItem("faro_muted", muted ? "1" : "0"); } catch {}
    paintMute(); sfx.click();
  };
  paintMute();

  function getBest() { try { return parseInt(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } }
  function setBest(v) { try { localStorage.setItem(BEST_KEY, v); } catch {} }
  function showBest() {
    const b = getBest();
    $("best").textContent = b ? "Mejor puntaje: " + b : "";
  }

  function show(id) { ["start","game","end"].forEach(s => $(s).classList.toggle("hidden", s !== id)); }

  function renderStats() {
    $("stats").innerHTML = Object.entries(NAMES).map(([k,[label,id]]) => {
      const v = Math.max(0, Math.min(10, state[k]));
      return `<div class="stat ${v<=2?"low":""}"><span>${label}</span>
        <div class="bar"><div class="fill" id="${id}" style="width:${v*10}%"></div></div><span>${v}</span></div>`;
    }).join("");
    $("progress").innerHTML = Array.from({length:TOTAL},(_,i)=>`<i class="${i<hour-1?"done":""}"></i>`).join("");
  }

  function startGame() {
    state = {comb:6, ener:6, mor:6};
    queue = [...EVENTS].sort(() => Math.random() - 0.5);
    hour = 1;
    document.body.classList.remove("dawn");
    show("game");
    nextEvent();
  }

  function nextEvent() {
    locked = false;
    renderStats();
    const ev = queue[hour - 1];
    const clock = (22 + hour) % 24;
    $("hour").textContent = `Hora ${hour} de ${TOTAL} · ${String(clock).padStart(2,"0")}:00`;
    $("title").textContent = ev.t;
    $("text").textContent = ev.x;
    $("result").classList.add("hidden");
    $("btn-next").classList.add("hidden");
    const box = $("options");
    box.innerHTML = "";
    ev.o.forEach(([label, fx, msg]) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = () => choose(fx, msg);
      box.appendChild(b);
    });
    if (Math.random() < 0.5) thunder();
  }

  function fxText(fx) {
    const sign = n => (n > 0 ? "+" : "") + n;
    return Object.entries(fx).filter(([,v]) => v).map(([k,v]) => `${NAMES[k][0]} ${sign(v)}`).join(" · ");
  }

  function choose(fx, msg) {
    if (locked) return;
    locked = true;
    Object.entries(fx).forEach(([k,v]) => state[k] = Math.min(10, state[k] + v));
    Object.values(fx).reduce((a, b) => a + b, 0) >= 0 ? sfx.good() : sfx.bad();
    renderStats();
    $("options").querySelectorAll("button").forEach(b => b.disabled = true);
    const r = $("result");
    r.innerHTML = `${msg}<br><small>${fxText(fx) || "Sin cambios"}</small>`;
    r.classList.remove("hidden");
    const nb = $("btn-next");
    nb.classList.remove("hidden");
    const lost = Object.values(state).some(v => v <= 0);
    nb.textContent = lost ? "Ver resultado" : (hour === TOTAL ? "Esperar el amanecer" : "Continuar");
    nb.focus();
    nb.onclick = () => lost ? finish(false) : (hour === TOTAL ? finish(true) : (hour++, nextEvent()));
  }

  function finish(win) {
    const score = win ? (state.comb + state.ener + state.mor) * 10 : (hour - 1) * 5;
    const best = getBest();
    if (score > best) setBest(score);
    document.body.classList.toggle("dawn", win);
    show("end");
    if (win) {
      const total = state.comb + state.ener + state.mor;
      let ending;
      if (state.comb >= 7 && state.ener >= 7 && state.mor >= 7)
        ending = ["🏆", "Leyenda del faro", "No solo sobreviviste: el faro brilló más fuerte que nunca. En el puerto ya cuentan tu historia."];
      else if (state.mor >= state.comb && state.mor >= state.ener && state.mor >= 7)
        ending = ["💚", "El guardián querido", "Tu calidez salvó a más gente que la luz. Los marineros te dejan cartas de agradecimiento."];
      else if (state.ener >= state.comb && state.ener >= state.mor && state.ener >= 7)
        ending = ["⚡", "El ingeniero", "Tu maquinaria quedó impecable. El faro podría aguantar otra tormenta igual."];
      else if (total <= 9)
        ending = ["😮‍💨", "Por un pelo", "Amaneciste con el tanque vacío y las manos temblando. Pero amaneciste."];
      else
        ending = ["🌅", "¡Amaneció!", "Resististe la noche y el faro sigue en pie."];
      $("end-icon").textContent = ending[0];
      $("end-title").textContent = ending[1];
      sfx.win();
      $("end-text").innerHTML = `${ending[2]}<br>Puntaje: <b>${score}</b>` +
        (score > best ? " · ¡Nuevo récord!" : ` · Récord: ${Math.max(score,best)}`);
    } else {
      const k = Object.keys(state).find(x => state[x] <= 0);
      const why = {comb:"Te quedaste sin combustible.", ener:"Se agotó la energía.", mor:"Perdiste el ánimo y abandonaste tu puesto."}[k];
      $("end-icon").textContent = "🌊";
      sfx.lose();
      $("end-title").textContent = "El faro se apagó";
      $("end-text").innerHTML = `${why}<br>Sobreviviste ${hour-1} de ${TOTAL} horas.<br>Puntaje: <b>${score}</b>`;
    }
  }

  $("btn-start").onclick = () => { sfx.click(); startGame(); };
  $("btn-again").onclick = () => { show("start"); showBest(); document.body.classList.remove("dawn"); };
  showBest();
})();
