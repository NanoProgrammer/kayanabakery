# Karyana Loyalty Club (KLC) — especificación

**Estado: PROPUESTA. No autoriza cambios en producción.**

El motor está construido y probado, pero **apagado**: `KLC_LIVE` en
`lib/loyalty/standing.ts` está en `false`, y mientras lo esté nada de esto
toca el nivel, el precio ni lo que ve un cliente. La página del Club también
lee ese interruptor, así que la página y las reglas no pueden describir dos
clubes distintos. Encenderlo es una línea — después de las decisiones de la
sección 5.
Rubén y Karina no han aprobado el despliegue. Los umbrales 4 / 10 / 18 KLC
son propuestos, no definitivos. Nada de lo descrito aquí está conectado al
checkout, a la membresía ni al nivel que un cliente tiene hoy.

Fuentes: documento de costos y requisitos del 12-nov-2026, adenda de los
cinco pilares (12-nov-2026, 7:02 PM) y la aclaración sobre Legendario
(12-nov-2026, 9:01 PM).

Código de apoyo: `lib/loyalty/klc.ts` (motor puro, sin conectar) y
`scripts/test-klc.ts` (`npm run test:klc`, 52 pruebas).

---

## 1. Auditoría del sistema actual (requisito F.1)

Esto responde a los puntos marcados «CONJETURA por validar» y a las preguntas
de la sección G. Leído del código, no supuesto.

### 1.1 Puntos: tasa real — CONJETURA CONFIRMADA

| Pregunta | Respuesta, con la línea de código |
| --- | --- |
| ¿Puntos base por $1? | **1 punto por cada $1**. `lib/checkout/pricing.ts`: `dollars = Math.floor(subtotalCents / 100)`, `pointsEarned = Math.floor(dollars * tierData.pointsMultiplier)` |
| ¿Valor de canje? | **1 punto = 1 centavo**, o sea 100 puntos = $1. `lib/membership/tiers.ts`: `pointsToCents(points) { return points }` |
| ¿Sobre qué base se ganan? | **Sólo el subtotal de productos**, antes de descuentos. **No** sobre GST, envío ni propina |
| ¿Los invitados ganan? | **No.** `isGuest ? 0 : …` |

La conjetura del documento («1 punto base por $1; 100 puntos = $1») es
correcta, y por tanto los escenarios de la sección C son válidos: un pastel
de $60 genera 60 / 120 / 240 / 300 puntos = $0.60 / $1.20 / $2.40 / $3.00.

### 1.2 Hallazgos que el documento no contempla

1. **Los puntos se ganan sobre el subtotal ANTES de descuentos.** Un cliente
   que paga una orden completa con puntos **vuelve a ganar puntos** sobre el
   subtotal íntegro. En el escenario del pastel de $60 pagado con puntos, el
   Club paga el canje y además acredita 60–300 puntos nuevos. Esto no aparece
   en el costeo de la sección C y debería entrar en el techo de la sección E.
   *Decisión pendiente: ¿ganar sobre el subtotal después de descuentos?*

2. **`dollarsToPoints()` convierte a 100 puntos por $1**, mientras que la
   acumulación real usa 1 punto por $1 — una diferencia de 100×. Hoy no se usa
   en ningún lado (código muerto), pero cualquiera que la use para acreditar
   puntos entregaría cien veces lo previsto. *Recomendación: borrarla.*

3. **El `appliesTo` de los cupones no se aplicaba.** Corregido el 12-nov-2026
   (ver `lib/checkout/pricing.ts`, `couponCovers`). Relevante para el techo de
   la sección E: antes de ese arreglo, un cupón «sólo pasteles» descontaba
   sobre la orden completa, así que cualquier medición histórica del costo de
   promociones está subestimada.

4. **La tarifa de Square no está en el código.** No hay ningún 2.8% + $0.30
   configurado: el cobro lo liquida Square y la aplicación nunca ve la tarifa.
   El neto por pedido **no es auditable desde esta base de datos**; hay que
   sacarlo del panel de Square. (Requisito F.1, «Square neto».)

