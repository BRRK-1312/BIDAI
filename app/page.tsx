"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import DecisionCenter from "./decision-center";

type Stop = {
  name: string;
  day: string;
  date: string;
  base: 0 | 1 | 2 | 3;
  coords: [number, number];
  note: string;
  kind: "camping" | "nature" | "town" | "beach" | "history";
};

type EventItem = {
  date: string;
  place: string;
  title: string;
  time: string;
  note: string;
  priority?: boolean;
  coords: [number, number];
  url: string;
  type?: string;
  status?: "CONFIRMADO" | "PENDIENTE" | "EDICIÓN ANTERIOR";
  distance?: string;
  suggestedDay?: string;
};

type ExploreItem = {
  name: string;
  type: "playa" | "fluvial" | "interés" | "desvío";
  base: 1 | 2 | 3;
  coords: [number, number];
  note: string;
  url?: string;
  categories?: string[];
  location?: string;
  specialty?: string;
  hours?: string;
  price?: string;
  visitTime?: string;
};

type CampingItem = {
  name: string;
  area: string;
  category: "EN RUTA" | "DESVÍO CORTO" | "FUERA DE RUTA";
  coords: [number, number];
  url?: string;
};

type WeatherDay = {
  max: number;
  min: number;
  rain: number;
  wind: number;
  wave?: number;
  code: number;
  hourly: Array<{ time: string; temp: number; rain: number; wind: number }>;
};

type DiaryEntry = {
  note: string;
  rating: number;
  food: string;
  expense: string;
  recommended: boolean;
  photo?: string;
};

const dayOperations: Record<string, {
  base: 1 | 2 | 3;
  parking: string;
  parkingMinutes: number;
  walkMinutes: number;
  visitMinutes: number;
  restMinutes: number;
  lastExit: string;
  road: string;
  toll: string;
  border: string;
  warnings: string[];
  priority: "IMPRESCINDIBLE" | "MUY RECOMENDABLE" | "SI QUEDA TIEMPO" | "ALTERNATIVA";
}> = {
  "01": { base: 1, parking: "Paradas de servicio en ruta; llegada dentro del camping.", parkingMinutes: 10, walkMinutes: 35, visitMinutes: 60, restMinutes: 45, lastExit: "17:00", road: "Autovía casi todo el trayecto; último tramo rural.", toll: "Revisar peajes electrónicos portugueses si se abandona la A-52/A-24.", border: "Entrada España → Portugal.", warnings: ["Trayecto largo", "Montar la tienda con luz"] , priority: "IMPRESCINDIBLE" },
  "02": { base: 1, parking: "Soajo: aparcamiento junto a la entrada del pueblo. Lindoso: junto al castillo.", parkingMinutes: 20, walkMinutes: 150, visitMinutes: 150, restMinutes: 45, lastExit: "18:30", road: "Carreteras estrechas, curvas y tráfico lento dentro del parque.", toll: "Sin peajes previstos.", border: "Sin cruce fronterizo.", warnings: ["Aparcamiento pequeño: antes de las 10:00", "Cobertura irregular", "Llevar agua", "Roca resbaladiza", "Evitar pozas tras lluvia"], priority: "IMPRESCINDIBLE" },
  "03": { base: 1, parking: "Sistelo: plazas limitadas en la entrada. Arcos: aparcamientos junto al río.", parkingMinutes: 20, walkMinutes: 180, visitMinutes: 120, restMinutes: 45, lastExit: "18:00", road: "Acceso lento a Sistelo; calcular más tiempo del indicado por distancia.", toll: "Sin peajes previstos.", border: "Sin cruce fronterizo.", warnings: ["Pasarelas resbaladizas con lluvia", "Llevar agua", "Cobertura irregular en el valle"], priority: "MUY RECOMENDABLE" },
  "04": { base: 2, parking: "Bom Jesus: aparcamiento superior o funicular. Braga: parkings urbanos.", parkingMinutes: 30, walkMinutes: 150, visitMinutes: 210, restMinutes: 60, lastExit: "17:30", road: "Tramo urbano lento en Braga y entrada a Viana.", toll: "La ruta rápida puede incluir autopista de peaje.", border: "Sin cruce fronterizo.", warnings: ["Día de desmontaje y montaje", "Reservar margen para tráfico urbano"], priority: "IMPRESCINDIBLE" },
  "05": { base: 2, parking: "Viana: parking Campo d’Agonia. Santa Luzia: aparcamiento superior limitado.", parkingMinutes: 25, walkMinutes: 120, visitMinutes: 240, restMinutes: 60, lastExit: "19:30", road: "Desplazamientos urbanos cortos.", toll: "Sin peajes previstos.", border: "Sin cruce fronterizo.", warnings: ["Santa Luzia pierde interés con niebla", "Cabedelo expuesta al viento"], priority: "MUY RECOMENDABLE" },
  "06": { base: 2, parking: "Afife y Moledo: aparcamientos de playa; Caminha: zona de la estación.", parkingMinutes: 35, walkMinutes: 90, visitMinutes: 300, restMinutes: 60, lastExit: "20:00", road: "N13 costera con tráfico de agosto; evitar encadenar demasiadas playas.", toll: "Sin peajes previstos.", border: "Sin cruce fronterizo.", warnings: ["Playas expuestas al viento", "Corrientes atlánticas", "Restaurante: reservar para cenar"], priority: "IMPRESCINDIBLE" },
  "07": { base: 3, parking: "Valença: exterior de la fortaleza. Tui: parking Área Panorámica.", parkingMinutes: 35, walkMinutes: 120, visitMinutes: 240, restMinutes: 60, lastExit: "18:00", road: "N13 y accesos urbanos; posible tráfico fronterizo.", toll: "Evitar autopista si se prefiere ruta sin peaje.", border: "Cruce Portugal → Galicia por el puente internacional.", warnings: ["Día de traslado", "Posibles cortes por fiestas en Valença", "No dejar equipaje visible"], priority: "IMPRESCINDIBLE" },
  "08": { base: 3, parking: "Santa Trega: aparcamientos junto al castro y la cima; plazas limitadas.", parkingMinutes: 25, walkMinutes: 150, visitMinutes: 210, restMinutes: 60, lastExit: "19:30", road: "Subida estrecha y lenta al monte.", toll: "Acceso al monte sujeto a tasa local.", border: "Sin cruce fronterizo.", warnings: ["Llegar temprano", "Niebla y viento en la cima", "Calzado con agarre"], priority: "IMPRESCINDIBLE" },
  "09": { base: 3, parking: "Oia: junto al monasterio. Mougás: apartaderos pequeños. Baiona: parking Aral.", parkingMinutes: 35, walkMinutes: 150, visitMinutes: 270, restMinutes: 60, lastExit: "19:30", road: "PO-552 costera; curvas y tráfico lento en Baiona.", toll: "Sin peajes previstos.", border: "Sin cruce fronterizo.", warnings: ["Mougás no es apropiada tras lluvias", "Roca muy resbaladiza", "Cabo expuesto al viento", "Aparcamiento pequeño"], priority: "MUY RECOMENDABLE" },
  "10": { base: 3, parking: "Paradas de servicio planificadas cada 2–2,5 horas.", parkingMinutes: 10, walkMinutes: 20, visitMinutes: 30, restMinutes: 75, lastExit: "10:00", road: "Trayecto largo; añadir margen por tráfico de regreso.", toll: "Revisar ruta elegida antes de salir.", border: "Cruce Galicia → Castilla y León; sin control habitual.", warnings: ["Desmontar temprano", "No apurar el descanso", "Comprobar combustible"], priority: "IMPRESCINDIBLE" },
};

const priorityByPlace: Record<string, string> = {
  Soajo: "IMPRESCINDIBLE", Lindoso: "IMPRESCINDIBLE", Braga: "IMPRESCINDIBLE",
  "Viana do Castelo": "IMPRESCINDIBLE", "Monte Santa Trega": "IMPRESCINDIBLE",
  "Praia de Moledo": "MUY RECOMENDABLE", Caminha: "MUY RECOMENDABLE",
  "Pozas de Mougás": "ALTERNATIVA · SOLO EN SECO", Baiona: "SI QUEDA TIEMPO",
  "Cabo Silleiro": "MUY RECOMENDABLE", Sistelo: "MUY RECOMENDABLE",
};

const lapaProgram = "https://www.cmav.pt/informar/agenda-de-eventos/agenda-cultural/evento/festas-de-nossa-senhora-da-lapa-29";
const valencaProgram = "https://cm-valenca.pt/diogo-picarra-sara-correia-sons-do-minho-e-carolina-de-deus-nas-festas-de-valenca/";

const bases = [
  {
    id: 1,
    short: "MONTAÑA",
    title: "Lima Escape",
    dates: "1–4 AGO",
    color: "#e5482c",
    center: [41.824395, -8.318062] as [number, number],
    detail: "Peneda–Gerês · 3 noches",
  },
  {
    id: 2,
    short: "ATLÁNTICO",
    title: "INATEL Cabedelo",
    dates: "4–7 AGO",
    color: "#1779a8",
    center: [41.678611, -8.823056] as [number, number],
    detail: "Viana do Castelo · 3 noches",
  },
  {
    id: 3,
    short: "FRONTERA",
    title: "Camping Santa Tecla",
    dates: "7–10 AGO",
    color: "#2f7d5b",
    center: [41.8897, -8.8464] as [number, number],
    detail: "A Guarda · 3 noches",
  },
] as const;

const stops: Stop[] = [
  { name: "Vitoria–Gasteiz", day: "Día 1", date: "1 AGO", base: 0, coords: [42.8467, -2.6716], note: "Salida y regreso del viaje", kind: "town" },
  { name: "Lima Escape", day: "Días 1–3", date: "1–4 AGO", base: 1, coords: [41.824395, -8.318062], note: "Primera base: bosque, río Lima y Peneda–Gerês", kind: "camping" },
  { name: "Soajo", day: "Día 2", date: "2 AGO", base: 1, coords: [41.8721, -8.2634], note: "Espigueiros, aldea de piedra y miradores", kind: "history" },
  { name: "Lindoso", day: "Día 2", date: "2 AGO", base: 1, coords: [41.8662, -8.1998], note: "Castillo, era comunal y más de cincuenta espigueiros", kind: "history" },
  { name: "Sistelo", day: "Día 3", date: "3 AGO", base: 1, coords: [41.9733, -8.3746], note: "Senderos, bancales y Ecovia do Vez", kind: "nature" },
  { name: "Arcos de Valdevez", day: "Día 3", date: "3 AGO", base: 1, coords: [41.8467, -8.4191], note: "Paseo junto al Vez y baño fluvial", kind: "town" },
  { name: "Bom Jesus do Monte", day: "Día 4", date: "4 AGO", base: 1, coords: [41.5547, -8.3771], note: "Santuario, escalinata y funicular hidráulico", kind: "history" },
  { name: "Braga", day: "Día 4", date: "4 AGO", base: 1, coords: [41.5518, -8.4229], note: "Sé, centro histórico y gastronomía del Minho", kind: "town" },
  { name: "INATEL Cabedelo", day: "Días 4–6", date: "4–7 AGO", base: 2, coords: [41.678611, -8.823056], note: "Segunda base con acceso directo a la playa", kind: "camping" },
  { name: "Viana do Castelo", day: "Día 5", date: "5 AGO", base: 2, coords: [41.6932, -8.8329], note: "Centro histórico, Gil Eannes y paseo marítimo", kind: "town" },
  { name: "Santa Luzia", day: "Día 5", date: "5 AGO", base: 2, coords: [41.7044, -8.8342], note: "Basílica y gran mirador sobre el Lima", kind: "history" },
  { name: "Praia de Afife", day: "Día 6", date: "6 AGO", base: 2, coords: [41.7812, -8.8725], note: "Playa atlántica extensa y salvaje", kind: "beach" },
  { name: "Vila Praia de Âncora", day: "Día 6", date: "6 AGO", base: 2, coords: [41.8158, -8.8695], note: "Puerto, paseo y Forte da Lagarteira", kind: "town" },
  { name: "Praia de Moledo", day: "Día 6", date: "6 AGO", base: 2, coords: [41.8496, -8.8664], note: "Surf, pinar y vistas al Forte da Ínsua", kind: "beach" },
  { name: "Caminha", day: "Día 6", date: "6 AGO", base: 2, coords: [41.8753, -8.8387], note: "Casco histórico y desembocadura del Miño", kind: "town" },
  { name: "Valença do Minho", day: "Día 7", date: "7 AGO", base: 3, coords: [42.0308, -8.6459], note: "Fortaleza fronteriza y murallas", kind: "history" },
  { name: "Tui", day: "Día 7", date: "7 AGO", base: 3, coords: [42.0472, -8.6444], note: "Catedral, calles medievales y río Miño", kind: "town" },
  { name: "Camping Santa Tecla", day: "Días 7–9", date: "7–10 AGO", base: 3, coords: [41.8897, -8.8464], note: "Tercera base junto al estuario del Miño", kind: "camping" },
  { name: "Monte Santa Trega", day: "Día 8", date: "8 AGO", base: 3, coords: [41.8925, -8.8697], note: "Castro y miradores sobre Portugal y el Atlántico", kind: "history" },
  { name: "A Guarda", day: "Día 8", date: "8 AGO", base: 3, coords: [41.9012, -8.8747], note: "Puerto pesquero, cetáreas y cocina marinera", kind: "town" },
  { name: "Monasterio de Oia", day: "Día 9", date: "9 AGO", base: 3, coords: [42.0024, -8.8767], note: "Monasterio cisterciense frente al océano", kind: "history" },
  { name: "Pozas de Mougás", day: "Día 9", date: "9 AGO", base: 3, coords: [42.0581, -8.8662], note: "Pozas, molinos y paisaje de costa", kind: "nature" },
  { name: "Cabo Silleiro", day: "Día 9", date: "9 AGO", base: 3, coords: [42.1012, -8.8974], note: "Faro, acantilados y baterías costeras", kind: "nature" },
  { name: "Baiona", day: "Día 9", date: "9 AGO", base: 3, coords: [42.1209, -8.8492], note: "Monterreal, casco histórico y paseo marítimo", kind: "town" },
];

const dayRoutes = [
  { day: "01", title: "Vitoria → Gerês", color: "#20201d", points: [[42.8467, -2.6716], [41.824395, -8.318062]] },
  { day: "02", title: "Soajo + Lindoso", color: "#e5482c", points: [[41.824395, -8.318062], [41.8721, -8.2634], [41.8662, -8.1998], [41.824395, -8.318062]] },
  { day: "03", title: "Sistelo + Arcos", color: "#e5482c", points: [[41.824395, -8.318062], [41.9733, -8.3746], [41.8467, -8.4191], [41.824395, -8.318062]] },
  { day: "04", title: "Braga → Cabedelo", color: "#8c3d27", points: [[41.824395, -8.318062], [41.5547, -8.3771], [41.5518, -8.4229], [41.678611, -8.823056]] },
  { day: "05", title: "Viana + Santa Luzia", color: "#1779a8", points: [[41.678611, -8.823056], [41.6932, -8.8329], [41.7044, -8.8342], [41.678611, -8.823056]] },
  { day: "06", title: "Costa norte", color: "#1779a8", points: [[41.678611, -8.823056], [41.7812, -8.8725], [41.8158, -8.8695], [41.8496, -8.8664], [41.8753, -8.8387], [41.678611, -8.823056]] },
  { day: "07", title: "Valença + Tui", color: "#386d65", points: [[41.678611, -8.823056], [42.0308, -8.6459], [42.0472, -8.6444], [41.8897, -8.8464]] },
  { day: "08", title: "Santa Trega", color: "#2f7d5b", points: [[41.8897, -8.8464], [41.8925, -8.8697], [41.9012, -8.8747], [41.8897, -8.8464]] },
  { day: "09", title: "Costa de Oia", color: "#2f7d5b", points: [[41.8897, -8.8464], [42.0024, -8.8767], [42.0581, -8.8662], [42.1012, -8.8974], [42.1209, -8.8492], [41.8897, -8.8464]] },
  { day: "10", title: "Regreso", color: "#20201d", points: [[41.8897, -8.8464], [42.8467, -2.6716]] },
] as const;

