"use client";

import { useEffect, useMemo, useState } from "react";

type Weather = { max: number; min: number; rain: number; wind: number; wave?: number };
type Section = "days" | "guide" | "events" | "food" | "walks" | "explore" | "campings" | "decide" | "offline";
type Props = {
  weather: Record<string, Weather>;
  openDay: (day: string) => void;
  openSection: (section: Section) => void;
};

// Modo operativo de viaje: mantiene las decisiones diarias separadas del mapa principal.
const days = [
  { day: "01", date: "1 AGO", title: "Vitoria → Lima Escape", base: "Lima Escape", drive: "620 km · 6 h 15", normal: ["Salida temprana de Vitoria", "Parada larga para comer", "Llegada y montaje", "Paseo junto al río Lima"], calm: ["Viaje directo", "Montaje con luz", "Cena y descanso"], rain: ["Viaje directo", "Compra antes de llegar", "Montaje y descanso"], alternative: "Ponte de Lima solo si se llega con margen.", event: "Feirão de Viana y Âncora FolK quedan fuera de ruta: no recomendados este día.", maps: "https://www.google.com/maps/dir/42.8467,-2.6716/41.824395,-8.318062" },
  { day: "02", date: "2 AGO", title: "Soajo + Lindoso", base: "Lima Escape", drive: "80 km · 2 h", normal: ["Soajo y espigueiros", "Poço Negro", "Comida local", "Castillo y espigueiros de Lindoso"], calm: ["Soajo", "Poço Negro", "Regreso temprano"], rain: ["Soajo", "Castillo de Lindoso", "Cafés de Arcos"], alternative: "Cambiar Poço Negro por Poço da Gola si el aparcamiento está lleno.", event: "Noite do Folclore en Arcos · 21:30; encaja al regresar.", maps: "https://www.google.com/maps/dir/41.824395,-8.318062/41.8721,-8.2634/41.8662,-8.1998/41.824395,-8.318062" },
  { day: "03", date: "3 AGO", title: "Sistelo + Arcos", base: "Lima Escape", drive: "110 km · 2 h 20", normal: ["Sistelo", "Tramo de la Ecovia do Vez", "Arcos y playa de Valeta", "Cena"], calm: ["Miradores de Sistelo", "Arcos", "Baño en Valeta"], rain: ["Paço de Giela", "Centro de Arcos", "Comida larga"], alternative: "Lagoas do Vez sustituye la ecovía completa.", event: "Cantares ao Desafio · Arcos · 22:00; compatible.", maps: "https://www.google.com/maps/dir/41.824395,-8.318062/41.9733,-8.3746/41.8467,-8.4191/41.824395,-8.318062" },
  { day: "04", date: "4 AGO", title: "Braga → Cabedelo", base: "Traslado", drive: "125 km · 2 h 15", normal: ["Desmontaje", "Bom Jesus", "Braga y comida", "Montaje en Cabedelo"], calm: ["Bom Jesus", "Traslado y montaje"], rain: ["Sé de Braga", "Museu dos Biscainhos", "Traslado"], alternative: "Eliminar Sameiro antes que acortar Braga.", event: "O Mundo a Dançar · Cerveira · 22:00; desvío largo tras el traslado.", maps: "https://www.google.com/maps/dir/41.824395,-8.318062/41.5547,-8.3771/41.5518,-8.4229/41.678611,-8.823056" },
  { day: "05", date: "5 AGO", title: "Viana + Santa Luzia", base: "INATEL Cabedelo", drive: "30 km · 50 min", normal: ["Centro de Viana", "Gil Eannes", "Comida", "Santa Luzia", "Cabedelo"], calm: ["Viana", "Gil Eannes", "Cabedelo"], rain: ["Gil Eannes", "Museu do Traje", "Centro histórico"], alternative: "No subir a Santa Luzia con nube cerrada.", event: "O Mundo a Dançar en Arcos · 22:00; solo si se acepta conducir 50 min.", maps: "https://www.google.com/maps/dir/41.678611,-8.823056/41.6932,-8.8329/41.7044,-8.8342/41.678611,-8.823056" },
  { day: "06", date: "6 AGO", title: "Costa norte", base: "INATEL Cabedelo", drive: "90 km · 2 h", normal: ["Praia de Afife", "Vila Praia de Âncora", "Moledo", "Caminha y cena"], calm: ["Afife o Moledo", "Caminha"], rain: ["Caminha", "Cerveira", "Comida larga"], alternative: "Elegir dos playas como máximo.", event: "SonicBlast y Festa do Mar e da Sardinha en Âncora; encajan perfectamente.", maps: "https://www.google.com/maps/dir/41.678611,-8.823056/41.7812,-8.8725/41.8158,-8.8695/41.8496,-8.8664/41.8753,-8.8387/41.678611,-8.823056" },
  { day: "07", date: "7 AGO", title: "Valença + Tui", base: "Traslado", drive: "120 km · 2 h", normal: ["Desmontaje", "Valença", "Tui", "Montaje en Santa Tecla"], calm: ["Valença", "Montaje temprano"], rain: ["Catedral de Tui", "Fortaleza de Valença", "Montaje"], alternative: "Cerveira sustituye Tui si se prefiere arte y menos paseo.", event: "Sons no Terreiro · Cerveira · 21:30; opción nocturna recomendada.", maps: "https://www.google.com/maps/dir/41.678611,-8.823056/42.0308,-8.6459/42.0472,-8.6444/41.8897,-8.8464" },
  { day: "08", date: "8 AGO", title: "Santa Trega + A Guarda", base: "Camping Santa Tecla", drive: "25 km · 45 min", normal: ["Castro de Santa Trega", "Miradores", "Puerto de A Guarda", "Cena"], calm: ["Subida en coche", "Castro", "Puerto"], rain: ["MASAT", "Museo del castro", "Puerto y cafés"], alternative: "Sendero Azul sustituye la subida a pie.", event: "Sons no Terreiro o conciertos de Valença; Festa do Rio exige 2 h de conducción.", maps: "https://www.google.com/maps/dir/41.8897,-8.8464/41.8925,-8.8697/41.9012,-8.8747/41.8897,-8.8464" },
  { day: "09", date: "9 AGO", title: "Oia + Mougás + Baiona", base: "Camping Santa Tecla", drive: "95 km · 2 h", normal: ["Monasterio de Oia", "Pozas de Mougás", "Cabo Silleiro", "Baiona"], calm: ["Oia", "Cabo Silleiro", "Baiona"], rain: ["Monasterio de Oia", "Exposiciones Baiverán", "Casco de Baiona"], alternative: "Eliminar Mougás si llueve o la roca está húmeda.", event: "Feira de Artes e Velharias en Cerveira; alternativa tranquila al recorrido costero.", maps: "https://www.google.com/maps/dir/41.8897,-8.8464/42.0024,-8.8767/42.0581,-8.8662/42.1012,-8.8974/42.1209,-8.8492/41.8897,-8.8464" },
  { day: "10", date: "10 AGO", title: "Regreso", base: "Vitoria–Gasteiz", drive: "650 km · 6 h 30", normal: ["Desmontaje", "Desayuno", "Regreso con dos descansos"], calm: ["Desmontaje", "Regreso directo"], rain: ["Salida directa", "Dos descansos cubiertos"], alternative: "No añadir visitas antes del trayecto.", event: "Sin evento recomendado: prioridad absoluta al regreso.", maps: "https://www.google.com/maps/dir/41.8897,-8.8464/42.8467,-2.6716" },
] as const;

