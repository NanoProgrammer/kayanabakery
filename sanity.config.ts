import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { karyanaStructure } from "./sanity/structure";

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
});
