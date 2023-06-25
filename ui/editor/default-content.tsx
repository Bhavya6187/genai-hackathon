const DEFAULT_EDITOR_CONTENT = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Newsletter Generator" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a newsletter generator powered by GPT-4. Use this to generate newsletter specific to any country.",
        },
      ],
    },
    { type: "paragraph" },
  ],
};

export default DEFAULT_EDITOR_CONTENT;