5. **Envío: mínimos y prioridad.** `MIN_DELIVERY_CENTS = 2500` ($25) es el
   mínimo para *poder* pedir envío, para todos los niveles. Los umbrales de
   envío gratis son Artesano $32 y Selecto/Legendario $25. Es decir, un
   Selecto alcanza envío gratis exactamente en el mínimo de pedido; un
   Artesano paga envío entre $25 y $31.99. Eso es lo que la sección D señala
   como «texto potencialmente contradictorio»: **no es contradictorio en el
   código, pero sí mal explicado en la página.**

6. **Hoy el nivel se compra, no se gana.** `Membership.tier` lo fija el pago
   (Square), y `effectiveTier()` lo baja a BASICO cuando vence. No existe
   ningún concepto de nivel ganado por compras. Migrar a niveles ganados es
   un cambio de modelo, no un ajuste de parámetros.

### 1.3 Los tres saldos (requisito F.2)

| Saldo | Dónde vive hoy | Estado |
| --- | --- | --- |
| Prepago ya comprado | `Membership` + `pointsForFee()`, que convierte la cuota a puntos a valor nominal (1 punto = 1 centavo) | **Existe.** Es una obligación: no puede borrarse en la migración |
| Puntos canjeables | `User.pointsBalance` + `PointsTransaction` | **Existe** |
| KLC de nivel | — | **No existe.** Habría que crearlo |

**El prepago y los puntos canjeables comparten hoy la misma columna.** La
cuota de membresía se convierte en `pointsBalance`, mezclada con los puntos
ganados por compra.

**Esto ya está resuelto del lado técnico.** `lib/loyalty/balances.ts`
reconstruye los dos saldos desde `PointsTransaction`, y
`npm run report:balances` lo corre contra la base real — **solo lectura, no
cambia nada**:

- `BONUS` = dinero que el cliente pagó (cuota de membresía convertida a
  puntos a valor nominal). **Es una obligación.**
- Todo lo demás positivo (`EARNED`, `REFERRAL`, `BIRTHDAY`, `ADJUSTMENT`) =
  puntos regalados por comprar. **Es un costo de marketing, no una deuda.**

Un canje consume **los créditos más antiguos primero**, que es como se
comporta un saldo de verdad y es el único reparto que no exige una decisión
que nadie ha tomado. El reporte muestra además los dos extremos (si todo
canje saliera del prepago, o si saliera de lo ganado) para que el rango sea
visible en vez de supuesto.

**El reporte también detecta cuentas cuyo saldo el libro no explica** — puntos
que se movieron sin dejar registro. Ésas hay que resolverlas antes de
migrar: reconstruir una de ellas le daría al cliente una obligación **menor**
de la que realmente pagó.

---

## 2. Los cinco pilares

Los pilares son **formas alternativas** de acumular KLC, **no cinco
requisitos**. Antigüedad, referidos y exploración son bonificaciones
opcionales. (Aclaración por correo, 12-nov-2026, 9:01 PM.)

1. Frecuencia de compra
2. Consumo
3. Antigüedad verificable — *opcional*
4. Referidos — *opcional*
5. Exploración de productos — *opcional*

### 2.1 Niveles (propuestos)

| Nivel | KLC | Requisito adicional |
| --- | --- | --- |
| Básico | 0 | — |
| Artesano | 4 | — |
| Selecto | 10 | — |
| Legendario | 18 | **≥ 4 compras personales verificadas en fechas distintas** |

**Legendario requiere únicamente esas dos condiciones.** Un cliente nuevo
puede alcanzarlo sin antigüedad alguna. Los referidos y la exploración **no
sustituyen** las cuatro compras personales: cuando los KLC alcanzan 18 pero
las compras no llegan a cuatro, el miembro se queda en Selecto y se le dice
qué le falta (`heldBack: "NEEDS_PERSONAL_PURCHASES"`).

Dos pedidos el mismo día cuentan como **una** fecha.