const dailyPlans = [
  {
    day: "01", date: "SÁB · 1 AGO", drive: "≈ 620 KM · 6 H 15", base: "LIMA ESCAPE · NOCHE 1/3",
    schedule: ["Salida temprana de Vitoria–Gasteiz", "Parada larga para comer durante el trayecto", "Llegada, montaje y paseo junto al río Lima"],
    walk: "Paseo de aclimatación por el entorno del camping · 30–45 min · fácil",
    food: "Cena sencilla en el camping: caldo verde, broa y producto local.",
    rain: "Llegar sin prisas, hacer la compra y reservar energía para Peneda–Gerês.",
    pace: { tranquilo: "Viaje directo, montaje y descanso.", normal: "Añadir el paseo corto junto al Lima.", completo: "Parar en Ponte de Lima antes de llegar al camping." },
  },
  {
    day: "02", date: "DOM · 2 AGO", drive: "≈ 80 KM · 2 H", base: "LIMA ESCAPE · NOCHE 2/3",
    schedule: ["Espigueiros y aldea de Soajo", "Ruta o baño en las pozas", "Castillo y espigueiros de Lindoso", "Noite do Folclore en Arcos, opcional"],
    walk: "Elegir: Poço Negro · 2 km fácil / ruta completa de las pozas · 11,95 km media",
    food: "Cachena da Peneda o cabrito assado; para pícnic, broa, queso y fruta.",
    rain: "Soajo y Lindoso en visitas cortas; sustituir las pozas por el castillo y cafés de Arcos.",
    pace: { tranquilo: "Espigueiros de Soajo, Poço Negro y regreso.", normal: "Soajo, baño y conjunto histórico de Lindoso.", completo: "Ruta circular de las pozas y Lindoso; empezar muy temprano." },
  },
  {
    day: "03", date: "LUN · 3 AGO", drive: "≈ 110 KM · 2 H 20", base: "LIMA ESCAPE · NOCHE 3/3",
    schedule: ["Sistelo y sus bancales", "Tramo de la Ecovia do Vez", "Baño en Praia Fluvial da Valeta", "Cantares ao Desafio a las 22:00"],
    walk: "Ecovia Vilela → Sistelo · 10,5 km fácil; versión corta por las Lagoas do Vez · 4 km",
    food: "Arroz de sarrabulho o rojões à minhota en Arcos de Valdevez.",
    rain: "Centro de Arcos, Paço de Giela y comida larga; evitar pasarelas si están resbaladizas.",
    pace: { tranquilo: "Miradores de Sistelo y baño en Valeta.", normal: "Lagoas do Vez, Sistelo y Arcos.", completo: "Ecovia Vilela–Sistelo y fiesta nocturna en Arcos." },
  },
  {
    day: "04", date: "MAR · 4 AGO", drive: "≈ 125 KM · 2 H 15", base: "TRASLADO A INATEL CABEDELO",
    schedule: ["Desmontar y salir hacia Braga", "Bom Jesus do Monte", "Sé y centro histórico de Braga", "Llegada a Cabedelo y montaje"],
    walk: "Bom Jesus + centro de Braga · 5–7 km urbanos · fácil",
    food: "Bacalhau à Braga o frigideiras; café y pudim Abade de Priscos.",
    rain: "Sé de Braga, Biscainhos y cafés históricos; dejar los jardines para otra ocasión.",
    pace: { tranquilo: "Bom Jesus y traslado directo a Cabedelo.", normal: "Bom Jesus, centro de Braga y llegada al camping.", completo: "Añadir Sameiro o una visita interior antes de salir hacia Viana." },
  },
  {
    day: "05", date: "MIÉ · 5 AGO", drive: "≈ 30 KM · 50 MIN", base: "INATEL CABEDELO · NOCHE 2/3",
    schedule: ["Centro histórico de Viana", "Navío-hospital Gil Eannes", "Santa Luzia y mirador", "Atardecer en Praia do Cabedelo"],
    walk: "Casco histórico y frente marítimo · 4–5 km fácil; subida a Santa Luzia en funicular o coche",
    food: "Bacalhau à Minhota, peixe grelhado y bola de Berlim en la playa.",
    rain: "Gil Eannes, Museu do Traje y cafés del centro; subir a Santa Luzia solo si hay visibilidad.",
    pace: { tranquilo: "Viana y playa de Cabedelo.", normal: "Centro, Gil Eannes, Santa Luzia y playa.", completo: "Añadir un tramo de la Ecovia Litoral Norte al atardecer." },
  },
  {
    day: "06", date: "JUE · 6 AGO", drive: "≈ 90 KM · 2 H", base: "INATEL CABEDELO · NOCHE 3/3",
    schedule: ["Praia de Afife", "Vila Praia de Âncora", "Moledo y Forte da Ínsua", "Paseo y cena en Caminha"],
    walk: "Elegir un tramo costero corto o Cabedelo → Rodanho · 6–7 km fácil",
    food: "Pescado a la brasa, arroz de marisco o polvo à lagareiro en Caminha.",
    rain: "Caminha, Museu Municipal y cafés; sustituir las playas por Santa Marta de Portuzelo.",
    pace: { tranquilo: "Elegir Afife o Moledo y terminar en Caminha.", normal: "Afife, Âncora, Moledo y Caminha.", completo: "Hacer toda la costa y añadir un paseo a pie por las dunas." },
  },
  {
    day: "07", date: "VIE · 7 AGO", drive: "≈ 120 KM · 2 H", base: "TRASLADO A CAMPING SANTA TECLA",
    schedule: ["Desmontar y salir hacia Valença", "Fortaleza y murallas", "Cruzar a Tui y visitar la catedral", "Montaje en A Guarda", "Conciertos gratuitos en Valença, opcional"],
    walk: "Murallas de Valença + casco medieval de Tui · 5–6 km urbanos · fácil",
    food: "Bacalhau o rojões en Valença; empanada y producto gallego para el camping.",
    rain: "Catedral de Tui, comercio cubierto de la fortaleza y traslado temprano al camping.",
    pace: { tranquilo: "Valença y traslado directo a A Guarda.", normal: "Valença, Tui y llegada al camping.", completo: "Añadir Vila Nova de Cerveira o volver a los conciertos de Valença." },
  },
  {
    day: "08", date: "SÁB · 8 AGO", drive: "≈ 25 KM · 45 MIN", base: "CAMPING SANTA TECLA · NOCHE 2/3",
    schedule: ["Castro de Santa Trega", "Miradores sobre el Miño y Portugal", "Puerto y casco de A Guarda", "Cetáreas y paseo marítimo"],
    walk: "Camiños do Trega · 5–7 km media / Sendero Azul desde O Muíño · 5,6 km fácil",
    food: "Pulpo, pescado o langosta de A Guarda si queréis una comida especial.",
    rain: "MASAT, museo del castro y cafés del puerto; posponer la cima si está cubierta.",
    pace: { tranquilo: "Subir en coche a Santa Trega y pasear por el puerto.", normal: "Castro, miradores, A Guarda y cetáreas.", completo: "Subir caminando por Camiños do Trega y enlazar con el Sendero Azul." },
  },
  {
    day: "09", date: "DOM · 9 AGO", drive: "≈ 95 KM · 2 H", base: "CAMPING SANTA TECLA · NOCHE 3/3",
    schedule: ["Monasterio de Oia", "Pozas de Mougás", "Cabo Silleiro", "Baiona y fortaleza de Monterreal"],
    walk: "Pozas de Mougás · 4,9 km fácil en seco / paseo de Monterreal · 3,5 km",
    food: "Empanada para pícnic; marisco, percebes o pulpo en Baiona.",
    rain: "Monasterio de Oia y casco de Baiona; no acceder a pozas con lluvia fuerte o roca mojada.",
    pace: { tranquilo: "Oia, Cabo Silleiro y Baiona.", normal: "Oia, pozas de Mougás, cabo y Baiona.", completo: "Ruta completa de las pozas y vuelta a pie a la fortaleza de Monterreal." },
  },
  {
    day: "10", date: "LUN · 10 AGO", drive: "≈ 650 KM · 6 H 30", base: "REGRESO A VITORIA–GASTEIZ",
    schedule: ["Desmontar temprano", "Desayuno y últimas compras", "Regreso con una parada larga y otra breve"],
    walk: "Paseo corto por el puerto o Praia do Muíño antes de salir, solo si el horario lo permite",
    food: "Comprar empanada, rosca de yema y conservas para el trayecto.",
    rain: "Salida directa y paradas de carretera bajo techo.",
    pace: { tranquilo: "Desmontar y regresar directamente.", normal: "Desayuno en A Guarda y regreso.", completo: "Paseo corto por Praia do Muíño antes de emprender el viaje." },
  },
] as const;

const events: EventItem[] = [
  { date: "1–10 AGO", place: "PONTE DE LIMA", title: "Festival Internacional de Jardines", time: "HORARIO DE VISITA", note: "Doce jardines efímeros internacionales. Plan tranquilo de 60–90 minutos para combinar con el centro histórico o el regreso desde Braga. Incluido desde la agenda Visit Portugal aportada.", coords: [41.7623, -8.5865], url: "https://festivaldejardins.cm-pontedelima.pt/" },
  { date: "1–10 AGO", place: "VILA NOVA DE CERVEIRA", title: "Bienal Internacional de Arte de Cerveira", time: "HORARIO DE EXPOSICIONES", note: "Arte contemporáneo, talleres, escultura y exposiciones repartidas por la villa. Buena alternativa cultural desde Cabedelo o Santa Tecla.", priority: true, coords: [41.9413, -8.7426], url: "https://bienaldecerveira.pt/" },
  { date: "1 AGO", place: "VILA NOVA DE CERVEIRA", title: "Fiestas de São Sebastião · jornada final", time: "PROGRAMA VARIABLE", note: "Último día de las fiestas municipales, con música, gastronomía, folclore y posibles fuegos. Solo encaja si se acepta un desvío el primer día.", coords: [41.9413, -8.7426], url: "https://www.cm-vncerveira.pt/" },
  { date: "2 AGO", place: "ARCOS DE VALDEVEZ", title: "Noite do Folclore", time: "21:30", note: "Seis ranchos folclóricos. Encaja al volver de Soajo y Lindoso.", coords: [41.8467, -8.4191], url: lapaProgram },
  { date: "3 AGO", place: "ARCOS DE VALDEVEZ", title: "Cantares ao Desafio", time: "22:00", note: "Tradición oral improvisada después de la ruta de Sistelo.", priority: true, coords: [41.8467, -8.4191], url: "https://www.cmav.pt/informar/agenda-de-eventos/agenda-cultural/evento/festas-de-nossa-senhora-da-lapa-dia-dos-cantares-ao-desafio" },
  { date: "4 AGO", place: "ARCOS DE VALDEVEZ", title: "Noite do Emigrante", time: "21:30", note: "Alternativa nocturna tras Braga; supone retroceder hacia el interior.", coords: [41.8467, -8.4191], url: lapaProgram },
  { date: "5 AGO", place: "ARCOS DE VALDEVEZ", title: "Folk O Mundo a Dançar", time: "22:00", note: "Gala internacional gratuita a unos 50 minutos de Cabedelo.", priority: true, coords: [41.8467, -8.4191], url: "https://www.cmav.pt/informar/agenda-de-eventos/agenda-cultural/evento/festas-de-nossa-senhora-da-lapa-dia-do-mundo-a-dancar" },
  { date: "6 AGO", place: "MONÇÃO", title: "Desfile internacional de folclore", time: "TARDE", note: "Alternativa cultural al día completo de playas.", coords: [42.0789, -8.4808], url: "https://www.cm-moncao.pt/pt/menu/1586/agenda-cultural.aspx" },
  { date: "6–8 AGO", place: "VIANA DO CASTELO", title: "NEOPOP Festival · 20 aniversario", time: "TARDE–NOCHE", note: "Festival internacional de música electrónica junto al mar. Prever ruido, ocupación alta, reservas y cortes cerca del Forte de Santiago da Barra.", priority: true, coords: [41.6912, -8.8387], url: "https://neopopfestival.com/pt" },
  { date: "6–8 AGO", place: "VILA PRAIA DE ÂNCORA", title: "SonicBlast Fest", time: "TARDE–NOCHE", note: "Festival de rock, stoner y música pesada junto a Praia do Caldeirão. Puede combinarse con el día de Afife y Âncora; comprobar entradas.", coords: [41.8118, -8.8677], url: "https://sonicblastfestival.com/" },
  { date: "6–10 AGO", place: "TERRAS DE BOURO", title: "Fiestas de Terras de Bouro · São Brás", time: "PROGRAMA VARIABLE", note: "Conciertos, tradición y gastronomía. Es un desvío largo desde la base costera: utilizar solo como alternativa si queréis volver al interior.", coords: [41.7172, -8.3083], url: "https://www.cm-terrasdebouro.pt/" },
  { date: "6–9 AGO", place: "ARCOS DE VALDEVEZ", title: "Ínsua do Vez Summer Sessions", time: "NOCHE", note: "Música electrónica gratuita en el Ecoparque do Vez.", coords: [41.848, -8.416], url: "https://www.cmav.pt/informar/agenda-de-eventos/agenda-cultural" },
  { date: "7 AGO", place: "VALENÇA", title: "Sara Correia · Sons do Minho · Pete Tha Zouk", time: "NOCHE", note: "Conciertos gratuitos junto a la fortaleza; encaja con el traslado a Galicia.", coords: [42.0308, -8.6459], url: valencaProgram },
  { date: "7–9 AGO", place: "CASTELO DO NEIVA", title: "XIII Feira Medieval", time: "TODO EL DÍA", note: "Mercado, recreación, gastronomía y animación histórica.", coords: [41.6215, -8.8025], url: "https://www.cm-viana-castelo.pt/areas-de-atividade/comunicacao/agenda-de-eventos" },
  { date: "6–9 AGO", place: "SANTA MARTA DE PORTUZELO", title: "Romaria de Santa Marta", time: "VARIABLE", note: "Romaría minhota íntima con folclore y música popular.", coords: [41.729, -8.729], url: "https://associativismo.cm-viana-castelo.pt/eventos/12592/romaria-de-santa-marta" },
  { date: "8 AGO", place: "ARCOS DE VALDEVEZ", title: "Festa do Rio e do Fogo", time: "TARDE–NOCHE", note: "Bombos, agua, barcos alegóricos y fuegos. La cita más singular del viaje.", priority: true, coords: [41.8467, -8.4191], url: lapaProgram },
  { date: "8 AGO", place: "VALENÇA", title: "Diogo Piçarra · Miguel Rendeiro", time: "NOCHE", note: "Segunda opción para la noche del sábado.", coords: [42.0308, -8.6459], url: valencaProgram },
  { date: "9 AGO", place: "VALENÇA", title: "Carolina de Deus · fiesta musical", time: "NOCHE", note: "Puede añadirse al regreso desde Oia y Baiona.", coords: [42.0308, -8.6459], url: valencaProgram },
];

const foodByBase = [
  {
    base: "BASE 01 · MINHO INTERIOR",
    color: "#e5482c",
    foods: [
      ["Cachena da Peneda", "Carne de raza local, guisada o asada."],
      ["Cabrito assado", "Clásico de montaña con patatas y arroz."],
      ["Rojões à minhota", "Cerdo dorado con patata y sabores del Minho."],
      ["Arroz de sarrabulho", "Arroz intenso y especiado; plato contundente."],
      ["Broa de milho", "Pan de maíz para acompañar quesos y guisos."],
    ],
  },
  {
    base: "BASE 02 · VIANA Y COSTA",
    color: "#1779a8",
    foods: [
      ["Bacalhau à Minhota", "Bacalao frito con cebolla, pimiento y patata."],
      ["Polvo à lagareiro", "Pulpo asado con aceite, ajo y patatas."],
      ["Peixe grelhado", "Pescado atlántico del día a la brasa."],
      ["Arroz de marisco", "Ideal para compartir en la costa."],
      ["Bola de Berlim", "El dulce típico para comer en la playa."],
    ],
  },
  {
    base: "BASE 03 · BAIXO MIÑO",
    color: "#2f7d5b",
    foods: [
      ["Langosta de A Guarda", "Producto emblemático; opción especial y cara."],
      ["Pulpo á feira", "Pulpo, pimentón, aceite y sal gruesa."],
      ["Empanada gallega", "Perfecta para pícnic y días de carretera."],
      ["Percebes y marisco", "Preguntad siempre por precio y temporada."],
      ["Rosca de yema", "Dulce tradicional de A Guarda."],
    ],
  },
];

const walks = [
  {
    base: 1, title: "Ecovia do Vez · Vilela → Sistelo", difficulty: "FÁCIL", distance: "10,5 KM", elevation: "+180 M APROX.", shape: "LINEAL", time: "3 H",
    note: "La mejor ruta fluvial del viaje: pasarelas, bosque, bancales y llegada a Sistelo. Conviene dejar un coche en cada extremo o volver en taxi.",
    start: [41.9247, -8.4244], url: "https://es.wikiloc.com/rutas-senderismo/ecovia-do-rio-vez-vilela-sistelo-18926287", source: "TRACK GPS",
  },
  {
    base: 1, title: "PR1 PTB · Trilho dos Moinhos de Parada", difficulty: "MEDIA", distance: "7 KM", elevation: "+250 M APROX.", shape: "CIRCULAR", time: "3–4 H",
    note: "Ruta señalizada entre Parada de Lindoso, molinos, espigueiros y vistas al valle del Lima. Calzado con buen agarre.",
    start: [41.8679, -8.2048], url: "https://fronteiraesquecida.eu/pt/fichas/trilho-dos-moinhos-2/", source: "FICHA DEL RECORRIDO",
  },
  {
    base: 1, title: "Trilho do Penedo do Encanto", difficulty: "MEDIA", distance: "5 KM", elevation: "+200 M APROX.", shape: "CIRCULAR", time: "2–2,5 H",
    note: "Alternativa más corta en Lindoso. Comparte parte del PR1 y añade bosque, roca y panorámicas de la Serra Amarela.",
    start: [41.8679, -8.2048], url: "https://es.wikiloc.com/rutas-senderismo/pr-trilho-do-penedo-do-encanto-13137706", source: "TRACK GPS",
  },
  {
    base: 2, title: "Ecovia Litoral Norte · Viana → Fortim de Paçô", difficulty: "FÁCIL", distance: "8–9 KM", elevation: "+60 M APROX.", shape: "LINEAL", time: "2,5–3 H",
    note: "Costa, molinos, geositios y playas. Puede acortarse empezando en Praia Norte; regreso sencillo en taxi o tren desde Carreço.",
    start: [41.7004, -8.8582], url: "https://www.cm-viana-castelo.pt/visite-viana/descobrir-viana/espacos-verdes-e-natureza/ciclovias-e-ecovias", source: "INFORMACIÓN MUNICIPAL",
  },
  {
    base: 2, title: "Cabedelo → Rodanho → Amorosa", difficulty: "FÁCIL", distance: "12,2 KM", elevation: "+23 M", shape: "CIRCULAR", time: "3 H",
    note: "Ruta casi plana desde el camping por dunas, pinar y tres playas. Se puede recortar dando la vuelta en Rodanho: unos 6–7 km.",
    start: [41.678611, -8.823056], url: "https://es.wikiloc.com/rutas-senderismo/desde-cabedelo-a-amorosa-viana-do-castelo-246571218", source: "TRACK GPS 2026",
  },
  {
    base: 2, title: "PR9 VCT · Canos de Água de Santa Luzia", difficulty: "MEDIA", distance: "10,4 KM", elevation: "+308 M", shape: "CIRCULAR", time: "3 H",
    note: "Sendero oficial por antiguos canales de piedra y bosque de Santa Luzia. La subida es sostenida pero sin pasos técnicos.",
    start: [41.7172, -8.8338], url: "https://es.wikiloc.com/rutas-senderismo/pr9-os-canos-de-agua-de-santa-luzia-viana-do-castelo-119959851", source: "PR OFICIAL + TRACK",
  },
  {
    base: 3, title: "PR-G160 · Desembocadura del Miño", difficulty: "FÁCIL", distance: "7 KM", elevation: "CASI LLANA", shape: "LINEAL", time: "2 H",
    note: "Ruta oficial señalizada desde Salcidos por observatorios de aves, ribera del Miño y playa de O Muíño. Ideal con calor moderado.",
    start: [41.9071, -8.8378], url: "https://mapas.turismoaguarda.es/es/rutas-de-senderismo/resource/r/pr-g160-ruta-desembocadura-del-mino", source: "FICHA OFICIAL",
  },
  {
    base: 3, title: "Sendero Azul · O Muíño → Area Grande", difficulty: "FÁCIL", distance: "5,6 KM", elevation: "+70 M APROX.", shape: "LINEAL", time: "1,5–2 H",
    note: "Paseo costero oficial por pasarelas, salinas romanas, puerto y pequeñas playas. Regreso a pie: 11,2 km en total.",
    start: [41.9004, -8.8671], url: "https://mapas.turismoaguarda.es/es/rutas-de-senderismo/resource/sendero-azul_167", source: "FICHA OFICIAL",
  },
  {
    base: 3, title: "PR-G122 · Camiños do Trega", difficulty: "MEDIA", distance: "5–7 KM", elevation: "+350 M APROX.", shape: "CIRCULAR / VARIANTES", time: "2,5–3 H",
    note: "Red señalizada para subir al castro y los miradores de Santa Trega. Elegid la variante desde A Guarda; subida fuerte pero técnicamente sencilla.",
    start: [41.9012, -8.8747], url: "https://www.turismoaguarda.es/wp-content/uploads/2022/07/2022-ruta-senderismo-es.pdf", source: "MAPA OFICIAL PDF",
  },
];

