// ── Manual Page Types ──────────────────────────────────────────────

export type PageType =
  | "prose_procedure"
  | "spec_table"
  | "flowchart"
  | "parts_diagram"
  | "index_toc"
  | "wiring_diagram"
  | "component_photo"
  | "cover"
  | "section_divider"
  | "blank";

// ── Figure & Page-Level Types ─────────────────────────────────────

export interface FigureDetected {
  fig_id: string;
  ref_code: string | null;
  type: string;
  description: string;
  bbox_percent: number[];
  associated_step: string | null;
}

export interface Continuation {
  continues_from: string | null;
  continues_to: string | null;
}

export interface ToolReference {
  part_number: string;
  name: string;
  usage: string;
}

export interface UncertainValue {
  field: string;
  value: string;
  reason: string;
}

export interface ExtractionMeta {
  model?: string;
  pass?: number;
  confidence?: string;
  uncertain_values?: UncertainValue[];
}

// ── Content Block Types ────────────────────────────────────────────

export interface HeadingBlock {
  block_type: "heading";
  level?: number;
  text: string;
}

export type ProseStyle = "normal" | "note" | "caution" | "warning" | "important";

export interface ProseBlock {
  block_type: "prose";
  text: string;
  style: ProseStyle;
}

export interface SpecItem {
  label: string;
  value: string;
  unit: string | null;
  condition: string | null;
}

export interface SpecsBlock {
  block_type: "specs";
  items: SpecItem[];
}

export interface ProcedureStep {
  step: number | string;
  text: string;
  figure_ref?: string | null;
  warnings?: string[];
  notes?: string[];
  substeps?: ProcedureStep[];
}

export interface ProcedureMethod {
  id: string;
  label: string;
  steps: (string | ProcedureStep)[];
}

export interface ProcedureBlock {
  block_type: "procedure";
  id?: string;
  title?: string;
  steps?: (string | ProcedureStep)[];
  methods?: ProcedureMethod[];
}

export interface FlowchartNode {
  id: string;
  type: "start" | "action" | "decision" | "terminal" | "reference";
  text: string;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string | null;
}

export interface FlowchartBlock {
  block_type: "flowchart";
  title?: string;
  diagram_id?: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  legend?: Record<string, string> | { symbol: string; meaning: string }[];
}

export interface TableColumn {
  key: string;
  label: string;
  type?: string;
}

export interface TableBlock {
  block_type: "table";
  title?: string;
  columns: TableColumn[];
  rows: Record<string, string | boolean | number>[];
  legend?: Record<string, string> | string | { symbol: string; meaning: string }[];
}

export interface CalloutItem {
  label: string;
  position: string;
}

export interface ComponentLocationBlock {
  block_type: "component_location";
  description?: string;
  ref_figure?: string;
  callouts?: CalloutItem[];
}

export interface PartItem {
  number?: number;
  name: string;
  note: string | null;
}

export interface PartsDiagramBlock {
  block_type: "parts_diagram";
  description?: string;
  ref_figure?: string;
  diagram_image?: string;
  parts: PartItem[];
}

export interface WireComponent {
  id: string;
  name: string;
  type: string;
}

export interface Wire {
  from: string | { component: string; pin?: string };
  to: string | { component: string; pin?: string };
  signal?: string;
  color?: string;
  color_full?: string;
  id?: string;
}

export interface WiringSchematicBlock {
  block_type: "wiring_schematic";
  title?: string;
  description?: string;
  ref_figure?: string;
  components?: WireComponent[];
  wires?: Wire[];
  harnesses?: unknown[];
  fuses?: unknown[];
  fusible_links?: unknown[];
  notes?: string | unknown[];
}

export interface DiagnosticCodeBlock {
  block_type: "diagnostic_code";
  code_number: string;
  code_name: string;
  diagnostic_procedure?: string;
  description?: string;
  possible_causes?: string[];
}

export type ContentBlock =
  | HeadingBlock
  | ProseBlock
  | SpecsBlock
  | ProcedureBlock
  | FlowchartBlock
  | TableBlock
  | ComponentLocationBlock
  | PartsDiagramBlock
  | WiringSchematicBlock
  | DiagnosticCodeBlock;

// ── Manual Page ────────────────────────────────────────────────────

export interface ManualPage {
  page_code: string;
  section: string;
  title: string;
  page_type: PageType;
  source_image: string;
  continuation?: Continuation;
  full_page_figure?: boolean;
  figures_detected?: FigureDetected[];
  content_blocks: ContentBlock[];
  tools_referenced?: ToolReference[];
  cross_references: string[];
  model_notes: string | null;
  _extraction_meta?: ExtractionMeta;
}

// ── Section Metadata ───────────────────────────────────────────────

export interface SectionMeta {
  code: string;
  name: string;
  slug: string;
  pageCount: number;
  pages: PageSummary[];
}

export interface PageSummary {
  page_code: string;
  title: string;
  page_type: PageType;
  slug: string;
}

// ── Search ─────────────────────────────────────────────────────────

export interface SearchDocument {
  id: string; // section/pageSlug
  pageCode: string;
  section: string;
  title: string;
  pageType: PageType;
  headings: string; // all heading block texts
  body: string; // prose, procedures, specs, tables, component info
  tools: string; // tool names, part numbers, usage
  crossRefs: string; // cross-reference page codes
  diagnostics: string; // DTC codes, names, causes, procedures
}