### 2.2 KLC por referido convertido

**+2 KLC** cuando la persona referida hace su **primera compra válida**.
Registrarse **no** genera estos KLC. El premio de Karyana Points por
registrarse es un sistema aparte, con sus propias reglas, y no se toca.

### 2.3 KLC por exploración

**+1 KLC** la primera vez que el miembro compra de cada familia:

| Familia | Slug real del catálogo |
| --- | --- |
| (a) Conchas y pan dulce | `conchas` |
| (b) Pan tradicional y de temporada | `traditional-mexican-bread` |
| (c) Pasteles y celebraciones | `cakes` (se muestra como «Confectionery») |
| (d) Postres y especialidades | `churros` |

Leído del sitio el 17-nov-2026. Las categorías reales de la tienda son
`conchas`, `cakes`, `churros`, `traditional-mexican-bread` y `boxes`.

**PENDIENTE: `boxes`.** Una caja puede llevar productos de varias familias.
Acreditarla como una sola familia sería elegir una arbitrariamente;
acreditarla como las cuatro daría 4 KLC por una sola compra. Hoy no cuenta
para ninguna. Lo tiene que decidir Karyana.

Una familia se reconoce **una sola vez**, por muchos sabores que se prueben.
Un producto que no cae en ninguna familia **no genera crédito**, en vez de
ser adivinado dentro de una. Varios de estos slugs no existen todavía en el
catálogo: **este mapeo hay que confirmarlo contra Studio antes de simular.**

### 2.4 Tope combinado

**Máximo 6 KLC por 365 días móviles** entre referidos y exploración. Móvil,
no por año calendario. Un crédito que supere el tope **no se concede** —
queda rechazado, no diferido, así que no reaparece después. Un crédito que
sólo cabría parcialmente se rechaza entero: conceder una parte sería inventar
una regla que nadie aprobó.

Frecuencia, consumo y antigüedad **no** están sujetos a este tope.

Este límite es **independiente** del tope operativo de 10 referidos por
ciclo. Tras el décimo, el miembro puede pedir una revisión personal para
habilitar otro ciclo.

### 2.5 Cambio solicitado: que un referido suba KLC «como si fuera una compra»

**Pendiente de aprobación de Karina y Rubén. No implementado.**

Santiago pidió (17-nov-2026) que referir suba los créditos KLC como si fuera
una compra. Hay que separar dos cosas, porque una ya existe y la otra choca
con una regla escrita:

**Ya existe:** un referido convertido **sí sube KLC**, +2, en cuanto la
persona referida hace su primera compra válida (sección 2.2). Eso ya está en
el motor.

**Choca con la adenda:** que cuente *como una compra propia* no se puede sin
cambiar una regla que Karina y Rubén escribieron dos veces:

> «No permitir que referidos o exploración sustituyan el requisito mínimo de
> compras propias y en fechas distintas para categorías superiores;
> particularmente Legendario requiere al menos cuatro compras personales
> verificadas.»

Si un referido cuenta como compra, esa protección desaparece: alguien podría
llegar a Legendario sin haber comprado nunca.

**Y un número que conviene mirar antes de decidir.** Con los valores de la
adenda —+2 KLC por referido y tope de 6 KLC por 365 días— referir a 10
personas da esto (calculado con el motor, no estimado):

| | |
| --- | --- |
| 10 referidos convertidos | **6 KLC otorgados, 14 rechazados** |
| Referidos que llegan a contar | **3 de 10** |
| Nivel alcanzado con 10 referidos y 0 compras propias | **Artesano** |

O sea: el tope operativo son 10 referidos por ciclo, pero **solo los 3
primeros suben KLC**. Los otros 7 no mueven la aguja. Si la intención es
premiar a quien trae 10 personas, **el tope de 6 es lo que hay que subir**,
no la regla de las compras propias. Son dos decisiones distintas y conviene
tomarlas por separado.

### 2.6 Conservar el nivel, y perderlo

