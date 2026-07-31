"use client";

import { useEffect, useMemo, useState } from "react";

type BaseId = 1 | 2 | 3;
type Interest = "baño" | "senderismo" | "patrimonio" | "museos" | "gastronomía" | "surf";
type Weather = "sol" | "nubes" | "lluvia" | "viento";
type Expense = { id: string; concept: string; category: string; amount: number; date: string };

type SmartPlace = {
  name: string;
  base: BaseId;
  coords: [number, number];
  tags: string[];
  duration: number;
  cost: number;
  open: string;
  crowd: "baja" | "media" | "alta";
  best: string;
  parking: string;
  note: string;
};

const bases = {
  1: { name: "Lima Escape", coords: [41.824395, -8.318062] as [number, number] },
  2: { name: "INATEL Cabedelo", coords: [41.678611, -8.823056] as [number, number] },
  3: { name: "Camping Santa Tecla", coords: [41.8897, -8.8464] as [number, number] },
};

const places: SmartPlace[] = [
  { name: "Soajo + Poço Negro", base: 1, coords: [41.8721, -8.2634], tags: ["baño","patrimonio","poza","pueblo"], duration: 150, cost: 0, open: "Siempre; baño según caudal", crowd: "alta", best: "Antes de 10:00", parking: "Pequeño junto a la aldea", note: "Espigueiros, paseo y baño; roca resbaladiza." },
  { name: "Lindoso + Poço da Gola", base: 1, coords: [41.8662, -8.1998], tags: ["baño","patrimonio","poza","pueblo"], duration: 180, cost: 0, open: "Exterior siempre", crowd: "media", best: "Mañana", parking: "Junto al castillo", note: "Castillo, espigueiros y baño cercano." },
  { name: "Sistelo y Ecovia do Vez", base: 1, coords: [41.9733, -8.3746], tags: ["senderismo","patrimonio","fotografía"], duration: 240, cost: 0, open: "Siempre", crowd: "media", best: "08:00–12:30", parking: "Entrada del pueblo", note: "Ruta fácil/media entre bancales; llevar agua." },
  { name: "Museu D. Diogo de Sousa", base: 1, coords: [41.5448, -8.4264], tags: ["museos","patrimonio","lluvia"], duration: 100, cost: 4, open: "Mar–dom 10:00–17:30", crowd: "baja", best: "Después de comer o con lluvia", parking: "Aparcamientos de Braga", note: "Arqueología romana de Bracara Augusta." },
  { name: "Museu dos Biscainhos", base: 1, coords: [41.5518, -8.4299], tags: ["museos","patrimonio","lluvia"], duration: 75, cost: 4, open: "Mar–dom 10:00–12:30 / 14:00–17:30", crowd: "baja", best: "10:00 o 14:00", parking: "Centro de Braga", note: "Palacio barroco y artes decorativas." },
  { name: "Praia do Cabedelo", base: 2, coords: [41.6783, -8.8384], tags: ["baño","surf","playa","fotografía"], duration: 180, cost: 0, open: "Siempre; socorrismo estacional", crowd: "alta", best: "Mañana o atardecer", parking: "Amplio, pero se llena", note: "Surf, dunas y puesta de sol; expuesta al viento." },
  { name: "Navio-Hospital Gil Eannes", base: 2, coords: [41.6907, -8.8317], tags: ["museos","patrimonio","lluvia"], duration: 100, cost: 5, open: "Horario estacional; comprobar", crowd: "media", best: "Primera hora", parking: "Doca comercial", note: "El museo más singular de Viana." },
  { name: "Museu do Traje", base: 2, coords: [41.6935, -8.8287], tags: ["museos","patrimonio","lluvia"], duration: 75, cost: 3, open: "Lun–vie 9:00–13:00 / 14:00–17:00", crowd: "baja", best: "Después del mercado", parking: "Centro peatonal", note: "Traje, bordado y cultura popular." },
  { name: "Afife + Praia da Arda", base: 2, coords: [41.7553, -8.8718], tags: ["baño","surf","playa","fotografía"], duration: 180, cost: 0, open: "Siempre; socorrismo estacional", crowd: "media", best: "Mañana, revisar viento", parking: "Accesos costeros", note: "Costa abierta y fotogénica." },
  { name: "MASAT + Castro de Santa Trega", base: 3, coords: [41.8921, -8.8692], tags: ["museos","patrimonio","fotografía"], duration: 150, cost: 5, open: "Mar–dom 10:00–20:00 en temporada", crowd: "alta", best: "Antes de 10:30", parking: "Monte Santa Trega", note: "Museo, castro y vistas sobre el Miño." },
  { name: "Museo do Mar + puerto", base: 3, coords: [41.9011, -8.8776], tags: ["museos","gastronomía","lluvia"], duration: 90, cost: 2, open: "Jue–dom 11:00–14:00 / 16:00–19:00", crowd: "baja", best: "Antes de comer", parking: "Puerto de A Guarda", note: "Pesca tradicional y paseo gastronómico." },
  { name: "Praia do Muíño", base: 3, coords: [41.9004, -8.8671], tags: ["baño","playa","fluvial"], duration: 150, cost: 0, open: "Siempre; vigilancia estacional", crowd: "alta", best: "Antes de 11:00", parking: "Limitado en agosto", note: "Baño en la desembocadura del Miño." },
  { name: "Casa de la Navegación + Carabela Pinta", base: 3, coords: [42.1192, -8.8496], tags: ["museos","patrimonio","lluvia"], duration: 120, cost: 6, open: "Casa: mar–sáb 10:00–13:00 / 16:00–19:00", crowd: "media", best: "10:00; combinar con Baiona", parking: "Aparcamientos de Baiona", note: "Historia marítima, réplica y realidad virtual." },
  { name: "A Guarda: puerto y gastronomía", base: 3, coords: [41.9012, -8.8747], tags: ["gastronomía","pueblo","mercado"], duration: 120, cost: 25, open: "Restaurantes: confirmar descanso", crowd: "alta", best: "Reservar para 13:30", parking: "Puerto o accesos al centro", note: "Pulpo, pescado, marisco y paseo marítimo." },
];

