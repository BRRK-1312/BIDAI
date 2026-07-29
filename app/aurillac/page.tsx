"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./aurillac.module.css";

type Pace = "tranquilo" | "normal" | "completo";
type Section = "today" | "days" | "discover" | "plan" | "saved";
type PlaceCategory = "base" | "festival" | "service" | "transport";
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
type StageDetail = {
  distance: string;
  duration: string;
  mode: string;
  navigation: string;
  route: [number, number][];
  agenda: { time: string; title: string; detail: string }[];
};
type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  coords: [number, number];
  detail: string;
};

const stages: Stage[] = [
  { day: "01", date: "15/16 AGO", title: "VITORIA → FRANCIA", base: "ETAPA DE APROXIMACIÓN", drive: "SALIDA FLEXIBLE", coords: [44.8378, -0.5792], kind: "route", plan: ["Salida desde Vitoria–Gasteiz", "Cruce de frontera con margen", "Noche intermedia para no llegar cansados"], note: "La salida puede hacerse el 15 o el 16; se mantienen las dos variantes." },
  { day: "02", date: "16/17 AGO", title: "DORDOÑA / LOT", base: "BASE PREVIA", drive: "ETAPA MODULAR", coords: [44.7995, 1.6179], kind: "nature", plan: ["Pueblos y paisaje del valle", "Paseo o baño según el tiempo", "Preparar la llegada a Aurillac"], note: "Jornada flexible antes del festival. Evitar sobrecargarla." },
  { day: "03", date: "18 AGO", title: "LLEGADA A AURILLAC", base: "LA PONÉTIE", drive: "MONTAJE + RECONOCIMIENTO", coords: [44.9197, 2.4328], kind: "route", plan: ["Llegar antes de media tarde", "Montar la base en La Ponétie", "Probar el acceso en bicicleta al centro", "Localizar agua, aseos, duchas y aparcabicis"], note: "El programa OFF se publica el 17 a las 14:00. Revisarlo sin llenar cada hueco." },
  { day: "04", date: "19 AGO", title: "FESTIVAL · ORIENTACIÓN", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9269, 2.4398], kind: "festival", plan: ["Reconocimiento de los ejes del centro", "Un espectáculo prioritario gratuito", "Bloque OFF libre de 2–3 horas", "Regreso con margen a La Ponétie"], note: "Primer día deliberadamente abierto para entender ritmos y distancias reales." },
  { day: "05", date: "20 AGO", title: "FESTIVAL · SELECCIÓN", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9282, 2.4431], kind: "festival", plan: ["Primer bloque de calle", "Comida y descanso largo", "Uno o dos espectáculos gratuitos", "Noche flexible según energía"], note: "INCONTINUO y Projet Fantôme no deben reservarse en franjas incompatibles." },
  { day: "06", date: "21 AGO", title: "FESTIVAL · OFF + NOCHE", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9253, 2.4455], kind: "festival", plan: ["Mañana libre para compañías OFF", "Comida y descanso largo", "Bleue Volute como ancla nocturna", "La Louuve en Place des Carmes, si queda energía"], note: "Phoenix queda fuera del plan porque es de pago. Esta jornada conserva un bloque amplio para el OFF." },
  { day: "07", date: "22 AGO", title: "FESTIVAL · CIERRE VISUAL", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9311, 2.4412], kind: "festival", plan: ["Últimos descubrimientos OFF", "Hmadcha o Wishes Tree, según pendientes", "Bleue Volute y Projet Fantôme", "Regreso y preparación del desmontaje"], note: "Variante enteramente gratuita, visual y sin barreras lingüísticas." },
  { day: "08", date: "23 AGO", title: "SALIDA DE AURILLAC", base: "CANTAL", drive: "SALIDA ANTES DE 12:00", coords: [45.1086, 2.6768], kind: "nature", plan: ["Desmontaje temprano", "Salida recomendada antes de las 12:00", "Ruta panorámica por el Cantal", "Noche fuera del dispositivo del festival"], note: "Evitar el tráfico y los desmontajes del cierre." },
  { day: "09", date: "24 AGO", title: "CANTAL / AUBRAC", base: "ETAPA NATURAL", drive: "CARRETERAS LENTAS", coords: [44.684, 2.8472], kind: "nature", plan: ["Paisaje volcánico", "Pueblo o paseo corto", "Gastronomía local", "Descanso"], note: "En montaña importan más los tiempos reales que los kilómetros." },
  { day: "10", date: "25 AGO", title: "ALBI / TOULOUSE", base: "SUROESTE FRANCÉS", drive: "TRASLADO CON PARADAS", coords: [43.6047, 1.4442], kind: "city", plan: ["Desplazamiento hacia el suroeste", "Parada cultural en Albi", "Paseo y noche en Toulouse"], note: "Etapa abierta según energía, meteorología y alojamiento." },
  { day: "11", date: "26 AGO", title: "TOULOUSE → BAYONA", base: "CERCA DE LA FRONTERA", drive: "ACERCAMIENTO", coords: [43.4832, -1.5586], kind: "route", plan: ["Acercamiento al País Vasco", "Pausa en Pau", "Dormir con el regreso resuelto"], note: "El 27 queda como jornada cómoda, no como una paliza final." },
  { day: "12", date: "27 AGO", title: "VUELTA A VITORIA", base: "FIN DEL VIAJE", drive: "REGRESO", coords: [42.8467, -2.6716], kind: "route", plan: ["Salida sin prisa", "Paradas de descanso", "Llegada a Vitoria–Gasteiz"], note: "Cierre del viaje." },
];