const waterWalks = [
  {
    base: 1, title: "Passadiços das Lagoas do Vez", difficulty: "FÁCIL", distance: "4 KM", elevation: "POCO DESNIVEL", shape: "IDA Y VUELTA", time: "1–1,5 H",
    note: "Pasarelas entre Poço das Caldeiras y Cabreiro, con varios accesos a cascadas y lagunas. La opción más sencilla y completa para caminar y bañarse.",
    start: [41.9701, -8.4067], url: "https://www.vagamundos.pt/passadicos-lagoas-do-vez-ecovia/", source: "FICHA + GPX", bath: "POZA NATURAL · SIN VIGILANCIA",
  },
  {
    base: 1, title: "Soajo → Poço Negro", difficulty: "FÁCIL", distance: "2 KM", elevation: "+60 M APROX.", shape: "IDA Y VUELTA", time: "40–60 MIN",
    note: "Paseo desde los espigueiros hasta una de las pozas más accesibles de Soajo. El último acceso baja por una escalera empinada.",
    start: [41.8733, -8.2627], url: "https://www.vagamundos.pt/cascatas-e-lagoas-do-soajo/", source: "FICHA DE ACCESO", bath: "POZA NATURAL · SIN VIGILANCIA",
  },
  {
    base: 1, title: "Soajo · Ruta completa de las pozas", difficulty: "MEDIA", distance: "11,95 KM", elevation: "+446 M", shape: "CIRCULAR", time: "3 H 21 EN MOVIMIENTO",
    note: "Ruta larga por el entorno de Soajo que termina en las pozas. Incluye tramos de vegetación espesa; el registro original empleó 7 h 03 con paradas.",
    start: [41.8733, -8.2627], url: "https://es.wikiloc.com/rutas-senderismo/soajo-pozas-soajo-143504710", source: "TRACK WIKILOC", bath: "POZAS NATURALES · SIN VIGILANCIA",
  },
  {
    base: 1, title: "Parada de Lindoso → Poço da Gola", difficulty: "FÁCIL", distance: "0,6 KM", elevation: "+35 M APROX.", shape: "IDA Y VUELTA", time: "20–30 MIN",
    note: "Acceso muy corto desde la zona del Café Mó hasta una piscina natural entre roca y bosque. Puede estar resbaladizo junto al agua.",
    start: [41.8676, -8.2059], url: "https://www.vagamundos.pt/cascatas-do-lindoso-serra-amarela/", source: "FICHA DE ACCESO", bath: "POZA NATURAL · SIN VIGILANCIA",
  },
  {
    base: 1, title: "Arcos → Praia Fluvial da Valeta", difficulty: "FÁCIL", distance: "4 KM", elevation: "CASI LLANA", shape: "CIRCULAR", time: "1 H",
    note: "Paseo urbano por ambas orillas del Vez, puente viejo, Pontilhão y zona de baño de Valeta. Perfecto para una tarde tranquila.",
    start: [41.8467, -8.4191], url: "https://www.ecoviadovez.com/", source: "ECOVIA DO VEZ", bath: "PLAYA FLUVIAL · SERVICIOS",
  },
  {
    base: 2, title: "PR2 VDM · Azenhas do Coura", difficulty: "FÁCIL", distance: "6,4 KM", elevation: "+62 M", shape: "CIRCULAR", time: "2 H",
    note: "Sale del puente medieval de Vilar de Mouros y pasa por molinos, bosque de ribera y Praia Fluvial das Azenhas, a solo 600 m del inicio.",
    start: [41.8859, -8.7902], url: "https://www.jf-vilardemouros.com/freguesia/trilhos/4-pr2_trilho_das_azenhas_do_coura", source: "FICHA OFICIAL", bath: "PLAYA FLUVIAL · SERVICIOS",
  },
  {
    base: 3, title: "Pozas de Mougás", difficulty: "FÁCIL", distance: "4,9 KM", elevation: "+152 M", shape: "IDA Y VUELTA", time: "1,5–2 H",
    note: "Pista forestal y sendero junto al río hasta varias pozas y una cascada. Fácil en seco; la roca húmeda exige buen calzado.",
    start: [42.0558, -8.8492], url: "https://es.wikiloc.com/rutas-senderismo/pozas-de-mougas-86681243", source: "TRACK GPS", bath: "POZA NATURAL · SIN VIGILANCIA",
  },
  {
    base: 3, title: "PR-G112 · As Eiras y río Tamuxe", difficulty: "FÁCIL", distance: "13,7 KM", elevation: "+82 M", shape: "CIRCULAR", time: "3,5 H",
    note: "Ruta llana y señalizada desde la playa fluvial de As Eiras, siguiendo el Miño y el bosque de ribera hasta las aceñas del Tamuxe.",
    start: [41.9451, -8.7891], url: "https://es.wikiloc.com/rutas-senderismo/o-rosal-comarca-do-baixo-mino-pontevedra-pr-g-112-sendeiro-de-pescadores-rio-mino-tamuxe-vuelta-82854790", source: "PR OFICIAL + TRACK", bath: "PLAYA FLUVIAL · VERIFICAR BAÑO",
  },
];

const routePractical: Record<string, { terrain: string; shade: string; signs: string; parking: string; caution: string }> = {
  "Ecovia do Vez · Vilela → Sistelo": { terrain: "Pasarelas, pista compacta y sendero fluvial.", shade: "Media–alta junto al río.", signs: "Ecovia señalizada; descargar el track para enlaces y desvíos.", parking: "Inicio en Vilela; al ser lineal, prever taxi o segundo coche en Sistelo.", caution: "Madera y piedra resbaladizas con lluvia; poca sombra en algunos bancales." },
  "PR1 PTB · Trilho dos Moinhos de Parada": { terrain: "Camino rural, roca y sendero de montaña.", shade: "Media.", signs: "PR señalizado, pero conviene llevar el recorrido descargado.", parking: "Parada de Lindoso, junto al núcleo y los espigueiros.", caution: "Piedra húmeda y tramos irregulares; evitar las horas centrales." },
  "Trilho do Penedo do Encanto": { terrain: "Sendero forestal, roca y antiguos caminos.", shade: "Media.", signs: "Track GPS recomendado; puede compartir marcas con otros senderos.", parking: "Parada de Lindoso.", caution: "Cruces poco evidentes y firme irregular después de lluvia." },
  "Ecovia Litoral Norte · Viana → Fortim de Paçô": { terrain: "Paseo marítimo, pasarelas, arena firme y caminos costeros.", shade: "Baja.", signs: "Ecovia municipal con tramos señalizados.", parking: "Praia Norte o entorno del punto elegido en Viana.", caution: "Exposición total al sol y viento; comprobar mareas en accesos rocosos." },
  "Cabedelo → Rodanho → Amorosa": { terrain: "Pasarelas, pistas de pinar y paseo costero.", shade: "Media en el pinar; baja en dunas.", signs: "No confiar solo en señalización: llevar el track.", parking: "Salida directa desde INATEL Cabedelo.", caution: "Arena blanda en algunos enlaces y calor acumulado en las pasarelas." },
  "PR9 VCT · Canos de Água de Santa Luzia": { terrain: "Sendero forestal, canales de piedra y caminos con pendiente.", shade: "Alta en bosque.", signs: "PR señalizado; descargar track de apoyo.", parking: "Entorno del punto oficial de salida en Santa Luzia.", caution: "Canales estrechos y roca mojada; la subida acumula más esfuerzo del que parece." },
  "PR-G160 · Desembocadura del Miño": { terrain: "Pasarelas y caminos llanos de ribera.", shade: "Baja–media.", signs: "PR-G homologado y señalizado.", parking: "Salcidos o Praia do Muíño, según el sentido elegido.", caution: "Mosquitos al atardecer y zonas expuestas al sol." },
  "Sendero Azul · O Muíño → Area Grande": { terrain: "Paseo litoral, pasarelas y caminos urbanos.", shade: "Baja.", signs: "Sendero Azul señalizado.", parking: "Praia do Muíño; regreso andando, taxi o segundo coche.", caution: "Recorrido lineal: volver a pie duplica la distancia." },
  "PR-G122 · Camiños do Trega": { terrain: "Calzada, sendero pedregoso y pendientes sostenidas.", shade: "Baja–media.", signs: "Red PR-G señalizada con variantes.", parking: "A Guarda si se sube andando; aparcamientos del monte para acortar.", caution: "Calor, desnivel y cruces entre variantes; escoger el itinerario antes de salir." },
  "Passadiços das Lagoas do Vez": { terrain: "Pasarelas y sendero fluvial sencillo.", shade: "Alta.", signs: "Recorrido local; llevar ubicación y track.", parking: "Acceso de Poço das Caldeiras o Cabreiro; plazas limitadas.", caution: "No saltar desde roca y extremar cuidado si las pasarelas están mojadas." },
  "Soajo → Poço Negro": { terrain: "Calles de aldea, camino y escalera final empinada.", shade: "Media.", signs: "Acceso local sin señalización continua.", parking: "Aparcamiento público de Soajo, cerca de los espigueiros.", caution: "Último descenso fuerte y roca pulida junto al agua." },
  "Soajo · Ruta completa de las pozas": { terrain: "Caminos rurales, sendero cerrado y tramos de vegetación.", shade: "Media–alta.", signs: "Seguir el track Wikiloc; no es una ruta oficial homologada.", parking: "Soajo, utilizando las zonas públicas del núcleo.", caution: "Ruta media, larga y con +446 m; salir temprano y contar margen para las paradas." },
  "Parada de Lindoso → Poço da Gola": { terrain: "Camino corto y sendero de bajada.", shade: "Alta.", signs: "Acceso local; orientación sencilla con el punto descargado.", parking: "Parada de Lindoso, sin bloquear accesos vecinales.", caution: "Roca muy resbaladiza y poza sin vigilancia." },
  "Arcos → Praia Fluvial da Valeta": { terrain: "Paseo urbano y caminos acondicionados junto al Vez.", shade: "Media.", signs: "Ecovia y paseo urbano fáciles de seguir.", parking: "Aparcamientos públicos de Arcos de Valdevez.", caution: "Comprobar calidad del agua y zona habilitada antes del baño." },
  "PR2 VDM · Azenhas do Coura": { terrain: "Caminos de ribera, bosque y pistas junto a molinos.", shade: "Alta.", signs: "PR local señalizado.", parking: "Entorno del puente medieval de Vilar de Mouros.", caution: "Barro y raíces después de lluvia; verificar el estado de la playa fluvial." },
  "Pozas de Mougás": { terrain: "Pista forestal y sendero pedregoso junto al río.", shade: "Media.", signs: "Seguir el track GPS; señalización variable.", parking: "Zona de inicio indicada en Mougás; estacionamiento limitado.", caution: "No acceder con lluvia fuerte; roca húmeda y pozas sin vigilancia." },
  "PR-G112 · As Eiras y río Tamuxe": { terrain: "Pistas y caminos fluviales prácticamente llanos.", shade: "Media.", signs: "PR-G homologado y señalizado.", parking: "Área recreativa y playa fluvial de As Eiras.", caution: "Distancia larga aunque el desnivel sea mínimo; confirmar baño y llevar agua." },
};

const routeAdvanced: Record<string, { shade: string; coverage: string; water: string; best: string; real: string; shortcut: string }> = {
  "Ecovia do Vez · Vilela → Sistelo": { shade: "65 % aprox.", coverage: "Irregular en los tramos encajados.", water: "Fuentes en núcleos; llevar 1,5 l.", best: "08:00–09:00.", real: "Fácil por terreno; exigente por longitud y logística lineal.", shortcut: "Terminar en Cabreiro o usar taxi desde Sistelo." },
  "PR1 PTB · Trilho dos Moinhos de Parada": { shade: "55 % aprox.", coverage: "Irregular.", water: "No contar con agua potable en ruta.", best: "Primera hora de la mañana.", real: "Media por firme irregular y desnivel acumulado.", shortcut: "Regresar desde los molinos antes del tramo alto." },
  "Trilho do Penedo do Encanto": { shade: "60 % aprox.", coverage: "Irregular.", water: "Llevar toda el agua.", best: "Antes de las 10:00.", real: "Media corta: pendientes y orientación, sin pasos técnicos.", shortcut: "Volver por el mismo camino desde el mirador." },
  "Ecovia Litoral Norte · Viana → Fortim de Paçô": { shade: "15 % aprox.", coverage: "Buena.", water: "Servicios en playas y Viana.", best: "08:00 o últimas horas de la tarde.", real: "Fácil y llana, pero muy expuesta al sol y viento.", shortcut: "Empezar en Praia Norte o terminar en Carreço." },
  "Cabedelo → Rodanho → Amorosa": { shade: "35 % aprox.", coverage: "Buena.", water: "Camping y establecimientos costeros.", best: "Antes de las 09:00.", real: "Fácil; la arena y la distancia aumentan el esfuerzo.", shortcut: "Dar la vuelta en Rodanho: 6–7 km." },
  "PR9 VCT · Canos de Água de Santa Luzia": { shade: "75 % aprox.", coverage: "Media.", water: "No depender de fuentes.", best: "08:00–09:00.", real: "Media por +308 m y firme estrecho junto a canales.", shortcut: "Regreso por pista forestal en los cruces señalizados." },
  "PR-G160 · Desembocadura del Miño": { shade: "30 % aprox.", coverage: "Buena.", water: "Servicios en Praia do Muíño.", best: "Mañana o tarde.", real: "Muy fácil; principal dificultad: calor y recorrido lineal.", shortcut: "Comenzar en Salcidos o terminar en los observatorios." },
  "Sendero Azul · O Muíño → Area Grande": { shade: "10 % aprox.", coverage: "Buena.", water: "Bares y fuentes en A Guarda.", best: "Primera hora o atardecer.", real: "Fácil; recordar que el regreso duplica la distancia.", shortcut: "Terminar en el puerto de A Guarda." },
  "PR-G122 · Camiños do Trega": { shade: "25 % aprox.", coverage: "Buena salvo alguna ladera.", water: "Llevar agua; servicios en cima y A Guarda.", best: "Antes de las 09:00.", real: "Media por +350 m, calor y múltiples variantes.", shortcut: "Subir o bajar en coche desde los aparcamientos intermedios." },
  "Passadiços das Lagoas do Vez": { shade: "80 % aprox.", coverage: "Irregular.", water: "Llevar agua potable; el río no se considera fuente.", best: "09:00–11:00.", real: "Fácil; atención a pasarelas mojadas.", shortcut: "Regresar desde cualquiera de las lagunas." },
  "Soajo → Poço Negro": { shade: "55 % aprox.", coverage: "Media.", water: "Servicios en Soajo.", best: "09:00–11:00.", real: "Fácil y corto; bajada final empinada.", shortcut: "Acceso de ida y vuelta; regresar antes de la escalera." },
  "Soajo · Ruta completa de las pozas": { shade: "60 % aprox.", coverage: "Irregular.", water: "Llevar 2 l; no beber del río.", best: "Salida 07:30–08:30.", real: "Media real: 11,95 km, +446 m y vegetación cerrada.", shortcut: "Usar el acceso corto a Poço Negro como alternativa." },
  "Parada de Lindoso → Poço da Gola": { shade: "80 % aprox.", coverage: "Irregular.", water: "Llevar agua; servicios en Parada.", best: "Media mañana.", real: "Fácil y muy corto; acceso final resbaladizo.", shortcut: "Regreso inmediato por el mismo camino." },
  "Arcos → Praia Fluvial da Valeta": { shade: "45 % aprox.", coverage: "Buena.", water: "Fuentes y comercios en Arcos.", best: "Mañana o final de tarde.", real: "Muy fácil y urbano.", shortcut: "Cruzar por cualquiera de los puentes y cerrar el circuito." },
  "PR2 VDM · Azenhas do Coura": { shade: "75 % aprox.", coverage: "Media.", water: "Servicios en Vilar de Mouros.", best: "09:00–11:00.", real: "Fácil; raíces, barro y tramos de ribera.", shortcut: "Volver desde Praia Fluvial das Azenhas." },
  "Pozas de Mougás": { shade: "50 % aprox.", coverage: "Irregular.", water: "Llevar agua potable.", best: "08:30–10:30.", real: "Fácil en seco; media con roca mojada.", shortcut: "Regresar desde la primera poza." },
  "PR-G112 · As Eiras y río Tamuxe": { shade: "45 % aprox.", coverage: "Buena.", water: "Área recreativa y núcleos cercanos.", best: "Antes de las 09:00.", real: "Fácil por terreno, larga por 13,7 km.", shortcut: "Hacer solo el tramo de ribera desde As Eiras." },
};

