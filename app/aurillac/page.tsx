"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import styles from "./aurillac.module.css";

type Stage = {
  day: string;
  date: string;
  title: string;
  base: string;
  drive: string;
  coords: [number, number];
  plan: string[];
  note: string;
  kind: "route" | "festival" | "nature" | "city";
};

const stages: Stage[] = [
  { day:"01", date:"15/16 AGO", title:"VITORIA → FRANCIA", base:"ETAPA DE APROXIMACIÓN", drive:"SALIDA FLEXIBLE", coords:[44.8378,-0.5792], kind:"route", plan:["Salida desde Vitoria–Gasteiz","Cruce de frontera con margen","Noche intermedia para no llegar cansados"], note:"La salida puede hacerse el 15 o el 16; la aplicación conserva ambas opciones." },
  { day:"02", date:"16/17 AGO", title:"DORDOÑA / LOT", base:"BASE PREVIA", drive:"ETAPA MODULAR", coords:[44.7995,1.6179], kind:"nature", plan:["Pueblos y paisaje del valle","Paseo o baño según tiempo","Preparar llegada a Aurillac"], note:"Jornada flexible antes del festival. Evitar sobrecargarla." },
  { day:"03", date:"18 AGO", title:"LLEGADA A AURILLAC", base:"LA PONÉTIE", drive:"MONTAJE + RECONOCIMIENTO", coords:[44.9197,2.4328], kind:"route", plan:["Llegada antes de media tarde","Montaje en La Ponétie","Reconocer Rue du Viaduc y accesos ciclistas","Descargar o revisar el programa gratuito"], note:"Entrada operativa recomendada el 18 para empezar el festival sin prisas." },
  { day:"04", date:"19 AGO", title:"FESTIVAL · ORIENTACIÓN", base:"LA PONÉTIE", drive:"BICI + A PIE", coords:[44.9269,2.4398], kind:"festival", plan:["Primer recorrido en bicicleta","Centro y plazas principales","Bloques de espectáculos gratuitos","Regreso con margen antes de la noche"], note:"Solo programación gratuita. La selección diaria se cerrará con el programa oficial." },
  { day:"05", date:"20 AGO", title:"FESTIVAL · JORNADA COMPLETA", base:"LA PONÉTIE", drive:"BICI + A PIE", coords:[44.9282,2.4431], kind:"festival", plan:["Salida temprana en bicicleta","Primer bloque de calle","Descanso y comida","Tarde y noche de espectáculos gratuitos"], note:"Priorizar compañías de calle y dejar huecos reales entre ubicaciones." },
  { day:"06", date:"21 AGO", title:"FESTIVAL · RITMO FLEXIBLE", base:"LA PONÉTIE", drive:"BICI + A PIE", coords:[44.9253,2.4455], kind:"festival", plan:["Mañana tranquila","Programación gratuita prioritaria","Pausa larga en las horas de más calor","Segundo bloque al atardecer"], note:"Día preparado para adaptar intensidad, lluvia o cansancio." },
  { day:"07", date:"22 AGO", title:"FESTIVAL · CIERRE", base:"LA PONÉTIE", drive:"BICI + A PIE", coords:[44.9311,2.4412], kind:"festival", plan:["Últimas propuestas gratuitas","Repetir una compañía si merece la pena","Cena y cierre sin mover el coche","Preparar desmontaje"], note:"No se muestran ni presupuestan espectáculos de pago." },
  { day:"08", date:"23 AGO", title:"SALIDA DE AURILLAC", base:"CANTAL", drive:"SALIDA ANTES DE 12:00", coords:[45.0544,2.4782], kind:"nature", plan:["Desmontaje temprano","Salida recomendada antes de las 12:00","Ruta panorámica por el Cantal","Noche fuera del dispositivo del festival"], note:"Evitar quedar bloqueados por desmontajes y tráfico de salida." },
  { day:"09", date:"24 AGO", title:"CANTAL / AUBRAC", base:"ETAPA NATURAL", drive:"CARRETERAS LENTAS", coords:[44.6213,2.6616], kind:"nature", plan:["Paisaje volcánico","Pueblo o paseo corto","Gastronomía local","Descanso"], note:"Carreteras de montaña: calcular tiempos reales, no solo kilómetros." },
  { day:"10", date:"25 AGO", title:"REGRESO · ETAPA 1", base:"SUROESTE FRANCÉS", drive:"TRASLADO CON PARADAS", coords:[43.6047,1.4442], kind:"city", plan:["Desplazamiento hacia el suroeste","Parada cultural o gastronómica","Noche intermedia"], note:"Etapa abierta para decidir según energía, meteorología y alojamiento." },
  { day:"11", date:"26 AGO", title:"REGRESO · ETAPA 2", base:"CERCA DE LA FRONTERA", drive:"ACERCAMIENTO", coords:[43.4832,-1.5586], kind:"route", plan:["Acercamiento al País Vasco","Última visita breve","Dormir con el regreso resuelto"], note:"Deja el 27 como jornada cómoda, no como paliza final." },
  { day:"12", date:"27 AGO", title:"VUELTA A VITORIA", base:"FIN DEL VIAJE", drive:"REGRESO", coords:[42.8467,-2.6716], kind:"route", plan:["Salida sin prisa","Paradas de descanso","Llegada a Vitoria–Gasteiz"], note:"Cierre del viaje y exportación de gastos/notas." },
];