const dayOptions = [
  { id: "interior", name: "Soajo y Lindoso", drive: 75, walk: 120, rest: 60, bath: "Sí", shade: "Media", rain: "Mala", spend: 25, intensity: "Normal", tags: ["baño","senderismo","patrimonio"] },
  { id: "braga", name: "Braga cultural", drive: 150, walk: 100, rest: 70, bath: "No", shade: "Alta", rain: "Excelente", spend: 45, intensity: "Tranquilo", tags: ["museos","patrimonio","gastronomía"] },
  { id: "viana", name: "Viana y Cabedelo", drive: 35, walk: 75, rest: 150, bath: "Sí", shade: "Baja", rain: "Regular", spend: 38, intensity: "Normal", tags: ["baño","surf","museos"] },
  { id: "afife", name: "Costa Afife–Âncora", drive: 80, walk: 90, rest: 150, bath: "Sí", shade: "Baja", rain: "Mala", spend: 32, intensity: "Completo", tags: ["playa","surf","fotografía"] },
  { id: "guardia", name: "A Guarda y Santa Trega", drive: 35, walk: 100, rest: 90, bath: "Opcional", shade: "Media", rain: "Buena", spend: 40, intensity: "Normal", tags: ["museos","patrimonio","gastronomía"] },
  { id: "baiona", name: "Baiona marítima", drive: 80, walk: 90, rest: 80, bath: "Opcional", shade: "Media", rain: "Excelente", spend: 50, intensity: "Normal", tags: ["museos","patrimonio","gastronomía"] },
];

