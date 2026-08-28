import { defineConfig } from "sanity";
import { deskTool as structureTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { karyanaStructure } from "./sanity/structure";
import { printPackingSlipAction } from "./sanity/structure/actions/printPackingSlip";

export default defineConfig({
  name: "default",
  title: "Karyana Bakery",
  basePath: "/studio",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",

  plugins: [
    structureTool({
      structure: karyanaStructure,
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) =>
      context.schemaType === "order"
        ? [...prev, printPackingSlipAction]
        : prev,
  },
});