const festivalZones = [
  {name:"La Ponétie", coords:[44.9197,2.4328] as [number,number], detail:"Base operativa · camping y salida en bici"},
  {name:"Rue du Viaduc", coords:[44.9244,2.4371] as [number,number], detail:"Eje de acceso hacia el centro"},
  {name:"Centre-ville", coords:[44.9269,2.4398] as [number,number], detail:"Núcleo principal de programación de calle"},
  {name:"Jordanne", coords:[44.9311,2.4412] as [number,number], detail:"Zona verde y escenarios próximos"},
];

export default function AurillacPage() {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState("04");
  const [pace, setPace] = useState<"tranquilo"|"normal"|"completo">("normal");
  const active = useMemo(() => stages.find((item) => item.day === selected) || stages[3], [selected]);

  useEffect(() => {
    if (!mapNode.current || mapInstance.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, {zoomControl:false}).setView([44.9269,2.4398], 14);
      mapInstance.current = map;
      L.control.zoom({position:"bottomright"}).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:"© OpenStreetMap",
        maxZoom:19,
      }).addTo(map);
      festivalZones.forEach((zone, index) => {
        L.circleMarker(zone.coords, {
          radius:index === 0 ? 11 : 8,
          color:"#f4f0e6",
          weight:3,
          fillColor:index === 0 ? "#e35a36" : "#12695f",
          fillOpacity:1,
        }).addTo(map).bindPopup("<b>" + zone.name + "</b><br>" + zone.detail);
      });
      const bikeLine = festivalZones.map((zone) => zone.coords);
      L.polyline(bikeLine, {color:"#e35a36",weight:5,dashArray:"10 8",opacity:.9}).addTo(map);
      L.control.scale({imperial:false}).addTo(map);
    });
    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <small>BIDAIAK · FRANCIA 2026</small>
          <h1>AURILLAC<br/>EN LA CALLE</h1>
          <p>Vitoria–Gasteiz → Cantal · 15/16–27 agosto · Festival 19–22</p>
        </div>
        <div className={styles.rules}>
          <span><b>100%</b> TEATRO GRATUITO</span>
          <span><b>04</b> DÍAS DE FESTIVAL</span>
          <span><b>🚲</b> MOVILIDAD PRINCIPAL</span>
        </div>
      </header>

      <section className={styles.mapSection}>
        <div ref={mapNode} className={styles.map} aria-label="Mapa de movilidad en Aurillac"/>
        <div className={styles.mapCaption}>
          <small>MAPA OPERATIVO · AURILLAC</small>
          <h2>LA PONÉTIE → CENTRO</h2>
          <p>La bicicleta es el transporte principal. La lanzadera gratuita queda como alternativa para lluvia, cansancio o regreso nocturno.</p>
          <a href="https://www.google.com/maps/dir/44.9197,2.4328/44.9244,2.4371/44.9269,2.4398/44.9311,2.4412" target="_blank" rel="noreferrer">ABRIR RECORRIDO ↗</a>
        </div>
      </section>

      <section className={styles.control}>
        <div>
          <small>PLANIFICADOR</small>
          <h2>ELIGE EL DÍA</h2>
        </div>
        <select value={selected} onChange={(event)=>setSelected(event.target.value)}>
          {stages.map((stage)=><option value={stage.day} key={stage.day}>{stage.date} · {stage.title}</option>)}
        </select>
        <div className={styles.paces}>
          {(["tranquilo","normal","completo"] as const).map((item)=><button className={pace===item ? styles.on : ""} onClick={()=>setPace(item)} key={item}>{item.toUpperCase()}</button>)}
        </div>
      </section>

      <section className={styles.activeDay}>
        <div className={styles.dayNumber}>{active.day}</div>
        <div>
          <small>{active.date} · {active.kind.toUpperCase()}</small>
          <h2>{active.title}</h2>
          <p className={styles.meta}>{active.base} · {active.drive}</p>
          <ol>{active.plan.map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</li>)}</ol>
          <p className={styles.note}>◆ {active.note}</p>
          <div className={styles.paceAdvice}>
            <b>RITMO {pace.toUpperCase()}</b>
            {pace==="tranquilo" && <p>Una actividad principal, pausas largas y regreso temprano.</p>}
            {pace==="normal" && <p>Plan completo con dos bloques y margen real entre ubicaciones.</p>}
            {pace==="completo" && <p>Salida temprana y jornada extendida, sin encadenar horarios imposibles.</p>}
          </div>
        </div>
      </section>

      <section className={styles.timeline}>
        <header><small>RUTA COMPLETA</small><h2>15/16 → 27 AGOSTO</h2><p>Las etapas exteriores al festival quedan modulares hasta cerrar campings y alojamientos.</p></header>
        <div>{stages.map((stage)=><button className={selected===stage.day ? styles.selected : ""} onClick={()=>setSelected(stage.day)} key={stage.day}><span>{stage.day}</span><div><small>{stage.date} · {stage.base}</small><b>{stage.title}</b><p>{stage.note}</p></div></button>)}</div>
      </section>

      <section className={styles.festival}>
        <div><small>REGLA DE SELECCIÓN</small><h2>SOLO GRATIS</h2><p>La agenda de la app se limitará a espectáculos con acceso gratuito. Los de pago no aparecerán en recomendaciones, agenda ni presupuesto.</p></div>
        <div><small>OPERATIVA DIARIA</small><h2>BICI + A PIE</h2><p>Dejar el coche en La Ponétie. Candado, luces, prenda reflectante, impermeable ligero y una ubicación acordada para encontrar las bicicletas.</p></div>
        <div><small>ALTERNATIVA</small><h2>LANZADERA</h2><p>Usar la lanzadera gratuita 19–22 cuando la bici no sea práctica. Confirmar paradas y último servicio en el dispositivo del festival.</p></div>
      </section>
    </main>
  );
}
