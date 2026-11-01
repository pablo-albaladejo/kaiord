export type Skill = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly examples: ReadonlyArray<string>;
};

const CONTENT = "input_content (text, or base64 for FIT)";

/** D8: the ids are written out literally; a test pins them to tools/list. */
export const SKILLS: ReadonlyArray<Skill> = [
  {
    id: "kaiord_convert",
    name: "Convert a workout",
    description: `Convert a structured workout between FIT, TCX, ZWO, GCN and KRD. Arguments: ${CONTENT}, input_format, output_format, optional ftp. FIT output is base64 text.`,
    tags: ["convert", "fit", "tcx", "zwo", "garmin", "krd"],
    examples: [
      '{"skill":"kaiord_convert","input_content":"<zwo xml>","input_format":"zwo","output_format":"krd"}',
    ],
  },
  {
    id: "kaiord_diff",
    name: "Compare two workouts",
    description:
      "Compare two workout files and list their differences. Arguments: content1, content2, optional format1 and format2.",
    tags: ["diff", "compare"],
    examples: ['{"skill":"kaiord_diff","content1":"<krd>","content2":"<krd>"}'],
  },
  {
    id: "kaiord_extract_workout",
    name: "Extract a workout",
    description: `Extract the structured workout from a file as JSON. Arguments: ${CONTENT}, optional input_format.`,
    tags: ["extract", "workout", "json"],
    examples: [
      '{"skill":"kaiord_extract_workout","input_content":"<base64 fit>","input_format":"fit"}',
    ],
  },
  {
    id: "kaiord_get_format_spec",
    name: "Get the KRD format spec",
    description:
      "Return the KRD format specification. Read it before creating or editing KRD documents. No arguments.",
    tags: ["krd", "spec", "docs"],
    examples: ['{"skill":"kaiord_get_format_spec"}'],
  },
  {
    id: "kaiord_inspect",
    name: "Inspect a workout",
    description: `Return a human-readable summary of a workout file. Arguments: ${CONTENT}, optional input_format.`,
    tags: ["inspect", "summary"],
    examples: [
      '{"skill":"kaiord_inspect","input_content":"<tcx xml>","input_format":"tcx"}',
    ],
  },
  {
    id: "kaiord_list_formats",
    name: "List formats",
    description:
      "List the supported workout formats and their capabilities. No arguments.",
    tags: ["formats", "discovery"],
    examples: ['{"skill":"kaiord_list_formats"}'],
  },
  {
    id: "kaiord_round_trip_validate",
    name: "Round-trip validate FIT",
    description:
      "Convert a FIT workout to KRD and back, and report tolerance violations. Arguments: input_content (base64 FIT).",
    tags: ["validate", "fit", "round-trip"],
    examples: [
      '{"skill":"kaiord_round_trip_validate","input_content":"<base64 fit>"}',
    ],
  },
  {
    id: "kaiord_validate",
    name: "Validate KRD",
    description:
      "Validate a KRD JSON document against the schema. Arguments: input_content (KRD JSON).",
    tags: ["validate", "krd", "schema"],
    examples: ['{"skill":"kaiord_validate","input_content":"<krd json>"}'],
  },
];

export const SKILL_IDS: ReadonlyArray<string> = SKILLS.map((skill) => skill.id);
