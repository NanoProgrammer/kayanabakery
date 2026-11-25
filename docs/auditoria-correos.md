# Auditoría de correos — Situación 11

*Inventario del 25 de noviembre de 2026, leído del código, no de memoria.*

La junta pidió revisar los correos automáticos y comerciales y decidir cuáles
conservar, modificar o eliminar, para evitar saturación y reservar el correo
sobre todo para comunicaciones esenciales.

Esto es la primera mitad: **qué manda el sistema hoy, quién lo dispara y a
quién llega.** La segunda mitad —qué se queda y qué se va— es una decisión de
Karina y Rubén, y está marcada abajo donde hace falta.

## Lo primero, porque cambia la conversación

**Brevo no manda ni un solo correo desde este sitio.** Todo el correo
transaccional sale por **Resend**. Brevo recibe contactos y los mete en listas;
lo que se manda desde esas listas se arma dentro de Brevo y no está en el
código. Así que esta auditoría tiene dos partes distintas:

- **Resend** — los 12 correos de abajo. Están en el código y los puedo
  cambiar, quitar o reescribir.
- **Brevo** — las listas y automatizaciones. Yo solo veo qué contactos entran y
  con qué etiquetas. Lo que Brevo les manda después hay que revisarlo dentro de
  la cuenta de Brevo; no puedo verlo desde aquí.

Si alguien se queja de "demasiados correos de Karyana", es mucho más probable
que venga de una automatización de Brevo que de esta lista.

## Correo transaccional (Resend)

Esencial = el cliente lo pidió o lo necesita. Comercial = nosotros decidimos
mandarlo.

| # | Correo | Cuándo sale | A quién | Tipo |
|---|---|---|---|---|
| 1 | Confirmación de pedido | Al pagar | Cliente | Esencial |
| 2 | Aviso de pedido nuevo | Al pagar | Karyana | Interno |
| 3 | Pedido completado | Al marcarlo completado en el Studio, o al cierre automático de las 11 PM | Cliente | Esencial |
| 4 | **Factura de pedido personalizado** | Cuando alguien aprieta el botón en el Studio | Cliente | Esencial · nuevo (Situación 7) |
| 5 | Restablecer contraseña | Cuando el cliente lo pide | Cliente | Esencial |
| 6 | Bienvenida a membresía | Al suscribirse | Cliente | Esencial |
| 7 | Problema de renovación | Cuando falla el cobro | Cliente | Esencial |
| 8 | Recordatorio de caja semanal | Cron diario, antes de preparar la caja | Miembros con caja | Esencial |
| 9 | Caja semanal procesada | Cron diario, al cobrarla | Miembros con caja | Esencial |
| 10 | Aviso de puntos por vencer | Cron diario | Clientes con puntos próximos a vencer | **A decidir** |
| 11 | Pedir reseña | Cron diario, al día siguiente del pedido | Cliente | **A decidir** |
| 12 | Decisión de Embajador | Al aprobar o rechazar | Solicitante | Esencial |
| 13 | Formulario de contacto | Al enviarlo | Karyana | Interno |
| 14 | Solicitud de pastel personalizado | Al enviarla | Karyana | Interno |
| 15 | Invitación de referido | Cuando un cliente invita a alguien | Invitado | **A decidir** |

### Dónde está la saturación real

De los 15, **solo tres son discutibles**, y conviene mirarlos juntos porque
caen sobre la misma persona en la misma semana:

- **Pedir reseña (11).** Verificado en el código: el cron busca pedidos
  completados con `reviewRequestedAt` vacío, o sea **uno por pedido, sin
  ningún tope por cliente**. Para alguien que compra pan cada semana son
  ~52 peticiones de reseña al año. Nadie escribe 52 reseñas; lo que hace es
  dejar de abrir los correos de Karyana.
  **Recomendación:** mandarla tras el primer pedido y después como mucho una
  vez cada seis meses. Es un cambio chico y lo hago en cuanto me digan que sí.
- **Puntos por vencer (10).** Útil, pero se vuelve ruido si sale varias veces
  por el mismo lote de puntos. **A verificar:** si avisa una vez o cada día
  hasta que vencen.
- **Invitación de referido (15).** Va a alguien que nunca nos dio su correo —
  se lo dio su amigo. Es el que más cuidado merece bajo las reglas canadienses
  de consentimiento. **Recomendación:** mantenerlo en uno solo por invitación,
  sin recordatorios.

Los demás los pidió el cliente o los necesita para recoger su pedido. Quitarlos
no reduce saturación, solo deja gente sin saber dónde está su pastel.

## Brevo: qué entra y con qué etiqueta

El sitio solo empuja contactos. Seis momentos:

| Momento | Qué se escribe |
|---|---|
| Se suscribe al newsletter | Lista general + lista de su idioma (ES / EN) |
| Crea su cuenta | Contacto con `LANGUAGE` y origen |
| Cambia su membresía | Lista de miembros, nivel actual |
| Completa un pedido | Atributos de compra |
| Pedido de invitado | Contacto nuevo desde el pedido |
| Prende o apaga la caja semanal | Lista que dispara la automatización ON/OFF |

Cada contacto lleva `LANGUAGE`, así que **toda campaña de Brevo se puede
segmentar por idioma.** Si hoy sale una campaña en inglés a toda la base, es
una configuración de Brevo, no una limitación del sitio.

### Lo que hay que revisar dentro de Brevo

No lo puedo ver desde el código. Para cada automatización en la cuenta:

1. ¿A quién le llega y cada cuánto?
2. ¿Se cruza con alguno de los 15 de arriba? (Ejemplo: una automatización de
   "gracias por tu compra" en Brevo es un duplicado del correo 1.)
3. ¿Está segmentada por `LANGUAGE`?
4. ¿Tiene enlace para darse de baja? Obligatorio en Canadá para lo comercial.

## Lo que sí hice

Nada de esto cambia todavía: es un inventario, y la decisión de qué se queda es
de Karina y Rubén. Lo único que cambié en esta área fue agregar la **factura de
pedido personalizado** (4), que la junta pidió en la Situación 7.

## Relacionado: consentimiento de mensajes

La Situación 10 pedía revisar el consentimiento. Eso ya quedó, pero **solo para
SMS y WhatsApp**: ahora un cliente que responde STOP o BAJA deja de recibir
mensajes, en los dos idiomas, y queda registrado en el Studio.

**El correo no tiene equivalente.** Busqué `emailMarketing` en todo el
proyecto y aparece en un solo lugar: la ruta que guarda las preferencias de la
cuenta. Es decir:

- **Ningún correo lo consulta** antes de salir. Está en `true` para todos y no
  cambiaría nada si estuviera en `false`.
- **No hay pantalla donde apagarlo.** La API lo acepta, pero ningún componente
  lo muestra, así que el cliente no puede llegar a él.

El interruptor existe y no está conectado por ninguno de los dos lados. Para lo
transaccional da igual; para lo comercial es un hueco real de cumplimiento.

Hace falta decidir dos cosas antes de arreglarlo:

1. ¿Cuáles de los 15 cuentan como comerciales y deben respetar ese campo? Mi
   lectura: los 10, 11 y 15. Los demás son transaccionales y se mandan igual.
2. ¿Dónde lo apaga el cliente: en su cuenta, con un enlace en el correo, o los
   dos?

Con esas dos respuestas lo conecto.
