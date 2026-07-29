"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./aurillac.module.css";

type Pace = "tranquilo" | "normal" | "completo";
type Stage = {
  day: string; date: string; title: string; base: string; drive: string;
  coords: [number, number]; plan: string[]; note: string;
  kind: "route" | "festival" | "nature" | "city";
};
type Place = {
  id: string; name: string; category: "base" | "festival" | "service" | "transport";
  coords: [number, number]; detail: string;
};

const stages: Stage[] = [
  { day:"01",date:"15/16 AGO",title:"VITORIA → FRANCIA",base:"ETAPA DE APROXIMACIÓN",drive:"SALIDA FLEXIBLE",coords:[44.8378,-0.5792],kind:"route",plan:["Salida desde Vitoria–Gasteiz","Cruce de frontera con margen","Noche intermedia para no llegar cansados"],note:"La salida puede hacerse el 15 o el 16; se mantienen las dos variantes."},
  { day:"02",date:"16/17 AGO",title:"DORDOÑA / LOT",base:"BASE PREVIA",drive:"ETAPA MODULAR",coords:[44.7995,1.6179],kind:"nature",plan:["Pueblos y paisaje del valle","Paseo o baño según el tiempo","Preparar la llegada a Aurillac"],note:"Jornada flexible antes del festival. Evitar sobrecargarla."},
  { day:"03",date:"18 AGO",title:"LLEGADA A AURILLAC",base:"LA PONÉTIE",drive:"MONTAJE + RECONOCIMIENTO",coords:[44.9197,2.4328],kind:"route",plan:["Llegar antes de media tarde","Montar la base en La Ponétie","Probar el acceso en bicicleta al centro","Localizar agua, aseos, duchas y aparcabicis"],note:"El programa OFF se publica el 17 a las 14:00. Revisarlo sin llenar cada hueco."},
  { day:"04",date:"19 AGO",title:"FESTIVAL · ORIENTACIÓN",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9269,2.4398],kind:"festival",plan:["Reconocimiento de los ejes del centro","Un espectáculo prioritario gratuito","Bloque OFF libre de 2–3 horas","Regreso con margen a La Ponétie"],note:"Primer día deliberadamente abierto para entender ritmos y distancias reales."},
  { day:"05",date:"20 AGO",title:"FESTIVAL · SELECCIÓN",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9282,2.4431],kind:"festival",plan:["Primer bloque de calle","Comida y descanso largo","Uno o dos espectáculos gratuitos","Noche flexible según energía"],note:"INCONTINUO y Projet Fantôme no deben reservarse en franjas incompatibles."},
  { day:"06",date:"21 AGO",title:"FESTIVAL · PHOENIX",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9253,2.4455],kind:"festival",plan:["Mañana libre para compañías OFF","Comida y desplazamiento con margen","Phoenix · bloque 17:00–20:10","La Louuve en Place des Carmes, si encaja"],note:"Phoenix bloquea prácticamente toda la tarde. No añadir citas durante ese intervalo."},
  { day:"07",date:"22 AGO",title:"FESTIVAL · CIERRE",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9311,2.4412],kind:"festival",plan:["Variante visual o experimental","Bloque OFF libre de 2–3 horas","Última propuesta gratuita","Regreso y preparación del desmontaje"],note:"Womb requiere lanzadera y ocupa la noche; si se elige, debe ser el plan principal del bloque."},
  { day:"08",date:"23 AGO",title:"SALIDA DE AURILLAC",base:"CANTAL",drive:"SALIDA ANTES DE 12:00",coords:[45.0544,2.4782],kind:"nature",plan:["Desmontaje temprano","Salida recomendada antes de las 12:00","Ruta panorámica por el Cantal","Noche fuera del dispositivo del festival"],note:"Evitar el tráfico y los desmontajes del cierre."},
  { day:"09",date:"24 AGO",title:"CANTAL / AUBRAC",base:"ETAPA NATURAL",drive:"CARRETERAS LENTAS",coords:[44.6213,2.6616],kind:"nature",plan:["Paisaje volcánico","Pueblo o paseo corto","Gastronomía local","Descanso"],note:"En montaña importan más los tiempos reales que los kilómetros."},
  { day:"10",date:"25 AGO",title:"REGRESO · ETAPA 1",base:"SUROESTE FRANCÉS",drive:"TRASLADO CON PARADAS",coords:[43.6047,1.4442],kind:"city",plan:["Desplazamiento hacia el suroeste","Parada cultural o gastronómica","Noche intermedia"],note:"Etapa abierta según energía, meteorología y alojamiento."},
  { day:"11",date:"26 AGO",title:"REGRESO · ETAPA 2",base:"CERCA DE LA FRONTERA",drive:"ACERCAMIENTO",coords:[43.4832,-1.5586],kind:"route",plan:["Acercamiento al País Vasco","Última visita breve","Dormir con el regreso resuelto"],note:"El 27 queda como jornada cómoda, no como una paliza final."},
  { day:"12",date:"27 AGO",title:"VUELTA A VITORIA",base:"FIN DEL VIAJE",drive:"REGRESO",coords:[42.8467,-2.6716],kind:"route",plan:["Salida sin prisa","Paradas de descanso","Llegada a Vitoria–Gasteiz"],note:"Cierre del viaje."},
];

