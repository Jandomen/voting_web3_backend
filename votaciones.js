const votaciones = [
  { id: 1, titulo: "Mejor lenguaje de programación", opciones: ["JavaScript", "Python", "Go", "Rust"] },
  { id: 2, titulo: "Mejor framework frontend", opciones: ["React", "Vue", "Angular", "Svelte"] }
];

let lastVotacionId = votaciones.length;

function crearVotacion(titulo, opciones) {
  lastVotacionId++;
  const nueva = { id: lastVotacionId, titulo, opciones };
  votaciones.push(nueva);
  return nueva;
}

module.exports = { votaciones, crearVotacion };