Implementado en `lib/loyalty/standing.ts` (`npm run test:standing`, 35
pruebas). **Detrás del interruptor `KLC_LIVE`, hoy en `false`.**

La idea que la membresía pagada nunca tuvo: el nivel **se gana y hay que
conservarlo**. Los créditos cuentan solo mientras son recientes (365 días),
así que quien deja de comprar baja solo — sin trabajo de expiración, sin
correo de "tu membresía venció", solo un número que deja de ser cierto.

Dos cosas evitan que eso sea cruel:

| | |
| --- | --- |
| **Subir es inmediato** | Nadie debería esperar para ser premiado |
| **Bajar espera 90 días** | Un mes flojo después de un año de lealtad no cuesta el nivel |
| **Nunca más de un escalón** | Una ausencia larga es un descenso, no una caída |
| **Se avisa antes** | "Conservas Legendario 60 días más — una compra lo renueva" |

El caso que estas reglas evitan es concreto: **un cliente de siempre entrando
el día de su cumpleaños y encontrándose en Básico.**

---

## 3. Integridad

- Sólo pedidos **válidos y únicos**. No se acreditan autorreferidos, cuentas
  de la misma persona, compras de prueba, duplicados ni pedidos creados para
  acumular créditos.
- **Idempotencia:** cada crédito lleva una clave (`ref:<userId>`,
  `fam:<FAMILIA>`) y la misma clave no se acredita dos veces. En la base de
  datos esto debe ser además un índice único, no sólo una comprobación en
  código.
- **Auditoría:** cada evento se registra con fecha, tipo, cantidad,
  referencia y resultado — incluidos los **rechazados**, con el motivo
  (`duplicate`, `yearly_cap`). Un crédito negado en silencio es indefendible
  frente a un cliente que lo reclama.

---

## 4. Experiencia del cliente

Progreso claro, sin exponer la fórmula: *«Cada compra, recomendación y nueva
experiencia te acerca a Legendario»*, con lo que falta. Cuando el nivel está
retenido por las compras personales, se dice exactamente eso — «te falta 1
compra para Legendario» — y no un número de créditos que ya tiene.

---

## 5. Lo que falta antes de programar nada

**Decisiones de Rubén y Karina:**

- ¿Los puntos se ganan sobre el subtotal antes o después de descuentos?
  (hallazgo 1.2.1 — hoy es antes, y se paga doble).
- ¿500 puntos de cumpleaños para todos o sólo miembros activos? ¿Requieren
  compra previa?
- ¿Qué es una muestra gratuita: cantidad, frecuencia, si exige pedido?
- Política de envío y prioridad, y corregir la página según 1.2.5.
- Techo del costo total de beneficios (puntos + regalo + envío incremental +
  promociones).
- Decidir qué hacer con `boxes` en el mapeo de familias de 2.3 (único punto
  que queda abierto: el resto ya está confirmado contra el catálogo real).

**Trabajo técnico previo:**

- ~~Separar prepago de puntos canjeables~~ **hecho** (`lib/loyalty/balances.ts`,
  `npm run report:balances`). Queda **correr el reporte contra producción** y
  resolver las cuentas que salgan marcadas antes de migrar.
- Sacar la tarifa neta real de Square de su panel; no está en esta base de
  datos (1.2.4).
- Re-simular la distribución Básico/Artesano/Selecto/Legendario con la
  fórmula ampliada, sobre pedidos reales.
- Borrar `dollarsToPoints()` (1.2.2).

**Pruebas exigidas (F.6):** pastel $60, caja $35, pedido $25, pedido con
descuento, cumpleaños, 2 y 3 pedidos por ruta, puntos y prepagos existentes,
y dos correos del mismo cliente verificados. De éstas, `npm run test:klc`
cubre hoy la parte de créditos y niveles; **el motor de simulación económica
por pedido (F.3) no está hecho.**

**Migración (F.7):** asignar KLC por compras históricas verificables, pero
**no** otorgar puntos canjeables retroactivos sin decisión expresa.
Protección de nivel 90 días.