const stageDetails: Record<string, StageDetail> = {
  "01": { distance: "≈ 355 KM", duration: "4 H 10 + PARADAS", mode: "COCHE", navigation: "https://www.google.com/maps/dir/Vitoria-Gasteiz/Bordeaux", route: [[42.8467, -2.6716], [43.4832, -1.5586], [44.8378, -0.5792]], agenda: [{ time: "09:00", title: "SALIDA DE VITORIA", detail: "Primera etapa sin visitas largas." }, { time: "11:30", title: "PAUSA EN LAS LANDAS", detail: "Descanso y comida ligera." }, { time: "15:00", title: "BURDEOS / CAZAUX", detail: "Montaje y tarde libre." }] },
  "02": { distance: "≈ 255 KM", duration: "4 H 15 + VISITAS", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Bordeaux/Sarlat-la-Caneda/Rocamadour", route: [[44.8378, -0.5792], [44.8891, 1.2165], [44.7995, 1.6179]], agenda: [{ time: "09:00", title: "RUMBO A SARLAT", detail: "Unas 2 h 30 desde Burdeos." }, { time: "12:00", title: "SARLAT-LA-CANÉDA", detail: "Casco medieval y comida." }, { time: "16:00", title: "VALLE DE LA DORDOÑA", detail: "Parada breve en La Roque-Gageac." }, { time: "19:00", title: "ROCAMADOUR", detail: "Paseo y noche cerca del Lot." }] },
  "03": { distance: "≈ 145 KM", duration: "2 H 45 + MONTAJE", mode: "COCHE + BICI", navigation: "https://www.google.com/maps/dir/Rocamadour/Aurillac", route: [[44.7995, 1.6179], [44.8582, 1.8905], [44.9197, 2.4328]], agenda: [{ time: "09:30", title: "SALIDA DEL LOT", detail: "Carreteras secundarias." }, { time: "13:00", title: "LA PONÉTIE", detail: "Montaje, agua y descanso." }, { time: "17:30", title: "PRUEBA EN BICI", detail: "La Ponétie → centro → Jordanne." }, { time: "20:00", title: "PROGRAMA OFF", detail: "Guardar 1–2 prioridades por día." }] },
  "04": { distance: "≈ 7 KM", duration: "15 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Place+de+l'Hotel+de+Ville,+Aurillac/Parking+de+la+Tour,+Aurillac/Cours+Monthyon,+Aurillac/Square+des+Justes,+Aurillac", route: [[44.9197, 2.4328], [44.9269, 2.4398], [44.9283, 2.444], [44.9272, 2.4377], [44.929, 2.4405], [44.9197, 2.4328]], agenda: [{ time: "12:30", title: "APERTURA OFICIAL", detail: "Place de l’Hôtel de Ville." }, { time: "14:00", title: "BLOQUE OFF LIBRE", detail: "Explorar sin reservas hasta las 18:30." }, { time: "19:00", title: "DA GOUSKATE!", detail: "Parking de la Tour · 45 min · gratis." }, { time: "20:00", title: "WISHES TREE", detail: "Cours Monthyon · 1 h · gratis." }, { time: "23:00", title: "PROJET FANTÔME", detail: "Square des Justes · 25 min · gratis." }] },
  "05": { distance: "≈ 8 KM", duration: "20 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Place+des+Carmes,+Aurillac/Chateau+Saint-Etienne,+Aurillac", route: [[44.9197, 2.4328], [44.9272, 2.4377], [44.9254, 2.4425], [44.9304, 2.4407], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "WISHES TREE / KMs OF RESISTANCE", detail: "Elegir una propuesta gratuita." }, { time: "12:15", title: "OFF + COMIDA", detail: "Bloque libre y descanso." }, { time: "20:00", title: "HMADCHA", detail: "Place des Carmes · 1 h 10 · gratis." }, { time: "22:00", title: "INCONTINUO", detail: "Château Saint-Étienne · 1 h 15 · gratis." }] },
  "06": { distance: "≈ 6 KM", duration: "15 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Place+des+Carmes,+Aurillac", route: [[44.9197, 2.4328], [44.9272, 2.4377], [44.9228, 2.446], [44.9254, 2.4425], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "PROGRAMA OFF", detail: "Selección espontánea por cercanía." }, { time: "13:00", title: "COMIDA + DESCANSO", detail: "Tres horas sin agenda cerrada." }, { time: "17:00", title: "SEGUNDO BLOQUE OFF", detail: "No encadenar barrios." }, { time: "21:45", title: "BLEUE VOLUTE", detail: "Rue du Pont d’Aliès · gratis." }, { time: "23:45", title: "LA LOUUVE", detail: "Place des Carmes · DJ set." }] },
  "07": { distance: "≈ 8 KM", duration: "20 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Place+des+Carmes,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Square+des+Justes,+Aurillac", route: [[44.9197, 2.4328], [44.9254, 2.4425], [44.9228, 2.446], [44.929, 2.4405], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "PROGRAMA OFF", detail: "Última mañana para compañías de paso." }, { time: "14:00", title: "COMIDA + DESCUBRIMIENTOS", detail: "Bloque libre." }, { time: "20:00", title: "HMADCHA O WISHES TREE", detail: "Solo la que siga pendiente · gratis." }, { time: "21:45", title: "BLEUE VOLUTE", detail: "Rue du Pont d’Aliès · gratis." }, { time: "23:00", title: "PROJET FANTÔME", detail: "Si no se vio el miércoles · gratis." }] },
  "08": { distance: "≈ 95 KM", duration: "2 H 40 + PARADAS", mode: "COCHE + SENDERO", navigation: "https://www.google.com/maps/dir/Aurillac/Salers/Puy+Mary", route: [[44.9197, 2.4328], [45.1384, 2.4948], [45.1086, 2.6768]], agenda: [{ time: "08:00", title: "DESMONTAJE", detail: "Salir antes del tráfico de cierre." }, { time: "11:30", title: "SALERS", detail: "Pueblo volcánico y comida." }, { time: "16:00", title: "PUY MARY", detail: "Mirador o subida corta." }, { time: "19:00", title: "NOCHE EN EL CANTAL", detail: "Base tranquila fuera de Aurillac." }] },
  "09": { distance: "≈ 175 KM", duration: "4 H 10 + VISITAS", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Puy+Mary/Conques/Laguiole", route: [[45.1086, 2.6768], [44.5995, 2.3971], [44.684, 2.8472]], agenda: [{ time: "09:00", title: "SALIDA DEL CANTAL", detail: "Carretera panorámica." }, { time: "12:00", title: "CONQUES", detail: "Pueblo, abadía y comida." }, { time: "16:30", title: "MESETA DE AUBRAC", detail: "Parada paisajística." }, { time: "18:30", title: "LAGUIOLE", detail: "Cena y descanso." }] },
  "10": { distance: "≈ 235 KM", duration: "3 H 30 + VISITA", mode: "COCHE + A PIE", navigation: "https://www.google.com/maps/dir/Laguiole/Albi/Toulouse", route: [[44.684, 2.8472], [43.928, 2.148], [43.6047, 1.4442]], agenda: [{ time: "09:00", title: "SALIDA DE LAGUIOLE", detail: "Bajada hacia el Tarn." }, { time: "12:00", title: "ALBI", detail: "Catedral, centro y comida." }, { time: "16:30", title: "RUMBO A TOULOUSE", detail: "A68 · aproximadamente una hora." }, { time: "19:00", title: "PASEO JUNTO AL GARONA", detail: "Cena sin más coche." }] },
  "11": { distance: "≈ 300 KM", duration: "3 H 20 + PARADAS", mode: "COCHE", navigation: "https://www.google.com/maps/dir/Toulouse/Bayonne", route: [[43.6047, 1.4442], [43.297, -0.3708], [43.4832, -1.5586]], agenda: [{ time: "10:00", title: "SALIDA DE TOULOUSE", detail: "Etapa sencilla por la A64." }, { time: "12:30", title: "PAUSA EN PAU", detail: "Comida y descanso." }, { time: "16:30", title: "BAYONA", detail: "Paseo o playa según energía." }] },
  "12": { distance: "≈ 155 KM", duration: "2 H + PARADA", mode: "COCHE", navigation: "https://www.google.com/maps/dir/Bayonne/Vitoria-Gasteiz", route: [[43.4832, -1.5586], [43.3183, -1.9812], [42.8467, -2.6716]], agenda: [{ time: "10:30", title: "SALIDA SIN PRISA", detail: "Última revisión del equipaje." }, { time: "12:00", title: "PARADA BREVE", detail: "Café antes de entrar en Álava." }, { time: "14:00", title: "VITORIA–GASTEIZ", detail: "Llegada y fin del viaje." }] },
};

