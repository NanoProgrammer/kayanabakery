import { PrismaClient } from "/home/user/kayanabakery/node_modules/@prisma/client/default.js";
const prisma = new PrismaClient();
const u = await prisma.user.create({ data: { email: "joan@example.com", name: "Joan Molina", phone: "+14035550123" } });
// A pickup order placed yesterday, still open, with both texts queued at Twilio —
// exactly the shape the old checkout left behind.
await prisma.order.create({ data: {
  orderNumber: "KAR-202610-WMZGY", userId: u.id,
  status: "IN_PROGRESS", paymentStatus: "PAID", fulfillmentType: "PICKUP",
  pickupDate: new Date(Date.now() + 864e5), pickupTime: "10:00 AM - 12:00 PM",
  items: [{ productId: "p1", name: "Concha", quantity: 6, price: 600 }],
  subtotal: 3600, gst: 180, total: 3780,
  readyMsgSid: "SM_fake_ready_1", completedMsgSid: "SM_fake_done_1",
}});
console.log("seeded Joan's order");
await prisma.$disconnect();