const parking = {
  "01": ["Dentro de Lima Escape", "Área de servicio antes de la llegada", "Amplia", "Asfalto y último tramo rural", "0–5 min", "Sin saturación prevista", "41.824395, -8.318062"],
  "02": ["Entrada de Soajo + castillo de Lindoso", "Calles exteriores sin bloquear vecinos", "Pequeña", "Carretera estrecha y sinuosa", "5–15 min", "Antes de 09:30", "41.8721, -8.2634"],
  "03": ["Entrada de Sistelo", "Aparcamiento de Arcos junto al río", "Muy pequeña en Sistelo", "Acceso asfaltado pero lento", "5–15 min", "Antes de 10:00", "41.9733, -8.3746"],
  "04": ["Parking superior de Bom Jesus", "Parking del funicular", "Media", "Urbano y asfaltado", "5–15 min", "Antes de 10:00", "41.5547, -8.3771"],
  "05": ["Campo d’Agonia", "Parking de la Marina", "Grande", "Acceso urbano", "8–15 min al centro", "Antes de 11:00", "41.6932, -8.8329"],
  "06": ["Aparcamientos oficiales de playa", "Estación de Caminha", "Variable", "N13 lenta en agosto", "3–12 min", "Playas antes de 10:30", "41.7812, -8.8725"],
  "07": ["Exterior de la fortaleza de Valença", "Área Panorámica de Tui", "Grande", "Evitar entrar en calles históricas", "5–12 min", "Añadir 30 min con fiestas", "42.0308, -8.6459"],
  "08": ["Castro y cima de Santa Trega", "A Guarda y subida parcial a pie", "Pequeña", "Subida estrecha y sujeta a tasa", "2–15 min", "Antes de 10:00", "41.8925, -8.8697"],
  "09": ["Oia + parking Aral de Baiona", "Apartaderos autorizados de Mougás", "Pequeña en Mougás", "PO-552 con curvas", "5–15 min", "Baiona antes de 17:00", "42.0024, -8.8767"],
  "10": ["Áreas de servicio planificadas", "Paradas cada 2–2,5 h", "Grande", "Autovía", "0–5 min", "Salir antes de 10:00", "41.8897, -8.8464"],
} as const;