const places: Place[] = [
  { id: "ponetie", name: "La Ponétie", category: "base", coords: [44.9197, 2.4328], detail: "Base operativa · salida en bici" },
  { id: "centre", name: "Centre-ville", category: "festival", coords: [44.9269, 2.4398], detail: "Núcleo principal de teatro de calle" },
  { id: "carmes", name: "Place des Carmes", category: "festival", coords: [44.9254, 2.4425], detail: "Escenario y encuentro nocturno" },
  { id: "jardins", name: "Jardins de la Jordanne", category: "festival", coords: [44.9311, 2.4412], detail: "Zona verde y programación próxima" },
  { id: "haras", name: "Haras National", category: "transport", coords: [44.9348, 2.4321], detail: "Ubicación periférica · calcular traslado" },
  { id: "office", name: "Oficina del festival", category: "service", coords: [44.9265, 2.4407], detail: "Programa, cambios y ayuda operativa" },
  { id: "hospital", name: "Centre Hospitalier", category: "service", coords: [44.9217, 2.4555], detail: "Asistencia sanitaria" },
  { id: "station", name: "Gare d’Aurillac", category: "transport", coords: [44.9209, 2.4356], detail: "Tren y referencia de movilidad" },
];

const conflictRules = [
  ["SOLO GRATIS", "TODOS LOS DÍAS", "Las propuestas de pago quedan fuera del plan y de la agenda recomendada."],
  ["INCONTINUO / PROJET FANTÔME", "NO ENCADENAR", "Elegir uno si sus horarios vuelven a solaparse."],
  ["HMADCHA → INCONTINUO", "MARGEN AJUSTADO", "Salir directamente de Carmes al Château; no añadir ninguna parada intermedia."],
  ["HARAS NATIONAL", "TRASLADO ESPECÍFICO", "Reservar margen; no está en el núcleo compacto del centro."],
];

