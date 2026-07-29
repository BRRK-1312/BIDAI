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
type StageDetail = {
  distance: string; duration: string; mode: string; navigation: string;
  route: [number, number][];
  agenda: {time:string; title:string; detail:string}[];
};

const stages: Stage[] = [
  { day:"01",date:"15/16 AGO",title:"VITORIA → FRANCIA",base:"ETAPA DE APROXIMACIÓN",drive:"SALIDA FLEXIBLE",coords:[44.8378,-0.5792],kind:"route",plan:["Salida desde Vitoria–Gasteiz","Cruce de frontera con margen","Noche intermedia para no llegar cansados"],note:"La salida puede hacerse el 15 o el 16; se mantienen las dos variantes."},
  { day:"02",date:"16/17 AGO",title:"DORDOÑA / LOT",base:"BASE PREVIA",drive:"ETAPA MODULAR",coords:[44.7995,1.6179],kind:"nature",plan:["Pueblos y paisaje del valle","Paseo o baño según el tiempo","Preparar la llegada a Aurillac"],note:"Jornada flexible antes del festival. Evitar sobrecargarla."},
  { day:"03",date:"18 AGO",title:"LLEGADA A AURILLAC",base:"LA PONÉTIE",drive:"MONTAJE + RECONOCIMIENTO",coords:[44.9197,2.4328],kind:"route",plan:["Llegar antes de media tarde","Montar la base en La Ponétie","Probar el acceso en bicicleta al centro","Localizar agua, aseos, duchas y aparcabicis"],note:"El programa OFF se publica el 17 a las 14:00. Revisarlo sin llenar cada hueco."},
  { day:"04",date:"19 AGO",title:"FESTIVAL · ORIENTACIÓN",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9269,2.4398],kind:"festival",plan:["Reconocimiento de los ejes del centro","Un espectáculo prioritario gratuito","Bloque OFF libre de 2–3 horas","Regreso con margen a La Ponétie"],note:"Primer día deliberadamente abierto para entender ritmos y distancias reales."},
  { day:"05",date:"20 AGO",title:"FESTIVAL · SELECCIÓN",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9282,2.4431],kind:"festival",plan:["Primer bloque de calle","Comida y descanso largo","Uno o dos espectáculos gratuitos","Noche flexible según energía"],note:"INCONTINUO y Projet Fantôme no deben reservarse en franjas incompatibles."},
  { day:"06",date:"21 AGO",title:"FESTIVAL · OFF + NOCHE",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9253,2.4455],kind:"festival",plan:["Mañana libre para compañías OFF","Comida y descanso largo","Bleue Volute como ancla nocturna","La Louuve en Place des Carmes, si queda energía"],note:"Phoenix queda fuera del plan porque es de pago. Esta jornada conserva un bloque amplio para el OFF."},
  { day:"07",date:"22 AGO",title:"FESTIVAL · CIERRE VISUAL",base:"LA PONÉTIE",drive:"BICI + A PIE",coords:[44.9311,2.4412],kind:"festival",plan:["Últimos descubrimientos OFF","Hmadcha o Wishes Tree, según pendientes","Bleue Volute y Projet Fantôme","Regreso y preparación del desmontaje"],note:"Variante enteramente gratuita, visual y sin barreras lingüísticas."},
  { day:"08",date:"23 AGO",title:"SALIDA DE AURILLAC",base:"CANTAL",drive:"SALIDA ANTES DE 12:00",coords:[45.0544,2.4782],kind:"nature",plan:["Desmontaje temprano","Salida recomendada antes de las 12:00","Ruta panorámica por el Cantal","Noche fuera del dispositivo del festival"],note:"Evitar el tráfico y los desmontajes del cierre."},
  { day:"09",date:"24 AGO",title:"CANTAL / AUBRAC",base:"ETAPA NATURAL",drive:"CARRETERAS LENTAS",coords:[44.6213,2.6616],kind:"nature",plan:["Paisaje volcánico","Pueblo o paseo corto","Gastronomía local","Descanso"],note:"En montaña importan más los tiempos reales que los kilómetros."},
  { day:"10",date:"25 AGO",title:"REGRESO · ETAPA 1",base:"SUROESTE FRANCÉS",drive:"TRASLADO CON PARADAS",coords:[43.6047,1.4442],kind:"city",plan:["Desplazamiento hacia el suroeste","Parada cultural o gastronómica","Noche intermedia"],note:"Etapa abierta según energía, meteorología y alojamiento."},
  { day:"11",date:"26 AGO",title:"REGRESO · ETAPA 2",base:"CERCA DE LA FRONTERA",drive:"ACERCAMIENTO",coords:[43.4832,-1.5586],kind:"route",plan:["Acercamiento al País Vasco","Última visita breve","Dormir con el regreso resuelto"],note:"El 27 queda como jornada cómoda, no como una paliza final."},
  { day:"12",date:"27 AGO",title:"VUELTA A VITORIA",base:"FIN DEL VIAJE",drive:"REGRESO",coords:[42.8467,-2.6716],kind:"route",plan:["Salida sin prisa","Paradas de descanso","Llegada a Vitoria–Gasteiz"],note:"Cierre del viaje."},
];

