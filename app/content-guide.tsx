"use client";

import { useState } from "react";

type GuideProps = {
  openSection: (section: "days" | "events" | "food" | "walks" | "explore") => void;
};

const dayDecisions = [
  { day: "01", title: "Vitoria → Zamora → Miranda → Bragança", must: "Llegar a Bragança con margen y dormir en alojamiento reservado.", skip: "No añadir más paradas a una jornada ya muy larga.", rain: "Catedrales de Zamora y Miranda; reducir paseos exteriores.", crowd: "Salida antes de las 08:00.", night: "Cena transmontana y descanso en Bragança." },
  { day: "02", title: "Bragança → Lima Escape", must: "Ciudadela de Bragança y llegada al camping con luz.", skip: "No añadir Soajo después del traslado.", rain: "Castillo, Museo de la Máscara y salida temprana.", crowd: "Abandonar Bragança antes de las 14:30.", night: "Montaje y paseo corto junto al Lima." },
  { day: "03", title: "Soajo + Lindoso", must: "Espigueiros de Soajo, Poço Negro y castillo de Lindoso.", skip: "Poço da Gola si el día va tarde.", rain: "Aldeas, castillo y centro interpretativo; sin pozas.", crowd: "Soajo antes de las 09:30; aparcamientos pequeños.", night: "Regreso tranquilo a Lima Escape." },
  { day: "04", title: "Sistelo + Arcos", must: "Bancales de Sistelo, tramo de Ecovia y paseo del Vez en Arcos.", skip: "No completar la Ecovia lineal sin taxi o segundo coche.", rain: "Centro de Arcos, Paço de Giela y Museu da Água.", crowd: "Sistelo temprano; Arcos funciona mejor al final de la tarde.", night: "Agenda de Arcos o última cena en la base interior." },
  { day: "05", title: "Braga → Cabedelo", must: "Bom Jesus, Sé y casco histórico.", skip: "Sameiro si el traslado se retrasa.", rain: "Iglesias, museos y mercado de Braga.", crowd: "Bom Jesus antes de las 10:00; sumar 30 min de aparcamiento.", night: "Atardecer corto en Cabedelo después de montar." },
  { day: "06", title: "Viana + Santa Luzia", must: "Centro, Gil Eannes, Santa Luzia y cena en Viana.", skip: "Mirador si la cima está completamente cubierta.", rain: "Gil Eannes, Museu do Traje y cafés del centro.", crowd: "Aparcar una vez y recorrer Viana a pie.", night: "Paseo iluminado por la ribera." },
  { day: "07", title: "Costa norte", must: "Elegir dos playas, no intentar verlas todas.", skip: "Moledo con viento fuerte: sustituir por Caminha o Âncora.", rain: "Caminha, Cerveira, museo y comida larga.", crowd: "Afife antes de las 10:30; N13 lenta en agosto.", night: "SonicBlast o sardinas en Âncora." },
  { day: "08", title: "Valença + Tui", must: "Fortaleza de Valença, puente internacional y casco de Tui.", skip: "Compras largas si todavía hay que montar la tienda.", rain: "Catedral de Tui, museos y comer bajo soportales.", crowd: "Aparcar fuera de la fortaleza; prever cortes por fiestas.", night: "Sons no Terreiro en Cerveira." },
  { day: "09", title: "Santa Trega + A Guarda", must: "Castro, dos miradores y puerto.", skip: "Subida a pie con niebla cerrada o calor fuerte.", rain: "MASAT, museo del castro y ruta gastronómica por el puerto.", crowd: "Subir antes de las 10:00 o a última hora.", night: "Puesta de sol en O Muíño." },
  { day: "10", title: "Oia + Mougás + Baiona", must: "Monasterio de Oia, Cabo Silleiro y paseo de Monterreal.", skip: "Pozas de Mougás tras lluvia o con roca húmeda.", rain: "Oia y Baiona; exposiciones Baiverán.", crowd: "Baiona por la tarde requiere margen de aparcamiento.", night: "Cena de pescado en A Guarda." },
  { day: "11", title: "Regreso o extensión", must: "Decidir según descanso y hacer dos paradas reales si se vuelve.", skip: "No añadir rutas antes de 650 km de conducción.", rain: "Regreso directo o jornada cultural si se amplía.", crowd: "Salir antes de las 10:00.", night: "Llegada y descarga básica; diario del viaje otro día." },
];