const bathDetails: Record<string, { watched: string; access: string; parking: string; shade: string; picnic: string; food: string; swim: string; risk: string; quality: string }> = {
  "Passadiços das Lagoas do Vez": { watched: "No vigilada", access: "Fácil por pasarelas; roca al entrar", parking: "Pequeños accesos en Cabreiro/Caldeiras", shade: "Alta", picnic: "Espacios naturales, sin garantizar mesas", food: "Servicios en aldeas y Arcos", swim: "Solo con caudal estable y agua clara", risk: "Roca resbaladiza y profundidad variable", quality: "https://apambiente.pt/agua/aguas-balneares" },
  "Soajo → Poço Negro": { watched: "No vigilada", access: "Escalera final empinada", parking: "Aparcamiento público de Soajo", shade: "Media", picnic: "Mejor pícnic en Soajo", food: "Cafés y restaurantes en Soajo", swim: "Baño natural condicionado al caudal", risk: "Roca pulida, saltos y profundidad", quality: "https://apambiente.pt/agua/aguas-balneares" },
  "Soajo · Ruta completa de las pozas": { watched: "No vigiladas", access: "Medio; ruta larga", parking: "Zonas públicas de Soajo", shade: "Media–alta", picnic: "Llevar pícnic y retirar residuos", food: "Servicios al inicio/final en Soajo", swim: "Solo en pozas accesibles y tranquilas", risk: "Fatiga, roca mojada y cambios de caudal", quality: "https://apambiente.pt/agua/aguas-balneares" },
  "Parada de Lindoso → Poço da Gola": { watched: "No vigilada", access: "Corto pero resbaladizo", parking: "Parada de Lindoso", shade: "Alta", picnic: "Área natural reducida", food: "Café/servicios en Parada", swim: "Poza pequeña; valorar caudal", risk: "Roca húmeda y acceso estrecho", quality: "https://apambiente.pt/agua/aguas-balneares" },
  "Arcos → Praia Fluvial da Valeta": { watched: "Comprobar vigilancia 2026", access: "Muy fácil y urbano", parking: "Aparcamientos de Arcos", shade: "Media", picnic: "Césped y zonas de estancia", food: "Bares y restaurantes cercanos", swim: "Zona fluvial acondicionada", risk: "Corriente tras lluvias", quality: "https://apambiente.pt/apa/epoca-balnear-2026" },
  "PR2 VDM · Azenhas do Coura": { watched: "Comprobar vigilancia 2026", access: "Fácil desde Vilar de Mouros", parking: "Entorno del puente medieval", shade: "Alta", picnic: "Área recreativa", food: "Cafés en Vilar de Mouros", swim: "Playa fluvial acondicionada", risk: "Caudal y fondo irregular", quality: "https://apambiente.pt/apa/epoca-balnear-2026" },
  "Pozas de Mougás": { watched: "No vigiladas", access: "Pista y sendero pedregoso", parking: "Limitado en Mougás", shade: "Media", picnic: "Sin servicios garantizados", food: "Restauración en Mougás/Oia", swim: "Solo en condiciones secas y estables", risk: "Roca mojada, crecidas y saltos", quality: "https://mapas.xunta.gal/visores/augasdegalicia/" },
  "PR-G112 · As Eiras y río Tamuxe": { watched: "Comprobar temporada", access: "Muy fácil desde el área recreativa", parking: "Praia Fluvial de As Eiras", shade: "Media", picnic: "Área recreativa y mesas", food: "Servicios en O Rosal", swim: "Verificar autorización y calidad el mismo día", risk: "Corriente del Miño/Tamuxe", quality: "https://mapas.xunta.gal/visores/augasdegalicia/" },
};

const mainCampings = [
  { name: "Lima Escape", base: 1, coords: [41.824395, -8.318062] as [number, number], price: "31 € aprox.: 2 adultos + tienda pequeña; coche/electricidad aparte", reception: "8:30–22:00; lunes hasta 21:00 en temporada media/alta", electric: "Disponible; llevar alargador largo y confirmar suplemento", pool: "Piscina y entorno fluvial; comprobar condiciones de uso", services: "Lima Bar, parcelas sombreadas y actividades de naturaleza", distance: "En una península junto al río Lima", phone: "+351 258 588 361 · +351 964 969 309", quiet: "ALTA · entorno forestal", trips: "Soajo, Lindoso, Peneda–Gerês, Sistelo y Arcos", url: "https://www.lima-escape.pt/parque-campismo/precos-campismo/" },
  { name: "INATEL Cabedelo", base: 2, coords: [41.678611, -8.823056] as [number, number], price: "Tarifa diaria 2026 no publicada claramente; pedir presupuesto", reception: "Confirmar llegada tardía con INATEL", electric: "Disponible en parcelas; confirmar suplemento", pool: "No figura piscina en los servicios oficiales", services: "Restaurante, bar, mercado, lavandería, balnearios y sombra", distance: "Acceso directo a Praia do Cabedelo; Viana a 2 km", phone: "+351 258 322 042", quiet: "MEDIA · camping costero de 25 ha", trips: "Viana, Santa Luzia, Afife, Âncora, Moledo y Caminha", url: "https://hoteis.inatel.pt/pt/Menu/Campismo/Cabedelo/Parque-de-Campismo-Inatel-Cabedelo.aspx" },
  { name: "Camping Santa Tecla", base: 3, coords: [41.8897, -8.8464] as [number, number], price: "35,90 €: 2 adultos + tienda pequeña + coche; 42,90 € con electricidad", reception: "Confirmar llegada con la reserva", electric: "7 €/noche en temporada alta", pool: "13 jun–15 sep: 10–14 y 16–20, si el tiempo permite", services: "Restaurante, bar, supermercado, wifi, lavandería y piscina", distance: "A orillas del Miño", phone: "+34 986 613 011", quiet: "MEDIA–ALTA · parcelas llanas y sombreadas", trips: "A Guarda, Santa Trega, Oia, Mougás, Baiona y Baixo Miño", url: "https://www.campingsantatecla.es/tarifas/" },
] as const;

const restaurantRecommendations = [
  { base: 1, name: "Opción tradicional en Arcos/Soajo", place: "Arcos de Valdevez · Soajo", coords: [41.8467, -8.4191] as [number, number], dish: "Cachena, cabrito y arroz de feijão", price: "€€ · 18–30 € aprox.", special: "Cocina minhota de montaña", market: "Mercado Municipal de Arcos", budget: "Prato do dia al mediodía", takeaway: "Broa, queso, embutido y fruta", closed: "Confirmar descanso semanal", url: "https://www.visitarcos.pt/" },
  { base: 1, name: "Compra para el camping", place: "Ponte da Barca · Arcos", coords: [41.8064, -8.4196] as [number, number], dish: "Rojões, caldo verde y broa", price: "€ · 8–15 € aprox.", special: "Comida preparada y producto local", market: "Mercados y supermercados de Arcos", budget: "Menú del día o comida preparada", takeaway: "Ideal para la primera base", closed: "Mercados: comprobar horario", url: "https://www.cmav.pt/" },
  { base: 2, name: "Taberna o tasca de Viana", place: "Viana do Castelo", coords: [41.6928, -8.8282] as [number, number], dish: "Bacalhau à Minhota y polvo à lagareiro", price: "€€ · 16–28 € aprox.", special: "Pescado y cocina del Minho", market: "Mercado Municipal de Viana", budget: "Prato do dia", takeaway: "Bolas de Berlim y empanadas", closed: "Muchos locales cierran lunes; confirmar", url: "https://www.cm-viana-castelo.pt/visite-viana/" },
  { base: 2, name: "Pescado en Caminha", place: "Caminha", coords: [41.8753, -8.8387] as [number, number], dish: "Peixe grelhado y arroz de marisco", price: "€€–€€€ · 20–35 € aprox.", special: "Pescado atlántico", market: "Mercado Municipal de Caminha", budget: "Sardina o plato del día", takeaway: "Empanada, conservas y fruta", closed: "Confirmar reserva y descanso", url: "https://www.cm-caminha.pt/" },
  { base: 3, name: "Puerto de A Guarda", place: "A Guarda", coords: [41.9012, -8.8747] as [number, number], dish: "Pulpo, pescado y marisco", price: "€€–€€€ · 20–45 € aprox.", special: "Producto del puerto; langosta como capricho", market: "Praza de Abastos de A Guarda", budget: "Ración o menú del día", takeaway: "Empanada gallega y conservas", closed: "Confirmar; varía por temporada", url: "https://www.turismoaguarda.es/donde-comer/" },
  { base: 3, name: "Baiona y Baixo Miño", place: "Baiona · O Rosal", coords: [42.1209, -8.8492] as [number, number], dish: "Pulpo á feira, marisco y cocina gallega", price: "€€ · 18–35 € aprox.", special: "Mar y vinos del Rosal", market: "Mercado de Baiona / comercio local", budget: "Tapería y menú", takeaway: "Empanada y rosca de yema", closed: "Confirmar antes de desviaros", url: "https://turismodebaiona.com/" },
] as const;

const explore: ExploreItem[] = [
  { name: "Praia Fluvial da Valeta", type: "fluvial", base: 1, coords: [41.8487, -8.4159], note: "Baño urbano en el Vez; cómoda para combinar con Arcos." },
  { name: "Praia Fluvial de Ponte da Barca", type: "fluvial", base: 1, coords: [41.8082, -8.4181], note: "Zona de baño y césped junto al puente medieval." },
  { name: "Praia Fluvial de Adaúfe", type: "fluvial", base: 1, coords: [41.6193, -8.3944], note: "Desvío al norte de Braga, con área de recreo." },
  { name: "Santuário da Peneda", type: "desvío", base: 1, coords: [41.9732, -8.2225], note: "Santuario monumental en un valle glaciar.", url: "https://www.visitportugal.com/es/content/santuario-de-nossa-senhora-da-peneda" },
  { name: "Castro Laboreiro", type: "desvío", base: 1, coords: [42.0302, -8.1582], note: "Aldea, castillo y paisaje serrano; excursión larga." },
  { name: "Ponte de Lima", type: "interés", base: 1, coords: [41.7676, -8.5831], note: "Villa histórica, puente romano-medieval y paseo fluvial." },
  { name: "Museu da Água ao Ar Livre do Rio Vez", type: "interés", base: 1, coords: [41.8472, -8.4158], note: "Centro interpretativo y recorrido exterior junto al Vez; combina bien con la Valeta.", location: "Arcos de Valdevez", specialty: "Agua, paisaje y patrimonio del río Vez", hours: "Exterior abierto; comprobar agenda del centro", price: "Exterior libre; actividades según programa", visitTime: "45–75 min", categories: ["museo", "lluvia-parcial"], url: "https://www.cmav.pt/viver/cultura/espacos/rede-de-equipamentos/museu-da-agua-ao-ar-livre-do-rio-vez" },
  { name: "Paço de Giela", type: "interés", base: 1, coords: [41.8337, -8.4287], note: "Casa-torre medieval rehabilitada con interpretación histórica y vistas sobre Arcos.", location: "Arcos de Valdevez", specialty: "Arquitectura medieval e historia local", hours: "Horario estacional; comprobar antes de salir", price: "Confirmar tarifa", visitTime: "60–90 min", categories: ["museo", "lluvia-parcial"], url: "https://www.cmav.pt/viver/cultura/espacos/rede-de-equipamentos/paco-de-giela" },
  { name: "Porta do Mezio", type: "interés", base: 1, coords: [41.8839, -8.3129], note: "Puerta del parque nacional con recepción e interpretación ambiental.", location: "Mezio · Arcos de Valdevez", specialty: "Naturaleza y Peneda-Gerês", hours: "Horario estacional; confirmar actividades", price: "Confirmar según actividad", visitTime: "45–90 min", categories: ["museo", "lluvia"], url: "https://www.portadomezio.pt/" },
  { name: "Museu de Arqueologia D. Diogo de Sousa", type: "interés", base: 1, coords: [41.5448, -8.4264], note: "La mejor introducción al pasado romano de Bracara Augusta.", location: "Braga", specialty: "Arqueología y romanización", hours: "Mar–dom 10:00–17:30; confirmar festivos", price: "Confirmar tarifa vigente", visitTime: "75–120 min", categories: ["museo", "lluvia"], url: "https://www.museusemonumentos.pt/pt/museus-e-monumentos/museu-de-arqueologia-d-diogo-de-sousa" },
  { name: "Museu dos Biscainhos", type: "interés", base: 1, coords: [41.5518, -8.4299], note: "Palacio barroco, artes decorativas y jardín histórico.", location: "Braga", specialty: "Casa histórica y artes decorativas", hours: "Mar–dom 10:00–12:30 y 14:00–17:30", price: "Confirmar tarifa y salas abiertas", visitTime: "60–90 min", categories: ["museo", "lluvia"], url: "https://www.museusemonumentos.pt/pt/museus-e-monumentos/museu-dos-biscainhos" },
  { name: "Praia do Cabedelo", type: "playa", base: 2, coords: [41.6783, -8.8384], note: "La playa de la segunda base: dunas, surf y puesta de sol." },
  { name: "Praia do Rodanho", type: "playa", base: 2, coords: [41.6525, -8.8244], note: "Amplia y menos urbana, al sur de Cabedelo." },
  { name: "Praia da Amorosa", type: "playa", base: 2, coords: [41.6502, -8.8266], note: "Pasarelas, dunas y paseo litoral." },
  { name: "Praia da Arda / Mariana", type: "playa", base: 2, coords: [41.7553, -8.8718], note: "Playa atlántica abierta entre Carreço y Afife." },
  { name: "Praia Fluvial das Azenhas", type: "fluvial", base: 2, coords: [41.8764, -8.7909], note: "Baño interior en Vilar de Mouros; verificar caudal y vigilancia." },
  { name: "Vila Nova de Cerveira", type: "desvío", base: 2, coords: [41.9413, -8.7426], note: "Villa de arte, fortaleza y miradores sobre el Miño." },
  { name: "Navio-Hospital Gil Eannes", type: "interés", base: 2, coords: [41.6907, -8.8317], note: "Buque hospital visitable ligado a la flota bacaladera portuguesa.", location: "Doca Comercial · Viana", specialty: "Historia marítima y medicina a bordo", hours: "Horario estacional; comprobar el mismo día", price: "Confirmar tarifa vigente", visitTime: "75–120 min", categories: ["museo", "lluvia"], url: "https://www.fundacaogileannes.pt/" },
  { name: "Museu do Traje de Viana do Castelo", type: "interés", base: 2, coords: [41.6935, -8.8287], note: "Traje tradicional, bordado e identidad local en la Praça da República.", location: "Praça da República · Viana", specialty: "Traje, bordado y cultura popular", hours: "Lun–vie 9:00–13:00 y 14:00–17:00; confirmar fin de semana", price: "Confirmar tarifa municipal", visitTime: "60–90 min", categories: ["museo", "lluvia"], url: "https://www.cm-viana-castelo.pt/visite-viana/o-que-visitar/museus/" },
  { name: "Museu de Artes Decorativas", type: "interés", base: 2, coords: [41.6924, -8.8256], note: "Mobiliario, cerámica y artes decorativas en una casa histórica.", location: "Largo de São Domingos · Viana", specialty: "Artes decorativas portuguesas", hours: "Horario municipal; comprobar festivos", price: "Confirmar tarifa municipal", visitTime: "60–90 min", categories: ["museo", "lluvia"], url: "https://www.cm-viana-castelo.pt/visite-viana/o-que-visitar/museus/" },
  { name: "Praia do Muíño", type: "fluvial", base: 3, coords: [41.9004, -8.8671], note: "Playa en la desembocadura del Miño, protegida del oleaje.", url: "https://www.turismoaguarda.es/playas-fluviales/" },
  { name: "Praia de Area Grande", type: "playa", base: 3, coords: [41.9207, -8.8744], note: "Cala atlántica junto a la senda litoral de A Guarda." },
  { name: "Praia de Fedorento", type: "playa", base: 3, coords: [41.9132, -8.8762], note: "Pequeña playa rocosa al norte del puerto." },
  { name: "A Cabeciña", type: "interés", base: 3, coords: [42.0543, -8.8509], note: "Petroglifos, castro y mirador sobre Mougás." },
  { name: "Serra da Groba", type: "desvío", base: 3, coords: [42.1046, -8.8386], note: "Miradores, caballos y panorámica de Baiona." },
  { name: "Tomiño", type: "desvío", base: 3, coords: [41.9877, -8.7554], note: "Mercado, Miño y conexión con Vila Nova de Cerveira." },
  { name: "MASAT · Museo Arqueolóxico de Santa Trega", type: "interés", base: 3, coords: [41.8921, -8.8692], note: "Piezas del castro que ayudan a comprender el yacimiento.", location: "Monte Santa Trega · A Guarda", specialty: "Cultura castreña y arqueología", hours: "Mar–dom 10:00–20:00 en temporada; lunes cerrado", price: "Confirmar tarifa y acceso al monte", visitTime: "30–60 min", categories: ["museo", "lluvia-parcial"], url: "https://www.turismoaguarda.es/museos/" },
  { name: "Museo do Mar de A Guarda", type: "interés", base: 3, coords: [41.9011, -8.8776], note: "Museo en la Atalaia dedicado al oficio pesquero y la vida marítima.", location: "Atalaia · Puerto de A Guarda", specialty: "Pesca y patrimonio marítimo", hours: "Jue–dom 11:00–14:00 y 16:00–19:00; confirmar temporada", price: "Confirmar tarifa", visitTime: "30–60 min", categories: ["museo", "lluvia"], url: "https://www.turismoaguarda.es/museos/" },
  { name: "Casa de la Navegación de Baiona", type: "interés", base: 3, coords: [42.1192, -8.8496], note: "Historia del puerto, la Arribada y las navegaciones, con opción de realidad virtual.", location: "Ventura Misa, 17 · Baiona", specialty: "Navegación e historia portuaria", hours: "Mar–sáb 10:00–13:00 y 16:00–19:00", price: "2 €; 4 € con RV; combinada 3 €", visitTime: "60–90 min", categories: ["museo", "lluvia"], url: "https://www.baiona.gal/instalaciones/culturales/" },
  { name: "Museo de la Carabela Pinta", type: "interés", base: 3, coords: [42.1205, -8.8473], note: "Réplica flotante que muestra cómo era la vida a bordo en el siglo XV.", location: "Paseo Elduayen · Baiona", specialty: "Navegación del siglo XV", hours: "Horario estacional; comprobar por viento y mantenimiento", price: "3 €; existe entrada combinada", visitTime: "30–45 min", categories: ["museo", "lluvia-parcial"], url: "https://www.baiona.gal/instalaciones/culturales/" },
];