function distanceKm(a: [number, number], b: [number, number]) {
  const r = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat/2) ** 2 + Math.cos(a[0]*Math.PI/180) * Math.cos(b[0]*Math.PI/180) * Math.sin(dLon/2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`;
}

export default function DecisionCenter() {
  const [base, setBase] = useState<BaseId>(1);
  const [hours, setHours] = useState(7);
  const [interest, setInterest] = useState<Interest>("baño");
  const [weather, setWeather] = useState<Weather>("sol");
  const [pace, setPace] = useState("normal");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(60);
  const [planReady, setPlanReady] = useState(false);
  const [near, setNear] = useState<{coords:[number,number]; status:string}|null>(null);
  const [compareA, setCompareA] = useState("interior");
  const [compareB, setCompareB] = useState("braga");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseReady, setExpenseReady] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState({concept:"", category:"Comida", amount:""});

  useEffect(() => {
    const saved = localStorage.getItem("bidai-expenses");
    if (saved) {
      try { setExpenses(JSON.parse(saved)); } catch {}
    } else {
      const legacy = localStorage.getItem("bidai-budget");
      if (legacy) try {
        const previous = Number(JSON.parse(legacy)?.actual || 0);
        if (previous > 0) setExpenses([{id:"legacy", concept:"Gastos registrados anteriormente", category:"Otros", amount:previous, date:new Date().toISOString()}]);
      } catch {}
    }
    setExpenseReady(true);
  }, []);
  useEffect(() => { if (expenseReady) localStorage.setItem("bidai-expenses", JSON.stringify(expenses)); }, [expenses,expenseReady]);

  const ranked = useMemo(() => places.map((place) => {
    const km = distanceKm(bases[base].coords, place.coords);
    let score = place.base === base ? 30 : 0;
    if (place.tags.includes(interest)) score += 36;
    if (weather === "lluvia" && place.tags.includes("lluvia")) score += 45;
    if (weather === "viento" && place.tags.includes("surf")) score -= 22;
    if (hours * 60 >= place.duration + km * 3) score += 12;
    if (pace === "tranquilo" && place.duration <= 150) score += 12;
    if (pace === "completo" && place.duration >= 150) score += 10;
    return {...place, km, score};
  }).sort((a,b) => b.score-a.score), [base,hours,interest,weather,pace]);

  const searchResults = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return places.map(p => ({...p, km: distanceKm(bases[base].coords,p.coords)}))
      .filter(p => p.km <= range && (!terms.length || terms.every(t => `${p.name} ${p.tags.join(" ")} ${p.note}`.toLowerCase().includes(t))))
      .sort((a,b)=>a.km-b.km).slice(0,8);
  },[query,range,base]);

  const chosen = useMemo(
    () => ranked.slice(0, weather === "lluvia" ? 2 : pace === "completo" ? 3 : 2),
    [ranked, weather, pace],
  );
  const timeline = useMemo(() => {
    const steps = chosen.reduce<{ cursor: number; rows: { time: string; text: string }[] }>(
      (acc, place, index) => {
        const drive = Math.max(15, Math.round(place.km * 1.6));
        const arrival = acc.cursor + drive;
        const afterVisit = arrival + place.duration;
        return {
          cursor: afterVisit + (index === 0 ? 75 : 25),
          rows: [
            ...acc.rows,
            { time: clock(acc.cursor), text: index ? `Traslado a ${place.name}` : `Salida de ${bases[base].name}` },
            { time: clock(arrival), text: `${place.name} · ${place.note}` },
            ...(index === 0
              ? [{ time: clock(afterVisit), text: "Comida / descanso · confirmar horario y reserva" }]
              : []),
          ],
        };
      },
      { cursor: 9 * 60, rows: [] },
    );
    return [...steps.rows, { time: clock(steps.cursor), text: `Regreso estimado a ${bases[base].name}` }];
  }, [chosen, base]);

  const getNear = () => {
    if (!navigator.geolocation) return setNear({coords:bases[base].coords,status:"Geolocalización no disponible"});
    navigator.geolocation.getCurrentPosition(
      p => setNear({coords:[p.coords.latitude,p.coords.longitude],status:"Ubicación usada solo en este momento; no se guarda."}),
      () => setNear({coords:bases[base].coords,status:"Sin permiso: mostramos distancias desde el camping seleccionado."}),
      {enableHighAccuracy:false,timeout:8000,maximumAge:300000},
    );
  };
  const nearResults = near ? places.map(p=>({...p,km:distanceKm(near.coords,p.coords)})).sort((a,b)=>a.km-b.km).slice(0,5) : [];
  const totalExpenses = expenses.reduce((sum,item)=>sum+item.amount,0);
  const a = dayOptions.find(d=>d.id===compareA)!;
  const b = dayOptions.find(d=>d.id===compareB)!;
  const addExpense = () => {
    const amount = Number(expenseDraft.amount);
    if (!expenseDraft.concept.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setExpenses([{id:crypto.randomUUID(), concept:expenseDraft.concept.trim(), category:expenseDraft.category, amount, date:new Date().toISOString()}, ...expenses]);
    setExpenseDraft({concept:"",category:"Comida",amount:""});
    setShowExpense(false);
  };

  return <div className="decision-center">
    <section className="decision-hero">
      <small>ASISTENTE DE DECISIÓN</small>
      <h3>¿QUÉ HACEMOS HOY?</h3>
      <p>Elige la situación real. El cálculo se hace en tu dispositivo y no necesita cuenta.</p>
      <div className="decision-form">
        <label>BASE<select value={base} onChange={e=>setBase(Number(e.target.value) as BaseId)}><option value="1">01 · Lima Escape</option><option value="2">02 · INATEL Cabedelo</option><option value="3">03 · Santa Tecla</option></select></label>
        <label>HORAS DISPONIBLES<input type="range" min="3" max="12" value={hours} onChange={e=>setHours(Number(e.target.value))}/><b>{hours} h</b></label>
        <label>TIEMPO<select value={weather} onChange={e=>setWeather(e.target.value as Weather)}><option value="sol">Sol / estable</option><option value="nubes">Nublado</option><option value="lluvia">Lluvia</option><option value="viento">Viento fuerte</option></select></label>
        <label>PRIORIDAD<select value={interest} onChange={e=>setInterest(e.target.value as Interest)}>{["baño","senderismo","patrimonio","museos","gastronomía","surf"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>RITMO<select value={pace} onChange={e=>setPace(e.target.value)}><option value="tranquilo">Tranquilo</option><option value="normal">Normal</option><option value="completo">Completo</option></select></label>
      </div>
      <button className="decision-main-button" onClick={()=>setPlanReady(true)}>ORGANIZAR MI DÍA →</button>
    </section>

    {planReady && <section className="smart-result">
      <small>RECOMENDACIÓN AUTOMÁTICA</small><h3>{weather==="lluvia" ? "PLAN CUBIERTO Y FLEXIBLE" : chosen[0].name}</h3>
      <div className="recommendation-levels">
        <article><b>MEJOR PLAN</b><strong>{chosen[0].name}</strong><span>{chosen[0].km.toFixed(0)} km · {chosen[0].duration} min · {chosen[0].open}</span></article>
        <article><b>ALTERNATIVA TRANQUILA</b><strong>{ranked.find(p=>p.duration<=150)?.name}</strong><span>Menos desplazamiento y margen para descansar.</span></article>
        <article><b>SI EMPEORA EL TIEMPO</b><strong>{ranked.find(p=>p.tags.includes("lluvia"))?.name}</strong><span>Opción cubierta; comprobar última entrada.</span></article>
      </div>
      <ol className="decision-timeline">{timeline.map((x,i)=><li key={`${x.time}-${i}`}><time>{x.time}</time><span>{x.text}</span></li>)}</ol>
      <div className="decision-alerts">
        {chosen.some(x=>x.crowd==="alta") && <span>⚠️ Zona concurrida: llegar temprano.</span>}
        {chosen.some(x=>/comprobar|confirmar/i.test(x.open)) && <span>🕒 Comprobar horario antes de salir.</span>}
        {weather==="lluvia" && <span>🌧️ Evitar pozas y roca después de lluvia.</span>}
        {weather==="viento" && <span>💨 Revisar viento y oleaje antes de la costa.</span>}
      </div>
      <a className="multi-map" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/${bases[base].coords.join(",")}/${chosen.map(x=>x.coords.join(",")).join("/")}/${bases[base].coords.join(",")}`}>ABRIR TODO EL DÍA EN GOOGLE MAPS ↗</a>
    </section>}

    <section className="tool-section">
      <header><small>BUSCADOR GENERAL</small><h3>ENCUENTRA EL PLAN ADECUADO</h3></header>
      <div className="smart-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="poza, museo romano, surf, lluvia…"/><label>RADIO<select value={range} onChange={e=>setRange(Number(e.target.value))}><option value="15">15 km</option><option value="30">30 km</option><option value="60">60 km</option><option value="120">120 km</option></select></label></div>
      <div className="compact-results">{searchResults.map(p=><article key={p.name}><b>{p.name}</b><span>{p.km.toFixed(0)} km desde la base · {p.duration} min</span><small>{p.tags.join(" · ")}</small><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${p.coords.join(",")}`}>IR ↗</a></article>)}</div>
    </section>

    <section className="tool-section">
      <header><small>COMBINACIONES INTELIGENTES</small><h3>PLANES DE MEDIO DÍA</h3></header>
      <div className="combo-grid">
        {ranked.slice(0,4).map((p,i)=><article key={p.name}><em>0{i+1}</em><b>{p.name}</b><p>{i%2===0 ? "Visita + paseo + comida" : "Actividad + descanso + alternativa cercana"}</p><span>≈ {p.duration+75} min · {p.cost ? `${p.cost} € entrada/consumo` : "Gratis"}</span><button onClick={()=>{setPlanReady(true);setInterest((p.tags[0] as Interest)||"patrimonio")}}>USAR ESTE PLAN</button></article>)}
      </div>
    </section>

    <section className="tool-section">
      <header><small>CERCA DE MÍ</small><h3>DECIDIR SIN DAR VUELTAS</h3></header>
      <button className="geo-button" onClick={getNear}>USAR MI UBICACIÓN AHORA</button>
      <p className="privacy-note">La ubicación no se almacena ni se envía al proyecto. Si no das permiso, se usa el camping.</p>
      {near && <><p className="geo-status">{near.status}</p><div className="near-grid">{nearResults.map(p=><a key={p.name} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${p.coords.join(",")}`}><b>{p.km.toFixed(1)} km</b><span>{p.name}</span><small>{p.best}</small></a>)}</div></>}
    </section>

    <section className="tool-section">
      <header><small>COMPARADOR</small><h3>DOS JORNADAS, UNA DECISIÓN</h3></header>
      <div className="compare-selects"><select value={compareA} onChange={e=>setCompareA(e.target.value)}>{dayOptions.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select><b>VS</b><select value={compareB} onChange={e=>setCompareB(e.target.value)}>{dayOptions.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></div>
      <div className="compare-table">
        <span>PLAN</span><b>{a.name}</b><b>{b.name}</b>
        <span>CONDUCCIÓN</span><p>{a.drive} min</p><p>{b.drive} min</p>
        <span>CAMINATA</span><p>{a.walk} min</p><p>{b.walk} min</p>
        <span>BAÑO</span><p>{a.bath}</p><p>{b.bath}</p>
        <span>SOMBRA</span><p>{a.shade}</p><p>{b.shade}</p>
        <span>CON LLUVIA</span><p>{a.rain}</p><p>{b.rain}</p>
        <span>GASTO / 2</span><p>≈ {a.spend} €</p><p>≈ {b.spend} €</p>
      </div>
    </section>

    <section className="tool-section">
      <header><small>GESTOR DE GASTOS</small><h3>GASTOS DEL VIAJE</h3></header>
      <button className="add-expense-button" onClick={()=>setShowExpense(!showExpense)}>{showExpense ? "CANCELAR" : "+ AÑADIR NUEVO GASTO"}</button>
      {showExpense && <div className="expense-form">
        <label>CONCEPTO<input autoFocus value={expenseDraft.concept} onChange={e=>setExpenseDraft({...expenseDraft,concept:e.target.value})} placeholder="Camping, comida, gasolina…"/></label>
        <label>CATEGORÍA<select value={expenseDraft.category} onChange={e=>setExpenseDraft({...expenseDraft,category:e.target.value})}>{["Camping","Comida","Gasolina","Peajes","Entradas","Actividades","Compra","Otros"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>IMPORTE<input type="number" min="0" step="0.01" value={expenseDraft.amount} onChange={e=>setExpenseDraft({...expenseDraft,amount:e.target.value})} placeholder="0,00"/></label>
        <button onClick={addExpense}>GUARDAR GASTO</button>
      </div>}
      <div className="expense-total"><small>TOTAL GASTADO</small><b>{totalExpenses.toFixed(2)} €</b><span>{(totalExpenses/2).toFixed(2)} € por persona</span></div>
      <div className="expense-list">
        {!expenses.length && <p>Todavía no hay gastos. Pulsa «Añadir nuevo gasto» para registrar el primero.</p>}
        {expenses.map(item=><article key={item.id}><span><small>{item.category} · {new Date(item.date).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit"})}</small><b>{item.concept}</b></span><strong>{item.amount.toFixed(2)} €</strong><button aria-label={`Eliminar ${item.concept}`} onClick={()=>setExpenses(expenses.filter(x=>x.id!==item.id))}>×</button></article>)}
      </div>
    </section>
  </div>;
}