const comparisons = [
  { title: "SOAJO O SISTELO", a: "Soajo", b: "Sistelo", verdict: "Soajo gana en patrimonio, pozas y variedad. Sistelo gana en paisaje agrícola y senderismo fluvial. Si solo queda un día: Soajo.", rows: [["Baño", "Muy bueno", "Limitado"], ["Paseo fácil", "Sí", "Sí"], ["Fotografía", "Espigueiros y granito", "Bancales y valle"], ["Masificación", "Media–alta", "Media"], ["Tiempo ideal", "4–6 h", "3–5 h"]] },
  { title: "POÇO NEGRO O POÇO DA GOLA", a: "Poço Negro", b: "Poço da Gola", verdict: "Poço Negro es más espectacular; Poço da Gola es una parada corta muy cómoda al visitar Lindoso.", rows: [["Acceso", "Corto, final empinado", "Muy corto"], ["Estancia", "60–90 min", "30–60 min"], ["Espacio", "Reducido", "Muy reducido"], ["Mejor combinación", "Soajo", "Lindoso"], ["Tras lluvia", "Evitar", "Evitar"]] },
  { title: "AFIFE O MOLEDO", a: "Afife", b: "Moledo", verdict: "Afife para playa salvaje y fotografía; Moledo para servicios, vistas a Ínsua y combinar con Caminha.", rows: [["Paisaje", "Dunas y rocas", "Ínsua y Santa Trega"], ["Servicios", "Pocos", "Más completos"], ["Surf", "Muy expuesta", "Variable"], ["Viento", "Expuesta", "Muy expuesta"], ["Ambiente", "Natural", "Más concurrido"]] },
  { title: "BRAGA O VIANA CON LLUVIA", a: "Braga", b: "Viana", verdict: "Braga es la opción más completa con lluvia continua. Viana funciona mejor con chubascos porque combina museos y paseos cortos.", rows: [["Museos", "Muchos", "Buenos y compactos"], ["Patrimonio interior", "Excelente", "Bueno"], ["Aparcamiento", "Tráfico urbano", "Más sencillo"], ["Comida", "Muy amplia", "Pescado y cocina minhota"], ["Día completo", "Sí", "Sí"]] },
  { title: "CERVEIRA, VALENÇA O TUI", a: "Cerveira", b: "Valença / Tui", verdict: "Cerveira para arte y calma; Valença y Tui para patrimonio monumental y una jornada más completa.", rows: [["Ambiente", "Artístico", "Histórico"], ["Tiempo mínimo", "2 h", "4–5 h"], ["Compras", "Artesanía", "Textil y comercio"], ["Fotografía", "Río y esculturas", "Fortaleza y puente"], ["Noche", "Conciertos", "Fiestas / terrazas"]] },
];

const localFood = [
  { zone: "INTERIOR · GERÊS / ARCOS", dishes: "Cachena, cabrito assado, arroz de feijão, rojões y broa.", buy: "Panadería y mercado de Arcos; preparar empanada, fruta y agua para el parque.", budget: "Menú del día o tasca: 12–18 €. Cachena/cabrito: 20–30 €.", timing: "Comer antes de las 14:00 en aldeas; oferta limitada por la tarde.", reserve: "Reservar cachena o cabrito el fin de semana." },
  { zone: "BRAGA", dishes: "Bacalhau à Braga, papas de sarrabulho, frigideiras y pudim Abade de Priscos.", buy: "Mercado Municipal y Frigideiras do Cantinho para llevar.", budget: "Comida tradicional: 15–25 €. Pastelería y tentempié: 3–8 €.", timing: "Buen día para una comida sentada y larga.", reserve: "Reserva recomendable en el centro durante el fin de semana." },
  { zone: "VIANA / COSTA", dishes: "Polvo à lagareiro, bacalhau à Minhota, arroz de marisco, pescado y bolas de Berlim.", buy: "Mercado Municipal de Viana, panaderías y pescado preparado para el camping.", budget: "Pescado: 16–25 €. Arroz de marisco: 22–35 € por persona.", timing: "Playa por la mañana y comida tardía protegida del sol.", reserve: "Imprescindible reservar en locales costeros populares." },
  { zone: "CAMINHA / ÂNCORA", dishes: "Sardinas, robalo, arroz de tamboril y marisco.", buy: "Festa do Mar e da Sardinha o mercado de Caminha.", budget: "Sardinas/comida informal: 10–18 €. Marisco: precio variable.", timing: "Encaja como cena tras Afife, Moledo o SonicBlast.", reserve: "Festivales y fines de semana generan esperas." },
  { zone: "A GUARDA / BAIXO MIÑO", dishes: "Pulpo, pez espada, langosta, empanada, percebes y rosca de yema.", buy: "Plaza de abastos de A Guarda; empanada para Mougás y Oia.", budget: "Pulpo/menú: 12–22 €. Langosta y percebes: preguntar antes el precio.", timing: "Comer en el puerto después de Santa Trega.", reserve: "Reservar si buscáis una marisquería concreta." },
];