const stageDetails: Record<string, StageDetail> = {
  "01":{distance:"≈ 355 KM",duration:"4 H 10 + PARADAS",mode:"COCHE",navigation:"https://www.google.com/maps/dir/Vitoria-Gasteiz/Bordeaux",route:[[42.8467,-2.6716],[43.4832,-1.5586],[44.8378,-0.5792]],agenda:[{time:"09:00",title:"SALIDA DE VITORIA",detail:"Primera etapa sin visitas largas."},{time:"11:30",title:"PAUSA EN LAS LANDAS",detail:"Descanso y comida ligera."},{time:"15:00",title:"BURDEOS / CAZAUX",detail:"Montaje y tarde libre."}]},
  "02":{distance:"≈ 255 KM",duration:"4 H 15 + VISITAS",mode:"COCHE + PASEO",navigation:"https://www.google.com/maps/dir/Bordeaux/Sarlat-la-Caneda/Rocamadour",route:[[44.8378,-0.5792],[44.8891,1.2165],[44.7995,1.6179]],agenda:[{time:"09:00",title:"RUMBO A SARLAT",detail:"Unas 2 h 30 desde Burdeos."},{time:"12:00",title:"SARLAT-LA-CANÉDA",detail:"Casco medieval y comida."},{time:"16:00",title:"VALLE DE LA DORDOÑA",detail:"Parada breve en La Roque-Gageac."},{time:"19:00",title:"ROCAMADOUR",detail:"Paseo y noche cerca del Lot."}]},
  "03":{distance:"≈ 145 KM",duration:"2 H 45 + MONTAJE",mode:"COCHE + BICI",navigation:"https://www.google.com/maps/dir/Rocamadour/Aurillac",route:[[44.7995,1.6179],[44.8582,1.8905],[44.9197,2.4328]],agenda:[{time:"09:30",title:"SALIDA DEL LOT",detail:"Carreteras secundarias."},{time:"13:00",title:"LA PONÉTIE",detail:"Montaje, agua y descanso."},{time:"17:30",title:"PRUEBA EN BICI",detail:"La Ponétie → centro → Jordanne."},{time:"20:00",title:"PROGRAMA OFF",detail:"Guardar 1–2 prioridades por día."}]},
  "04":{distance:"≈ 7 KM",duration:"15 MIN BICI + A PIE",mode:"BICI / A PIE",navigation:"https://www.google.com/maps/dir/44.9197,2.4328/Place+de+l'Hotel+de+Ville,+Aurillac/Parking+de+la+Tour,+Aurillac/Cours+Monthyon,+Aurillac/Square+des+Justes,+Aurillac",route:[[44.9197,2.4328],[44.9269,2.4398],[44.9283,2.4440],[44.9272,2.4377],[44.9290,2.4405],[44.9197,2.4328]],agenda:[{time:"12:30",title:"APERTURA OFICIAL",detail:"Place de l’Hôtel de Ville."},{time:"14:00",title:"BLOQUE OFF LIBRE",detail:"Explorar sin reservas hasta las 18:30."},{time:"19:00",title:"DA GOUSKATE!",detail:"Parking de la Tour · 45 min · gratis."},{time:"20:00",title:"WISHES TREE",detail:"Cours Monthyon · 1 h · gratis."},{time:"23:00",title:"PROJET FANTÔME",detail:"Square des Justes · 25 min · gratis."}]},
  "05":{distance:"≈ 8 KM",duration:"20 MIN BICI + A PIE",mode:"BICI / A PIE",navigation:"https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Place+des+Carmes,+Aurillac/Chateau+Saint-Etienne,+Aurillac",route:[[44.9197,2.4328],[44.9272,2.4377],[44.9254,2.4425],[44.9304,2.4407],[44.9197,2.4328]],agenda:[{time:"11:00",title:"WISHES TREE / KMs OF RESISTANCE",detail:"Elegir una propuesta gratuita."},{time:"12:15",title:"OFF + COMIDA",detail:"Bloque libre y descanso."},{time:"20:00",title:"HMADCHA",detail:"Place des Carmes · 1 h 10 · gratis."},{time:"22:00",title:"INCONTINUO",detail:"Château Saint-Étienne · 1 h 15 · gratis."}]},
  "06":{distance:"≈ 6 KM",duration:"15 MIN BICI + A PIE",mode:"BICI / A PIE",navigation:"https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Place+des+Carmes,+Aurillac",route:[[44.9197,2.4328],[44.9272,2.4377],[44.9228,2.4460],[44.9254,2.4425],[44.9197,2.4328]],agenda:[{time:"11:00",title:"PROGRAMA OFF",detail:"Selección espontánea por cercanía."},{time:"13:00",title:"COMIDA + DESCANSO",detail:"Tres horas sin agenda cerrada."},{time:"17:00",title:"SEGUNDO BLOQUE OFF",detail:"No encadenar barrios."},{time:"21:45",title:"BLEUE VOLUTE",detail:"Rue du Pont d’Aliès · gratis."},{time:"23:45",title:"LA LOUUVE",detail:"Place des Carmes · DJ set."}]},
  "07":{distance:"≈ 8 KM",duration:"20 MIN BICI + A PIE",mode:"BICI / A PIE",navigation:"https://www.google.com/maps/dir/44.9197,2.4328/Place+des+Carmes,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Square+des+Justes,+Aurillac",route:[[44.9197,2.4328],[44.9254,2.4425],[44.9228,2.4460],[44.9290,2.4405],[44.9197,2.4328]],agenda:[{time:"11:00",title:"PROGRAMA OFF",detail:"Última mañana para compañías de paso."},{time:"14:00",title:"COMIDA + DESCUBRIMIENTOS",detail:"Bloque libre."},{time:"20:00",title:"HMADCHA O WISHES TREE",detail:"Solo la que siga pendiente · gratis."},{time:"21:45",title:"BLEUE VOLUTE",detail:"Rue du Pont d’Aliès · gratis."},{time:"23:00",title:"PROJET FANTÔME",detail:"Si no se vio el miércoles · gratis."}]},
  "08":{distance:"≈ 95 KM",duration:"2 H 40 + PARADAS",mode:"COCHE + SENDERO",navigation:"https://www.google.com/maps/dir/Aurillac/Salers/Puy+Mary",route:[[44.9197,2.4328],[45.1384,2.4948],[45.1086,2.6768]],agenda:[{time:"08:00",title:"DESMONTAJE",detail:"Salir antes del tráfico de cierre."},{time:"11:30",title:"SALERS",detail:"Pueblo volcánico y comida."},{time:"16:00",title:"PUY MARY",detail:"Mirador o subida corta."},{time:"19:00",title:"NOCHE EN EL CANTAL",detail:"Base tranquila fuera de Aurillac."}]},
  "09":{distance:"≈ 175 KM",duration:"4 H 10 + VISITAS",mode:"COCHE + PASEO",navigation:"https://www.google.com/maps/dir/Puy+Mary/Conques/Laguiole",route:[[45.1086,2.6768],[44.5995,2.3971],[44.6840,2.8472]],agenda:[{time:"09:00",title:"SALIDA DEL CANTAL",detail:"Carretera panorámica."},{time:"12:00",title:"CONQUES",detail:"Pueblo, abadía y comida."},{time:"16:30",title:"MESETA DE AUBRAC",detail:"Parada paisajística."},{time:"18:30",title:"LAGUIOLE",detail:"Cena y descanso."}]},
  "10":{distance:"≈ 235 KM",duration:"3 H 30 + VISITA",mode:"COCHE + A PIE",navigation:"https://www.google.com/maps/dir/Laguiole/Albi/Toulouse",route:[[44.6840,2.8472],[43.9280,2.1480],[43.6047,1.4442]],agenda:[{time:"09:00",title:"SALIDA DE LAGUIOLE",detail:"Bajada hacia el Tarn."},{time:"12:00",title:"ALBI",detail:"Catedral, centro y comida."},{time:"16:30",title:"RUMBO A TOULOUSE",detail:"A68 · aproximadamente una hora."},{time:"19:00",title:"PASEO JUNTO AL GARONA",detail:"Cena sin más coche."}]},
  "11":{distance:"≈ 300 KM",duration:"3 H 20 + PARADAS",mode:"COCHE",navigation:"https://www.google.com/maps/dir/Toulouse/Bayonne",route:[[43.6047,1.4442],[43.2970,-0.3708],[43.4832,-1.5586]],agenda:[{time:"10:00",title:"SALIDA DE TOULOUSE",detail:"Etapa sencilla por la A64."},{time:"12:30",title:"PAUSA EN PAU",detail:"Comida y descanso."},{time:"16:30",title:"BAYONA",detail:"Paseo o playa según energía."}]},
  "12":{distance:"≈ 155 KM",duration:"2 H + PARADA",mode:"COCHE",navigation:"https://www.google.com/maps/dir/Bayonne/Vitoria-Gasteiz",route:[[43.4832,-1.5586],[43.3183,-1.9812],[42.8467,-2.6716]],agenda:[{time:"10:30",title:"SALIDA SIN PRISA",detail:"Última revisión del equipaje."},{time:"12:00",title:"PARADA BREVE",detail:"Café antes de entrar en Álava."},{time:"14:00",title:"VITORIA–GASTEIZ",detail:"Llegada y fin del viaje."}]},
};

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
  ["SOLO GRATIS","TODOS LOS DÍAS","Las propuestas de pago quedan fuera del plan y de la agenda recomendada."],
  ["INCONTINUO / PROJET FANTÔME","NO ENCADENAR","Elegir uno si sus horarios vuelven a solaparse."],
  ["HMADCHA → INCONTINUO","MARGEN AJUSTADO","Salir directamente de Carmes al Château; no añadir ninguna parada intermedia."],
  ["HARAS NATIONAL","TRASLADO ESPECÍFICO","Reservar margen; no está en el núcleo compacto del centro."],
];