const campings: CampingItem[] = [
  { name: "Parque de Campismo de Travanca", area: "Arcos de Valdevez", category: "EN RUTA", coords: [41.8946, -8.3448], url: "https://www.portadomezio.pt/" },
  { name: "Lima Escape", area: "Entre Ambos-os-Rios · Ponte da Barca", category: "EN RUTA", coords: [41.824395, -8.318062], url: "https://www.lima-escape.pt/" },
  { name: "Orbitur Caminha", area: "Mata do Camarido · Caminha", category: "EN RUTA", coords: [41.8789, -8.8576], url: "https://www.orbitur.pt/" },
  { name: "Sereia da Gelfa", area: "Vila Praia de Âncora", category: "EN RUTA", coords: [41.8004, -8.8614] },
  { name: "Parque de Campismo Lamas de Mouro", area: "Melgaço", category: "DESVÍO CORTO", coords: [42.0508, -8.2028], url: "https://www.montesdelaboreiro.pt/" },
  { name: "Parque de Campismo Termas do Peso", area: "Melgaço", category: "DESVÍO CORTO", coords: [42.1014, -8.3004] },
  { name: "Ermida Gerês Camping", area: "Vilar da Veiga · Terras de Bouro", category: "DESVÍO CORTO", coords: [41.7188, -8.1316], url: "https://www.ermidagerescamping.com/" },
  { name: "Garfepark Camping", area: "Póvoa de Lanhoso", category: "DESVÍO CORTO", coords: [41.5758, -8.2297], url: "https://garfeparkcamping.weebly.com/" },
  { name: "Parque de Campismo da Penha", area: "Guimarães", category: "DESVÍO CORTO", coords: [41.4325, -8.2678] },
  { name: "Campismo da Barragem de Queimadela", area: "Fafe", category: "DESVÍO CORTO", coords: [41.5039, -8.1113] },
  { name: "Orbitur Angeiras", area: "Lavra · Matosinhos", category: "DESVÍO CORTO", coords: [41.2676, -8.7189], url: "https://www.orbitur.pt/" },
  { name: "Parque de Campismo de Vila Chã", area: "Vila do Conde", category: "DESVÍO CORTO", coords: [41.2875, -8.7298] },
  { name: "Parque Municipal de Campismo de Espinho", area: "Espinho", category: "FUERA DE RUTA", coords: [41.0114, -8.6403] },
  { name: "Parque de Campismo de Salgueiros", area: "Vila Nova de Gaia", category: "FUERA DE RUTA", coords: [41.1135, -8.6578] },
  { name: "Orbitur Canidelo", area: "Vila Nova de Gaia", category: "FUERA DE RUTA", coords: [41.1241, -8.6684], url: "https://www.orbitur.pt/pt/destinos/regiao-norte/orbitur-canidelo" },
  { name: "Parque de Campismo Marisol", area: "Vila Nova de Gaia", category: "FUERA DE RUTA", coords: [41.0845, -8.6534] },
  { name: "Campidouro", area: "Medas · Gondomar", category: "FUERA DE RUTA", coords: [41.0715, -8.4293], url: "https://campidouro.pt/" },
  { name: "Parque de Campismo de Mourilhe", area: "Cinfães", category: "FUERA DE RUTA", coords: [41.0794, -8.0911], url: "https://www.welcomedouro.pt/" },
  { name: "Mata do Cabo", area: "São João da Pesqueira", category: "FUERA DE RUTA", coords: [41.1487, -7.4045] },
  { name: "Parque de Campismo de Chaves", area: "Quinta do Rebentão · Chaves", category: "FUERA DE RUTA", coords: [41.7068, -7.4684] },
  { name: "Parque Municipal da Maravilha", area: "Mirandela", category: "FUERA DE RUTA", coords: [41.4872, -7.1817] },
  { name: "Glamping Hills", area: "Santa Comba de Rossas · Bragança", category: "FUERA DE RUTA", coords: [41.6673, -6.8286] },
  { name: "Parque de Campismo Cepo Verde", area: "Gondesende · Bragança", category: "FUERA DE RUTA", coords: [41.8922, -6.9137], url: "http://www.montesinho.com/cepoverde" },
  { name: "Sobre Aguas Camping", area: "Estrada de Rabal · Bragança", category: "FUERA DE RUTA", coords: [41.8261, -6.7587] },
  { name: "Parque de Campismo de Vimioso", area: "Vimioso", category: "FUERA DE RUTA", coords: [41.5856, -6.5287] },
];

const interests = [
  ["PATRIMONIO", "Espigueiros de Soajo y Lindoso · Castelo de Lindoso · Sé de Braga · Fortaleza de Valença · Castro de Santa Trega · Monasterio de Oia"],
  ["NATURALEZA", "Río Lima · Serra Amarela · bancales de Sistelo · dunas de Cabedelo · estuario del Miño · pozas de Mougás"],
  ["FOTOGRAFÍA", "Santa Luzia al atardecer · Forte da Ínsua desde Moledo · Santa Trega · Cabo Silleiro · puerto de A Guarda"],
  ["BAÑO Y SURF", "Praia do Cabedelo · Afife · Moledo · playas de Âncora · Area Grande · Praia do Muíño"],
] as const;

function googleDirections(points: readonly (readonly number[])[]) {
  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1).map((p) => `${p[0]},${p[1]}`).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=driving`;
}

function durationGroup(time: string) {
  if (time.includes("MIN") && !time.includes("H")) return "corta";
  const hours = Number.parseFloat(time.replace(",", "."));
  if (hours < 1) return "corta";
  if (hours <= 2) return "media";
  return "larga";
}

function osmUrl(coords: readonly number[]) {
  return `https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}#map=15/${coords[0]}/${coords[1]}`;
}

function suggestedDay(base: number) {
  return base === 1 ? "02" : base === 2 ? "06" : base === 3 ? "08" : "01";
}