const photoSpots = [
  ["Espigueiros de Soajo", "Primera hora", "Luz lateral, menos coches y menos visitantes.", "Gran angular moderado; buscar líneas entre los hórreos."],
  ["Lindoso", "Última tarde", "Castillo y espigueiros con luz cálida hacia la Serra Amarela.", "Combinar planos generales y detalles de granito."],
  ["Sistelo", "Mañana o cielo cubierto", "Los bancales conservan textura sin sombras duras.", "Miradores de entrada y caminos sobre el valle."],
  ["Bom Jesus", "Antes de 10:00", "Escalinata más vacía y luz suave.", "Composición axial desde abajo; después detalles barrocos."],
  ["Santa Luzia", "Última hora", "Vista del Lima, Viana y costa.", "No subir con nube cerrada; esperar claros tras lluvia."],
  ["Praia de Afife", "Atardecer", "Rocas, espuma y dunas.", "Trípode opcional; mantener distancia con oleaje."],
  ["Moledo e Ínsua", "Atardecer", "Fortaleza recortada contra el océano.", "Tele corto para acercar Ínsua y Santa Trega."],
  ["Santa Trega", "Mañana despejada", "Miño, Portugal, castro y costa en una misma jornada.", "Priorizar miradores antes que la cima si aparece niebla."],
  ["Cabo Silleiro", "Última tarde", "Faro, acantilados y baterías.", "Viento frecuente; proteger equipo y no acercarse al borde."],
];

const heritage = [
  ["Castillo y espigueiros de Lindoso", "Fortaleza fronteriza y una gran era comunal que explica la vida agrícola de montaña.", "La concentración de más de cincuenta espigueiros y las vistas desde la muralla.", "60–90 min"],
  ["Paço de Giela", "Casa fuerte medieval vinculada al territorio de Arcos de Valdevez.", "La torre, la evolución del edificio y el paisaje del valle.", "45–60 min"],
  ["Sé de Braga", "Una de las catedrales más antiguas de Portugal y resumen de varios estilos.", "Capillas, coro y tesoro; entrar merece más la pena que verla solo por fuera.", "60–90 min"],
  ["Gil Eannes", "Antiguo buque hospital de la flota bacaladera portuguesa.", "Camarotes, quirófano y espacios técnicos conservados.", "60–90 min"],
  ["Fortaleza de Valença", "Doble recinto defensivo frente a Tui y pieza clave de la frontera del Miño.", "Recorrer baluartes y mirar hacia la catedral de Tui.", "90–120 min"],
  ["Catedral de Tui", "Catedral-fortaleza románica y gótica sobre el Miño.", "Claustro, fachada occidental y panorámica fronteriza.", "60–90 min"],
  ["Castro de Santa Trega", "Gran asentamiento galaico con ocupación anterior y romana.", "Viviendas reconstruidas, museo y relación visual con la desembocadura.", "90–150 min"],
  ["Monasterio de Oia", "Monasterio cisterciense excepcionalmente situado frente al Atlántico.", "Fachada, recinto y vínculo histórico con la defensa costera.", "45–75 min"],
  ["Fortaleza de Monterreal", "Recinto amurallado que domina Baiona y su bahía.", "Paseo exterior completo; entrar depende del acceso del parador.", "60–90 min"],
];

const nights = [
  ["BASE 01", "Paseo fluvial en Arcos, folclore, Cantares ao Desafio o cena temprana en el camping.", "Las carreteras del parque son lentas y oscuras: evitar enlazar pozas con eventos nocturnos lejanos."],
  ["BASE 02", "Atardecer en Cabedelo, cena en Viana, NEOPOP, SonicBlast o sardinas en Âncora.", "Confirmar transporte, entradas y ruido; no conducir cansado después de un festival."],
  ["BASE 03", "Puerto de A Guarda, Sons no Terreiro, fiestas de Valença o paseo iluminado por Tui.", "El cruce fronterizo es sencillo, pero los eventos pueden alterar aparcamientos y tráfico."],
];

