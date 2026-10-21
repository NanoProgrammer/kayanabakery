/**
 * The print queue's own GROQ, kept out of the route so a test can run the
 * exact string the printer runs.
 *
 * Drafts are why this file exists. Studio saves a draft on the first keystroke,
 * and `*[...]` read through a token-authenticated client includes drafts, so a
 * half-typed custom order was handed to the printer the moment the customer's
 * name was typed — and then stamped as printed, which meant the finished order
 * never printed at all. Only a published document is an order.
 *
 * Content releases are excluded for the same reason: a `versions.*` document is
 * a scheduled edit, not something the kitchen should be making.
 */
export const MANUAL_ORDERS_QUERY = `*[_type == "order"
    && !defined(prismaId)
    && !defined(printedAt)
    && !(_id in path("drafts.**"))
    && !(_id in path("versions.**"))
    && defined(createdAt)
    && createdAt >= $since]
   | order(createdAt asc) [0...25] {
     _id, orderNumber, customerName, fulfillmentType, pickupDate, createdAt
   }`;

/**
 * Manual orders carrying a printedAt — used by `npm run print:stuck`.
 *
 * Drafts are deliberately NOT filtered out here: a draft holding a printedAt is
 * the damage left by the bug above, and the point of the listing is to find it
 * before the order is published and the stamp goes with it. Read it through a
 * client with no perspective, or drafts are invisible and the listing is a lie.
 */
export const STAMPED_MANUAL_ORDERS_QUERY = `*[_type == "order"
    && !defined(prismaId)
    && defined(printedAt)]
   | order(createdAt desc) [0...50] {
     _id, orderNumber, customerName, createdAt, printedAt
   }`;

/**
 * One manual order, found by document id or by the order number the kitchen
 * reads off the screen. The draft of a given id is matched too, so an order
 * can be unstuck before it is published as well as after.
 */
export const MANUAL_ORDER_BY_REF_QUERY = `*[_type == "order"
    && !defined(prismaId)
    && (_id == $ref || orderNumber == $ref || _id == "drafts." + $ref)]
   [0...10] {
     _id, orderNumber, customerName, createdAt, printedAt
   }`;
