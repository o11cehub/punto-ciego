// Tres bugs reales y distintos entre sí, para no tener que inventar
// código roto en vivo mientras grabás el video. Cada uno demuestra una
// categoría de 'punto ciego' diferente:
//   1. Closures y scope de 'var' en un bucle
//   2. Coerción de tipos con comparación laxa (==)
//   3. Referencia vs. valor al mutar un array compartido
export function getSampleCases() {
  return [
    {
      id: 'closure-var',
      label: 'Caso 1: avisos con setTimeout',
      code: `function programarAvisos() {
  for (var i = 1; i <= 3; i++) {
    setTimeout(() => {
      console.log(\`Aviso número \${i}\`);
    }, i * 1000);
  }
}

programarAvisos();`,
      problemDescription:
        'Esperaba que se impriman "Aviso número 1", "Aviso número 2" y "Aviso número 3" en ese orden, pero los tres avisos terminan diciendo "Aviso número 4".',
    },
    {
      id: 'loose-equality',
      label: 'Caso 2: validación de código postal',
      code: `function tieneCodigoPostal(direccion) {
  if (direccion.cp == false) {
    return false;
  }
  return true;
}

console.log(tieneCodigoPostal({ cp: "0000" }));`,
      problemDescription:
        'La dirección tiene un código postal cargado ("0000"), así que esperaba que la función devuelva true, pero me devuelve false.',
    },
    {
      id: 'reference-mutation',
      label: 'Caso 3: resumen del carrito',
      code: `function agregarProductoAlResumen(carritoOriginal, producto) {
  const resumen = carritoOriginal;
  resumen.push(producto);
  return resumen;
}

const carrito = ["remera"];
const resumenParaMostrar = agregarProductoAlResumen(carrito, "buzo");

console.log(carrito);`,
      problemDescription:
        'Solo quiero armar un resumen aparte para mostrar en pantalla, sin tocar el carrito original. Pero cuando reviso "carrito" después de llamar a la función, también tiene "buzo" adentro, y no debería.',
    },
  ];
}