const contexts: Record<string, Record<string, string[]>> = {
  baño: { "1": ["Poço Negro", "Poço da Gola", "Praia Fluvial da Valeta"], "2": ["Praia de Afife", "Praia de Moledo", "Cabedelo"], "3": ["Praia do Muíño", "Pozas de Mougás", "Area Grande"] },
  lluvia: { "1": ["Sé y museos de Braga", "Paço de Giela", "Castillo de Lindoso"], "2": ["Gil Eannes", "Museu do Traje", "Centro de Caminha"], "3": ["Catedral de Tui", "MASAT", "Exposiciones de Baiona"] },
  cansancio: { "1": ["Espigueiros de Soajo", "Arcos de Valdevez", "Ponte de Lima"], "2": ["Centro de Viana", "Cabedelo", "Caminha"], "3": ["Puerto de A Guarda", "Baiona", "Cerveira"] },
  viento: { "1": ["Arcos de Valdevez", "Soajo", "Lindoso"], "2": ["Viana do Castelo", "Gil Eannes", "Cerveira"], "3": ["Tui", "Valença", "MASAT"] },
  comida: { "1": ["Cachena en Soajo", "Rojões en Arcos", "Bacalhau en Braga"], "2": ["Pescado en Viana", "Sardinas en Âncora", "Marisco en Caminha"], "3": ["Pulpo en A Guarda", "Empanada para Oia", "Marisco en Baiona"] },
  fiesta: { "1": ["Fiestas de Arcos", "Folclore", "Cantares ao Desafio"], "2": ["NEOPOP", "SonicBlast", "Sardinas en Âncora"], "3": ["Sons no Terreiro", "Fiestas de Valença", "Agenda de Tui"] },
};

function baseForDay(day: string) {
  return Number(day) <= 4 ? "1" : Number(day) <= 6 ? "2" : "3";
}

