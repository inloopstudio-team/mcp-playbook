export async function handleListPrompts(): Promise<any> {
  console.error("Handling prompts/list");

  const prompts = [
    {
      name: "init-playbook",
      description:
        "Provides the initial instruction prompt for the MCP Playbook server.",
      arguments: [],
    },
  ];

  return { prompts };
}
