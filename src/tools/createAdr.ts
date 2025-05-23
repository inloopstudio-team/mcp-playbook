import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolDefinition } from "../types.js";

export const CreateAdrArgsSchema = z.object({

  adr_name: z
    .string()
    .describe(
      "The name of the ADR file (without sequence numbers and the .md extension).",
    ),
  content: z
    .string()
    .describe('''The markdown content of the ADR. This content must strictly follow the following template:
```
---
# These are optional metadata elements. Feel free to remove any of them.
status: "{proposed | rejected | accepted | deprecated | … | superseded by ADR-0123"
date: {YYYY-MM-DD when the decision was last updated}
decision-makers: {list everyone involved in the decision}
consulted: {list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication}
informed: {list everyone who is kept up-to-date on progress; and with whom there is a one-way communication}
---

# {short title, representative of solved problem and found solution}

## Context and Problem Statement

{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}

<!-- This is an optional element. Feel free to remove. -->
## Decision Drivers

* {decision driver 1, e.g., a force, facing concern, …}
* {decision driver 2, e.g., a force, facing concern, …}
* … <!-- numbers of drivers can vary -->

## Considered Options

* {title of option 1}
* {title of option 2}
* {title of option 3}
* … <!-- numbers of options can vary -->

## Decision Outcome

Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.

<!-- This is an optional element. Feel free to remove. -->
### Consequences

* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}
* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}
* … <!-- numbers of consequences can vary -->

<!-- This is an optional element. Feel free to remove. -->
### Confirmation

{Describe how the implementation of/compliance with the ADR can/will be confirmed. Are the design that was decided for and its implementation in line with the decision made? E.g., a design/code review or a test with a library such as ArchUnit can help validate this. Not that although we classify this element as optional, it is included in many ADRs.}

<!-- This is an optional element. Feel free to remove. -->
## Pros and Cons of the Options

### {title of option 1}

<!-- This is an optional element. Feel free to remove. -->
{example | description | pointer to more information | …}

* Good, because {argument a}
* Good, because {argument b}
<!-- use "neutral" if the given argument weights neither for good nor bad -->
* Neutral, because {argument c}
* Bad, because {argument d}
* … <!-- numbers of pros and cons can vary -->

### {title of other option}

{example | description | pointer to more information | …}

* Good, because {argument a}
* Good, because {argument b}
* Neutral, because {argument c}
* Bad, because {argument d}
* …

<!-- This is an optional element. Feel free to remove. -->
<h2>More Information</h2>

{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when/how this decision the decision should be realized and if/when it should be re-visited. Links to other decisions and resources might appear here as well.}
```'''),
  branch_name: z
    .string()
    .optional()
    .describe(
      "The name of the branch to use for the changes. Suggestion: follow a descriptive naming convention (e.g., 'docs/add-adr-name').",
    ),
  commit_message: z
    .string()
    .optional()
    .describe("The commit message for the file change."),
  pr_title: z
    .string()
    .optional()
    .describe(
      "The title for a new Pull Request. Follow commitlint standards (e.g., 'docs: add adr name').",
    ),
  pr_body: z
    .string()
    .optional()
    .describe(
      "The body content for a new Pull Request. Provide a comprehensive and detailed description.",
    ),
});

export type CreateAdrArgs = z.infer<typeof CreateAdrArgsSchema>;

export const createAdrTool: ToolDefinition = {
  name: "create_adr",
  description:
    "Creates or overwrites a new Architectural Decision Record (ADR) file in the docs/adr/ directory of the target project. ADR files will be named following an `adr-name.md` convention.",
  inputSchema: zodToJsonSchema(CreateAdrArgsSchema),
  annotations: {
    title: "Create ADR",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
