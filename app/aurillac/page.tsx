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
  { day: "01", date: "15 AGO", title: "VITORIA → VAYRAC", base: "LA PALENQUIÈRE", drive: "TRASLADO + MONTAJE", coords: [44.9538, 1.7039], kind: "route", plan: ["Salida temprana de Vitoria–Gasteiz", "Dos pausas reales durante el trayecto", "Montaje, compra básica y paseo por Vayrac", "Baño o descanso junto al río"], note: "La prioridad es llegar con margen y empezar descansados; no añadir una visita importante." },
  { day: "02", date: "16 AGO", title: "MARTEL · CARENNAC · DORDOÑA", base: "LA PALENQUIÈRE", drive: "EXCURSIÓN CIRCULAR", coords: [44.9182, 1.7323], kind: "nature", plan: ["Paseo histórico por Martel", "Carennac y comida o picnic", "Baño y descanso junto al Dordoña", "Canoa desde Carennac, solo opcional"], note: "El día funciona perfectamente sin actividad de pago." },
  { day: "03", date: "17 AGO", title: "AUTOIRE · LOUBRESSAC", base: "LA PALENQUIÈRE", drive: "PUEBLOS + CASCADA", coords: [44.8538, 1.8209], kind: "nature", plan: ["Autoire a primera hora", "Paseo hasta la cascada", "Loubressac, miradores y fotografía", "Padirac opcional con reserva"], note: "Si se añade Padirac, recortar el paseo; alternativa gratuita: más valle, baño y paisaje." },
  { day: "04", date: "18 AGO", title: "VAYRAC → AURILLAC", base: "LA PONÉTIE", drive: "COMPRA + MONTAJE", coords: [44.9197, 2.4328], kind: "route", plan: ["Desmontar La Palenquière", "Compra grande antes de instalarse", "Montar La Ponétie y localizar servicios", "Reconocer centro y accesos en bicicleta"], note: "Localizar Rue du Viaduc, Parvis du Conseil départemental y conseguir el programa gratuito/OFF." },
  { day: "05", date: "19 AGO", title: "FESTIVAL · ORIENTACIÓN", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9269, 2.4398], kind: "festival", plan: ["Reconocimiento de los ejes del centro", "Un espectáculo prioritario gratuito", "Bloque OFF libre de 2–3 horas", "Regreso con margen a La Ponétie"], note: "Primer día deliberadamente abierto para entender ritmos y distancias reales." },
  { day: "06", date: "20 AGO", title: "FESTIVAL · SELECCIÓN", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9282, 2.4431], kind: "festival", plan: ["Primer bloque de calle", "Comida y descanso largo", "Uno o dos espectáculos gratuitos", "Noche flexible según energía"], note: "INCONTINUO y Projet Fantôme no deben reservarse en franjas incompatibles." },
  { day: "07", date: "21 AGO", title: "FESTIVAL · OFF + NOCHE", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9253, 2.4455], kind: "festival", plan: ["Mañana libre para compañías OFF", "Comida y descanso largo", "Bleue Volute como ancla nocturna", "La Louuve si queda energía"], note: "Solo espectáculos gratuitos; conservar un bloque amplio para el OFF." },
  { day: "08", date: "22 AGO", title: "FESTIVAL · CIERRE VISUAL", base: "LA PONÉTIE", drive: "BICI + A PIE", coords: [44.9311, 2.4412], kind: "festival", plan: ["Últimos descubrimientos OFF", "Hmadcha o Wishes Tree, según pendientes", "Bleue Volute y Projet Fantôme", "Preparar el desmontaje"], note: "Dejar recogido el máximo equipaje y revisar la meteorología de Salers/Puy Mary." },
  { day: "09", date: "23 AGO", title: "AURILLAC → SALERS → SAINT-CYPRIEN", base: "LA CITARELLE", drive: "TRASLADO PANORÁMICO", coords: [44.5492, 2.40988], kind: "nature", plan: ["Desmontar La Ponétie", "Salers durante 2–3 horas", "Puy Mary solo con buen tiempo y energía", "Montaje, piscina y descanso en La Citarelle"], note: "Elección recomendada: Salers sí; Puy Mary según fuerzas; ninguna ruta larga." },
  { day: "10", date: "24 AGO", title: "CONQUES CON CALMA", base: "LA CITARELLE", drive: "PATRIMONIO + PASEO", coords: [44.5995, 2.3971], kind: "city", plan: ["Calles medievales y tímpano", "Abadía de Sainte-Foy y vidrieras de Soulages", "Miradores y fotografía", "Chapelle Sainte-Foy opcional: 7,5 km"], note: "Plan tranquilo: Conques, comida y piscina. No usar automáticamente las bicicletas por el relieve." },
  { day: "11", date: "25 AGO", title: "ESTAING O ENTRAYGUES", base: "LA CITARELLE", drive: "DOS VARIANTES EXCLUYENTES", coords: [44.5542, 2.6725], kind: "nature", plan: ["Opción A: Estaing, puente y paseo por el Lot", "Canoa o paddle tranquilo opcional", "Opción B: Entraygues y descenso de 10 km", "Elegir una sola variante la víspera"], note: "No combinar una visita larga a Estaing con el descenso de Entraygues." },
  { day: "12", date: "26 AGO", title: "DÍA FLEXIBLE EN AVEYRON", base: "LA CITARELLE", drive: "SEGÚN TIEMPO Y ENERGÍA", coords: [44.5492, 2.40988], kind: "nature", plan: ["Naturaleza: Grand-Vabre y La Vinzelle", "Patrimonio: Belcastel y Marcillac-Vallon", "Lluvia: Rodez y Museo Soulages", "Mucha energía: ruta completa por Aubrac"], note: "Elegir una sola opción; la piscina y el descanso también son un plan válido." },
  { day: "13", date: "27 AGO", title: "SAINT-CYPRIEN → VITORIA", base: "FIN DEL VIAJE", drive: "REGRESO DIRECTO", coords: [42.8467, -2.6716], kind: "route", plan: ["Desmontaje y salida antes de las 09:00", "Una parada larga para comer", "Otra parada breve de descanso", "Llegada a Vitoria con margen"], note: "Revisar presión, portabicis, luces, documentación y carga antes de salir." },
];

