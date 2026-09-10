// Static blog content — no CMS. Each post carries both languages inline so
// the site's existing cookie-based locale (see lib/i18n/server.ts) can pick
// the right copy at render time without a client round-trip.

export type BlogKind = "producto" | "cultural" | "servicio" | "curioso";

export type BlogBlock =
  | { type: "p"; en: string; es: string }
  | { type: "h3"; en: string; es: string };

export type BlogPost = {
  slug: string;
  kind: BlogKind;
  /** Real Sanity category slug to pull a product photo from, or null for a generic header. */
  categorySlug: string | null;
  title: { en: string; es: string };
  scriptTag: { en: string; es: string };
  metaDescription: { en: string; es: string };
  keywords: { en: string[]; es: string[] };
  body: BlogBlock[];
  ctaHref: string;
  ctaLabel: { en: string; es: string };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "conchas-mexicanas-calgary",
    kind: "producto",
    categorySlug: "conchas",
    title: {
      en: "Mexican Conchas in Calgary: The Guide We Owed You",
      es: "Conchas mexicanas en Calgary: la guía que te íbamos a deber",
    },
    scriptTag: {
      en: "the bread that smells like Sunday at grandma's",
      es: "el pan que huele a domingo en casa de la abuela",
    },
    metaDescription: {
      en: "A complete guide to Mexican conchas in Calgary — what makes them authentic, the flavors Karyana Bakery carries, and where to buy them fresh in the city.",
      es: "Guía completa sobre las conchas mexicanas en Calgary: qué las hace auténticas, los sabores que maneja Karyana Bakery y dónde comprarlas frescas en la ciudad.",
    },
    keywords: {
      en: ["mexican conchas calgary", "mexican bakery calgary", "pan dulce calgary", "where to buy conchas calgary", "concha bread vanilla chocolate"],
      es: ["conchas mexicanas calgary", "panadería mexicana calgary", "pan dulce calgary", "dónde comprar conchas calgary", "concha de vainilla y chocolate"],
    },
    body: [
      { type: "p", en: "Ask anyone from a Mexican household what bread they miss most, and the answer is almost always the same: the concha. In Calgary, finding a genuinely authentic Mexican concha — fluffy inside, sweet and crackly on top — isn't always easy. At Karyana Bakery, we bake them the way they've always been made: slow-fermented dough, no shortcuts, and that signature seashell-patterned sugar topping the bread is named after.", es: "Si preguntas en cualquier casa mexicana cuál es el pan que más se extraña fuera de México, la respuesta casi siempre es la misma: la concha. En Calgary, encontrar una concha mexicana de verdad — esponjosa por dentro, con la costra crujiente y dulce por fuera — no siempre es fácil. Por eso en Karyana Bakery las horneamos como se han hecho siempre: masa fermentada lentamente, sin atajos, y esa clásica cubierta de azúcar en forma de concha de mar que le da su nombre." },
      { type: "h3", en: "What makes a concha authentic?", es: "¿Qué hace auténtica a una concha?" },
      { type: "p", en: "Texture is the real test. An authentic concha isn't just sweet bread with sugar on top — the shell topping (\"pasta\") should crack slightly when you bite in, while the bread underneath stays soft and lightly sweet. We use real butter and long proofing times, not shortcuts, to get that combination right.", es: "La textura es la prueba de fuego. Una concha auténtica no es un pan dulce cualquiera con azúcar encima: la costra (la \"pasta\") debe romperse ligeramente al morder, mientras que el pan de abajo se mantiene suave y ligeramente dulce. En Karyana usamos mantequilla real y tiempos de reposo largos, no acelerantes, para lograr esa combinación." },
      { type: "h3", en: "Flavors we carry", es: "Sabores que manejamos" },
      { type: "p", en: "Vanilla and chocolate are the everyday classics, and we rotate seasonal flavors like strawberry throughout the year. See the full lineup — with real photos and pricing — in our conchas category.", es: "Vainilla y chocolate son los clásicos de toda la vida, pero rotamos sabores de temporada como fresa y, en ciertas épocas del año, ediciones especiales. Puedes verlas todas —con foto real y precio— en nuestra categoría de conchas." },
      { type: "h3", en: "How to get them in Calgary", es: "Cómo conseguirlas en Calgary" },
      { type: "p", en: "We offer pickup and delivery across Calgary, with a free first delivery for SE Calgary. Order by the piece, or build a mixed box if your house has both vanilla and chocolate loyalists.", es: "Hacemos pickup y entrega dentro de Calgary, con envío gratis en el primer pedido para el sureste (SE) de la ciudad. Puedes ordenar por pieza o armar una caja mixta si en tu casa hay fans de la vainilla y del chocolate por igual." },
    ],
    ctaHref: "/category/conchas",
    ctaLabel: {
      en: "See the full concha menu at karyanabakery.ca/category/conchas",
      es: "Encuentra el menú completo de conchas en karyanabakery.ca/category/conchas",
    },
  },
  {
    slug: "pasteles-personalizados-calgary",
    kind: "producto",
    categorySlug: "cakes",
    title: {
      en: "Custom Cakes in Calgary: From Quinceañeras to Baby Showers",
      es: "Pasteles personalizados en Calgary: de quinceañeras a baby showers",
    },
    scriptTag: {
      en: "designed with you, not picked off a shelf",
      es: "el pastel se diseña contigo, no de un catálogo",
    },
    metaDescription: {
      en: "Custom cakes in Calgary for quinceañeras, birthdays, and baby showers. Starting at $85 CAD, your choice of flavors, and 72 hours notice with Karyana Bakery.",
      es: "Pasteles personalizados en Calgary para quinceañeras, cumpleaños y baby showers. Precios desde $85 CAD, sabores a elegir y 72 horas de anticipación con Karyana Bakery.",
    },
    keywords: {
      en: ["custom cakes calgary", "quinceañera cake calgary", "birthday cake calgary", "custom cake bakery calgary", "mexican custom cake"],
      es: ["pasteles personalizados calgary", "pastel de quinceañera calgary", "pastel de cumpleaños calgary", "panadería de pasteles calgary", "pastel mexicano personalizado"],
    },
    body: [
      { type: "p", en: "A cake from a catalog looks good in a photo. One designed around you — the colors of a quince dress, a baby shower theme, an inside joke for the birthday person — is the one people remember. Karyana Bakery has been making custom cakes in Calgary since 2018, and every one starts as a conversation, not a fixed mold.", es: "Un pastel de catálogo se ve bien en la foto. Uno diseñado contigo — con los colores del vestido de quince años, el tema del baby shower, o el chiste interno del cumpleañero — se recuerda. En Karyana Bakery hacemos pasteles personalizados en Calgary desde 2018, y cada uno empieza con una conversación, no con un molde fijo." },
      { type: "h3", en: "What occasions?", es: "¿Para qué ocasiones?" },
      { type: "p", en: "Quinceañeras, birthdays, baby showers, or just because. You don't need a big excuse — just tell us the theme, the flavors you like, and the date.", es: "Quinceañeras, cumpleaños, baby showers, o simplemente \"porque sí\". No necesitas una excusa grande: solo cuéntanos el tema, los sabores que te gustan y la fecha." },
      { type: "h3", en: "Pricing and timing", es: "Precio y tiempos" },
      { type: "p", en: "Custom cakes start at $85 CAD and need 72 hours notice so the design gets done right, without rushing.", es: "Los pasteles personalizados empiezan en $85 CAD y necesitan 72 horas de anticipación para que el diseño salga bien hecho, sin prisas ni atajos." },
      { type: "h3", en: "How to start", es: "Cómo empezar" },
      { type: "p", en: "It starts on our custom cake page, where you tell us your idea and we confirm availability for your date in Calgary.", es: "El proceso arranca en nuestra página de pastel personalizado, donde nos cuentas tu idea y te confirmamos disponibilidad para tu fecha en Calgary." },
    ],
    ctaHref: "/custom-cake",
    ctaLabel: {
      en: "Start your cake at karyanabakery.ca/custom-cake",
      es: "Empieza tu pastel en karyanabakery.ca/custom-cake",
    },
  },
  {
    slug: "churros-mexicanos-calgary",
    kind: "producto",
    categorySlug: "churros",
    title: {
      en: "Mexican Churros in Calgary: Crisp Outside, Soft Inside",
      es: "Churros mexicanos en Calgary: crujientes por fuera, suaves por dentro",
    },
    scriptTag: {
      en: "cinnamon, sugar, and a line worth standing in",
      es: "canela, azúcar, y una fila que vale la pena",
    },
    metaDescription: {
      en: "Looking for authentic Mexican churros in Calgary? Here's how Karyana Bakery makes them, and how to order for pickup or your next event.",
      es: "¿Buscas churros mexicanos auténticos en Calgary? Conoce cómo los prepara Karyana Bakery y cómo pedirlos para llevar o para tu próximo evento.",
    },
    keywords: {
      en: ["churros calgary", "mexican churros calgary", "where to buy churros calgary", "churros for events calgary", "cinnamon sugar churros"],
      es: ["churros en calgary", "churros mexicanos calgary", "dónde comprar churros calgary", "churros para eventos calgary", "churros con canela y azúcar"],
    },
    body: [
      { type: "p", en: "The perfect churro follows one simple rule: crisp outside, soft inside, and enough cinnamon to taste in the first bite. At Karyana Bakery we make ours fresh, with the classic cinnamon-sugar finish of a real Mexican churro — not the generic fair-food version.", es: "El churro perfecto tiene una regla simple: crujiente por fuera, suave por dentro, y suficiente canela para que se sienta en el primer bocado. En Karyana Bakery los hacemos frescos, con el toque clásico de azúcar y canela que se espera de un churro mexicano de verdad — no la versión genérica que se encuentra en cualquier feria." },
      { type: "h3", en: "Why is it hard to find that in Calgary?", es: "¿Por qué cuesta encontrarlos así en Calgary?" },
      { type: "p", en: "A good churro is served fresh; made hours ahead, it loses its crunch. That's why we prepare to order, so they reach your table — or your event — at their best.", es: "Un buen churro se sirve recién hecho; si se prepara con horas de anticipación, pierde el crujido. Por eso preparamos por pedido, para que lleguen a tu mesa —o a tu evento— en su mejor momento." },
      { type: "h3", en: "For pickup or for your event", es: "Para llevar o para tu evento" },
      { type: "p", en: "Order a few for a weekend craving, or a big batch for a posada, birthday, or family gathering. See the full lineup in our churros category.", es: "Puedes pedirlos individuales para antojo del fin de semana, o en cantidad para una posada, cumpleaños o reunión familiar. Revisa el menú completo en nuestra categoría de churros." },
    ],
    ctaHref: "/category/churros",
    ctaLabel: {
      en: "Order your churros at karyanabakery.ca/category/churros",
      es: "Pide tus churros en karyanabakery.ca/category/churros",
    },
  },
  {
    slug: "pan-dulce-tradicional-calgary",
    kind: "producto",
    categorySlug: "traditional-mexican-bread",
    title: {
      en: "Traditional Mexican Pan Dulce: A Guide for Calgary Locals",
      es: "Pan dulce tradicional mexicano: guía para quienes viven en Calgary",
    },
    scriptTag: {
      en: "from concha to oreja, without losing the flavor",
      es: "de la concha a la oreja, sin traducir el sabor",
    },
    metaDescription: {
      en: "A guide to traditional Mexican pan dulce for Calgary's community: the classic pieces, how they differ, and where to get them fresh every week.",
      es: "Guía de pan dulce tradicional mexicano para la comunidad de Calgary: qué piezas existen, en qué se diferencian, y dónde conseguirlas frescas cada semana.",
    },
    keywords: {
      en: ["traditional mexican bread calgary", "mexican bakery calgary", "types of pan dulce", "mexican bakery near me calgary", "mexican sweet bread calgary"],
      es: ["pan dulce tradicional mexicano", "panadería mexicana calgary", "tipos de pan dulce", "pan mexicano cerca de mí calgary", "orejas y cuernitos calgary"],
    },
    body: [
      { type: "p", en: "For anyone who grew up in Mexico, pan dulce isn't a craving — it's a routine: walk into the bakery, grab the tray and tongs, and build a mixed bag for the coffee table. That routine is easy to lose in Calgary if there's nowhere that sells the real thing. At Karyana Bakery, we keep that variety alive.", es: "Para quien creció en México, el pan dulce no es un antojo — es una rutina: pasar por la panadería, tomar la charola y las pinzas, y armar una bolsa variada para la mesa del café. En Calgary esa rutina se pierde fácil si no hay dónde encontrar pan de verdad. En Karyana Bakery mantenemos viva esa variedad." },
      { type: "h3", en: "Pieces you'll recognize", es: "Piezas que vas a reconocer" },
      { type: "p", en: "From conchas to orejas to seasonal pieces, the goal is for Calgary's Mexican community — and anyone falling in love with the tradition — to find the same spread they remember from home.", es: "Desde conchas y orejas hasta piezas de temporada, nuestra idea es que la comunidad mexicana (y quien se está enamorando de esta tradición) encuentre en Calgary el mismo surtido que recordaba de casa." },
      { type: "h3", en: "Fresh, not stockpiled", es: "Fresco, no de bodega" },
      { type: "p", en: "We bake in frequent small batches instead of producing large quantities to store, so what you order feels closer to \"straight out of the oven\" than \"off the shelf.\"", es: "Horneamos en lotes frecuentes en lugar de producir grandes cantidades para almacenar, así que lo que pides se parece más a \"recién salido del horno\" que a \"de anaquel\"." },
      { type: "h3", en: "Build your own bag", es: "Arma tu propia bolsa" },
      { type: "p", en: "Browse the full catalog in our complete menu and put together your ideal combination for the next coffee-table gathering.", es: "Puedes explorar todo el catálogo en nuestro menú completo y armar tu combinación ideal para la próxima sobremesa." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Build your pan dulce bag at karyanabakery.ca/shop",
      es: "Arma tu bolsa de pan dulce en karyanabakery.ca/shop",
    },
  },
  {
    slug: "membresia-panaderia-calgary",
    kind: "servicio",
    categorySlug: null,
    title: {
      en: "Bakery Membership in Calgary: How the Karyana Club Works",
      es: "Membresía de panadería en Calgary: cómo funciona el club Karyana",
    },
    scriptTag: {
      en: "fresh bread on your week, without having to remember to order",
      es: "pan fresco en tu semana, sin tener que acordarte de pedirlo",
    },
    metaDescription: {
      en: "A look at Karyana Bakery's membership tiers in Calgary — perks, access to exclusive items, and automatic weekly bread delivery for the Selecto and Legendario plans.",
      es: "Conoce los niveles de membresía de Karyana Bakery en Calgary: beneficios, acceso a productos exclusivos, y entrega semanal automática de pan para los planes Selecto y Legendario.",
    },
    keywords: {
      en: ["bakery membership calgary", "bread subscription calgary", "weekly bread delivery calgary", "mexican bakery club", "karyana membership benefits"],
      es: ["membresía de panadería calgary", "suscripción de pan calgary", "entrega semanal de pan calgary", "club de panadería mexicana", "beneficios membresía karyana"],
    },
    body: [
      { type: "p", en: "If pan dulce always disappears faster than expected at your house, Karyana Bakery's membership is built for exactly that: steady access, a few exclusive perks, and — at the top tiers — bread that shows up on its own, every week.", es: "Si en tu casa el pan dulce desaparece siempre más rápido de lo que crees, la membresía de Karyana Bakery está pensada para eso: acceso constante, algunos beneficios exclusivos, y —en los niveles más altos— pan que llega solo, cada semana." },
      { type: "h3", en: "The tiers", es: "Los niveles" },
      { type: "p", en: "The club runs through a few levels, from Básico up to Artesano, Selecto, and Legendario, each unlocking more as you go.", es: "El club tiene distintos escalones, desde el básico hasta Artesano, Selecto y Legendario, cada uno con más beneficios conforme subes." },
      { type: "h3", en: "Automatic weekly delivery", es: "Entrega semanal automática" },
      { type: "p", en: "From the Selecto tier up, you can turn on automatic weekly bread delivery and choose whether to repeat your last box, get a curated pick, or build it yourself each week.", es: "A partir del nivel Selecto puedes activar la entrega semanal automática de pan, y elegir si prefieres repetir tu última caja, una selección curada, o armarla tú mismo cada semana." },
      { type: "h3", en: "Is it worth it?", es: "¿Vale la pena?" },
      { type: "p", en: "If you already order often, yes — the perks are built for people who've made Karyana part of their week. See the full plans on memberships.", es: "Si ya ordenas seguido, sí — los beneficios están pensados para quien ya hizo de Karyana parte de su semana. Revisa los planes completos en membresías." },
    ],
    ctaHref: "/memberships",
    ctaLabel: {
      en: "Compare plans at karyanabakery.ca/memberships",
      es: "Compara los planes en karyanabakery.ca/memberships",
    },
  },
  {
    slug: "cajas-pan-dulce-eventos-calgary",
    kind: "producto",
    categorySlug: "boxes",
    title: {
      en: "Pan Dulce Gift & Party Boxes for Calgary Events and Offices",
      es: "Cajas de pan dulce para eventos y oficina en Calgary",
    },
    scriptTag: {
      en: "a good box solves half of the party planning",
      es: "una caja bonita resuelve la mitad de la fiesta",
    },
    metaDescription: {
      en: "Mexican pan dulce and pastry boxes for offices, posadas, and gatherings in Calgary. Order ahead and cross dessert off your event list.",
      es: "Cajas de pan dulce y pastelitos mexicanos para oficinas, posadas y reuniones en Calgary. Pide con anticipación y olvídate del postre del evento.",
    },
    keywords: {
      en: ["pan dulce gift box calgary", "mexican pastry box calgary", "mexican bakery catering calgary", "office treats calgary", "posada dessert box calgary"],
      es: ["caja de pan dulce calgary", "caja de pastelitos para eventos", "catering panadería mexicana calgary", "postres para oficina calgary", "pan dulce para posada calgary"],
    },
    body: [
      { type: "p", en: "There are two kinds of hosts: the one who assembles dessert piece by piece, and the one who orders a ready-made box. Karyana Bakery's boxes are for the second kind — a full, presentable spread so you don't have to think about dessert on the day of the event.", es: "Hay dos tipos de anfitrión: el que arma el postre pieza por pieza, y el que pide una caja ya lista. Las cajas de Karyana Bakery son para el segundo tipo — surtidas, presentables, y pensadas para que no tengas que pensar en el postre el día del evento." },
      { type: "h3", en: "For the office", es: "Para la oficina" },
      { type: "p", en: "A long meeting or a team Friday feels different with a mixed pan dulce box on the table. Great for recurring office orders across Calgary.", es: "Una junta larga o un viernes de equipo se sienten distintos con una caja de pan dulce variado en el centro de la mesa. Ideal para pedidos recurrentes de oficinas en Calgary." },
      { type: "h3", en: "For posadas and gatherings", es: "Para posadas y reuniones" },
      { type: "p", en: "During posada season, the larger boxes are among our most-ordered items — enough variety that nobody misses out on their favorite.", es: "En temporada de posadas, las cajas grandes son de las piezas más pedidas — suficiente variedad para que nadie se quede sin su favorito." },
      { type: "h3", en: "How to order", es: "Cómo pedir" },
      { type: "p", en: "The bigger the order, the more lead time helps. See the box options in our boxes catalog.", es: "Entre más grande el pedido, más anticipación conviene dar. Revisa las opciones de caja en nuestro catálogo de cajas." },
    ],
    ctaHref: "/category/boxes",
    ctaLabel: {
      en: "Build your box at karyanabakery.ca/category/boxes",
      es: "Arma tu caja en karyanabakery.ca/category/boxes",
    },
  },
  {
    slug: "karyana-eventos-mercados-calgary",
    kind: "servicio",
    categorySlug: null,
    title: {
      en: "Karyana Bakery at Calgary Events and Markets",
      es: "Karyana Bakery en eventos y mercados de Calgary",
    },
    scriptTag: {
      en: "sometimes the counter comes to the street",
      es: "a veces el mostrador sale a la calle",
    },
    metaDescription: {
      en: "Find out which Calgary events and markets you can catch Karyana Bakery at in person, and how to keep up with upcoming dates.",
      es: "Descubre en qué eventos y mercados de Calgary puedes encontrar a Karyana Bakery en persona, y cómo enterarte de las próximas fechas.",
    },
    keywords: {
      en: ["mexican bakery events calgary", "latin markets calgary", "mexican community events calgary", "karyana bakery events", "mexican bakery pop-up calgary"],
      es: ["panadería mexicana eventos calgary", "mercados latinos calgary", "eventos comunidad mexicana calgary", "karyana bakery eventos", "panadería mexicana en vivo calgary"],
    },
    body: [
      { type: "p", en: "Beyond pickup and delivery, part of being a Mexican bakery in Calgary means showing up where the community gathers — markets, fairs, and local events.", es: "Además del pickup y la entrega a domicilio, parte de lo que somos como panadería mexicana en Calgary es también estar presentes donde la comunidad se reúne — mercados, ferias, y eventos locales." },
      { type: "h3", en: "Why show up in person?", es: "¿Por qué presencia en eventos?" },
      { type: "p", en: "Ordering online is convenient, but meeting the people who bake your bread — and tasting it fresh, in front of you — is a different experience. We aim to be in the spaces where Calgary's Mexican and Latino community already gathers.", es: "Un pedido en línea es práctico, pero conocer a quien hornea tu pan —y probarlo recién hecho frente a ti— es otra experiencia. Buscamos estar en los espacios donde la comunidad mexicana y latina de Calgary ya se junta." },
      { type: "h3", en: "How to keep up with dates", es: "Cómo enterarte de las fechas" },
      { type: "p", en: "Upcoming appearances are posted on our events page, so that's the most current place to check if you want to find us in person.", es: "Las próximas apariciones se anuncian en nuestra página de eventos, así que si quieres encontrarnos en persona, esa es la fuente más actualizada." },
      { type: "h3", en: "Hosting an event?", es: "¿Organizas un evento?" },
      { type: "p", en: "If you're organizing a market, fair, or community event in Calgary and want to invite us, reach out through contact.", es: "Si organizas un mercado, feria o evento comunitario en Calgary y quieres invitarnos, puedes escribirnos desde contacto." },
    ],
    ctaHref: "/events",
    ctaLabel: {
      en: "Check upcoming dates at karyanabakery.ca/events",
      es: "Revisa las próximas fechas en karyanabakery.ca/events",
    },
  },
  {
    slug: "pan-de-muerto-calgary",
    kind: "cultural",
    categorySlug: null,
    title: {
      en: "Pan de Muerto in Calgary: Where to Find It for Your Ofrenda",
      es: "Pan de Muerto en Calgary: dónde encontrarlo para tu ofrenda",
    },
    scriptTag: {
      en: "sugar, orange blossom, and a memory in every slice",
      es: "azúcar, azahar, y un recuerdo en cada rebanada",
    },
    metaDescription: {
      en: "Traditional pan de muerto in Calgary for your Día de Muertos ofrenda. Orange-blossom flavor, available seasonally at Karyana Bakery.",
      es: "Pan de muerto tradicional en Calgary para tu ofrenda de Día de Muertos. Sabor a azahar, disponible por temporada en Karyana Bakery.",
    },
    keywords: {
      en: ["pan de muerto calgary", "day of the dead bakery calgary", "where to buy pan de muerto calgary", "dia de los muertos ofrenda calgary", "traditional pan de muerto"],
      es: ["pan de muerto calgary", "día de muertos panadería calgary", "dónde comprar pan de muerto calgary", "ofrenda día de muertos calgary", "pan de muerto tradicional"],
    },
    body: [
      { type: "p", en: "Every year, in late October, one question keeps coming up in Calgary's Mexican community: \"where can I get pan de muerto?\" At Karyana Bakery we bake it seasonally, with the classic orange-blossom flavor and the sugar topping that belongs on every ofrenda.", es: "Cada año, a finales de octubre, hay una pregunta que se repite entre la comunidad mexicana en Calgary: \"¿dónde consigo pan de muerto?\" En Karyana Bakery lo horneamos por temporada, con la clásica esencia de azahar y el copete de azúcar que no puede faltar en la ofrenda." },
      { type: "h3", en: "More than a tradition, a memory", es: "Más que una tradición, un recuerdo" },
      { type: "p", en: "Pan de muerto isn't just a seasonal bread — for many, it's the piece that connects an ofrenda in Calgary to the one set up back home in Mexico.", es: "El pan de muerto no es solo un pan de temporada: para muchos es la pieza que conecta la ofrenda en Calgary con la que se pone en casa de la familia en México." },
      { type: "h3", en: "Limited availability", es: "Disponibilidad limitada" },
      { type: "p", en: "Since it's seasonal, availability is limited to the weeks around November 1st and 2nd — it's worth ordering ahead.", es: "Como es un producto de temporada, la disponibilidad es limitada a las semanas cercanas al 1 y 2 de noviembre — vale la pena ordenar con anticipación." },
      { type: "h3", en: "How to order", es: "Cómo pedirlo" },
      { type: "p", en: "Follow our socials and the shop near late October to reserve yours before it sells out.", es: "Sigue nuestras redes y la tienda cerca de finales de octubre para apartar el tuyo antes de que se agote." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Check seasonal availability at karyanabakery.ca/shop",
      es: "Revisa disponibilidad de temporada en karyanabakery.ca/shop",
    },
  },
  {
    slug: "rosca-de-reyes-calgary",
    kind: "cultural",
    categorySlug: null,
    title: {
      en: "Rosca de Reyes in Calgary: Where to Order for January 6th",
      es: "Rosca de Reyes en Calgary: dónde pedirla para el 6 de enero",
    },
    scriptTag: {
      en: "the hidden figurine comes with a commitment — and good bread",
      es: "la figura del niño trae compromiso — y buen pan",
    },
    metaDescription: {
      en: "Rosca de Reyes and Mexican holiday bread in Calgary. Reserve early for Three Kings Day with Karyana Bakery.",
      es: "Rosca de Reyes y pan navideño mexicano en Calgary. Reserva con tiempo para el Día de Reyes con Karyana Bakery.",
    },
    keywords: {
      en: ["rosca de reyes calgary", "mexican christmas bread calgary", "where to buy rosca de reyes calgary", "three kings day calgary", "mexican bakery christmas calgary"],
      es: ["rosca de reyes calgary", "pan navideño mexicano calgary", "dónde comprar rosca de reyes calgary", "día de reyes calgary", "panadería mexicana navidad calgary"],
    },
    body: [
      { type: "p", en: "January 6th doesn't feel the same without rosca, even in Calgary. At Karyana Bakery we make rosca de reyes seasonally, following the traditional recipe — candied fruit, the right texture, and yes, the little figurines hidden inside.", es: "El 6 de enero sin rosca no se siente igual, ni siquiera en Calgary. En Karyana Bakery preparamos rosca de reyes por temporada, siguiendo la receta tradicional — fruta cristalizada, la textura correcta, y sí, las figuritas escondidas adentro." },
      { type: "h3", en: "Why reserve ahead", es: "Por qué reservar con tiempo" },
      { type: "p", en: "Demand concentrates in just a few days around January 6th, so roscas sell out fast. Reserving ahead is the only way to guarantee one.", es: "La demanda se concentra en pocos días alrededor del 6 de enero, así que las roscas se agotan rápido. Reservar con anticipación es la única forma de asegurarla." },
      { type: "h3", en: "Sizes for family or the office", es: "Tamaños para la familia o la oficina" },
      { type: "p", en: "We offer different sizes, from small gatherings to a full office cutting rosca together.", es: "Manejamos distintos tamaños, desde reuniones pequeñas hasta la oficina completa partiendo rosca junta." },
      { type: "h3", en: "How to reserve", es: "Cómo reservar" },
      { type: "p", en: "Check availability and reserve yours through the shop or reach us via contact.", es: "Revisa disponibilidad y aparta la tuya desde la tienda o escríbenos por contacto." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Reserve your rosca at karyanabakery.ca/shop",
      es: "Reserva tu rosca en karyanabakery.ca/shop",
    },
  },
  {
    slug: "entrega-pan-mexicano-se-calgary",
    kind: "servicio",
    categorySlug: null,
    title: {
      en: "Mexican Bakery Delivery in SE Calgary: What to Know",
      es: "Entrega de pan mexicano en el sureste de Calgary: lo que debes saber",
    },
    scriptTag: {
      en: "your first order to SE Calgary is on the house",
      es: "tu primer pedido al SE de Calgary, va por la casa",
    },
    metaDescription: {
      en: "Everything about Karyana Bakery's home delivery in SE Calgary — free first delivery, timing, and how to order.",
      es: "Todo sobre la entrega a domicilio de Karyana Bakery en el sureste de Calgary: primer envío gratis, tiempos, y cómo pedir.",
    },
    keywords: {
      en: ["mexican bread delivery se calgary", "mexican bakery delivery calgary", "bread delivery near me calgary", "mexican bakery near me calgary", "free first delivery calgary"],
      es: ["entrega pan mexicano se calgary", "domicilio panadería mexicana calgary", "envío de pan a domicilio calgary", "panadería mexicana cerca de mí", "entrega gratis primer pedido calgary"],
    },
    body: [
      { type: "p", en: "If you live in SE Calgary, your first order with Karyana Bakery includes free home delivery — no code, no fine print, just order and receive it at your door.", es: "Si vives en el sureste (SE) de Calgary, tu primer pedido con Karyana Bakery incluye entrega gratis a domicilio — sin necesidad de código ni letras chiquitas, solo pedir y recibir en la puerta." },
      { type: "h3", en: "How does delivery work?", es: "¿Cómo funciona la entrega?" },
      { type: "p", en: "Pick your items in the shop, choose delivery at checkout, and we confirm the closest available time slot for your area.", es: "Eliges tus productos en la tienda, seleccionas entrega en el checkout, y confirmamos el horario disponible más cercano a tu zona." },
      { type: "h3", en: "What if I'm not in SE Calgary?", es: "¿Y si no vivo en el SE?" },
      { type: "p", en: "We also offer pickup and delivery in other parts of Calgary; cost and availability show directly at checkout based on your address.", es: "También hacemos pickup y entrega en otras zonas de Calgary; el costo y disponibilidad se muestran directamente en el checkout según tu dirección." },
      { type: "h3", en: "For recurring orders", es: "Para pedidos recurrentes" },
      { type: "p", en: "If you order often, a membership with automatic weekly delivery can save you the step of ordering every time.", es: "Si ordenas seguido, la membresía con entrega semanal automática puede ahorrarte el paso de pedir cada vez." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Start your order at karyanabakery.ca/shop",
      es: "Empieza tu pedido en karyanabakery.ca/shop",
    },
  },
  {
    slug: "guia-pan-dulce-nombres-calgary",
    kind: "curioso",
    categorySlug: "traditional-mexican-bread",
    title: {
      en: "Mexican Pan Dulce 101: A Field Guide to the Shapes and Names",
      es: "Pan dulce 101: guía de campo para reconocer cada pieza (y su nombre)",
    },
    scriptTag: {
      en: "point and say the name — you'll sound like a regular by piece three",
      es: "señala y di el nombre — para la tercera pieza ya suenas de la casa",
    },
    metaDescription: {
      en: "New to Mexican pan dulce? A friendly, no-shame field guide to the shapes and names you'll see at Karyana Bakery in Calgary — conchas, orejas, cuernos, and more.",
      es: "¿Nuevo en el pan dulce mexicano? Una guía de campo sin pena para reconocer las formas y nombres que vas a ver en Karyana Bakery en Calgary — conchas, orejas, cuernos y más.",
    },
    keywords: {
      en: ["mexican pan dulce guide", "types of pan dulce explained", "concha oreja cuerno names", "mexican sweet bread 101", "mexican bakery calgary guide"],
      es: ["guía de pan dulce", "nombres del pan dulce mexicano", "concha oreja cuerno significado", "tipos de pan dulce explicados", "panadería mexicana calgary guía"],
    },
    body: [
      { type: "p", en: "Walk into a Mexican bakery for the first time and the tray-and-tongs system can feel like a pop quiz: dozens of shapes, zero labels, and a line building behind you. Here's the cheat sheet nobody hands you at the door — so next time you can point with confidence.", es: "Entrar por primera vez a una panadería mexicana con charola y pinzas se siente como examen sorpresa: decenas de formas, ningún letrero, y una fila creciendo detrás de ti. Aquí está la chuleta que nadie te da en la puerta — para que la próxima vez señales con confianza." },
      { type: "h3", en: "The concha (\"shell\")", es: "La concha" },
      { type: "p", en: "The icon. Soft bread topped with a sugar-paste shell pattern, usually vanilla or chocolate. If you only learn one name, make it this one.", es: "La reina del mostrador. Pan suave con una pasta de azúcar encima marcada en forma de concha, normalmente de vainilla o chocolate. Si solo aprendes un nombre, que sea este." },
      { type: "h3", en: "The oreja (\"ear\")", es: "La oreja" },
      { type: "p", en: "Flaky, caramelized, and shaped like a heart or a butterfly — puff pastry with a crunchy, sugar-glazed shell. Related to what you might know as a palmier.", es: "Hojaldrada, caramelizada, con forma de corazón o mariposa — hojaldre con una costra crujiente y acaramelada. Es prima del \"palmier\" francés." },
      { type: "h3", en: "The cuerno (\"horn\")", es: "El cuerno" },
      { type: "p", en: "Shaped like a crescent, denser than a French croissant, lightly sweet. A safe pick if you want something familiar-but-not-quite.", es: "Con forma de medialuna, más denso que un croissant francés, ligeramente dulce. Es tu opción segura si quieres algo que se siente conocido pero distinto." },
      { type: "h3", en: "The garibaldi", es: "El garibaldi" },
      { type: "p", en: "A light sponge cake soaked in glaze and covered in rainbow sprinkles. Looks like a party. Tastes like one too.", es: "Un pan esponjoso bañado en glaseado y cubierto de chispas de colores. Se ve como fiesta. Sabe como fiesta." },
      { type: "h3", en: "The polvorón", es: "El polvorón" },
      { type: "p", en: "Shortbread-like, crumbly, and dusted in sugar — this one disintegrates a little in your hand, and that's completely normal.", es: "Tipo mantecada, quebradizo, espolvoreado de azúcar — se desmorona un poco en la mano, y eso es totalmente normal." },
      { type: "p", en: "Now that you can name what you're pointing at, see which of these Karyana actually has in stock this week in our shop.", es: "Ahora que ya puedes nombrar lo que señalas, checa cuáles tiene Karyana disponibles esta semana en la tienda." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Match names to real photos at karyanabakery.ca/shop",
      es: "Compara nombres con fotos reales en karyanabakery.ca/shop",
    },
  },
  {
    slug: "mitos-panaderia-mexicana",
    kind: "curioso",
    categorySlug: "conchas",
    title: {
      en: "5 Myths About Mexican Bakeries We're Happy to Debunk",
      es: "5 mitos sobre la panadería mexicana que hay que dejar de creer",
    },
    scriptTag: {
      en: "no, it's not \"just doughnuts with extra steps\"",
      es: "no, no es \"solo dona con pasos extra\"",
    },
    metaDescription: {
      en: "From \"it's all the same dough\" to \"it's only bread\" — we're clearing up the most common myths about Mexican bakeries, Karyana-style.",
      es: "Desde \"es la misma masa nomás con otra forma\" hasta \"solo hacen pan\" — aclaramos los mitos más comunes sobre la panadería mexicana, a la Karyana.",
    },
    keywords: {
      en: ["mexican bakery myths", "authentic mexican bakery calgary", "mexican pastry facts", "is pan dulce sweet", "mexican bakery vs regular bakery"],
      es: ["mitos panadería mexicana", "panadería mexicana auténtica calgary", "datos sobre pan dulce", "pan dulce es muy dulce", "diferencia panadería mexicana"],
    },
    body: [
      { type: "p", en: "Every cuisine collects a few myths from people who've never really sat down with it. Mexican bakeries have picked up their share. Let's clear the mostrador.", es: "Toda cocina acumula mitos de gente que nunca se sentó de verdad a probarla. La panadería mexicana también tiene los suyos. Vamos a limpiar el mostrador." },
      { type: "h3", en: "Myth 1: \"It's basically doughnuts\"", es: "Mito 1: \"Es básicamente dona\"" },
      { type: "p", en: "Pan dulce is actually less sugary than most North American pastry, on average. The sweetness sits mostly on top (a glaze, a sugar shell), while the bread itself stays mild — which is exactly why it pairs so well with a strong coffee.", es: "El pan dulce, en promedio, es menos dulce que la mayoría de la repostería norteamericana. Lo dulce vive arriba (un glaseado, una costra de azúcar), mientras el pan de abajo se mantiene sobrio — por eso combina tan bien con un café fuerte." },
      { type: "h3", en: "Myth 2: \"It's all the same dough, just shaped differently\"", es: "Mito 2: \"Es la misma masa, solo con otra forma\"" },
      { type: "p", en: "A concha, a puff-pastry oreja, and a choux-pastry churro have almost nothing in common at the dough level. Different fats, different fermentation, different techniques entirely.", es: "Una concha, una oreja de hojaldre, y un churro de masa choux casi no comparten nada a nivel de masa. Diferentes grasas, diferente fermentación, técnicas completamente distintas." },
      { type: "h3", en: "Myth 3: \"Mexican bakeries only do bread\"", es: "Mito 3: \"Las panaderías mexicanas solo hacen pan\"" },
      { type: "p", en: "Custom cakes for quinceañeras and birthdays are a full craft of their own — ask anyone who's ordered one for a 15-year-old's big day.", es: "Los pasteles personalizados para quinceañeras y cumpleaños son un oficio aparte — pregúntale a cualquiera que haya pedido uno para los quince de su hija." },
      { type: "h3", en: "Myth 4: \"You can't get the real thing outside Mexico\"", es: "Mito 4: \"No se consigue lo auténtico fuera de México\"" },
      { type: "p", en: "It takes the right recipe and zero shortcuts, not a specific zip code. Slow fermentation and real butter travel just fine.", es: "Lo que se necesita es la receta correcta y cero atajos, no un código postal específico. La fermentación lenta y la mantequilla real viajan bastante bien." },
      { type: "h3", en: "Myth 5: \"It's a breakfast-only food\"", es: "Mito 5: \"Es comida de solo desayuno\"" },
      { type: "p", en: "Pan dulce shows up at breakfast, at the 6pm merienda, and at 11pm when someone's craving hits. There's no clock on it.", es: "El pan dulce aparece en el desayuno, en la merienda de las 6pm, y a las 11pm cuando pega el antojo. No tiene horario." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Taste the difference at karyanabakery.ca/shop",
      es: "Prueba la diferencia en karyanabakery.ca/shop",
    },
  },
  {
    slug: "tradiciones-pan-dulce-cafe",
    kind: "curioso",
    categorySlug: "conchas",
    title: {
      en: "Why Mexicans Dunk Their Pan Dulce (And Other Sweet Bread Habits)",
      es: "Por qué remojamos el pan dulce en el café (y otras costumbres que nadie explica)",
    },
    scriptTag: {
      en: "some traditions were never written down — they were just always true",
      es: "hay costumbres que nunca se explican — solo se heredan",
    },
    metaDescription: {
      en: "The dunking, the pinch on top of the concha, the 6pm merienda — a look at the small rituals around Mexican pan dulce, and why they matter.",
      es: "El remojado, el pellizco a la concha antes de comerla, la merienda de las 6pm — un vistazo a los pequeños rituales alrededor del pan dulce mexicano, y por qué importan.",
    },
    keywords: {
      en: ["pan dulce traditions", "why dunk bread in coffee mexican", "mexican merienda tradition", "pan y cafe culture", "mexican bakery rituals"],
      es: ["tradiciones del pan dulce", "por qué se remoja el pan en café", "la merienda mexicana", "costumbre pan y café", "rituales panadería mexicana"],
    },
    body: [
      { type: "p", en: "Nobody teaches you to dunk your concha in coffee — you just absorb it, usually from watching an abuela do it without even looking down. Pan dulce comes with habits nobody wrote a manual for, and most of them are worth knowing.", es: "Nadie te enseña a remojar la concha en el café — simplemente lo aprendes, casi siempre viendo a una abuela hacerlo sin ni siquiera mirar hacia abajo. El pan dulce trae consigo costumbres que nadie puso en un manual, y la mayoría vale la pena conocerlas." },
      { type: "h3", en: "The dunk", es: "El remojo" },
      { type: "p", en: "Coffee or hot chocolate softens the crumb just enough without dissolving it — the goal is a bite that's warm all the way through, not soup. It takes a little practice to find the exact second.", es: "El café o el chocolate suavizan la miga justo lo necesario sin deshacerla — la meta es un bocado calientito por dentro, no una sopa. Encontrar el segundo exacto toma algo de práctica." },
      { type: "h3", en: "The pinch on top of the concha", es: "El pellizco a la concha" },
      { type: "p", en: "Plenty of people break off the sugary shell pattern first and eat it separately before touching the bread underneath. There's no official rule — it's just a very common personal ritual.", es: "Mucha gente arranca primero el diseño de azúcar de encima y se lo come aparte antes de tocar el pan de abajo. No hay regla oficial — es solo un ritual personal muy común." },
      { type: "h3", en: "The 6pm merienda", es: "La merienda de las 6pm" },
      { type: "p", en: "Not quite dinner, not quite a snack — the merienda is its own meal: bread, a hot drink, and usually the whole family at the table. It's less about the food and more about everyone stopping at the same time.", es: "No es cena, no es solo antojo — la merienda es su propia comida: pan, algo caliente de tomar, y normalmente toda la familia en la mesa. Es menos sobre la comida y más sobre que todos se detienen a la misma hora." },
      { type: "h3", en: "Sharing the bag", es: "Compartir la bolsa" },
      { type: "p", en: "A mixed bag of pan dulce is built for sharing — one bag, several people, and an unwritten rule that you don't take the last piece without asking.", es: "Una bolsa surtida de pan dulce está hecha para compartir — una bolsa, varias personas, y una regla no escrita de que no te llevas la última pieza sin preguntar." },
    ],
    ctaHref: "/shop",
    ctaLabel: {
      en: "Build a bag worth sharing at karyanabakery.ca/shop",
      es: "Arma una bolsa digna de compartir en karyanabakery.ca/shop",
    },
  },
  {
    slug: "cafe-de-olla-vs-chocolate-caliente",
    kind: "curioso",
    categorySlug: "churros",
    title: {
      en: "Café de Olla vs. Hot Chocolate: What Actually Pairs With Your Pan Dulce",
      es: "Café de olla vs. chocolate caliente: qué va mejor con cada pan",
    },
    scriptTag: {
      en: "the real debate isn't coffee vs. chocolate — it's which bread you're holding",
      es: "el verdadero debate no es café o chocolate — es qué pan traes en la mano",
    },
    metaDescription: {
      en: "Café de olla or Mexican hot chocolate? A practical pairing guide for what to drink with conchas, churros, and the rest of Karyana Bakery's menu.",
      es: "¿Café de olla o chocolate caliente? Una guía práctica de qué tomar con conchas, churros, y el resto del menú de Karyana Bakery.",
    },
    keywords: {
      en: ["cafe de olla vs hot chocolate", "what to drink with pan dulce", "mexican hot chocolate calgary", "best pairing for churros", "cafe de olla recipe origin"],
      es: ["café de olla vs chocolate caliente", "qué tomar con pan dulce", "chocolate caliente mexicano calgary", "mejor bebida para churros", "qué es el café de olla"],
    },
    body: [
      { type: "p", en: "Two drinks show up at almost every Mexican table with bread: café de olla, brewed with cinnamon and piloncillo in a clay pot, and hot chocolate, whipped frothy with a wooden molinillo. Both are correct. The real question is which bread you're about to eat.", es: "Dos bebidas aparecen en casi toda mesa mexicana con pan: el café de olla, hervido con canela y piloncillo en una olla de barro, y el chocolate caliente, batido con un molinillo hasta espumar. Las dos son correctas. La verdadera pregunta es qué pan estás por comerte." },
      { type: "h3", en: "Café de olla wins with: conchas, cuernos, polvorones", es: "El café de olla gana con: conchas, cuernos, polvorones" },
      { type: "p", en: "Anything mild and slightly sweet lets the cinnamon-and-piloncillo edge of café de olla come through instead of getting drowned out.", es: "Todo lo suave y ligeramente dulce deja que resalte el toque de canela y piloncillo del café de olla, en lugar de opacarlo." },
      { type: "h3", en: "Hot chocolate wins with: churros, garibaldis, anything glazed", es: "El chocolate caliente gana con: churros, garibaldis, todo lo glaseado" },
      { type: "p", en: "Churros and hot chocolate is the pairing that needs no introduction — the crunch and the cinnamon sugar practically ask for it. Anything already glazed or frosted plays well here too; the richness matches instead of competing.", es: "Churros con chocolate caliente es la pareja que no necesita presentación — el crujido y la canela con azúcar prácticamente lo piden. Todo lo que ya trae glaseado o betún también combina bien aquí; la riqueza empareja en lugar de competir." },
      { type: "h3", en: "The tiebreaker: temperature outside", es: "El desempate: la temperatura de afuera" },
      { type: "p", en: "This is Calgary, so let's be honest — on a −20°C day, the drink that wins is whichever one is hottest when it reaches your hands.", es: "Estamos en Calgary, seamos honestos — en un día de −20°C, gana la bebida que llegue más caliente a tus manos." },
      { type: "p", en: "See what's in stock this week and build your own pairing.", es: "Revisa qué hay disponible esta semana y arma tu propia combinación." },
    ],
    ctaHref: "/category/churros",
    ctaLabel: {
      en: "Start with churros at karyanabakery.ca/category/churros",
      es: "Empieza por los churros en karyanabakery.ca/category/churros",
    },
  },
  {
    slug: "sobrevivir-invierno-calgary-pan-dulce",
    kind: "curioso",
    categorySlug: null,
    title: {
      en: "Surviving a Calgary Winter With a Pan Dulce Craving",
      es: "Cómo sobrevivir el invierno de Calgary con antojo de pan dulce",
    },
    scriptTag: {
      en: "−25°C outside, concha and coffee inside — that's the whole strategy",
      es: "−25°C afuera, concha y café adentro — esa es toda la estrategia",
    },
    metaDescription: {
      en: "A survival guide for anyone missing home flavors during a Calgary winter — how a weekly bag of pan dulce makes the cold a little more bearable.",
      es: "Una guía de supervivencia para quien extraña los sabores de casa en pleno invierno de Calgary — cómo una bolsa semanal de pan dulce hace más llevadero el frío.",
    },
    keywords: {
      en: ["mexican comfort food calgary winter", "pan dulce craving calgary", "mexican bakery calgary winter", "latino community calgary", "warm bread delivery calgary"],
      es: ["comida mexicana consuelo calgary invierno", "antojo de pan dulce calgary", "panadería mexicana calgary invierno", "comunidad latina calgary", "entrega de pan caliente calgary"],
    },
    body: [
      { type: "p", en: "Nobody warns you about the specific kind of homesickness that shows up at −25°C. It's not big — it's small and oddly specific, like suddenly needing the smell of warm bread and cinnamon more than anything else in the world.", es: "Nadie te avisa sobre ese tipo de nostalgia tan específica que aparece a −25°C. No es grande — es pequeña y rarísimamente concreta, como necesitar de repente el olor a pan calientito y canela más que cualquier otra cosa en el mundo." },
      { type: "h3", en: "Step 1: Accept that the craving is real", es: "Paso 1: acepta que el antojo es real" },
      { type: "p", en: "It's not nostalgia being dramatic. Comfort food is doing exactly its job — reminding your body of somewhere warmer, literally and otherwise.", es: "No es la nostalgia siendo dramática. La comida de consuelo está haciendo exactamente su trabajo — recordarle a tu cuerpo un lugar más cálido, literal y de otras formas." },
      { type: "h3", en: "Step 2: Don't wait for a special occasion", es: "Paso 2: no esperes una ocasión especial" },
      { type: "p", en: "A random Tuesday with -30°C windchill is occasion enough for a concha and hot coffee. You don't need a holiday to justify it.", es: "Un martes cualquiera con sensación térmica de -30°C ya es ocasión suficiente para una concha y un café caliente. No necesitas una fecha especial para justificarlo." },
      { type: "h3", en: "Step 3: Stock up before the cold snap", es: "Paso 3: abastécete antes de la ola de frío" },
      { type: "p", en: "The days you least want to leave the house are exactly the days you'll want bread in the freezer. Ordering ahead — or turning on weekly delivery through the membership — solves this before it becomes a problem.", es: "Los días en que menos quieres salir de casa son justo los días en que vas a querer pan en el congelador. Pedir con anticipación —o activar la entrega semanal con la membresía— resuelve esto antes de que se vuelva problema." },
      { type: "h3", en: "Step 4: Find your community", es: "Paso 4: encuentra tu comunidad" },
      { type: "p", en: "Calgary's Mexican and Latino community is bigger than it feels on the coldest days. Karyana shows up at local markets and events throughout the year — sometimes the best remedy for homesickness is standing next to someone who gets it.", es: "La comunidad mexicana y latina de Calgary es más grande de lo que se siente en los días más fríos. Karyana aparece en mercados y eventos locales durante el año — a veces el mejor remedio para la nostalgia es estar junto a alguien que te entiende." },
    ],
    ctaHref: "/memberships",
    ctaLabel: {
      en: "Never run out mid-winter — see memberships at karyanabakery.ca/memberships",
      es: "Que nunca se te acabe a media temporada — ve las membresías en karyanabakery.ca/memberships",
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export const BLOG_KIND_LABEL: Record<BlogKind, { en: string; es: string }> = {
  producto: { en: "Product", es: "Producto" },
  cultural: { en: "Seasonal", es: "Temporada" },
  servicio: { en: "Service", es: "Servicio" },
  curioso: { en: "Fun facts", es: "Curiosidades" },
};