export default function TodayTools({ weather, openDay, openSection }: Props) {
  const initialDay = typeof window !== "undefined" && new Date().getMonth() === 7 && new Date().getDate() <= 10 ? String(new Date().getDate()).padStart(2, "0") : "01";
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [variant, setVariant] = useState<"normal" | "calm" | "rain">("normal");
  const [context, setContext] = useState("baño");
  const [checkedAt, setCheckedAt] = useState("");
  const selected = days.find((item) => item.day === selectedDay) || days[0];
  const forecast = weather[selectedDay];
  const defaultPlan = [...selected[variant]];
  const [customPlans, setCustomPlans] = useState<Record<string, string[]>>({});
  const plan = customPlans[selectedDay] || defaultPlan;
  const park = parking[selectedDay as keyof typeof parking];
  const suggestions = contexts[context][baseForDay(selectedDay)];

  useEffect(() => {
    try { setCustomPlans(JSON.parse(localStorage.getItem("np-custom-days") || "{}")); setCheckedAt(localStorage.getItem("np-today-checked") || ""); } catch { setCustomPlans({}); }
  }, []);
  useEffect(() => { localStorage.setItem("np-custom-days", JSON.stringify(customPlans)); }, [customPlans]);

  const recommendation = useMemo(() => {
    if (!forecast) return "La previsión todavía no está disponible: usa las comprobaciones oficiales.";
    if (forecast.rain >= 60) return "Plan de lluvia recomendado. Evita pozas, roca y miradores cubiertos.";
    if ((forecast.wave || 0) >= 1.8 || forecast.wind >= 35) return "Costa expuesta: prioriza pueblos, museos y playas resguardadas.";
    if (forecast.max >= 31) return "Empieza temprano, acorta senderismo y reserva el baño para después.";
    return "Condiciones compatibles con el plan normal. Mantén una alternativa preparada.";
  }, [forecast]);

  function applyVariant(next: "normal" | "calm" | "rain") {
    setVariant(next);
    setCustomPlans((current) => ({ ...current, [selectedDay]: [...selected[next]] }));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= plan.length) return;
    const next = [...plan];
    [next[index], next[target]] = [next[target], next[index]];
    setCustomPlans((current) => ({ ...current, [selectedDay]: next }));
  }
  function remove(index: number) {
    setCustomPlans((current) => ({ ...current, [selectedDay]: plan.filter((_, itemIndex) => itemIndex !== index) }));
  }
  function checkNow() {
    const value = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    setCheckedAt(value);
    localStorage.setItem("np-today-checked", value);
  }

  return <div className="today-tools">
    <section className="today-hero">
      <small>MODO OPERATIVO</small><h3>¿QUÉ HACEMOS HOY?</h3>
      <label>DÍA DEL VIAJE<select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>{days.map((day) => <option value={day.day} key={day.day}>Día {day.day} · {day.date} · {day.title}</option>)}</select></label>
      <div className="today-summary"><b>DÍA {selected.day}</b><strong>{selected.title}</strong><span>{selected.drive} · {selected.base}</span></div>
      {forecast && <div className="today-weather"><b>{forecast.max}°</b><span>{forecast.min}° mín.<br />☂ {forecast.rain}% · 💨 {forecast.wind} km/h{forecast.wave !== undefined && <><br />🌊 {forecast.wave.toFixed(1)} m</>}</span></div>}
      <p className="today-advice">◆ {recommendation}</p>
      <div className="today-primary-actions"><a href={selected.maps} target="_blank" rel="noreferrer">ABRIR RUTA COMPLETA ↗</a><button onClick={() => openDay(selectedDay)}>FICHA COMPLETA DEL DÍA</button></div>
    </section>

    <section className="today-section">
      <div className="today-section-title"><span>01</span><div><small>ITINERARIO EDITABLE</small><h3>MI PLAN DEFINITIVO</h3></div></div>
      <div className="variant-tabs"><button className={variant === "calm" ? "active" : ""} onClick={() => applyVariant("calm")}>TRANQUILO</button><button className={variant === "normal" ? "active" : ""} onClick={() => applyVariant("normal")}>NORMAL</button><button className={variant === "rain" ? "active" : ""} onClick={() => applyVariant("rain")}>MAL TIEMPO</button></div>
      <div className="editable-plan">{plan.map((item, index) => <article key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong><div><button disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={index === plan.length - 1} onClick={() => move(index, 1)}>↓</button><button onClick={() => remove(index)}>×</button></div></article>)}</div>
      <div className="plan-alternative"><b>ALTERNATIVA</b><p>{selected.alternative}</p><button onClick={() => setCustomPlans((current) => ({ ...current, [selectedDay]: [...plan, selected.alternative] }))}>AÑADIR AL PLAN</button></div>
      <button className="reset-plan" onClick={() => setCustomPlans((current) => { const next = { ...current }; delete next[selectedDay]; return next; })}>RESTAURAR PLAN RECOMENDADO</button>
    </section>

    <section className="today-section">
      <div className="today-section-title"><span>02</span><div><small>AGENDA INTEGRADA</small><h3>EVENTO COMPATIBLE</h3></div></div>
      <article className="fitted-event"><b>DÍA {selected.day}</b><p>{selected.event}</p><button onClick={() => openSection("events")}>VER PROGRAMA Y NAVEGACIÓN →</button></article>
    </section>

    <section className="today-section">
      <div className="today-section-title"><span>03</span><div><small>ANTES DE SALIR</small><h3>COMPROBAR HOY</h3></div></div>
      <div className="status-grid">
        <a className={forecast && forecast.rain < 50 ? "ok" : "warn"} href="https://www.ipma.pt/pt/index.html" target="_blank" rel="noreferrer"><b>METEOROLOGÍA</b><span>{forecast ? `${forecast.rain}% lluvia · ${forecast.wind} km/h` : "Sin dato"}</span></a>
        <a className="unknown" href="https://www.ipma.pt/pt/riscoincendio/" target="_blank" rel="noreferrer"><b>INCENDIOS</b><span>Comprobación oficial necesaria</span></a>
        <a className="unknown" href="https://prociv.gov.pt/pt/ocorrencias/" target="_blank" rel="noreferrer"><b>INCIDENCIAS</b><span>Carreteras y emergencias</span></a>
        <a className="unknown" href="https://infoagua.apambiente.pt/pt/praias" target="_blank" rel="noreferrer"><b>CALIDAD DEL AGUA</b><span>Consultar playa o zona de baño</span></a>
        <button className={(forecast?.wave || 0) < 1.8 ? "ok" : "warn"} onClick={() => openSection("days")}><b>OLEAJE / VIENTO</b><span>{forecast?.wave !== undefined ? `${forecast.wave.toFixed(1)} m · ${forecast.wind} km/h` : "Abrir previsión diaria"}</span></button>
        <button className="unknown" onClick={() => openSection("campings")}><b>CAMPING / HORARIOS</b><span>Confirmar recepción y reserva</span></button>
      </div>
      <button className="check-now" onClick={checkNow}>MARCAR COMPROBACIÓN REALIZADA ✓</button><p className="checked-at">Última comprobación manual: {checkedAt || "pendiente"}</p>
    </section>

    <section className="today-section">
      <div className="today-section-title"><span>04</span><div><small>SEGÚN EL MOMENTO</small><h3>NECESITO UN PLAN…</h3></div></div>
      <div className="context-tabs">{Object.keys(contexts).map((item) => <button className={context === item ? "active" : ""} key={item} onClick={() => setContext(item)}>{item.toUpperCase()}</button>)}</div>
      <div className="context-results">{suggestions.map((item, index) => <article key={item}><span>0{index + 1}</span><strong>{item}</strong><button onClick={() => openSection(context === "comida" ? "food" : context === "fiesta" ? "events" : "explore")}>VER OPCIONES →</button></article>)}</div>
    </section>

    <section className="today-section">
      <div className="today-section-title"><span>05</span><div><small>ACCESO REAL</small><h3>APARCAMIENTO</h3></div></div>
      <div className="parking-card"><p><b>🅿 PRINCIPAL</b>{park[0]}</p><p><b>ALTERNATIVO</b>{park[1]}</p><p><b>CAPACIDAD</b>{park[2]}</p><p><b>ACCESO</b>{park[3]}</p><p><b>CAMINANDO</b>{park[4]}</p><p><b>SATURACIÓN</b>{park[5]}</p><p className="coords"><b>COORDENADAS</b>{park[6]}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park[6])}`} target="_blank" rel="noreferrer">ABRIR APARCAMIENTO ↗</a></div>
    </section>
  </div>;
}