const stageDetails: Record<string, StageDetail> = {
  "01": { distance: "≈ 600–630 KM", duration: "7 H + PARADAS", mode: "COCHE", navigation: "https://www.google.com/maps/dir/Vitoria-Gasteiz/Vayrac", route: [[42.8467, -2.6716], [43.4832, -1.5586], [44.8378, -0.5792], [44.9538, 1.7039]], agenda: [{ time: "07:30", title: "SALIDA DE VITORIA", detail: "Jornada de traslado con dos pausas reales." }, { time: "15:30", title: "LA PALENQUIÈRE", detail: "Entrada, montaje y compra básica." }, { time: "18:30", title: "VAYRAC Y RÍO", detail: "Paseo, baño opcional y descanso." }] },
  "02": { distance: "≈ 45 KM", duration: "1 H 10 + VISITAS", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Vayrac/Martel/Carennac/Vayrac", route: [[44.9538, 1.7039], [44.9361, 1.6085], [44.9182, 1.7323], [44.9538, 1.7039]], agenda: [{ time: "09:30", title: "MARTEL", detail: "Núcleo histórico, plazas y mercado cubierto." }, { time: "13:00", title: "CARENNAC", detail: "Visita y comida o picnic." }, { time: "16:00", title: "DORDOÑA", detail: "Baño y descanso; canoa opcional." }] },
  "03": { distance: "≈ 55 KM", duration: "1 H 20 + RUTA", mode: "COCHE + SENDERO", navigation: "https://www.google.com/maps/dir/Vayrac/Autoire/Loubressac/Vayrac", route: [[44.9538, 1.7039], [44.8538, 1.8209], [44.8711, 1.8036], [44.9538, 1.7039]], agenda: [{ time: "09:00", title: "AUTOIRE", detail: "Pueblo y paseo hasta la cascada." }, { time: "14:30", title: "LOUBRESSAC", detail: "Miradores, paseo y fotografía." }, { time: "18:00", title: "REGRESO A VAYRAC", detail: "Preparar la salida; Padirac es opcional." }] },
  "04": { distance: "≈ 80–95 KM", duration: "1 H 40 + MONTAJE", mode: "COCHE + BICI", navigation: "https://www.google.com/maps/dir/Vayrac/Aurillac", route: [[44.9538, 1.7039], [44.8582, 1.8905], [44.9197, 2.4328]], agenda: [{ time: "09:00", title: "DESMONTAJE EN VAYRAC", detail: "Revisión del equipaje y salida con margen." }, { time: "12:00", title: "COMPRA GRANDE", detail: "Comida, agua y básicos antes de La Ponétie." }, { time: "14:00", title: "MONTAJE", detail: "Localizar duchas, aseos, prevención y lanzadera." }, { time: "18:00", title: "RECONOCIMIENTO EN BICI", detail: "Centro, Rue du Viaduc y programa OFF." }] },
  "05": { distance: "≈ 7 KM", duration: "15 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Place+de+l'Hotel+de+Ville,+Aurillac/Parking+de+la+Tour,+Aurillac/Cours+Monthyon,+Aurillac/Square+des+Justes,+Aurillac", route: [[44.9197, 2.4328], [44.9269, 2.4398], [44.9283, 2.444], [44.9272, 2.4377], [44.929, 2.4405], [44.9197, 2.4328]], agenda: [{ time: "12:30", title: "APERTURA OFICIAL", detail: "Place de l’Hôtel de Ville." }, { time: "14:00", title: "BLOQUE OFF LIBRE", detail: "Explorar sin reservas hasta las 18:30." }, { time: "19:00", title: "DA GOUSKATE!", detail: "Parking de la Tour · gratis." }, { time: "20:00", title: "WISHES TREE", detail: "Cours Monthyon · gratis." }, { time: "23:00", title: "PROJET FANTÔME", detail: "Square des Justes · gratis." }] },
  "06": { distance: "≈ 8 KM", duration: "20 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Place+des+Carmes,+Aurillac/Chateau+Saint-Etienne,+Aurillac", route: [[44.9197, 2.4328], [44.9272, 2.4377], [44.9254, 2.4425], [44.9304, 2.4407], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "WISHES TREE / KMs OF RESISTANCE", detail: "Elegir una propuesta gratuita." }, { time: "12:15", title: "OFF + COMIDA", detail: "Bloque libre y descanso." }, { time: "20:00", title: "HMADCHA", detail: "Place des Carmes · gratis." }, { time: "22:00", title: "INCONTINUO", detail: "Château Saint-Étienne · gratis." }] },
  "07": { distance: "≈ 6 KM", duration: "15 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Cours+Monthyon,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Place+des+Carmes,+Aurillac", route: [[44.9197, 2.4328], [44.9272, 2.4377], [44.9228, 2.446], [44.9254, 2.4425], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "PROGRAMA OFF", detail: "Selección espontánea por cercanía." }, { time: "13:00", title: "COMIDA + DESCANSO", detail: "Tres horas sin agenda cerrada." }, { time: "17:00", title: "SEGUNDO BLOQUE OFF", detail: "No encadenar barrios." }, { time: "21:45", title: "BLEUE VOLUTE", detail: "Rue du Pont d’Aliès · gratis." }, { time: "23:45", title: "LA LOUUVE", detail: "Place des Carmes." }] },
  "08": { distance: "≈ 8 KM", duration: "20 MIN BICI + A PIE", mode: "BICI / A PIE", navigation: "https://www.google.com/maps/dir/44.9197,2.4328/Place+des+Carmes,+Aurillac/Rue+du+Pont+d'Alies,+Aurillac/Square+des+Justes,+Aurillac", route: [[44.9197, 2.4328], [44.9254, 2.4425], [44.9228, 2.446], [44.929, 2.4405], [44.9197, 2.4328]], agenda: [{ time: "11:00", title: "PROGRAMA OFF", detail: "Última mañana para compañías de paso." }, { time: "14:00", title: "DESCUBRIMIENTOS", detail: "Bloque libre." }, { time: "20:00", title: "HMADCHA O WISHES TREE", detail: "Solo la que siga pendiente." }, { time: "21:45", title: "BLEUE VOLUTE", detail: "Rue du Pont d’Aliès · gratis." }, { time: "23:00", title: "PROJET FANTÔME", detail: "Si sigue pendiente · gratis." }] },
  "09": { distance: "≈ 125–145 KM", duration: "3 H + VISITAS", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Aurillac/Salers/Saint-Cyprien-sur-Dourdou", route: [[44.9197, 2.4328], [45.1384, 2.4948], [44.5492, 2.40988]], agenda: [{ time: "08:30", title: "DESMONTAJE", detail: "Salida tras cuatro días intensos." }, { time: "11:00", title: "SALERS", detail: "Visita de 2–3 horas y comida." }, { time: "16:30", title: "LA CITARELLE", detail: "Montaje, piscina y descanso." }, { time: "—", title: "PUY MARY OPCIONAL", detail: "Solo con salida temprana, buen tiempo y energía." }] },
  "10": { distance: "≈ 20 KM", duration: "35 MIN + VISITA", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Saint-Cyprien-sur-Dourdou/Conques/Saint-Cyprien-sur-Dourdou", route: [[44.5492, 2.40988], [44.5995, 2.3971], [44.5492, 2.40988]], agenda: [{ time: "09:00", title: "CONQUES", detail: "Calles medievales, tímpano y abadía." }, { time: "12:30", title: "VIDRIERAS Y MIRADORES", detail: "Soulages, fotografía y comida." }, { time: "15:30", title: "PLAN A ELEGIR", detail: "Piscina o Chapelle Sainte-Foy, 7,5 km." }] },
  "11": { distance: "≈ 75–105 KM", duration: "1 H 40 + ACTIVIDAD", mode: "COCHE + AGUA", navigation: "https://www.google.com/maps/dir/Saint-Cyprien-sur-Dourdou/Estaing/Entraygues-sur-Truyere/Saint-Cyprien-sur-Dourdou", route: [[44.5492, 2.40988], [44.5542, 2.6725], [44.6469, 2.5658], [44.5492, 2.40988]], agenda: [{ time: "09:30", title: "ELEGIR VARIANTE", detail: "Estaing tranquila o Entraygues activa." }, { time: "10:30", title: "PUEBLO Y LOT", detail: "Visita, paseo y picnic." }, { time: "14:00", title: "ACTIVIDAD OPCIONAL", detail: "Canoa/paddle o descenso de 10 km; no ambas." }] },
  "12": { distance: "≈ 20–180 KM", duration: "FLEXIBLE", mode: "COCHE + PASEO", navigation: "https://www.google.com/maps/dir/Saint-Cyprien-sur-Dourdou/Grand-Vabre/La+Vinzelle/Saint-Cyprien-sur-Dourdou", route: [[44.5492, 2.40988], [44.6287, 2.3598], [44.6271, 2.3194], [44.5492, 2.40988]], agenda: [{ time: "09:00", title: "DECISIÓN SEGÚN EL TIEMPO", detail: "Grand-Vabre, Belcastel, Rodez o Aubrac." }, { time: "10:00", title: "UNA SOLA EXCURSIÓN", detail: "No intentar combinar variantes." }, { time: "17:00", title: "REGRESO Y PREPARACIÓN", detail: "Piscina, compra y equipaje para el día 27." }] },
  "13": { distance: "≈ 540–570 KM", duration: "6 H 30 + PARADAS", mode: "COCHE", navigation: "https://www.google.com/maps/dir/Saint-Cyprien-sur-Dourdou/Vitoria-Gasteiz", route: [[44.5492, 2.40988], [44.8378, -0.5792], [43.4832, -1.5586], [42.8467, -2.6716]], agenda: [{ time: "08:30", title: "SALIDA DE LA CITARELLE", detail: "Desmontaje y revisión del portabicis." }, { time: "13:00", title: "PARADA LARGA", detail: "Comida y descanso real." }, { time: "16:30", title: "PAUSA BREVE", detail: "Estirar y revisar la carga." }, { time: "19:00", title: "VITORIA–GASTEIZ", detail: "Llegada con margen." }] },
};

const places: Place[] = [
  { id: "palenquiere", name: "Camping La Palenquière", category: "base", coords: [44.9538, 1.7039], detail: "Base 15–17 agosto · Vayrac · 3 noches" },
  { id: "ponetie", name: "La Ponétie", category: "base", coords: [44.9197, 2.4328], detail: "Base operativa · salida en bici" },
  { id: "citarelle", name: "Camping La Citarelle", category: "base", coords: [44.5492, 2.40988], detail: "Base 23–26 agosto · piscina · 4 noches" },
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
  const [selected, setSelected] = useState("TODOS");
  const [activeSection, setActiveSection] = useState<Section>("today");
  const [pace, setPace] = useState<Pace>("normal");
  const [filter, setFilter] = useState<"all" | PlaceCategory>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const showingAll = selected === "TODOS";
  const active = useMemo(() => stages.find((stage) => stage.day === selected) || stages[0], [selected]);
  const detail = stageDetails[active.day];
  const visiblePlaces = useMemo(() => places.filter((place) => filter === "all" || place.category === filter), [filter]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("aurillac-saved") || "[]"));
      // Always open on the complete itinerary. Restoring an old selected day made
      // returning visitors see only that stage (usually Vitoria → Bordeaux).
      setSelected("TODOS");
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
      const map = L.map(mapNode.current, { zoomControl: false, scrollWheelZoom: true }).setView([44.926, 2.44], 14);
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
      if (showingAll) {
        const colors = ["#20201d", "#c06a2c", "#e5482c", "#2f7d5b", "#1779a8", "#7b3fc6", "#b52a68", "#d39b22", "#20a56b", "#6656a8", "#8c3d27", "#c06a2c", "#20201d"];
        const allPoints: [number, number][] = [];
        stages.forEach((stage, stageIndex) => {
          const stageDetail = stageDetails[stage.day];
          allPoints.push(...stageDetail.route);
          L.polyline(stageDetail.route, {
            color: colors[stageIndex],
            weight: stage.kind === "festival" ? 4 : 5,
            dashArray: stage.kind === "festival" ? "8 7" : undefined,
            opacity: stage.kind === "festival" ? 0.78 : 0.92,
          })
            .bindTooltip(`DÍA ${stage.day} · ${stage.title}`)
            .addTo(routeLayer.current!);
        });
        const milestones = [stages[0].coords, stages[3].coords, stages[8].coords, stages[11].coords, stages[12].coords];
        milestones.forEach((point, index) => L.circleMarker(point, {
          radius: index === 0 || index === milestones.length - 1 ? 8 : 6,
          color: "#f4f0e6",
          weight: 3,
          fillColor: "#20201d",
          fillOpacity: 1,
        }).addTo(routeLayer.current!));
        mapInstance.current?.fitBounds(allPoints, { padding: [42, 42], maxZoom: 7 });
      } else {
        const line = L.polyline(detail.route, { color: "#e5482c", weight: 5, dashArray: active.kind === "festival" ? "10 8" : undefined, opacity: 0.95 }).addTo(routeLayer.current!);
        detail.route.forEach((point, index) => L.circleMarker(point, { radius: index === 0 || index === detail.route.length - 1 ? 7 : 5, color: "#20201d", weight: 2, fillColor: "#f4f0e6", fillOpacity: 1 }).addTo(routeLayer.current!));
        mapInstance.current?.fitBounds(line.getBounds(), { padding: [38, 38], maxZoom: active.kind === "festival" ? 15 : 9 });
      }
    });
  }, [active, detail, mapReady, showingAll]);

  function chooseDay(day: string) {
    setSelected(day);
    setActiveSection("today");
    if (window.innerWidth <= 1050) {
      window.requestAnimationFrame(() => document.querySelector(".route-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
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
          <span>15–27 AGO</span><span>13 DÍAS</span><span>FRANCIA</span>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <div className="intro">
            <p className="eyebrow">RUTA INTERACTIVA</p>
            <h1>AURILLAC<br />EN LA CALLE</h1>
            <p className="lede">Vitoria → Vayrac y Dordoña → Aurillac → Salers → Conques y valle del Lot → Vitoria</p>
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

        <section className="map-panel" id="aurillac-map">
          <div ref={mapNode} className={styles.mapCanvas} aria-label="Mapa del viaje a Aurillac" />
          <div className="map-title">
            <span>{showingAll ? "15—27 AGO · 13 DÍAS" : `DÍA ${active.day} · ${active.date}`}</span>
            <strong>{showingAll ? "VIAJE COMPLETO" : active.title}</strong>
          </div>
          <div className={styles.routeSummary}>
            {showingAll ? (
              <>
                <span><b>≈ 1.600–1.840 KM</b>RUTA COMPLETA</span>
                <span><b>13 ETAPAS</b>COCHE · BICI · A PIE</span>
                <button className={styles.summaryButton} onClick={() => setActiveSection("days")}>VER LOS 13 DÍAS →</button>
              </>
            ) : (
              <>
                <span><b>{detail.distance}</b>DISTANCIA</span>
                <span><b>{detail.duration}</b>{detail.mode}</span>
                <a href={detail.navigation} target="_blank" rel="noreferrer">NAVEGAR ↗</a>
              </>
            )}
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
            <h2>{showingAll ? "15—27 AGO" : active.date}<br />{showingAll ? "VIAJE COMPLETO" : active.title}</h2>
            <p>{showingAll ? "VAYRAC → AURILLAC → SAINT-CYPRIEN · 13 ETAPAS" : `${active.base} · ${active.drive}`}</p>
          </div>
          <div className="guide-tabs" role="tablist" aria-label="Contenido de la guía">
            <button className={activeSection === "today" ? "active" : ""} onClick={() => setActiveSection("today")}>HOY</button>
            <button className={activeSection === "days" ? "active" : ""} onClick={() => setActiveSection("days")}>DÍAS</button>
            <button className={activeSection === "discover" ? "active" : ""} onClick={() => setActiveSection("discover")}>DESCUBRIR</button>
            <button className={activeSection === "plan" ? "active" : ""} onClick={() => setActiveSection("plan")}>PLANIFICAR</button>
            <button className={activeSection === "saved" ? "active" : ""} onClick={() => setActiveSection("saved")}>MI VIAJE</button>
          </div>

          {showingAll && activeSection === "today" && (
            <div className={styles.panel}>
              <section className={styles.todayHero}>
                <small>RUTA COMPLETA · 15—27 AGOSTO</small>
                <h3>VITORIA → AURILLAC → VITORIA</h3>
                <div><b>13 ETAPAS</b><span>VAYRAC · FESTIVAL · AVEYRON</span></div>
                <button className={styles.fullTripButton} onClick={() => setActiveSection("days")}>ABRIR PLAN DÍA A DÍA →</button>
              </section>
              <section className={styles.tripPhases}>
                <button onClick={() => chooseDay("01")}><small>ANTES · DÍAS 01—04</small><strong>VITORIA → VAYRAC → VALLE DEL DORDOÑA → AURILLAC</strong><span>3 NOCHES EN LA PALENQUIÈRE · 4 ETAPAS</span></button>
                <button onClick={() => chooseDay("05")}><small>FESTIVAL · DÍAS 05—08</small><strong>AURILLAC EN BICI Y A PIE</strong><span>19—22 AGO · SOLO ESPECTÁCULOS GRATUITOS</span></button>
                <button onClick={() => chooseDay("09")}><small>DESPUÉS · DÍAS 09—13</small><strong>SALERS → SAINT-CYPRIEN → CONQUES → VALLE DEL LOT → VITORIA</strong><span>4 NOCHES EN LA CITARELLE · 5 ETAPAS</span></button>
              </section>
              <section className={styles.fullItinerary}>
                <div className={styles.itineraryHeading}>
                  <small>ITINERARIO COMPLETO</small>
                  <strong>13 DÍAS · 13 TRAYECTOS</strong>
                </div>
                {stages.map((stage) => (
                  <button key={stage.day} onClick={() => chooseDay(stage.day)}>
                    <span>{stage.day}</span>
                    <div>
                      <small>{stage.date}</small>
                      <strong>{stage.title}</strong>
                      <em>{stageDetails[stage.day].distance} · {stageDetails[stage.day].mode}</em>
                    </div>
                    <b>→</b>
                  </button>
                ))}
              </section>
            </div>
          )}

          {!showingAll && activeSection === "today" && (
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
              <article className={showingAll ? "selected" : ""}>
                <button onClick={() => setSelected("TODOS")}><span>∞</span><div><b>15—27 AGO</b><strong>VIAJE COMPLETO</strong><small>VAYRAC · FESTIVAL · AVEYRON</small></div></button>
              </article>
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
        <button className={activeSection === "today" ? "active" : ""} onClick={() => { setActiveSection("today"); document.querySelector(".route-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><b>●</b><span>HOY</span></button>
        <button onClick={() => document.getElementById("aurillac-map")?.scrollIntoView({ behavior: "smooth", block: "start" })}><b>⌖</b><span>MAPA</span></button>
        <button className={activeSection === "days" ? "active" : ""} onClick={() => { setActiveSection("days"); document.querySelector(".route-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><b>13</b><span>DÍAS</span></button>
        <button className={activeSection === "discover" ? "active" : ""} onClick={() => { setActiveSection("discover"); document.querySelector(".route-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><b>+</b><span>DESCUBRIR</span></button>
        <button className={activeSection === "saved" ? "active" : ""} onClick={() => { setActiveSection("saved"); document.querySelector(".route-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><b>♥</b><span>VIAJE</span></button>
      </nav>
    </main>
  );
}
