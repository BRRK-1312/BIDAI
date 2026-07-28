"use client";

import { useEffect, useState } from "react";

type Props = {
  tripLength: 11 | 12 | 13;
  setTripLength: (value: 11 | 12 | 13) => void;
};

const lodging = [
  {
    name: "HI Bragança · Pousada de Juventude",
    kind: "ECONÓMICO",
    price: "Desde 20 € por persona; comprobar habitación privada.",
    location: "Centro urbano · opción práctica para una sola noche.",
    parking: "Confirmar plaza o aparcamiento cercano antes de reservar.",
    url: "https://www.pousadasjuventude.pt/pt/pousadas/pousada-de-braganca/",
  },
  {
    name: "Hotel Tulipa",
    kind: "CÉNTRICO",
    price: "Tarifa variable en agosto; consultar reserva directa.",
    location: "Centro · cómodo para cenar y pasear sin volver a usar el coche.",
    parking: "Aparcamiento público gratuito cercano, según disponibilidad.",
    url: "https://www.hoteltulipa.com/en/",
  },
  {
    name: "Solar de Santa Maria",
    kind: "HISTÓRICO",
    price: "Tarifa variable; suele ser una opción con más encanto.",
    location: "Casco histórico · aproximadamente 5 minutos a pie del castillo.",
    parking: "Confirmar acceso y descarga de equipaje por la peatonalización estival.",
    url: "https://www.solarsantamaria.com/",
  },
  {
    name: "Pousada de Bragança",
    kind: "CONFORT + PARKING",
    price: "Opción superior; comparar tarifa flexible y desayuno.",
    location: "Mirador sobre la ciudad y el castillo · piscina.",
    parking: "Aparcamiento gratuito para huéspedes.",
    url: "https://www.pousadas.pt/en/hotel/pousada-braganca",
  },
] as const;

const returnRoutes = [
  {
    id: "directa",
    title: "REGRESO DIRECTO",
    days: "11 DÍAS",
    drive: "≈ 688 km · 7 h 35 de conducción",
    text: "A Guarda → Vitoria. Requiere desmontar temprano y reservar dos descansos largos.",
    maps: "https://www.google.com/maps/dir/41.8897,-8.8464/42.8467,-2.6716",
  },
  {
    id: "sanabria",
    title: "PUEBLA DE SANABRIA",
    days: "12 DÍAS",
    drive: "≈ 690 km totales · divididos en 2 etapas",
    text: "A Guarda → Puebla de Sanabria (≈293 km) y, al día siguiente, Vitoria (≈397 km). La extensión más lógica.",
    maps: "https://www.google.com/maps/dir/41.8897,-8.8464/42.0541,-6.6339/42.8467,-2.6716",
  },
  {
    id: "ribeira",
    title: "RIBEIRA SACRA",
    days: "13 DÍAS",
    drive: "≈ 695 km totales · divididos en 2 etapas",
    text: "A Guarda → Monforte de Lemos (≈322 km), jornada de miradores y regreso a Vitoria (≈373 km).",
    maps: "https://www.google.com/maps/dir/41.8897,-8.8464/42.5218,-7.5147/42.8467,-2.6716",
  },
] as const;

const decisions = [
  "Reservar alojamiento en Bragança para el 1 de agosto",
  "Confirmar entrada en Lima Escape el 2 y salida el 5",
  "Confirmar número de noches en Camping Santa Tecla",
  "Elegir regreso de 11, 12 o 13 días",
  "Descargar mapas y rutas de la primera etapa",
] as const;