const places: Place[] = [
  {id:"ponetie",name:"La Ponétie",category:"base",coords:[44.9197,2.4328],detail:"Base operativa · salida en bici"},
  {id:"centre",name:"Centre-ville",category:"festival",coords:[44.9269,2.4398],detail:"Núcleo principal de teatro de calle"},
  {id:"carmes",name:"Place des Carmes",category:"festival",coords:[44.9254,2.4425],detail:"Escenario y encuentro nocturno"},
  {id:"jardins",name:"Jardins de la Jordanne",category:"festival",coords:[44.9311,2.4412],detail:"Zona verde y programación próxima"},
  {id:"haras",name:"Haras National",category:"transport",coords:[44.9348,2.4321],detail:"Ubicación periférica · calcular traslado"},
  {id:"office",name:"Oficina del festival",category:"service",coords:[44.9265,2.4407],detail:"Programa, cambios y ayuda operativa"},
  {id:"hospital",name:"Centre Hospitalier",category:"service",coords:[44.9217,2.4555],detail:"Asistencia sanitaria"},
  {id:"station",name:"Gare d’Aurillac",category:"transport",coords:[44.9209,2.4356],detail:"Tren y referencia de movilidad"},
];

const conflictRules = [
  ["PHOENIX","21 AGO · 17:00–20:10","Bloquea la tarde completa, incluidos desplazamientos."],
  ["INCONTINUO / PROJET FANTÔME","NO ENCADENAR","Elegir uno si sus horarios vuelven a solaparse."],
  ["WOMB","LANZADERA + NOCHE","No tratarlo como un escenario céntrico ni añadir plan nocturno."],
  ["HARAS NATIONAL","TRASLADO ESPECÍFICO","Reservar margen; no está en el núcleo compacto del centro."],
];