export default function AurillacPage() {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const routeLayer = useRef<LayerGroup | null>(null);
  const [selected, setSelected] = useState("01");
  const [pace, setPace] = useState<Pace>("normal");
  const [filter, setFilter] = useState<"all"|Place["category"]>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const active = useMemo(() => stages.find((item) => item.day === selected) || stages[3], [selected]);
  const activeDetail = stageDetails[active.day];
  const visiblePlaces = useMemo(() => places.filter(place => filter === "all" || place.category === filter), [filter]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("aurillac-saved") || "[]"));
      const storedDay = localStorage.getItem("aurillac-day");
      setSelected(storedDay && stages.some(stage => stage.day === storedDay) ? storedDay : "01");
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
      routeLayer.current = L.layerGroup().addTo(map);
      L.control.scale({imperial:false}).addTo(map);
      setMapReady(true);
    });
    return () => { cancelled=true; mapInstance.current?.remove(); mapInstance.current=null; markerLayer.current=null; routeLayer.current=null; };
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
  }, [visiblePlaces, mapReady]);

  useEffect(() => {
    if (!mapInstance.current || !routeLayer.current) return;
    import("leaflet").then((L) => {
      routeLayer.current?.clearLayers();
      const line = L.polyline(activeDetail.route,{color:"#e45532",weight:5,dashArray:active.kind==="festival"?"10 8":undefined,opacity:.95}).addTo(routeLayer.current!);
      activeDetail.route.forEach((point,index) => L.circleMarker(point,{radius:index===0||index===activeDetail.route.length-1?7:5,color:"#20201d",weight:2,fillColor:"#f4f0e6",fillOpacity:1}).addTo(routeLayer.current!));
      mapInstance.current?.fitBounds(line.getBounds(),{padding:[38,38],maxZoom:active.kind==="festival"?15:9});
    });
  }, [active, activeDetail, mapReady]);

  function chooseDay(day: string) {
    setSelected(day);
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
        <a href="#ruta">VIAJE COMPLETO</a><a href="#mapa">MAPA</a><a href="#day-plan">DÍA</a><a href="#agenda">AGENDA</a><a href="#servicios">SERVICIOS</a>
      </nav>

      <section className={styles.dayStrip} aria-label="Trayectos y planes por día">
        <header><small>VIAJE COMPLETO · IDA + FESTIVAL + VUELTA</small><strong>SELECCIONA UN DÍA PARA VER SU TRAYECTO Y AGENDA</strong></header>
        <div>
          {stages.map(stage=><button type="button" className={selected===stage.day?styles.dayStripActive:""} onClick={()=>chooseDay(stage.day)} key={stage.day}><span>{stage.day}</span><small>{stage.date}</small><b>{stage.title}</b></button>)}
        </div>
      </section>

      <section className={styles.mapSection} id="mapa">
        <div className={styles.mapWrap}>
          <div ref={mapNode} className={styles.map} aria-label="Mapa operativo de Aurillac"/>
          <div className={styles.filters}>
            {(["all","base","festival","service","transport"] as const).map(item=><button key={item} className={filter===item?styles.filterOn:""} onClick={()=>setFilter(item)}>{item==="all"?"TODO":item==="service"?"SERVICIOS":item==="transport"?"TRANSPORTE":item.toUpperCase()}</button>)}
          </div>
        </div>
        <div className={styles.mapCaption}><small>TRAYECTO DEL DÍA · {active.date}</small><h2>{active.title}</h2><p>{active.plan.join(" · ")}</p><div className={styles.metric}><b>{activeDetail.distance}</b><span>DISTANCIA APROXIMADA</span></div><div className={styles.metric}><b>{activeDetail.duration}</b><span>{activeDetail.mode}</span></div><a href={activeDetail.navigation} target="_blank" rel="noreferrer">ABRIR RUTA EN GOOGLE MAPS ↗</a></div>
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
          <div style={{marginTop:24,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",border:"1px solid currentColor"}}>
            <div style={{padding:16,display:"grid",gap:8,borderRight:"1px solid currentColor"}}><small>TRAYECTO</small><b>{activeDetail.distance}</b><span>{activeDetail.duration}</span></div>
            <div style={{padding:16,display:"grid",gap:8}}><small>MODO</small><b>{activeDetail.mode}</b><a href={activeDetail.navigation} target="_blank" rel="noreferrer">NAVEGAR ↗</a></div>
          </div>
          <div style={{marginTop:20,borderTop:"1px solid currentColor",paddingTop:18}}>
            <small>AGENDA DEL DÍA</small>
            {activeDetail.agenda.map(item=><article style={{display:"grid",gridTemplateColumns:"72px 1fr",gap:16,padding:"14px 0",borderBottom:"1px solid rgba(32,32,29,.24)"}} key={`${item.time}-${item.title}`}><time style={{fontFamily:"monospace",fontWeight:900,color:"#e45532"}}>{item.time}</time><div><b>{item.title}</b><p style={{margin:"4px 0 0",fontSize:10}}>{item.detail}</p></div></article>)}
          </div>
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