function distanceKm(a: readonly number[], b: readonly number[]) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function Home() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Record<number, LayerGroup>>({});
  const dayRouteLayersRef = useRef<Record<string, LayerGroup>>({});
  const [activeBase, setActiveBase] = useState(0);
  const [activeDay, setActiveDay] = useState("TODOS");
  const [travelPace, setTravelPace] = useState<"tranquilo" | "normal" | "completo">("normal");
  const [routeBase, setRouteBase] = useState(0);
  const [routeDifficulty, setRouteDifficulty] = useState<"todas" | "FÁCIL" | "MEDIA">("todas");
  const [routeDuration, setRouteDuration] = useState<"todas" | "corta" | "media" | "larga">("todas");
  const [routeBath, setRouteBath] = useState<"todas" | "con" | "sin">("todas");
  const [openRoute, setOpenRoute] = useState<string | null>(null);
  const [exploreFilter, setExploreFilter] = useState("todos");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [planItems, setPlanItems] = useState<Array<{ name: string; day: string }>>([]);
  const [weather, setWeather] = useState<Record<string, WeatherDay>>({});
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "error">("loading");
  const [dayStart, setDayStart] = useState("08:30");
  const [dayEnd, setDayEnd] = useState("20:30");
  const [dayPreference, setDayPreference] = useState<"baño" | "senderismo" | "patrimonio" | "gastronomía">("senderismo");
  const [organizedDays, setOrganizedDays] = useState<Record<string, Array<{ time: string; label: string }>>>({});
  const [diary, setDiary] = useState<Record<string, DiaryEntry>>({});
  const [online, setOnline] = useState(true);
  const [downloadedBases, setDownloadedBases] = useState<number[]>([]);
  const [eventCheckedAt, setEventCheckedAt] = useState("");
  const [eventChecking, setEventChecking] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<"days" | "events" | "food" | "walks" | "explore" | "campings" | "decide" | "offline">("days");

  const visibleStops = useMemo(
    () => (activeBase === 0 ? stops : stops.filter((stop) => stop.base === activeBase)),
    [activeBase],
  );

  const routeMatches = (walk: (typeof walks)[number] | (typeof waterWalks)[number], hasBath: boolean) =>
    (routeBase === 0 || walk.base === routeBase) &&
    (routeDifficulty === "todas" || walk.difficulty === routeDifficulty) &&
    (routeDuration === "todas" || durationGroup(walk.time) === routeDuration) &&
    (routeBath === "todas" || (routeBath === "con" ? hasBath : !hasBath));

  const filteredWalks = walks.filter((walk) => routeMatches(walk, false));
  const filteredWaterWalks = waterWalks.filter((walk) => routeMatches(walk, true));
  const routeResultCount = filteredWalks.length + filteredWaterWalks.length;
  const filteredExplore = explore.filter((place) => {
    if (exploreFilter === "todos") return true;
    if (exploreFilter === "pozas") return place.type === "fluvial";
    if (exploreFilter === "fluvial") return place.type === "fluvial";
    if (exploreFilter === "playas") return place.type === "playa";
    if (exploreFilter === "museos") return place.categories?.includes("museo") ?? false;
    if (exploreFilter === "patrimonio") return place.type === "interés" || place.type === "desvío";
    if (exploreFilter === "foto") return /Peneda|Castro|Ponte|Cabeciña|Groba|Cerveira/i.test(place.name);
    if (exploreFilter === "surf") return /Cabedelo|Arda|Area Grande|Amorosa/i.test(place.name);
    if (exploreFilter === "lluvia") return place.categories?.some((category) => category.startsWith("lluvia")) || /Ponte de Lima|Cerveira/i.test(place.name);
    return true;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setFavorites(JSON.parse(localStorage.getItem("np-favorites") || "[]"));
        setVisited(JSON.parse(localStorage.getItem("np-visited") || "[]"));
        setPlanItems(JSON.parse(localStorage.getItem("np-plan") || "[]"));
        setDiary(JSON.parse(localStorage.getItem("np-diary") || "{}"));
        setDownloadedBases(JSON.parse(localStorage.getItem("np-offline-bases") || "[]"));
        setEventCheckedAt(localStorage.getItem("np-events-checked") || "");
      } catch {
        setFavorites([]);
        setVisited([]);
        setPlanItems([]);
      }
      setStorageLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem("np-favorites", JSON.stringify(favorites));
    localStorage.setItem("np-visited", JSON.stringify(visited));
    localStorage.setItem("np-plan", JSON.stringify(planItems));
    localStorage.setItem("np-diary", JSON.stringify(diary));
    localStorage.setItem("np-offline-bases", JSON.stringify(downloadedBases));
    localStorage.setItem("np-events-checked", eventCheckedAt);
  }, [favorites, visited, planItems, diary, downloadedBases, eventCheckedAt, storageLoaded]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOnline(navigator.onLine), 0);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.clearTimeout(timer); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWeather() {
      setWeatherStatus("loading");
      try {
        const grouped: Record<string, WeatherDay> = {};
        for (const base of bases) {
          const url = new URL("https://api.open-meteo.com/v1/forecast");
          url.search = new URLSearchParams({
            latitude: String(base.center[0]), longitude: String(base.center[1]),
            start_date: "2026-08-01", end_date: "2026-08-10", timezone: "Europe/Lisbon",
            daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
            hourly: "temperature_2m,precipitation_probability,wind_speed_10m",
          }).toString();
          const response = await fetch(url);
          if (!response.ok) throw new Error("weather");
          const data = await response.json();
          data.daily.time.forEach((date: string, index: number) => {
            const day = date.slice(-2);
            const hours: WeatherDay["hourly"] = [];
            data.hourly.time.forEach((time: string, hourIndex: number) => {
              if (time.startsWith(date) && [9, 12, 15, 18, 21].includes(Number(time.slice(11, 13)))) {
                hours.push({ time: time.slice(11), temp: Math.round(data.hourly.temperature_2m[hourIndex]), rain: data.hourly.precipitation_probability[hourIndex], wind: Math.round(data.hourly.wind_speed_10m[hourIndex]) });
              }
            });
            const routeBase = dayOperations[day]?.base;
            if (routeBase === base.id) grouped[day] = {
              max: Math.round(data.daily.temperature_2m_max[index]), min: Math.round(data.daily.temperature_2m_min[index]),
              rain: data.daily.precipitation_probability_max[index], wind: Math.round(data.daily.wind_speed_10m_max[index]),
              code: data.daily.weather_code[index], hourly: hours,
            };
          });
          if (base.id >= 2) {
            const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
            marineUrl.search = new URLSearchParams({
              latitude: String(base.center[0]), longitude: String(base.center[1]),
              start_date: "2026-08-01", end_date: "2026-08-10", timezone: "Europe/Lisbon",
              hourly: "wave_height",
            }).toString();
            const marineResponse = await fetch(marineUrl);
            if (marineResponse.ok) {
              const marine = await marineResponse.json();
              marine.hourly.time.forEach((time: string, hourIndex: number) => {
                const day = time.slice(8, 10);
                if (grouped[day] && dayOperations[day].base === base.id) {
                  grouped[day].wave = Math.max(grouped[day].wave || 0, marine.hourly.wave_height[hourIndex] || 0);
                }
              });
            }
          }
        }
        if (!cancelled) { setWeather(grouped); setWeatherStatus("ready"); }
      } catch {
        if (!cancelled) setWeatherStatus("error");
      }
    }
    loadWeather();
    return () => { cancelled = true; };
  }, []);

  function toggleList(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function addToPlan(name: string, day: string) {
    setPlanItems((current) => current.some((item) => item.name === name && item.day === day) ? current : [...current, { name, day }]);
  }

  function addMinutes(time: string, minutes: number) {
    const [hour, minute] = time.split(":").map(Number);
    const total = hour * 60 + minute + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function weatherAdvice(day: string) {
    const value = weather[day];
    if (!value) return weatherStatus === "error" ? "Previsión no disponible: consultar antes de salir." : "Cargando previsión actualizada…";
    if (value.rain >= 55 && [2, 3, 9].includes(Number(day))) return day === "09" ? "Evitar las pozas de Mougás; mejor Oia y Baiona." : "Evitar pozas y pasarelas; mejor Braga, Arcos o patrimonio cubierto.";
    if (value.wind >= 35 && [5, 6, 9].includes(Number(day))) return "Costa muy expuesta: priorizar pueblos y patrimonio; comprobar oleaje.";
    if (value.rain <= 25 && value.wind < 28 && [5, 6, 9].includes(Number(day))) return "Buen día para costa y baño, comprobando bandera y corrientes.";
    if (value.rain <= 30 && [2, 3].includes(Number(day))) return "Condiciones favorables para Peneda–Gerês; empezar temprano.";
    return "Plan viable con margen: revisar la previsión horaria al despertar.";
  }

  function organizeDay(day: string) {
    const plan = dailyPlans.find((item) => item.day === day)!;
    const ops = dayOperations[day];
    const forecast = weather[day];
    const wet = (forecast?.rain ?? 0) >= 50;
    const paceCount = travelPace === "tranquilo" ? 2 : travelPace === "normal" ? Math.min(4, plan.schedule.length) : plan.schedule.length;
    let items: string[] = (wet ? [plan.rain, ...plan.schedule.filter((_, index) => index < 2)] : [...plan.schedule]).slice(0, paceCount);
    if (dayPreference === "baño") items = [...items.filter((item) => /baño|playa|poza|río/i.test(item)), ...items.filter((item) => !/baño|playa|poza|río/i.test(item))];
    if (dayPreference === "gastronomía") items.splice(Math.min(1, items.length), 0, `Comida local: ${plan.food}`);
    if (dayPreference === "patrimonio") items = [...items.filter((item) => /castillo|centro|monasterio|catedral|fortaleza|espigueiro|museo|santa/i.test(item)), ...items.filter((item) => !/castillo|centro|monasterio|catedral|fortaleza|espigueiro|museo|santa/i.test(item))];
    if (dayPreference === "senderismo" && !items.some((item) => /ruta|paseo|ecovia|sendero/i.test(item))) items.unshift(plan.walk);
    const available = Math.max(240, (Number(dayEnd.slice(0, 2)) * 60 + Number(dayEnd.slice(3))) - (Number(dayStart.slice(0, 2)) * 60 + Number(dayStart.slice(3))));
    const fixed = ops.parkingMinutes + ops.restMinutes + ops.walkMinutes;
    const slot = Math.max(35, Math.floor((available - fixed) / Math.max(1, items.length + 2)));
    let cursor = dayStart;
    const timeline = [{ time: cursor, label: `Salida desde ${bases[ops.base - 1].title}` }];
    cursor = addMinutes(cursor, slot);
    timeline.push({ time: cursor, label: `Llegada y aparcamiento · reservar ${ops.parkingMinutes} min` });
    items.forEach((label, index) => {
      cursor = addMinutes(cursor, index === 1 ? ops.walkMinutes : slot);
      timeline.push({ time: cursor, label });
      if (index === 0 && dayPreference !== "gastronomía") {
        cursor = addMinutes(cursor, slot);
        timeline.push({ time: cursor, label: `Comida / pícnic · ${plan.food}` });
      }
    });
    timeline.push({ time: dayEnd, label: "Regreso previsto al camping" });
    setOrganizedDays((current) => ({ ...current, [day]: timeline }));
  }

  function exportDayRoute(day: string, format: "gpx" | "kml" = "gpx") {
    const route = dayRoutes.find((item) => item.day === day)!;
    const name = `día-${day}-${route.title}`;
    if (format === "gpx") {
      downloadText(`ruta-dia-${day}.gpx`, `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Norte Portugal 2026"><trk><name>${name}</name><trkseg>${route.points.map((p) => `<trkpt lat="${p[0]}" lon="${p[1]}"/>`).join("")}</trkseg></trk></gpx>`, "application/gpx+xml");
    } else {
      downloadText(`ruta-dia-${day}.kml`, `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Style id="road"><LineStyle><color>ff2c48e5</color><width>4</width></LineStyle></Style><Placemark><name>${name}</name><styleUrl>#road</styleUrl><LineString><coordinates>${route.points.map((p) => `${p[1]},${p[0]},0`).join(" ")}</coordinates></LineString></Placemark></Document></kml>`, "application/vnd.google-earth.kml+xml");
    }
  }

  function printDay(day: string) {
    const plan = dailyPlans.find((item) => item.day === day)!;
    const ops = dayOperations[day];
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Día ${day}</title><style>body{font:15px Arial;max-width:760px;margin:30px auto;padding:20px;color:#20201d}h1{font-size:38px}section{border-top:2px solid;padding:14px 0}li,p{line-height:1.5}.warn{background:#fff0e9;padding:12px}</style></head><body><h1>DÍA ${day}<br>${plan.date}</h1><p><b>${plan.drive}</b> · ${plan.base}</p><section><h2>Plan</h2><ol>${plan.schedule.map((x) => `<li>${x}</li>`).join("")}</ol></section><section><h2>Tiempos reales</h2><p>Parking ${ops.parkingMinutes} min · caminar ${ops.walkMinutes} min · visitas ${ops.visitMinutes} min · descanso ${ops.restMinutes} min · hora límite ${ops.lastExit}</p></section><section class="warn"><b>Alertas</b><ul>${ops.warnings.map((x) => `<li>${x}</li>`).join("")}</ul></section><section><b>Coordenadas y navegación</b><p>${dayRoutes.find((x) => x.day === day)!.points.map((p) => `${p[0]}, ${p[1]}`).join("<br>")}</p></section><script>window.onload=()=>window.print();<\/script></body></html>`);
    popup.document.close();
  }

  function downloadBasePack(baseId: number) {
    const base = bases[baseId - 1];
    const baseStops = stops.filter((stop) => stop.base === baseId);
    const baseDays = dailyPlans.filter((plan) => dayOperations[plan.day].base === baseId);
    downloadText(`paquete-base-${baseId}-${base.title.toLowerCase().replaceAll(" ", "-")}.html`, `<!doctype html><meta charset="utf-8"><title>${base.title}</title><style>body{font:15px Arial;max-width:800px;margin:auto;padding:24px}article{border-top:2px solid;padding:14px 0}</style><h1>BASE 0${baseId} · ${base.title}</h1><p>${base.dates} · ${base.center[0]}, ${base.center[1]}</p>${baseDays.map((plan) => `<article><h2>Día ${plan.day}</h2><p>${plan.drive}</p><ol>${plan.schedule.map((x) => `<li>${x}</li>`).join("")}</ol><p>${plan.walk}</p></article>`).join("")}<h2>Coordenadas</h2>${baseStops.map((x) => `<p><b>${x.name}</b><br>${x.coords[0]}, ${x.coords[1]}</p>`).join("")}`, "text/html");
    setDownloadedBases((current) => current.includes(baseId) ? current : [...current, baseId]);
  }

  function updateDiary(name: string, patch: Partial<DiaryEntry>) {
    setDiary((current) => {
      const existing: DiaryEntry = current[name] || { note: "", rating: 0, food: "", expense: "", recommended: true };
      return { ...current, [name]: { ...existing, ...patch } };
    });
  }

  function addDiaryPhoto(name: string, file?: File) {
    if (!file || file.size > 2_000_000) return;
    const reader = new FileReader();
    reader.onload = () => updateDiary(name, { photo: String(reader.result) });
    reader.readAsDataURL(file);
  }

  async function checkEventUpdates() {
    setEventChecking(true);
    await Promise.allSettled(events.map((event) => fetch(event.url, { mode: "no-cors", cache: "no-store" })));
    const value = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    setEventCheckedAt(value);
    setEventChecking(false);
  }

  function downloadText(filename: string, content: string, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPoints(format: "gpx" | "kml") {
    const points = [
      ...stops.map((item) => ({ name: item.name, coords: item.coords })),
      ...explore.map((item) => ({ name: item.name, coords: item.coords })),
      ...walks.map((item) => ({ name: `Inicio · ${item.title}`, coords: item.start })),
      ...waterWalks.map((item) => ({ name: `Inicio · ${item.title}`, coords: item.start })),
    ];
    const safe = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    if (format === "gpx") {
      downloadText("norte-portugal-2026.gpx", `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Norte Portugal 2026">${points.map((point) => `<wpt lat="${point.coords[0]}" lon="${point.coords[1]}"><name>${safe(point.name)}</name></wpt>`).join("")}</gpx>`, "application/gpx+xml");
    } else {
      downloadText("norte-portugal-2026.kml", `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${points.map((point) => `<Placemark><name>${safe(point.name)}</name><Point><coordinates>${point.coords[1]},${point.coords[0]},0</coordinates></Point></Placemark>`).join("")}</Document></kml>`, "application/vnd.google-earth.kml+xml");
    }
  }

  function downloadContacts() {
    const lines = [
      "NORTE DE PORTUGAL 2026 · DIRECCIONES Y CONTACTOS",
      "",
      ...mainCampings.flatMap((camp) => [`${camp.name}`, `${camp.coords[0]}, ${camp.coords[1]}`, `Teléfono: ${camp.phone}`, `Reserva: ${camp.url}`, ""]),
      "EMERGENCIAS: 112 (Portugal y España)",
    ];
    downloadText("contactos-norte-portugal-2026.txt", lines.join("\n"));
  }

  function printPlanning() {
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Norte de Portugal 2026</title><style>
      body{font:14px Arial,sans-serif;color:#20201d;max-width:820px;margin:30px auto;padding:0 24px}
      h1{font-size:34px;line-height:.95}article{break-inside:avoid;border-top:2px solid #20201d;padding:16px 0}
      h2{margin:0 0 5px;font-size:20px}small,b{letter-spacing:.06em}ul{padding-left:20px}p,li{line-height:1.45}
      .box{border-left:5px solid #1779a8;background:#eef6f9;padding:10px}.meta{font-weight:bold;color:#666}
    </style></head><body><h1>NORTE DE PORTUGAL<br>PLANNING · 1–10 AGOSTO 2026</h1>
    ${dailyPlans.map((plan) => `<article><h2>DÍA ${plan.day} · ${plan.date}</h2><p class="meta">${plan.drive} · ${plan.base}</p><ul>${plan.schedule.map((item) => `<li>${item}</li>`).join("")}</ul><p><b>Ruta:</b> ${plan.walk}</p><p><b>Comer:</b> ${plan.food}</p><p class="box"><b>Si llueve:</b> ${plan.rain}</p></article>`).join("")}
    <script>window.onload=()=>window.print();<\/script></body></html>`);
    popup.document.close();
  }

  function printDiary() {
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Diario Norte de Portugal</title><style>body{font:15px Arial;max-width:820px;margin:30px auto;padding:0 24px;color:#20201d}h1{font-size:42px;line-height:.9}article{break-inside:avoid;border-top:2px solid;padding:18px 0}img{max-width:100%;max-height:420px;object-fit:cover}small{font-weight:bold;letter-spacing:.1em}</style></head><body><h1>DIARIO<br>NORTE DE PORTUGAL 2026</h1>${Object.entries(diary).map(([name, entry]) => `<article><small>${entry.recommended ? "RECOMENDADO" : "NO REPETIRÍA"} · ${entry.rating || "—"}/5 ★</small><h2>${name}</h2>${entry.photo ? `<img src="${entry.photo}" alt="">` : ""}<p>${entry.note || "Sin nota."}</p><p><b>Comimos:</b> ${entry.food || "—"} · <b>Gasto:</b> ${entry.expense || "—"}</p></article>`).join("")}<script>window.onload=()=>window.print();<\/script></body></html>`);
    popup.document.close();
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!mapEl.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;

      const map = L.map(mapEl.current, { zoomControl: false, minZoom: 5 });
      map.fitBounds([[41.48, -8.99], [42.2, -8.05]], { padding: [25, 25] });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const all = L.layerGroup().addTo(map);
      layersRef.current[0] = all;

      dayRoutes.forEach((route) => {
        const routeLayer = L.layerGroup().addTo(map);
        dayRouteLayersRef.current[route.day] = routeLayer;
        L.polyline(route.points.map(([lat, lng]) => [lat, lng] as [number, number]), {
          color: route.color,
          weight: route.day === "01" || route.day === "10" ? 2 : 4,
          opacity: route.day === "01" || route.day === "10" ? 0.36 : 0.78,
          dashArray: route.day === "01" || route.day === "10" ? "7 8" : undefined,
        }).bindTooltip(`DÍA ${route.day} · ${route.title}`).addTo(routeLayer);
        route.points.slice(1, -1).forEach(([lat, lng], index) => {
          L.circleMarker([lat, lng], { radius: 10, color: route.color, weight: 2, fillColor: "#f4f0e6", fillOpacity: 1 })
            .bindTooltip(`${index + 1} → ${route.title}`, { permanent: false, direction: "top" })
            .addTo(routeLayer);
        });
      });

      stops.forEach((stop, index) => {
        const color = stop.base === 0 ? "#20201d" : bases[stop.base - 1].color;
        const marker = L.circleMarker(stop.coords, {
          radius: stop.kind === "camping" ? 10 : 6,
          color: "#fffdf7",
          weight: stop.kind === "camping" ? 4 : 2,
          fillColor: color,
          fillOpacity: 1,
        });
        marker.bindTooltip(`${index + 1}. ${stop.name}`, { direction: "top", offset: [0, -7] });
        marker.bindPopup(
          `<div class="map-popup"><span>${stop.day} · ${stop.date}</span><strong>${stop.name}</strong><p>${stop.note}</p><a href="https://www.google.com/maps/search/?api=1&query=${stop.coords[0]},${stop.coords[1]}" target="_blank" rel="noreferrer">ABRIR EN GOOGLE MAPS ↗</a></div>`,
        );
        marker.addTo(all);
      });

      const eventLayer = L.layerGroup();
      layersRef.current[1] = eventLayer;
      events.forEach((event) => {
        const marker = L.circleMarker(event.coords, {
          radius: event.priority ? 9 : 6,
          color: "#fffdf7",
          weight: event.priority ? 4 : 2,
          fillColor: "#b52a68",
          fillOpacity: 0.95,
        });
        marker.bindTooltip(`FIESTA · ${event.title}`, { direction: "top", offset: [0, -7] });
        marker.bindPopup(
          `<div class="map-popup event-popup"><span>${event.date} · ${event.time}</span><strong>${event.title}</strong><b>${event.place}</b><p>${event.note}</p><a href="https://www.google.com/maps/search/?api=1&query=${event.coords[0]},${event.coords[1]}" target="_blank" rel="noreferrer">ABRIR UBICACIÓN ↗</a></div>`,
        );
        marker.addTo(eventLayer);
      });

      const exploreLayer = L.layerGroup();
      layersRef.current[2] = exploreLayer;
      explore.forEach((place) => {
        const color = place.type === "playa" ? "#1779a8" : place.type === "fluvial" ? "#20a56b" : place.type === "desvío" ? "#d39b22" : "#6656a8";
        const marker = L.circleMarker(place.coords, { radius: 7, color: "#fffdf7", weight: 3, fillColor: color, fillOpacity: 0.96 });
        marker.bindTooltip(`${place.type.toUpperCase()} · ${place.name}`, { direction: "top", offset: [0, -7] });
        marker.bindPopup(`<div class="map-popup"><span>${place.type.toUpperCase()} · BASE 0${place.base}</span><strong>${place.name}</strong><p>${place.note}</p><a href="https://www.google.com/maps/search/?api=1&query=${place.coords[0]},${place.coords[1]}" target="_blank" rel="noreferrer">ABRIR UBICACIÓN ↗</a></div>`);
        marker.addTo(exploreLayer);
      });

      const campingLayer = L.layerGroup();
      layersRef.current[3] = campingLayer;
      campings.forEach((camp) => {
        const marker = L.circleMarker(camp.coords, { radius: 7, color: "#fffdf7", weight: 3, fillColor: "#6b4aa1", fillOpacity: 0.96 });
        marker.bindTooltip(`CAMPING · ${camp.name}`, { direction: "top", offset: [0, -7] });
        marker.bindPopup(`<div class="map-popup"><span>${camp.category} · ${camp.area}</span><strong>${camp.name}</strong><p>Incluido en el directorio aportado. Confirma apertura, servicios y parcelas antes de reservar.</p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${camp.name} ${camp.area}`)}" target="_blank" rel="noreferrer">ABRIR EN GOOGLE MAPS ↗</a></div>`);
        marker.addTo(campingLayer);
      });

      const foodLayer = L.layerGroup();
      layersRef.current[4] = foodLayer;
      restaurantRecommendations.forEach((item) => {
        const marker = L.circleMarker(item.coords, { radius: 7, color: "#fffdf7", weight: 3, fillColor: "#c46b24", fillOpacity: 0.96 });
        marker.bindTooltip(`COMER · ${item.place}`, { direction: "top", offset: [0, -7] });
        marker.bindPopup(`<div class="map-popup"><span>BASE 0${item.base} · ${item.price}</span><strong>${item.name}</strong><p>${item.dish}</p><a href="https://www.google.com/maps/search/?api=1&query=${item.coords[0]},${item.coords[1]}" target="_blank" rel="noreferrer">ABRIR ZONA ↗</a></div>`);
        marker.addTo(foodLayer);
      });

      mapRef.current = map;
    }
    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    [1, 2, 3, 4].forEach((key) => {
      const layer = layersRef.current[key];
      if (layer && map.hasLayer(layer)) map.removeLayer(layer);
    });
    if (activeSection === "events") layersRef.current[1]?.addTo(map);
    if (activeSection === "explore") layersRef.current[2]?.addTo(map);
    if (activeSection === "campings") layersRef.current[3]?.addTo(map);
    if (activeSection === "food") layersRef.current[4]?.addTo(map);
  }, [activeSection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(dayRouteLayersRef.current).forEach(([day, layer]) => {
      const show = activeDay === "TODOS" || activeDay === day;
      if (show && !map.hasLayer(layer)) layer.addTo(map);
      if (!show && map.hasLayer(layer)) map.removeLayer(layer);
    });
    if (activeDay !== "TODOS") {
      const route = dayRoutes.find((item) => item.day === activeDay);
      if (route) map.fitBounds(route.points.map((point) => [point[0], point[1]] as [number, number]), { padding: [35, 35] });
    }
  }, [activeDay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeBase === 0) {
      map.fitBounds([[41.48, -8.99], [42.2, -8.05]], { padding: [25, 25] });
    } else {
      map.setView(bases[activeBase - 1].center, activeBase === 1 ? 10 : 11);
    }
  }, [activeBase]);

  function focusStop(stop: Stop) {
    mapRef.current?.flyTo(stop.coords, stop.kind === "camping" ? 12 : 13, { duration: 0.65 });
    if (window.innerWidth < 900) document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">N↗P</span>
          <div>
            <strong>NORTE DE PORTUGAL</strong>
            <small>ROAD TRIP · 2026</small>
          </div>
        </div>
        <div className="trip-meta">
          <span>01—10 AGO</span>
          <span>10 DÍAS</span>
          <span>3 BASES</span>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <div className="intro">
            <p className="eyebrow">RUTA INTERACTIVA</p>
            <h1>MONTAÑA.<br />ATLÁNTICO.<br />FRONTERA.</h1>
            <p className="lede">Vitoria → Peneda–Gerês → Viana do Castelo → A Guarda → Vitoria</p>
          </div>

          <div className="base-tabs" role="tablist" aria-label="Filtrar por base">
            <button className={activeBase === 0 ? "active" : ""} onClick={() => setActiveBase(0)}>TODO</button>
            {bases.map((base) => (
              <button key={base.id} className={activeBase === base.id ? "active" : ""} onClick={() => setActiveBase(base.id)}>
                0{base.id}
              </button>
            ))}
          </div>

          <div className="stop-list">
            {visibleStops.map((stop, index) => (
              <article className={`stop-card ${stop.kind === "camping" ? "camp" : ""} ${visited.includes(stop.name) ? "visited" : ""}`} key={stop.name}>
                <button className="stop-main" onClick={() => focusStop(stop)}>
                  <span className="stop-index">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <small>{stop.day} · {stop.date}</small>
                    <strong>{stop.name}</strong>
                    <em>{stop.note}</em>
                    <span className={`priority-chip ${priorityByPlace[stop.name]?.startsWith("IMP") ? "must" : ""}`}>{priorityByPlace[stop.name] || (stop.kind === "camping" ? "BASE" : "SI QUEDA TIEMPO")}</span>
                    <span className="quick-icons" aria-label="Resumen práctico">
                      <i title="Acceso en coche">🚗</i><i title="Aparcamiento">🅿️</i>
                      {stop.kind === "nature" && <i title="Caminata">🥾</i>}
                      {(stop.kind === "beach" || /poza|río/i.test(stop.note)) && <i title="Baño">🏊</i>}
                      <i title="Comida cercana">🍴</i><i title="Prioridad">⭐</i>
                    </span>
                  </span>
                  <b>↗</b>
                </button>
                <div className="mini-actions">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${stop.coords[0]},${stop.coords[1]}`} target="_blank" rel="noreferrer">GOOGLE</a>
                  <a href={osmUrl(stop.coords)} target="_blank" rel="noreferrer">OSM</a>
                  <button onClick={() => addToPlan(stop.name, stop.day.match(/\d+/)?.[0].padStart(2, "0") || suggestedDay(stop.base))}>+ PLAN</button>
                  <button className={favorites.includes(stop.name) ? "active" : ""} onClick={() => toggleList(stop.name, favorites, setFavorites)}>♥</button>
                  <button className={visited.includes(stop.name) ? "active" : ""} onClick={() => toggleList(stop.name, visited, setVisited)}>✓</button>
                </div>
                <details className="stop-details">
                  <summary>MÁS INFORMACIÓN</summary>
                  <div>
                    <span><b>🚗 ACCESO</b>{dayOperations[(stop.day.match(/\d+/)?.[0] || "1").padStart(2, "0")]?.road || "Acceso directo por carretera."}</span>
                    <span><b>🅿️ PARKING</b>{dayOperations[(stop.day.match(/\d+/)?.[0] || "1").padStart(2, "0")]?.parking || "Consultar la ficha del lugar."}</span>
                    <span><b>🥾 CAMINATA</b>{stop.kind === "nature" || stop.kind === "history" ? "Conviene calzado cómodo." : "Paseo corto o acceso directo."}</span>
                    <span><b>🌳 SOMBRA</b>{stop.kind === "nature" ? "Parcial; variable según el recorrido." : "Limitada en zonas urbanas y costa."}</span>
                    <span><b>🏊 BAÑO</b>{stop.kind === "beach" || /poza|río/i.test(stop.note) ? "Sí; comprobar condiciones." : "No es el objetivo principal."}</span>
                    <span><b>📶 COBERTURA</b>{stop.base === 1 ? "Irregular fuera de los pueblos." : "Generalmente buena."}</span>
                    <span><b>🍴 COMIDA</b>{stop.kind === "town" ? "Buena oferta en el centro." : "Llevar pícnic si se alarga."}</span>
                    <span><b>🚻 SERVICIOS</b>{stop.kind === "town" || stop.kind === "camping" ? "Disponibles." : "Limitados o inexistentes."}</span>
                    <span><b>⚠️ RIESGO</b>{dayOperations[(stop.day.match(/\d+/)?.[0] || "1").padStart(2, "0")]?.warnings[0] || "Precaución habitual."}</span>
                    <span><b>⭐ PRIORIDAD</b>{priorityByPlace[stop.name] || (stop.kind === "camping" ? "Base del viaje" : "Si queda tiempo")}</span>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </aside>

        <section className="map-panel">
          <div id="map" ref={mapEl} aria-label="Mapa interactivo de la ruta por el norte de Portugal" />
          <div className="map-title">
            <span>42°N / 8°W</span>
            <strong>PORTUGAL<br />NORTE</strong>
          </div>
          <div className="legend">
            {bases.map((base) => (
              <button key={base.id} onClick={() => setActiveBase(base.id)}>
                <i style={{ background: base.color }} />
                <span><b>BASE 0{base.id}</b>{base.title}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="route-panel">
          <div className="route-head">
            <p className="eyebrow">GUÍA DE VIAJE</p>
            <h2>{activeSection === "days" ? "RUTA POR DÍAS" : activeSection === "events" ? "FIESTAS" : activeSection === "food" ? "QUÉ COMER" : activeSection === "walks" ? "RUTAS A PIE" : activeSection === "explore" ? "EXPLORAR" : activeSection === "campings" ? "CAMPINGS" : activeSection === "decide" ? "DECIDIR" : "MODO VIAJE"}</h2>
            <p>
              {activeSection === "days" && "Las líneas indican la secuencia. Abre cada jornada para obtener el recorrido por carretera."}
              {activeSection === "events" && "Agenda cultural integrada en las fechas y bases del viaje. Los puntos rosas aparecen también en el mapa."}
              {activeSection === "food" && "Platos populares organizados por cada camping base."}
              {activeSection === "walks" && "Recorridos fáciles o medios con filtros por base, dificultad, duración y posibilidad de baño."}
              {activeSection === "explore" && "Playas, piscinas fluviales y excursiones adicionales agrupadas por base."}
              {activeSection === "campings" && "Alternativas del directorio aportado. Pulsa una ficha para localizarla en Google Maps."}
              {activeSection === "decide" && "Buscador, asistente diario, distancias, combinaciones, comparador, ubicación opcional y presupuesto."}
              {activeSection === "offline" && "Favoritos, visitados, planning personal y descargas para utilizar la guía sin conexión."}
            </p>
          </div>
          <div className="guide-tabs" role="tablist" aria-label="Contenido de la guía">
            <button className={activeSection === "days" ? "active" : ""} onClick={() => setActiveSection("days")}>DÍAS</button>
            <button className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>FIESTAS</button>
            <button className={activeSection === "food" ? "active" : ""} onClick={() => setActiveSection("food")}>COMER</button>
            <button className={activeSection === "walks" ? "active" : ""} onClick={() => setActiveSection("walks")}>RUTAS</button>
            <button className={activeSection === "explore" ? "active" : ""} onClick={() => setActiveSection("explore")}>EXPLORAR</button>
            <button className={activeSection === "campings" ? "active" : ""} onClick={() => setActiveSection("campings")}>CAMPINGS</button>
            <button className={activeSection === "decide" ? "active" : ""} onClick={() => setActiveSection("decide")}>DECIDIR</button>
            <button className={activeSection === "offline" ? "active" : ""} onClick={() => setActiveSection("offline")}>VIAJE</button>
          </div>

          {activeSection === "days" && (
            <>
              <div className="pace-picker" aria-label="Intensidad del planning">
                <small>RITMO DEL VIAJE</small>
                <div>
                  {(["tranquilo", "normal", "completo"] as const).map((pace) => (
                    <button className={travelPace === pace ? "active" : ""} key={pace} onClick={() => setTravelPace(pace)}>
                      {pace}
                    </button>
                  ))}
                </div>
                <p>La opción elegida adapta todos los días sin cambiar los campings ni la ruta principal.</p>
              </div>
              <div className="day-list">
                {dayRoutes.map((route) => {
                  const plan = dailyPlans.find((item) => item.day === route.day)!;
                  const open = activeDay === route.day;
                  return (
                    <article className={open ? "selected" : ""} key={route.day}>
                      <button onClick={() => setActiveDay(open ? "TODOS" : route.day)} aria-expanded={open}>
                        <span style={{ borderColor: route.color }}>{route.day}</span>
                        <strong>{route.title}<small>{plan.date} · {plan.drive}</small></strong>
                        <b>{open ? "−" : "+"}</b>
                      </button>
                      {open && (
                        <div className="day-detail">
                          <div className="day-base" style={{ borderColor: route.color }}>{plan.base}</div>
                          <section className="weather-card">
                            <small>METEOROLOGÍA EN VIVO · OPEN-METEO</small>
                            {weather[route.day] ? (
                              <>
                                <div className="weather-main">
                                  <b>{weather[route.day].max}°</b>
                                  <span>{weather[route.day].min}° mín.<br />☂ {weather[route.day].rain}% · 💨 {weather[route.day].wind} km/h{weather[route.day].wave !== undefined && <><br />🌊 hasta {weather[route.day].wave?.toFixed(1)} m</>}</span>
                                </div>
                                <div className="hourly-weather">{weather[route.day].hourly.map((hour) => <span key={hour.time}><b>{hour.time}</b>{hour.temp}°<small>☂{hour.rain}% · 💨{hour.wind}</small></span>)}</div>
                                <p className="weather-advice">◆ {weatherAdvice(route.day)}</p>
                                {[5, 6, 9].includes(Number(route.day)) && <a href="https://www.meteoblue.com/es/tiempo/marine" target="_blank" rel="noreferrer">COMPROBAR OLEAJE Y VIENTO MARINO ↗</a>}
                                {[2, 3].includes(Number(route.day)) && <p className="flow-warning">⚠ La previsión no mide el caudal: tras tormentas o lluvia aguas arriba, evitar pozas aunque haga sol.</p>}
                              </>
                            ) : <p>{weatherAdvice(route.day)}</p>}
                          </section>
                          <section className="organizer">
                            <small>ORGANIZADOR AUTOMÁTICO</small>
                            <div className="organizer-grid">
                              <label>SALIDA<input type="time" value={dayStart} onChange={(event) => setDayStart(event.target.value)} /></label>
                              <label>REGRESO<input type="time" value={dayEnd} onChange={(event) => setDayEnd(event.target.value)} /></label>
                              <label>PREFERENCIA<select value={dayPreference} onChange={(event) => setDayPreference(event.target.value as typeof dayPreference)}><option value="senderismo">Senderismo</option><option value="baño">Baño</option><option value="patrimonio">Patrimonio</option><option value="gastronomía">Gastronomía</option></select></label>
                            </div>
                            <button className="organize-button" onClick={() => organizeDay(route.day)}>ORGANIZAR MI DÍA ↻</button>
                            {organizedDays[route.day] && <ol className="timeline">{organizedDays[route.day].map((item, index) => <li key={`${item.time}-${index}`}><time>{item.time}</time><span>{item.label}</span></li>)}</ol>}
                          </section>
                          <section>
                            <small>PLAN DEL DÍA</small>
                            <ol>{plan.schedule.map((item) => <li key={item}>{item}</li>)}</ol>
                          </section>
                          <section className={`pace-plan ${travelPace}`}>
                            <small>RITMO {travelPace.toUpperCase()}</small>
                            <p>{plan.pace[travelPace]}</p>
                          </section>
                          <section><small>RUTA A PIE</small><p>{plan.walk}</p></section>
                          <section><small>QUÉ COMER</small><p>{plan.food}</p></section>
                          <section className="rain-plan"><small>☂ SI LLUEVE</small><p>{plan.rain}</p></section>
                          <section className="operations-card">
                            <small>TIEMPOS REALES Y CARRETERA</small>
                            <div className="time-grid">
                              <span><b>🚗 CONDUCCIÓN</b>{plan.drive}</span><span><b>🅿️ PARKING</b>{dayOperations[route.day].parkingMinutes} min</span>
                              <span><b>🥾 CAMINAR</b>{dayOperations[route.day].walkMinutes} min</span><span><b>📍 VISITAS</b>{dayOperations[route.day].visitMinutes} min</span>
                              <span><b>☕ DESCANSO</b>{dayOperations[route.day].restMinutes} min</span><span><b>⏱ HORA LÍMITE</b>{dayOperations[route.day].lastExit}</span>
                            </div>
                            <p><b>ACCESO:</b> {dayOperations[route.day].road}</p>
                            <p><b>PEAJES:</b> {dayOperations[route.day].toll}</p>
                            <p><b>FRONTERA:</b> {dayOperations[route.day].border}</p>
                            <p><b>🅿️ RECOMENDADO:</b> {dayOperations[route.day].parking}</p>
                          </section>
                          <section className="alerts-card"><small>⚠ ALERTAS PRÁCTICAS</small><div>{dayOperations[route.day].warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></section>
                          <a href={googleDirections(route.points)} target="_blank" rel="noreferrer">
                            ABRIR TODAS LAS PARADAS EN GOOGLE MAPS ↗
                          </a>
                          <div className="day-downloads">
                            <button onClick={() => exportDayRoute(route.day, "gpx")}>GPX DEL DÍA</button>
                            <button onClick={() => exportDayRoute(route.day, "kml")}>KML DEL DÍA</button>
                            <button onClick={() => printDay(route.day)}>PDF DEL DÍA</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="interest-list">
                <p className="eyebrow">SITIOS DE INTERÉS</p>
                {interests.map(([title, text]) => (
                  <article key={title}><strong>{title}</strong><p>{text}</p></article>
                ))}
              </div>
              <div className="base-summary">
                {bases.map((base) => (
                  <div key={base.id}>
                    <span style={{ color: base.color }}>0{base.id}</span>
                    <p><b>{base.short}</b><strong>{base.title}</strong><small>{base.dates} · {base.detail}</small></p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === "events" && (
            <div className="event-list">
              <div className="priority-note"><b>★ PRIORIDAD</b><strong>8 AGO · Festa do Rio e do Fogo</strong><p>La cita más singular, aunque exige volver a Arcos desde A Guarda.</p></div>
              <div className="event-refresh">
                <button onClick={checkEventUpdates} disabled={eventChecking}>{eventChecking ? "COMPROBANDO…" : "COMPROBAR NOVEDADES ↻"}</button>
                <p>Última comprobación desde este dispositivo: <b>{eventCheckedAt || "todavía no realizada"}</b></p>
                <small>Se verifica que las páginas oficiales responden. Los programas pendientes siguen marcados hasta que la organización publique el detalle.</small>
              </div>
              {events.map((event) => {
                const nearest = [...bases].sort((a, b) => distanceKm(a.center, event.coords) - distanceKm(b.center, event.coords))[0];
                return (
                <article className={event.priority ? "priority" : ""} key={`${event.date}-${event.title}`}>
                  <div><span>{event.date}</span><b>{event.time}</b></div>
                  <section>
                    <small>{event.place} · {event.title.includes("Feira") ? "FERIA" : event.title.includes("Folk") || event.title.includes("Folclore") ? "FOLCLORE" : "FIESTA / MÚSICA"}</small>
                    <strong>{event.title}</strong>
                    <div className="event-status">
                      <b>{event.url.includes("agenda-cultural.aspx") || event.url.endsWith("agenda-cultural") ? "PENDIENTE DE PROGRAMA DETALLADO" : "CONFIRMADO 2026"}</b>
                      <span>BASE MÁS CERCANA: 0{nearest.id} · ≈ {Math.round(distanceKm(nearest.center, event.coords))} KM EN LÍNEA RECTA</span>
                    </div>
                    <p>{event.note}</p>
                    <details className="event-details">
                      <summary>HORARIOS, ACCESO Y CAMBIOS</summary>
                      <p><b>Destacados:</b> {event.time}; consultar el programa para conciertos, mercado, procesión o fuegos.</p>
                      <p><b>Comparación:</b> {event.url.includes("agenda-cultural") ? "Programa detallado todavía pendiente; se conserva la referencia de agenda." : "Página específica 2026 disponible; confirmar posibles ajustes de última hora."}</p>
                      <p><b>Tráfico:</b> Prever calles cortadas en el centro y llegar 45–60 minutos antes.</p>
                      <p><b>Aparcamiento alternativo:</b> usar los estacionamientos exteriores y completar el acceso a pie.</p>
                    </details>
                    <div className="link-row">
                      <a href={event.url} target="_blank" rel="noreferrer">PROGRAMA ↗</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${event.coords[0]},${event.coords[1]}`} target="_blank" rel="noreferrer">GOOGLE ↗</a>
                      <a href={osmUrl(event.coords)} target="_blank" rel="noreferrer">OSM ↗</a>
                      <button onClick={() => addToPlan(event.title, event.date.match(/\d+/)?.[0].padStart(2, "0") || "08")}>+ PLAN</button>
                    </div>
                  </section>
                </article>
                );
              })}
              <p className="data-note">Agenda ampliada con el PDF de Visit Portugal aportado. “Confirmado” significa que existe página o programa 2026; los horarios pequeños pueden cambiar por organización o lluvia. Revisad el enlace oficial 24–48 h antes.</p>
            </div>
          )}

          {activeSection === "food" && (
            <div className="food-list">
              {foodByBase.map((group) => (
                <section key={group.base}>
                  <h3 style={{ borderColor: group.color }}>{group.base}</h3>
                  {group.foods.map(([name, note]) => (
                    <article key={name}><strong>{name}</strong><p>{note}</p></article>
                  ))}
                </section>
              ))}
              <div className="food-guide-head"><b>DÓNDE Y CÓMO COMER</b><p>Precios orientativos por persona, sin bebidas especiales. Comprobad carta, cierre y reserva el mismo día.</p></div>
              {restaurantRecommendations.map((item) => (
                <article className="restaurant-card" key={item.name}>
                  <small>BASE 0{item.base} · {item.place}</small>
                  <strong>{item.name}</strong>
                  <div className="info-matrix">
                    <p><b>PLATO</b>{item.dish}</p><p><b>PRECIO</b>{item.price}</p>
                    <p><b>ESPECIALIDAD</b>{item.special}</p><p><b>MERCADO</b>{item.market}</p>
                    <p><b>ECONÓMICO</b>{item.budget}</p><p><b>PARA LLEVAR</b>{item.takeaway}</p>
                    <p><b>CIERRE</b>{item.closed}</p>
                  </div>
                  <div className="link-row">
                    <a href={item.url} target="_blank" rel="noreferrer">INFORMACIÓN / RESERVA ↗</a>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${item.coords[0]},${item.coords[1]}`} target="_blank" rel="noreferrer">ZONA EN GOOGLE ↗</a>
                    <a href={osmUrl(item.coords)} target="_blank" rel="noreferrer">OSM ↗</a>
                    <button onClick={() => addToPlan(item.name, suggestedDay(item.base))}>+ PLAN</button>
                    <button className={favorites.includes(item.name) ? "active" : ""} onClick={() => toggleList(item.name, favorites, setFavorites)}>♥</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeSection === "walks" && (
            <div className="walk-list">
              <div className="route-filters">
                <div className="filter-head"><b>FILTRAR RUTAS</b><span>{routeResultCount} RESULTADOS</span></div>
                <label>BASE
                  <select value={routeBase} onChange={(event) => setRouteBase(Number(event.target.value))}>
                    <option value={0}>Todas las bases</option>
                    <option value={1}>01 · Montaña</option>
                    <option value={2}>02 · Atlántico</option>
                    <option value={3}>03 · Frontera</option>
                  </select>
                </label>
                <label>DIFICULTAD
                  <select value={routeDifficulty} onChange={(event) => setRouteDifficulty(event.target.value as typeof routeDifficulty)}>
                    <option value="todas">Todas</option>
                    <option value="FÁCIL">Fácil</option>
                    <option value="MEDIA">Media</option>
                  </select>
                </label>
                <label>DURACIÓN
                  <select value={routeDuration} onChange={(event) => setRouteDuration(event.target.value as typeof routeDuration)}>
                    <option value="todas">Todas</option>
                    <option value="corta">Menos de 1 h</option>
                    <option value="media">1–2 h</option>
                    <option value="larga">Más de 2 h</option>
                  </select>
                </label>
                <label>BAÑO
                  <select value={routeBath} onChange={(event) => setRouteBath(event.target.value as typeof routeBath)}>
                    <option value="todas">Todas</option>
                    <option value="con">Con baño</option>
                    <option value="sin">Sin baño</option>
                  </select>
                </label>
                <button className="clear-filters" onClick={() => { setRouteBase(0); setRouteDifficulty("todas"); setRouteDuration("todas"); setRouteBath("todas"); }}>
                  LIMPIAR FILTROS
                </button>
              </div>
              {routeResultCount === 0 && <div className="empty-routes"><b>SIN RESULTADOS</b><p>Prueba a ampliar la duración o seleccionar todas las bases.</p></div>}
              {filteredWalks.map((walk) => (
                <article key={walk.title}>
                  <span style={{ background: bases[walk.base - 1].color }}>0{walk.base}</span>
                  <section>
                    <div className="route-badges">
                      <b className={walk.difficulty === "FÁCIL" ? "easy" : "medium"}>{walk.difficulty}</b>
                      <small>{walk.distance}</small><small>{walk.elevation}</small>
                    </div>
                    <strong>{walk.title}</strong>
                    <small>{walk.shape} · {walk.time}</small>
                    <p>{walk.note}</p>
                    <button className="practical-toggle" onClick={() => setOpenRoute(openRoute === walk.title ? null : walk.title)} aria-expanded={openRoute === walk.title}>
                      DETALLES PRÁCTICOS {openRoute === walk.title ? "−" : "+"}
                    </button>
                    {openRoute === walk.title && (
                      <div className="practical-grid">
                        <div className="elevation-profile"><b>PERFIL</b><span><i style={{ width: walk.difficulty === "MEDIA" ? "78%" : "42%" }} /></span><small>{walk.elevation} · indicador de esfuerzo</small><a href={walk.url} target="_blank" rel="noreferrer">VER PERFIL REAL EN EL TRACK ↗</a></div>
                        <p><b>TERRENO</b>{routePractical[walk.title].terrain}</p>
                        <p><b>SOMBRA</b>{routeAdvanced[walk.title].shade}</p>
                        <p><b>SEÑALIZACIÓN</b>{routePractical[walk.title].signs}</p>
                        <p><b>INICIO / PARKING</b>{routePractical[walk.title].parking}</p>
                        <p><b>COBERTURA</b>{routeAdvanced[walk.title].coverage}</p>
                        <p><b>AGUA</b>{routeAdvanced[walk.title].water}</p>
                        <p><b>MEJOR HORA</b>{routeAdvanced[walk.title].best}</p>
                        <p><b>DIFICULTAD REAL</b>{routeAdvanced[walk.title].real}</p>
                        <p><b>ATAJO / SALIDA</b>{routeAdvanced[walk.title].shortcut}</p>
                        <p className="route-caution"><b>ATENCIÓN</b>{routePractical[walk.title].caution}</p>
                      </div>
                    )}
                    <div className="link-row">
                      <a href={walk.url} target="_blank" rel="noreferrer">{walk.source} ↗</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${walk.start[0]},${walk.start[1]}`} target="_blank" rel="noreferrer">INICIO GOOGLE ↗</a>
                      <a href={osmUrl(walk.start)} target="_blank" rel="noreferrer">INICIO OSM ↗</a>
                      <button onClick={() => addToPlan(walk.title, suggestedDay(walk.base))}>+ PLAN</button>
                      <button className={favorites.includes(walk.title) ? "active" : ""} onClick={() => toggleList(walk.title, favorites, setFavorites)}>♥</button>
                      <button className={visited.includes(walk.title) ? "active" : ""} onClick={() => toggleList(walk.title, visited, setVisited)}>✓</button>
                    </div>
                  </section>
                </article>
              ))}
              {filteredWaterWalks.length > 0 && (
                <div className="walk-section-head">
                  <b>AGUA DULCE</b>
                  <strong>RUTAS CON BAÑO</strong>
                  <p>Pozas naturales y playas fluviales accesibles mediante recorridos fáciles, más una opción media y completa en Soajo.</p>
                </div>
              )}
              {filteredWaterWalks.map((walk) => (
                <article className="water-walk" key={walk.title}>
                  <span style={{ background: bases[walk.base - 1].color }}>0{walk.base}</span>
                  <section>
                    <div className="route-badges">
                      <b className={walk.difficulty === "FÁCIL" ? "easy" : "medium"}>{walk.difficulty}</b>
                      <small>{walk.distance}</small><small>{walk.elevation}</small>
                    </div>
                    <strong>{walk.title}</strong>
                    <small>{walk.shape} · {walk.time}</small>
                    <p>{walk.note}</p>
                    <button className="practical-toggle" onClick={() => setOpenRoute(openRoute === walk.title ? null : walk.title)} aria-expanded={openRoute === walk.title}>
                      DETALLES PRÁCTICOS {openRoute === walk.title ? "−" : "+"}
                    </button>
                    {openRoute === walk.title && (
                      <div className="practical-grid">
                        <div className="elevation-profile"><b>PERFIL</b><span><i style={{ width: walk.difficulty === "MEDIA" ? "78%" : "38%" }} /></span><small>{walk.elevation} · indicador de esfuerzo</small><a href={walk.url} target="_blank" rel="noreferrer">VER PERFIL REAL EN EL TRACK ↗</a></div>
                        <p><b>TERRENO</b>{routePractical[walk.title].terrain}</p>
                        <p><b>SOMBRA</b>{routeAdvanced[walk.title].shade}</p>
                        <p><b>SEÑALIZACIÓN</b>{routePractical[walk.title].signs}</p>
                        <p><b>INICIO / PARKING</b>{routePractical[walk.title].parking}</p>
                        <p><b>COBERTURA</b>{routeAdvanced[walk.title].coverage}</p>
                        <p><b>AGUA</b>{routeAdvanced[walk.title].water}</p>
                        <p><b>MEJOR HORA</b>{routeAdvanced[walk.title].best}</p>
                        <p><b>DIFICULTAD REAL</b>{routeAdvanced[walk.title].real}</p>
                        <p><b>ATAJO / SALIDA</b>{routeAdvanced[walk.title].shortcut}</p>
                        <p className="route-caution"><b>ATENCIÓN</b>{routePractical[walk.title].caution}</p>
                        <div className="bath-detail">
                          <b>FICHA DE BAÑO</b>
                          <p><strong>Vigilancia</strong>{bathDetails[walk.title].watched}</p>
                          <p><strong>Acceso</strong>{bathDetails[walk.title].access}</p>
                          <p><strong>Aparcamiento</strong>{bathDetails[walk.title].parking}</p>
                          <p><strong>Sombra</strong>{bathDetails[walk.title].shade}</p>
                          <p><strong>Pícnic</strong>{bathDetails[walk.title].picnic}</p>
                          <p><strong>Comida cerca</strong>{bathDetails[walk.title].food}</p>
                          <p><strong>Baño</strong>{bathDetails[walk.title].swim}</p>
                          <p><strong>Riesgo</strong>{bathDetails[walk.title].risk}</p>
                          <a href={bathDetails[walk.title].quality} target="_blank" rel="noreferrer">COMPROBAR CALIDAD DEL AGUA ↗</a>
                        </div>
                      </div>
                    )}
                    <em className="bath-status">≈ {walk.bath}</em>
                    <div className="link-row">
                      <a href={walk.url} target="_blank" rel="noreferrer">{walk.source} ↗</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${walk.start[0]},${walk.start[1]}`} target="_blank" rel="noreferrer">INICIO / PARKING ↗</a>
                      <a href={osmUrl(walk.start)} target="_blank" rel="noreferrer">OSM ↗</a>
                      <button onClick={() => addToPlan(walk.title, suggestedDay(walk.base))}>+ PLAN</button>
                      <button className={favorites.includes(walk.title) ? "active" : ""} onClick={() => toggleList(walk.title, favorites, setFavorites)}>♥</button>
                      <button className={visited.includes(walk.title) ? "active" : ""} onClick={() => toggleList(walk.title, visited, setVisited)}>✓</button>
                    </div>
                  </section>
                </article>
              ))}
              <p className="data-note">“Fácil” valora el terreno y el desnivel, no el calor. En agosto: empezar temprano, llevar agua, descargar el track y comprobar incendios, cierres y señalización el mismo día.</p>
            </div>
          )}

          {activeSection === "explore" && (
            <div className="explore-list">
              <div className="discovery-filters">
                {[
                  ["todos", "TODO"], ["pozas", "POZAS"], ["fluvial", "FLUVIALES"], ["playas", "ATLÁNTICAS"],
                  ["museos", "MUSEOS"], ["patrimonio", "PATRIMONIO"], ["foto", "MIRADORES / FOTO"], ["surf", "SURF"], ["lluvia", "CON LLUVIA"],
                ].map(([value, label]) => <button className={exploreFilter === value ? "active" : ""} key={value} onClick={() => setExploreFilter(value)}>{label}</button>)}
                <button onClick={() => setActiveSection("food")}>RESTAURANTES / MERCADOS</button>
                <button onClick={() => setActiveSection("events")}>FIESTAS / EVENTOS</button>
              </div>
              {exploreFilter === "museos" && <div className="museum-intro"><b>12 MUSEOS Y CENTROS DE INTERPRETACIÓN</b><p>Ordenados por la base más cómoda. Los horarios pueden cambiar en agosto o festivos: comprueba siempre la web oficial.</p></div>}
              {filteredExplore.map((place) => {
                const isMuseum = place.categories?.includes("museo");
                return (
                <article className={`${visited.includes(place.name) ? "visited " : ""}${isMuseum ? "museum-card" : ""}`} key={place.name}>
                  <span className={`place-type ${isMuseum ? "museo" : place.type}`}>{isMuseum ? "museo" : place.type}</span>
                  <strong>{place.name}</strong>
                  <small>BASE 0{place.base}{place.location ? ` · ${place.location}` : ""}</small>
                  <p>{place.note}</p>
                  {isMuseum && <div className="museum-facts"><p><b>🏛️ COLECCIÓN</b>{place.specialty}</p><p><b>🕒 HORARIO</b>{place.hours}</p><p><b>🎟️ PRECIO</b>{place.price}</p><p><b>⏱️ VISITA</b>{place.visitTime}</p></div>}
                  <div className="link-row">
                    {place.url && <a href={place.url} target="_blank" rel="noreferrer">WEB OFICIAL ↗</a>}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${place.coords[0]},${place.coords[1]}`} target="_blank" rel="noreferrer">GOOGLE ↗</a>
                    <a href={osmUrl(place.coords)} target="_blank" rel="noreferrer">OSM ↗</a>
                    <button onClick={() => addToPlan(place.name, suggestedDay(place.base))}>+ PLAN</button>
                    <button className={favorites.includes(place.name) ? "active" : ""} onClick={() => toggleList(place.name, favorites, setFavorites)}>♥</button>
                    <button className={visited.includes(place.name) ? "active" : ""} onClick={() => toggleList(place.name, visited, setVisited)}>✓</button>
                  </div>
                </article>
              )})}
              <p className="data-note">En zonas fluviales y pozas naturales, comprobad calidad del agua, caudal, accesos y vigilancia el mismo día.</p>
            </div>
          )}

          {activeSection === "campings" && (
            <div className="camping-list">
              <div className="camping-head"><b>LAS TRES BASES DEL VIAJE</b><p>Los importes y horarios pueden variar en agosto. Donde no existe tarifa pública 2026, se indica expresamente que hay que pedir presupuesto.</p></div>
              {mainCampings.map((camp) => (
                <article className="main-camping" key={camp.name}>
                  <small>BASE 0{camp.base} · {camp.coords[0]}, {camp.coords[1]}</small>
                  <strong>{camp.name}</strong>
                  <div className="info-matrix">
                    <p><b>PRECIO 2 + TIENDA</b>{camp.price}</p>
                    <p><b>RECEPCIÓN</b>{camp.reception}</p>
                    <p><b>ELECTRICIDAD</b>{camp.electric}</p>
                    <p><b>PISCINA</b>{camp.pool}</p>
                    <p><b>SERVICIOS</b>{camp.services}</p>
                    <p><b>PLAYA / RÍO</b>{camp.distance}</p>
                    <p><b>TELÉFONO</b>{camp.phone}</p>
                    <p><b>TRANQUILIDAD</b>{camp.quiet}</p>
                    <p><b>MEJORES EXCURSIONES</b>{camp.trips}</p>
                  </div>
                  <div className="link-row">
                    <a href={camp.url} target="_blank" rel="noreferrer">RESERVA / WEB ↗</a>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${camp.coords[0]},${camp.coords[1]}`} target="_blank" rel="noreferrer">GOOGLE ↗</a>
                    <a href={osmUrl(camp.coords)} target="_blank" rel="noreferrer">OSM ↗</a>
                    <button onClick={() => addToPlan(camp.name, suggestedDay(camp.base))}>+ PLAN</button>
                    <button className={favorites.includes(camp.name) ? "active" : ""} onClick={() => toggleList(camp.name, favorites, setFavorites)}>♥</button>
                  </div>
                </article>
              ))}
              <div className="camping-head alternatives"><b>ALTERNATIVAS DEL DIRECTORIO</b></div>
              {campings.map((camp) => (
                <article key={camp.name}>
                  <small>{camp.category}</small>
                  <strong>{camp.name}</strong>
                  <p>{camp.area}</p>
                  <div className="link-row">
                    {camp.url && <a href={camp.url} target="_blank" rel="noreferrer">WEB ↗</a>}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${camp.name} ${camp.area}`)}`} target="_blank" rel="noreferrer">GOOGLE MAPS ↗</a>
                    <a href={osmUrl(camp.coords)} target="_blank" rel="noreferrer">OSM ↗</a>
                    <button onClick={() => addToPlan(camp.name, suggestedDay(camp.coords[0] > 41.9 ? 3 : 2))}>+ PLAN</button>
                  </div>
                </article>
              ))}
              <p className="data-note">La lista procede del PDF aportado, publicado en 2013. Las tres bases del itinerario siguen destacadas en el mapa; estas son alternativas y requieren confirmar apertura.</p>
            </div>
          )}

          {activeSection === "decide" && <DecisionCenter />}

          {activeSection === "offline" && (
            <div className="offline-panel">
              <div className="offline-alert">
                <b>{online ? "● CON CONEXIÓN" : "● MODO SIN CONEXIÓN"}</b>
                <p>La guía conserva en este dispositivo las pantallas y áreas del mapa ya abiertas. Aun así, descargad en Google Maps u Organic Maps Peneda–Gerês, Viana–Caminha y Baixo Miño: las zonas nunca visualizadas necesitan conexión.</p>
              </div>
              <section className="base-packs">
                <h3>PAQUETES SIN CONEXIÓN POR BASE</h3>
                {bases.map((base) => <button className={downloadedBases.includes(base.id) ? "downloaded" : ""} key={base.id} onClick={() => downloadBasePack(base.id)}><b>0{base.id} · {base.title}</b><span>{downloadedBases.includes(base.id) ? "✓ DESCARGADO EN ESTE NAVEGADOR" : "DESCARGAR GUÍA HTML"}</span></button>)}
                <p>Estado: {downloadedBases.length}/3 paquetes descargados. Los archivos incluyen jornadas y coordenadas copiables.</p>
              </section>
              <div className="download-grid">
                <button onClick={printPlanning}><b>PDF</b><span>IMPRIMIR / GUARDAR PLANNING</span></button>
                <button onClick={() => exportPoints("gpx")}><b>GPX</b><span>EXPORTAR TODOS LOS PUNTOS</span></button>
                <button onClick={() => exportPoints("kml")}><b>KML</b><span>ABRIR EN GOOGLE EARTH</span></button>
                <button onClick={downloadContacts}><b>TXT</b><span>DIRECCIONES Y TELÉFONOS</span></button>
                <button onClick={() => downloadText("tarjeta-emergencia-portugal-2026.txt", `TARJETA DE EMERGENCIA · NORTE DE PORTUGAL 2026\n\nEMERGENCIAS PORTUGAL Y ESPAÑA: 112\n\n${mainCampings.map((camp) => `${camp.name}\n${camp.coords[0]}, ${camp.coords[1]}\n${camp.phone}`).join("\n\n")}\n\nHospital de Braga: +351 253 027 000\nULSAM Viana do Castelo: +351 258 802 100\nHospital Álvaro Cunqueiro Vigo: +34 986 811 111\n\nEn caso de incendio forestal: abandonar la ruta y seguir instrucciones de Protección Civil.`)}><b>112</b><span>TARJETA DE EMERGENCIA</span></button>
              </div>
              <section className="saved-section">
                <h3>MI PLAN PERSONAL · {planItems.length}</h3>
                {planItems.length === 0 ? <p>Añade lugares, rutas, restaurantes o fiestas mediante el botón “+ PLAN”.</p> : (
                  <div className="saved-list">
                    {[...planItems].sort((a, b) => a.day.localeCompare(b.day)).map((item) => (
                      <article key={`${item.day}-${item.name}`}><span>DÍA {item.day}</span><strong>{item.name}</strong><button onClick={() => setPlanItems((current) => current.filter((entry) => entry !== item))}>ELIMINAR</button></article>
                    ))}
                  </div>
                )}
              </section>
              <section className="saved-section">
                <h3>FAVORITOS · {favorites.length}</h3>
                {favorites.length === 0 ? <p>Marca lugares con ♥ para reunirlos aquí.</p> : (
                  <div className="tag-list">{favorites.map((item) => <button key={item} onClick={() => toggleList(item, favorites, setFavorites)}>♥ {item} ×</button>)}</div>
                )}
              </section>
              <section className="saved-section">
                <h3>VISITADOS · {visited.length}</h3>
                {visited.length === 0 ? <p>Marca con ✓ los lugares que ya habéis visitado.</p> : (
                  <div className="tag-list visited-tags">{visited.map((item) => <button key={item} onClick={() => toggleList(item, visited, setVisited)}>✓ {item} ×</button>)}</div>
                )}
              </section>
              <section className="saved-section travel-diary">
                <h3>ÁLBUM Y DIARIO · {Object.keys(diary).length}</h3>
                {visited.length === 0 ? <p>Marca primero un lugar como visitado para abrir su ficha de diario.</p> : visited.map((name) => {
                  const entry = diary[name] || { note: "", rating: 0, food: "", expense: "", recommended: true };
                  return <details key={name}>
                    <summary><span>✓ {name}</span><b>{entry.rating ? `${entry.rating}/5 ★` : "AÑADIR RECUERDO"}</b></summary>
                    <div className="diary-form">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {entry.photo && <img src={entry.photo} alt={`Recuerdo de ${name}`} />}
                      <label>FOTOGRAFÍA<input type="file" accept="image/*" onChange={(event) => addDiaryPhoto(name, event.target.files?.[0])} /><small>Máximo 2 MB; queda guardada en este dispositivo.</small></label>
                      <label>NOTA<textarea value={entry.note} onChange={(event) => updateDiary(name, { note: event.target.value })} placeholder="Qué os gustó, acceso, ambiente…" /></label>
                      <label>VALORACIÓN<select value={entry.rating} onChange={(event) => updateDiary(name, { rating: Number(event.target.value) })}><option value={0}>Sin valorar</option>{[1,2,3,4,5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label>
                      <label>QUÉ COMIMOS<input value={entry.food} onChange={(event) => updateDiary(name, { food: event.target.value })} /></label>
                      <label>GASTO APROXIMADO<input value={entry.expense} onChange={(event) => updateDiary(name, { expense: event.target.value })} placeholder="€" /></label>
                      <label className="recommend-check"><input type="checkbox" checked={entry.recommended} onChange={(event) => updateDiary(name, { recommended: event.target.checked })} /> Lo recomendaríamos</label>
                    </div>
                  </details>;
                })}
                {Object.keys(diary).length > 0 && <div className="diary-exports"><button className="export-diary" onClick={printDiary}>DIARIO ILUSTRADO / PDF</button><button className="export-diary" onClick={() => downloadText("diario-norte-portugal-2026.json", JSON.stringify(diary, null, 2), "application/json")}>EXPORTAR DATOS</button></div>}
              </section>
              <p className="data-note">Favoritos, visitados y plan personal se guardan únicamente en este navegador. No se sincronizan entre dispositivos.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