export default function AurillacPage() {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const [selected, setSelected] = useState("04");
  const [pace, setPace] = useState<Pace>("normal");
  const [filter, setFilter] = useState<"all"|Place["category"]>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const active = useMemo(() => stages.find((item) => item.day === selected) || stages[3], [selected]);
  const visiblePlaces = useMemo(() => places.filter(place => filter === "all" || place.category === filter), [filter]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("aurillac-saved") || "[]"));
      setSelected(localStorage.getItem("aurillac-day") || "04");
      setPace((localStorage.getItem("aurillac-pace") as Pace) || "normal");
    } catch { setSaved([]); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("aurillac-saved", JSON.stringify(saved));
    localStorage.setItem("aurillac-day", selected);
    localStorage.setItem("aurillac-pace", pace);
  }, [saved, selected, pace, ready]);

  useEffect(() => {
    if (!mapNode.current || mapInstance.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, {zoomControl:false, scrollWheelZoom:false}).setView([44.926,2.44],14);
      mapInstance.current = map;
      L.control.zoom({position:"bottomright"}).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap",maxZoom:19}).addTo(map);
      markerLayer.current = L.layerGroup().addTo(map);
      L.polyline([[44.9197,2.4328],[44.9209,2.4356],[44.9269,2.4398],[44.9311,2.4412]],{color:"#e45532",weight:5,dashArray:"10 8",opacity:.9}).addTo(map);
      L.control.scale({imperial:false}).addTo(map);
      setFilter(current => current);
    });
    return () => { cancelled=true; mapInstance.current?.remove(); mapInstance.current=null; markerLayer.current=null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerLayer.current) return;
    import("leaflet").then((L) => {
      markerLayer.current?.clearLayers();
      visiblePlaces.forEach(place => {
        const colors = {base:"#e45532",festival:"#12695f",service:"#3159a6",transport:"#7d4b91"};
        L.circleMarker(place.coords,{radius:place.category==="base"?11:8,color:"#f4f0e6",weight:3,fillColor:colors[place.category],fillOpacity:1})
          .addTo(markerLayer.current!).bindPopup(`<b>${place.name}</b><br>${place.detail}`);
      });
    });
  }, [visiblePlaces]);

  function chooseDay(day: string) {
    setSelected(day);
    const stage = stages.find(item => item.day === day);
    if (stage && mapInstance.current && stage.kind === "festival") mapInstance.current.flyTo(stage.coords,15,{duration:.65});
    document.getElementById("day-plan")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function toggleSaved(id: string) {
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current,id]);
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div><small>BIDAIAK · FRANCIA 2026</small><h1>AURILLAC<br/>EN LA CALLE</h1><p>Vitoria–Gasteiz → Cantal · 15/16–27 agosto · Festival 19–22</p></div>
        <div className={styles.rules}><span><b>0 €</b> SOLO ESPECTÁCULOS GRATUITOS</span><span><b>1–2</b> PRIORIDADES POR DÍA</span><span><b>🚲</b> BICI + A PIE</span></div>
      </header>

      <nav className={styles.quickNav} aria-label="Navegación de Aurillac">
        <a href="#mapa">MAPA</a><a href="#day-plan">HOY</a><a href="#agenda">AGENDA</a><a href="#servicios">SERVICIOS</a><a href="#ruta">RUTA</a>
      </nav>

      <section className={styles.mapSection} id="mapa">
        <div className={styles.mapWrap}>
          <div ref={mapNode} className={styles.map} aria-label="Mapa operativo de Aurillac"/>
          <div className={styles.filters}>
            {(["all","base","festival","service","transport"] as const).map(item=><button key={item} className={filter===item?styles.filterOn:""} onClick={()=>setFilter(item)}>{item==="all"?"TODO":item==="service"?"SERVICIOS":item==="transport"?"TRANSPORTE":item.toUpperCase()}</button>)}
          </div>
        </div>
        <div className={styles.mapCaption}><small>MAPA OPERATIVO · AURILLAC</small><h2>LA PONÉTIE → CENTRO</h2><p>Ruta principal en bicicleta, escenarios, servicios y lugares que necesitan transporte específico.</p><div className={styles.metric}><b>≈ 2 KM</b><span>TRAYECTO BASE–CENTRO</span></div><div className={styles.metric}><b>10–15 MIN</b><span>EN BICICLETA + MARGEN</span></div><a href="https://www.google.com/maps/dir/44.9197,2.4328/44.9269,2.4398/44.9311,2.4412" target="_blank" rel="noreferrer">ABRIR NAVEGACIÓN ↗</a></div>
      </section>

      <section className={styles.control} id="day-plan">
        <div><small>PLANIFICADOR</small><h2>ELIGE EL DÍA</h2></div>
        <select aria-label="Elegir día" value={selected} onChange={event=>chooseDay(event.target.value)}>{stages.map(stage=><option value={stage.day} key={stage.day}>{stage.date} · {stage.title}</option>)}</select>
        <div className={styles.paces}>{(["tranquilo","normal","completo"] as const).map(item=><button type="button" className={pace===item?styles.on:""} onClick={()=>setPace(item)} key={item}>{item.toUpperCase()}</button>)}</div>
      </section>

      <section className={styles.activeDay}>
        <div className={styles.dayNumber}>{active.day}</div>
        <div><small>{active.date} · {active.kind.toUpperCase()}</small><h2>{active.title}</h2><p className={styles.meta}>{active.base} · {active.drive}</p>
          <ol>{active.plan.slice(0,pace==="tranquilo"?3:pace==="normal"?4:5).map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</li>)}</ol>
          <p className={styles.note}>◆ {active.note}</p>
          <div className={styles.paceAdvice}><b>RITMO {pace.toUpperCase()}</b><p>{pace==="tranquilo"?"Una prioridad, pausas largas y regreso temprano.":pace==="normal"?"Dos bloques, una pausa larga y margen real entre ubicaciones.":"Jornada extendida solo si el cuerpo acompaña; nunca rellenar los bloques OFF."}</p></div>
        </div>
      </section>

      <section className={styles.agenda} id="agenda">
        <header><small>AGENDA DE DECISIÓN</small><h2>NO ENCADENAR LO IMPOSIBLE</h2><p>Reglas previas al programa OFF. Actualizar horarios desde el 17 de agosto a las 14:00.</p></header>
        <div className={styles.conflicts}>{conflictRules.map(([name,time,note])=><article key={name}><span>{time}</span><h3>{name}</h3><p>{note}</p><button className={saved.includes(name)?styles.saved:""} onClick={()=>toggleSaved(name)}>{saved.includes(name)?"★ GUARDADO":"☆ GUARDAR"}</button></article>)}</div>
        <aside><b>REGLA MAESTRA</b><p>Uno o dos espectáculos prioritarios por día + un bloque libre de 2–3 horas. La agenda solo admite propuestas gratuitas.</p></aside>
      </section>

      <section className={styles.services} id="servicios">
        <header><small>BASE OPERATIVA</small><h2>ANTES DE SALIR EN BICI</h2></header>
        <div>{["Agua llena","Luces cargadas","Candado","Impermeable","Punto de regreso","Última lanzadera"].map(item=><label key={item}><input type="checkbox"/><span>{item}</span></label>)}</div>
        <div className={styles.serviceCards}>{places.filter(place=>place.category==="service"||place.category==="transport").map(place=><button onClick={()=>{setFilter(place.category);mapInstance.current?.flyTo(place.coords,16)}} key={place.id}><small>{place.category==="service"?"SERVICIO":"MOVILIDAD"}</small><b>{place.name}</b><span>{place.detail}</span></button>)}</div>
      </section>

      <section className={styles.timeline} id="ruta">
        <header><small>RUTA COMPLETA</small><h2>15/16 → 27 AGOSTO</h2><p>Festival fijo; aproximación y regreso modulares hasta cerrar campings.</p></header>
        <div>{stages.map(stage=><button className={selected===stage.day?styles.selected:""} onClick={()=>chooseDay(stage.day)} key={stage.day}><span>{stage.day}</span><div><small>{stage.date} · {stage.base}</small><b>{stage.title}</b><p>{stage.note}</p></div></button>)}</div>
      </section>
    </main>
  );
}