export default function TripFlexibility({ tripLength, setTripLength }: Props) {
  const [delay, setDelay] = useState(0);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("bidai-decisions") || "[]")); } catch { setDone([]); }
  }, []);

  function toggleDecision(item: string) {
    setDone((current) => {
      const next = current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
      localStorage.setItem("bidai-decisions", JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="trip-flex">
      <section className="length-selector">
        <small>DURACIÓN DEL VIAJE</small>
        <h3>¿CUÁNDO VOLVEMOS?</h3>
        <div>
          {([11, 12, 13] as const).map((value) => (
            <button className={tripLength === value ? "active" : ""} onClick={() => setTripLength(value)} key={value}>
              <b>{value}</b><span>DÍAS</span>
            </button>
          ))}
        </div>
        <p>
          {tripLength === 11 && "Regreso directo el 11 de agosto desde A Guarda."}
          {tripLength === 12 && "Día 11 libre y regreso el 12, o noche intermedia en Puebla de Sanabria."}
          {tripLength === 13 && "Extensión completa: día adicional y regreso el 13, preferentemente vía Ribeira Sacra."}
        </p>
      </section>

      <section className="day-one-ops">
        <header><small>DÍA 01 · CRONOLOGÍA OPERATIVA</small><h3>VITORIA → BRAGANÇA</h3></header>
        <label>RETRASO ACUMULADO
          <select value={delay} onChange={(event) => setDelay(Number(event.target.value))}>
            <option value={0}>En horario</option><option value={30}>+30 minutos</option><option value={60}>+1 hora</option><option value={90}>+1 h 30</option>
          </select>
        </label>
        <ol>
          <li><time>{["07:30", "08:00", "08:30", "09:00"][delay / 30]}</time><span>Salida real de Vitoria–Gasteiz</span></li>
          <li><time>{delay ? "10:45" : "11:15"}</time><span>Zamora · parking, catedral, castillo y miradores</span></li>
          <li><time>13:30</time><span>Comida rápida y salida hacia Miranda</span></li>
          <li><time>14:30</time><span>Miranda do Douro · paseo y miradores</span></li>
          <li><time>17:45</time><span>Hora límite de salida hacia Bragança</span></li>
          <li><time>19:00</time><span>Check-in, paseo y cena</span></li>
        </ol>
        <p className={`delay-advice ${delay >= 60 ? "warning" : ""}`}>
          {delay === 0 && "◆ Plan completo viable. No añadáis nuevas paradas."}
          {delay === 30 && "◆ Reducir Zamora a 90 minutos y Miranda a una hora."}
          {delay === 60 && "⚠ Miranda debe limitarse a un mirador y un paseo de 30–40 minutos."}
          {delay >= 90 && "⚠ Omitir Miranda y dirigirse directamente a Bragança."}
        </p>
        <div className="stage-links">
          <a href="https://www.google.com/maps/dir/42.8467,-2.6716/41.5035,-5.7446" target="_blank" rel="noreferrer">VITORIA → ZAMORA</a>
          <a href="https://www.google.com/maps/dir/41.5035,-5.7446/41.4966,-6.2737" target="_blank" rel="noreferrer">ZAMORA → MIRANDA</a>
          <a href="https://www.google.com/maps/dir/41.4966,-6.2737/41.8061,-6.7567" target="_blank" rel="noreferrer">MIRANDA → BRAGANÇA</a>
          <a href="https://www.google.com/maps/dir/42.8467,-2.6716/41.5035,-5.7446/41.4966,-6.2737/41.8061,-6.7567" target="_blank" rel="noreferrer">JORNADA COMPLETA</a>
        </div>
      </section>

      <section className="braganca-guide">
        <header><small>NOCHE 01 · TRÁS-OS-MONTES</small><h3>BRAGANÇA</h3></header>
        <div className="braganca-modes">
          <article><b>90 MIN · ESENCIAL</b><p>Ciudadela, Domus Municipalis, iglesia de Santa María y paseo exterior del castillo.</p></article>
          <article><b>3 H · COMPLETO</b><p>Añadir torre del castillo, Museo Ibérico de la Máscara y calles del centro histórico.</p></article>
          <article><b>CON LLUVIA</b><p>Castillo, museo de la máscara, Museu do Abade de Baçal y comida transmontana.</p></article>
        </div>
        <p><b>COMER:</b> posta mirandesa, alheira, porco bísaro, presunto y queso de Trás-os-Montes.</p>
        <div className="official-agenda">
          <a href="https://turismo.cm-braganca.pt/a-viagem/agenda" target="_blank" rel="noreferrer"><b>NOITE NA BAIXA</b><span>1–2 AGO · programa municipal confirmado ↗</span></a>
          <a href="https://www.cm-braganca.pt/transparencia/comunicacao/agenda-e-eventos/todos-os-eventos" target="_blank" rel="noreferrer"><b>SONS DE VERÃO</b><span>Desde el 2 AGO · comprobar horario ↗</span></a>
          <a href="https://turismoenzamora.es/agenda/" target="_blank" rel="noreferrer"><b>AGENDA DE ZAMORA</b><span>Actividades del 1 AGO · solo si encajan con el horario ↗</span></a>
          <a href="https://www.cm-mdouro.pt/municipio/comunicacao/agenda-de-eventos" target="_blank" rel="noreferrer"><b>AGENDA DE MIRANDA</b><span>Sin evento imprescindible confirmado · revisar ↗</span></a>
        </div>
      </section>

      <section className="lodging-options">
        <header><small>RESERVA PENDIENTE</small><h3>DÓNDE DORMIR EN BRAGANÇA</h3></header>
        <div>
          {lodging.map((hotel) => <article key={hotel.name}>
            <small>{hotel.kind}</small><strong>{hotel.name}</strong>
            <p>{hotel.location}</p><p><b>PRECIO:</b> {hotel.price}</p><p><b>COCHE:</b> {hotel.parking}</p>
            <a href={hotel.url} target="_blank" rel="noreferrer">WEB / RESERVA ↗</a>
          </article>)}
        </div>
        <p className="data-note">Precios orientativos o no publicados: comprobar disponibilidad, cancelación, aire acondicionado, desayuno y hora límite de entrada para el 1 de agosto.</p>
      </section>

      <section className="return-options">
        <header><small>FINAL MODULAR</small><h3>TRES FORMAS DE VOLVER</h3></header>
        <div>{returnRoutes.map((route) => <article className={tripLength === Number(route.days.slice(0, 2)) ? "selected" : ""} key={route.id}>
          <small>{route.days}</small><strong>{route.title}</strong><b>{route.drive}</b><p>{route.text}</p>
          <a href={route.maps} target="_blank" rel="noreferrer">ABRIR RUTA ↗</a>
        </article>)}</div>
      </section>

      <section className="decision-list">
        <header><small>CONTROL DE RESERVAS</small><h3>POR DECIDIR · {decisions.length - done.length}</h3></header>
        {decisions.map((item) => <button className={done.includes(item) ? "done" : ""} onClick={() => toggleDecision(item)} key={item}>
          <i>{done.includes(item) ? "✓" : "○"}</i><span>{item}</span>
        </button>)}
      </section>
    </div>
  );
}