export default function ContentGuide({ openSection }: GuideProps) {
  const [comparison, setComparison] = useState(0);
  const [openDay, setOpenDay] = useState("02");
  const selected = comparisons[comparison];

  return (
    <div className="content-guide">
      <section className="guide-manifesto">
        <small>SELECCIÓN EDITORIAL</small>
        <h3>MENOS PUNTOS.<br />MEJORES DECISIONES.</h3>
        <p>Esta capa explica qué merece realmente la pena, cuándo ir, qué eliminar si el día se complica y cómo adaptar la ruta al clima, las multitudes y el cansancio.</p>
        <div>
          <button onClick={() => openSection("days")}>ABRIR PLAN DIARIO</button>
          <button onClick={() => openSection("events")}>VER AGENDA</button>
        </div>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>01</span><div><small>PLAN DEFINITIVO</small><h3>DECISIONES DÍA A DÍA</h3></div></div>
        <div className="editorial-days">
          {dayDecisions.map((item) => (
            <article className={openDay === item.day ? "open" : ""} key={item.day}>
              <button onClick={() => setOpenDay(openDay === item.day ? "" : item.day)}><b>{item.day}</b><span>{item.title}</span><i>{openDay === item.day ? "−" : "+"}</i></button>
              {openDay === item.day && <div><p><b>⭐ IMPRESCINDIBLE</b>{item.must}</p><p><b>✂ QUÉ ELIMINAR</b>{item.skip}</p><p><b>☂ CON LLUVIA</b>{item.rain}</p><p><b>⏱ AGOSTO</b>{item.crowd}</p><p><b>☾ NOCHE</b>{item.night}</p></div>}
            </article>
          ))}
        </div>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>02</span><div><small>ELEGIR SIN DUDAS</small><h3>COMPARADOR DE PLANES</h3></div></div>
        <div className="comparison-picker">{comparisons.map((item, index) => <button className={comparison === index ? "active" : ""} key={item.title} onClick={() => setComparison(index)}>{item.title}</button>)}</div>
        <article className="comparison-card">
          <div className="comparison-title"><b>{selected.a}</b><i>VS</i><b>{selected.b}</b></div>
          <div className="comparison-table">{selected.rows.map(([label, a, b]) => <div key={label}><strong>{label}</strong><span>{a}</span><span>{b}</span></div>)}</div>
          <p><b>VEREDICTO</b>{selected.verdict}</p>
        </article>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>03</span><div><small>COMER CON CRITERIO</small><h3>GASTRONOMÍA LOCAL</h3></div></div>
        <div className="local-food-grid">{localFood.map((item) => <article key={item.zone}><h4>{item.zone}</h4><p><b>PLATOS</b>{item.dishes}</p><p><b>PARA EL CAMPING</b>{item.buy}</p><p><b>PRECIO</b>{item.budget}</p><p><b>MOMENTO</b>{item.timing}</p><p><b>RESERVA</b>{item.reserve}</p></article>)}</div>
        <button className="guide-link-button" onClick={() => openSection("food")}>ABRIR TODA LA GUÍA GASTRONÓMICA →</button>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>04</span><div><small>LUZ Y PAISAJE</small><h3>GUÍA FOTOGRÁFICA</h3></div></div>
        <div className="photo-list">{photoSpots.map(([place, hour, why, frame]) => <article key={place}><div><strong>{place}</strong><small>{hour}</small></div><p>{why}</p><em>{frame}</em></article>)}</div>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>05</span><div><small>NO SOLO “UN CASTILLO”</small><h3>PATRIMONIO EXPLICADO</h3></div></div>
        <div className="heritage-list">{heritage.map(([place, context, key, time]) => <article key={place}><strong>{place}</strong><small>{time}</small><p>{context}</p><em><b>NO PERDERSE:</b> {key}</em></article>)}</div>
        <button className="guide-link-button" onClick={() => openSection("explore")}>ABRIR MUSEOS Y PATRIMONIO →</button>
      </section>

      <section className="guide-block">
        <div className="guide-block-head"><span>06</span><div><small>DESPUÉS DEL ATARDECER</small><h3>PLANES NOCTURNOS</h3></div></div>
        <div className="night-list">{nights.map(([base, plan, caution]) => <article key={base}><b>{base}</b><p>{plan}</p><em>⚠ {caution}</em></article>)}</div>
      </section>

      <section className="guide-block final-rules">
        <div className="guide-block-head"><span>07</span><div><small>REGLAS DE AGOSTO</small><h3>QUÉ CAMBIA EL VIAJE</h3></div></div>
        <ul>
          <li><b>UNA PRIORIDAD POR DÍA.</b> El resto debe poder eliminarse sin estropear la jornada.</li>
          <li><b>POZAS TEMPRANO.</b> Aparcamiento limitado, poca zona de estancia y roca más segura antes del calor.</li>
          <li><b>DOS PLAYAS COMO MÁXIMO.</b> Más paradas convierten el día en una sucesión de aparcamientos.</li>
          <li><b>30 MINUTOS EXTRA.</b> Añadirlos en Braga, Viana, Baiona y cualquier fiesta.</li>
          <li><b>NO CONFIAR SOLO EN EL SOL.</b> Una poza puede llevar caudal peligroso por lluvia aguas arriba.</li>
          <li><b>RESERVAR LA CENA.</b> Especialmente costa, viernes, sábado y noches de festival.</li>
          <li><b>DESCARGAR EL TRACK.</b> La cobertura del interior no es suficientemente fiable para improvisar.</li>
        </ul>
      </section>
    </div>
  );
}
