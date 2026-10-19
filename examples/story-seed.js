/* Tiny fictional seed for BareMetal.Play / BareMetal.Story demos. */
var STORY_DEMO_SEED = {
  stories: [{
    id: 1,
    slug: "paper-lantern",
    title: "The Paper Lantern",
    description: "A sample. A courtyard that exists only in this story: a lantern, wet paint, two endings.",
    tags: ["sample", "fiction"],
    author_id: "sample"
  }],
  nodes: [
    {
      id: 1,
      story_id: 1,
      key: "yard",
      text: "The courtyard exists only in this story. A paper lantern sits on warm stones as if someone forgot the match.\n\nYou notice {{state.facts.notice}}. The evening is {{persona.base_facts.weather}}.",
      is_ending: false,
      triggers: [{ template: "yard-letter", to: "the courtyard" }]
    },
    {
      id: 2,
      story_id: 1,
      key: "glow",
      text: "The flame is small and blue. A painted door that was only colour a moment ago swings inward. This path ends there.",
      is_ending: true
    },
    {
      id: 3,
      story_id: 1,
      key: "wind",
      text: "You leave the lantern unlit. A warm wind lifts the paper over the wall. The courtyard ends with the stones empty.",
      is_ending: true
    }
  ],
  choices: [
    { id: 1, node_id: 1, label: "Light the lantern", target_node_key: "glow" },
    { id: 2, node_id: 1, label: "Leave it dark", target_node_key: "wind" }
  ],
  personas: [
    {
      id: 1,
      story_id: 1,
      key: "courtyard",
      role: "narrator",
      system_prompt: "Rewrite the scene as fiction about a courtyard that is not a real place. Keep Markdown images. Return only the scene text.",
      base_facts: {
        weather: "damp and still",
        sign: "Told by the courtyard, which exists only in this story."
      }
    },
    {
      id: 2,
      story_id: 1,
      key: "visitor",
      role: "protagonist",
      system_prompt: "You are a visitor in a fictional courtyard.",
      base_facts: { notice: "the wet paint before the lantern" }
    }
  ],
  templates: [{
    id: 1,
    key: "yard-letter",
    channel: "email",
    subject: "The courtyard",
    body: "The courtyard that exists only in this story writes first, for {{to}}. You notice {{state.facts.notice}}. You hold {{state.inventory}}."
  }],
  user_progress: []
};