export default function AurillacPage() {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const routeLayer = useRef<LayerGroup | null>(null);
  const [selected, setSelected] = useState("01");
  const [activeSection, setActiveSection] = useState<Section>("today");
  const [pace, setPace] = useState<Pace>("normal");
  const [filter, setFilter] = useState<"all" | PlaceCategory>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const active = useMemo(() => stages.find((stage) => stage.day === selected) || stages[0], [selected]);
  const detail = stageDetails[active.day];
  const visiblePlaces = useMemo(() => places.filter((place) => filter === "all" || place.category === filter), [filter]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("aurillac-saved") || "[]"));
      const storedDay = localStorage.getItem("aurillac-day");
      setSelected(storedDay && stages.some((stage) => stage.day === storedDay) ? storedDay : "01");
      setPace((localStorage.getItem("aurillac-pace") as Pace) || "normal");
    } catch {
      setSaved([]);
    }
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
      const map = L.map(mapNode.current, { zoomControl: false, scrollWheelZoom: false }).setView([44.926, 2.44], 14);
      mapInstance.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
      markerLayer.current = L.layerGroup().addTo(map);
      routeLayer.current = L.layerGroup().addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
      setMapReady(true);
    });
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerLayer.current = null;
      routeLayer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerLayer.current) return;
    import("leaflet").then((L) => {
      markerLayer.current?.clearLayers();
      const colors = { base: "#e5482c", festival: "#2f7d5b", service: "#1779a8", transport: "#7d4b91" };
      visiblePlaces.forEach((place) => {
        L.circleMarker(place.coords, { radius: place.category === "base" ? 11 : 8, color: "#f4f0e6", weight: 3, fillColor: colors[place.category], fillOpacity: 1 })
          .addTo(markerLayer.current!)
          .bindPopup(`<b>${place.name}</b><br>${place.detail}`);
      });
    });
  }, [visiblePlaces, mapReady]);

  useEffect(() => {
    if (!mapInstance.current || !routeLayer.current) return;
    import("leaflet").then((L) => {
      routeLayer.current?.clearLayers();
      const line = L.polyline(detail.route, { color: "#e5482c", weight: 5, dashArray: active.kind === "festival" ? "10 8" : undefined, opacity: 0.95 }).addTo(routeLayer.current!);
      detail.route.forEach((point, index) => L.circleMarker(point, { radius: index === 0 || index === detail.route.length - 1 ? 7 : 5, color: "#20201d", weight: 2, fillColor: "#f4f0e6", fillOpacity: 1 }).addTo(routeLayer.current!));
      mapInstance.current?.fitBounds(line.getBounds(), { padding: [38, 38], maxZoom: active.kind === "festival" ? 15 : 9 });
    });
  }, [active, detail, mapReady]);

  function chooseDay(day: string) {
    setSelected(day);
    setActiveSection("today");
  }

  function focusPlace(place: Place) {
    mapInstance.current?.flyTo(place.coords, 16);
  }

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main className={styles.page}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">N↗P</span>
          <div><strong>BIDAIAK</strong><small>GUÍA DE VIAJE · 2026</small></div>
        </div>
        <div className="trip-meta">
          <span>15/16–27 AGO</span><span>12 DÍAS</span><span>FRANCIA</span>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <div className="intro">
            <p className="eyebrow">RUTA INTERACTIVA</p>
            <h1>AURILLAC<br />EN LA CALLE</h1>
            <p className="lede">Vitoria → Dordoña → Aurillac → Cantal → Toulouse → Vitoria</p>
          </div>
          <div className="base-tabs" role="tablist" aria-label="Filtrar lugares">
            {(["all", "base", "festival", "service"] as const).map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>
                {item === "all" ? "TODO" : item === "base" ? "BASE" : item === "festival" ? "FESTIVAL" : "ÚTIL"}
              </button>
            ))}
          </div>
          <div className="stop-list">
            {visiblePlaces.map((place, index) => (
              <article className={`stop-card ${place.category === "base" ? "camp" : ""}`} key={place.id}>
                <button className="stop-main" onClick={() => focusPlace(place)}>
                  <span className="stop-index">{String(index + 1).padStart(2, "0")}</span>
                  <span><small>{place.category.toUpperCase()}</small><strong>{place.name}</strong><em>{place.detail}</em></span>
                  <b>⌖</b>
                </button>
                <div className="mini-actions">
                  <button className={saved.includes(place.id) ? "active" : ""} onClick={() => toggleSaved(place.id)}>{saved.includes(place.id) ? "♥ GUARDADO" : "♡ GUARDAR"}</button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="map-panel" id="map">
          <div ref={mapNode} className={styles.mapCanvas} aria-label="Mapa del viaje a Aurillac" />
          <div className="map-title"><span>DÍA {active.day} · {active.date}</span><strong>{active.title}</strong></div>
          <div className={styles.routeSummary}>
            <span><b>{detail.distance}</b>DISTANCIA</span>
            <span><b>{detail.duration}</b>{detail.mode}</span>
            <a href={detail.navigation} target="_blank" rel="noreferrer">NAVEGAR ↗</a>
          </div>
          <div className="transport-legend">
            <span><i /> COCHE</span><span><i /> BICI / A PIE</span><small>TRAYECTO DEL DÍA ACTIVO</small>
          </div>
          <div className="legend">
            {(["all", "base", "festival", "service", "transport"] as const).map((item) => (
              <button key={item} onClick={() => setFilter(item)}><i className={styles[item]} /><span><b>{item === "all" ? "TODO" : item.toUpperCase()}</b></span></button>
            ))}
          </div>
        </section>

        <aside className="route-panel">
          <div className="route-head">
            <p className="eyebrow">GUÍA DE VIAJE</p>
            <h2>{active.date}<br />{active.title}</h2>
            <p>{active.base} · {active.drive}</p>
          </div>
          <div className="guide-tabs" role="tablist" aria-label="Contenido de la guía">
            <button className={activeSection === "today" ? "active" : ""} onClick={() => setActiveSection("today")}>HOY</button>
            <button className={activeSection === "days" ? "active" : ""} onClick={() => setActiveSection("days")}>DÍAS</button>
            <button className={activeSection === "discover" ? "active" : ""} onClick={() => setActiveSection("discover")}>DESCUBRIR</button>
            <button className={activeSection === "plan" ? "active" : ""} onClick={() => setActiveSection("plan")}>PLANIFICAR</button>
            <button className={activeSection === "saved" ? "active" : ""} onClick={() => setActiveSection("saved")}>MI VIAJE</button>
          </div>

          {activeSection === "today" && (
            <div className={styles.panel}>
              <section className={styles.todayHero}>
                <small>PLAN DEL DÍA · {detail.mode}</small><h3>{active.title}</h3>
                <div><b>{detail.distance}</b><span>{detail.duration}</span></div>
                <a href={detail.navigation} target="_blank" rel="noreferrer">ABRIR RUTA EN GOOGLE MAPS ↗</a>
              </section>
              <section className={styles.block}>
                <small>INTENSIDAD</small>
                <div className="pace-picker">{(["tranquilo", "normal", "completo"] as const).map((item) => <button className={pace === item ? "active" : ""} key={item} onClick={() => setPace(item)}>{item.toUpperCase()}</button>)}</div>
              </section>
              <section className={styles.block}>
                <small>RECORRIDO</small>
                <ol className={styles.planList}>{active.plan.slice(0, pace === "tranquilo" ? 3 : pace === "normal" ? 4 : 5).map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></li>)}</ol>
              </section>
              <section className={styles.block}>
                <small>AGENDA DEL DÍA</small>
                <div className={styles.agenda}>{detail.agenda.map((item) => <article key={`${item.time}-${item.title}`}><time>{item.time}</time><div><b>{item.title}</b><p>{item.detail}</p></div></article>)}</div>
              </section>
              <p className={styles.note}>◆ {active.note}</p>
            </div>
          )}

          {activeSection === "days" && (
            <div className="day-list">
              {stages.map((stage) => (
                <article className={selected === stage.day ? "selected" : ""} key={stage.day}>
                  <button onClick={() => chooseDay(stage.day)}><span>{stage.day}</span><div><b>{stage.date}</b><strong>{stage.title}</strong><small>{stage.base} · {stageDetails[stage.day].distance}</small></div></button>
                  {selected === stage.day && <div className="day-detail"><div className="day-base">{stage.drive}</div><section><small>PLAN</small><p>{stage.plan.join(" · ")}</p></section><a className={styles.fullLink} href={stageDetails[stage.day].navigation} target="_blank" rel="noreferrer">ABRIR TRAYECTO ↗</a></div>}
                </article>
              ))}
            </div>
          )}

          {activeSection === "discover" && (
            <div className="section-hub">
              {places.map((place, index) => <button key={place.id} onClick={() => { setFilter(place.category); focusPlace(place); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{place.name}</strong><p>{place.detail}</p></button>)}
            </div>
          )}

          {activeSection === "plan" && (
            <div className={styles.panel}>
              <section className={styles.block}><small>REGLAS DE DECISIÓN</small><h3>NO ENCADENAR LO IMPOSIBLE</h3><p>Uno o dos espectáculos prioritarios por día y un bloque libre de 2–3 horas.</p></section>
              <div className={styles.rules}>{conflictRules.map(([name, status, note]) => <article key={name}><small>{status}</small><b>{name}</b><p>{note}</p><button className={saved.includes(name) ? styles.saved : ""} onClick={() => toggleSaved(name)}>{saved.includes(name) ? "♥ GUARDADO" : "♡ GUARDAR"}</button></article>)}</div>
              <section className={styles.block}><small>ANTES DE SALIR EN BICI</small><div className={styles.checks}>{["Agua llena", "Luces cargadas", "Candado", "Impermeable", "Punto de regreso", "Última lanzadera"].map((item) => <label key={item}><input type="checkbox" />{item}</label>)}</div></section>
            </div>
          )}

          {activeSection === "saved" && (
            <div className="offline-panel">
              <div className="offline-alert"><b>MI VIAJE</b><p>Las selecciones se guardan en este navegador.</p></div>
              <section className="saved-section"><h3>GUARDADOS · {saved.length}</h3>{saved.length === 0 ? <p>Aún no has guardado lugares o reglas.</p> : <div className="tag-list">{saved.map((item) => <button key={item} onClick={() => toggleSaved(item)}>♥ {places.find((place) => place.id === item)?.name || item} ×</button>)}</div>}</section>
            </div>
          )}
        </aside>
      </section>

      <nav className="mobile-trip-nav" aria-label="Navegación móvil">
        <button className={activeSection === "today" ? "active" : ""} onClick={() => setActiveSection("today")}><b>●</b><span>HOY</span></button>
        <button onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" })}><b>⌖</b><span>MAPA</span></button>
        <button className={activeSection === "days" ? "active" : ""} onClick={() => setActiveSection("days")}><b>12</b><span>DÍAS</span></button>
        <button className={activeSection === "discover" ? "active" : ""} onClick={() => setActiveSection("discover")}><b>+</b><span>DESCUBRIR</span></button>
        <button className={activeSection === "saved" ? "active" : ""} onClick={() => setActiveSection("saved")}><b>♥</b><span>VIAJE</span></button>
      </nav>
    </main>
  );
}
