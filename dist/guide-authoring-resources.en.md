# Guide authoring resources

## teach

[Project](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach) · [Documentation](https://github.com/mattpocock/skills/blob/main/skills/productivity/teach/SKILL.md)

Fit: Closest to this guide's goal: organize learning objectives, short lessons, interactive exercises, references, and learning records into a sustainable teaching workspace. It emphasizes active recall and immediate feedback.

Limits: Lessons and code verification must be designed for the specific project; generated content is not guaranteed correct. This is a teaching workflow, not a ready-made LoongSuite course. The locally installed version may differ from the upstream layout.

Approach adopted: Adopt explicit tasks, staged lessons, shared diagram components, quiz feedback, and local learning records. Do not mark unfinished lessons as mastered.

## doc-coauthoring

[Project](https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring) · [Documentation](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md)

Fit: Gather reader background, iterate on structure, then test the document with a reader who has no prior context. This helps avoid an author's assumption that an explanation is already clear.

Limits: It neither generates courses nor validates Go examples. Its workflow cannot replace real compilation and reader practice.

Approach adopted: Adopt reader goals, structural iteration, and independent reader review. The current conversation already provides background, so do not repeat the interview.

## frontend-design

[Project](https://github.com/anthropics/skills/tree/main/skills/frontend-design) · [Documentation](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

Fit: Set a visual direction, typography, layout, and interaction details to avoid walls of text or generic template cards.

Limits: Interface quality does not establish teaching quality. Technical correctness, accessibility, and tests still need separate verification.

Approach adopted: Use a reading-oriented layout, source annotations, and interactive causal diagrams. Clearly label diagrams as teaching models.

## Diátaxis

[Project](https://diataxis.fr/) · [Documentation](https://diataxis.fr/tutorials/)

Fit: Distinguish tutorials, how-to guides, reference material, and explanations. Give readers one concrete success before gradually introducing complexity.

Limits: The four documentation types do not prescribe a learning order. Do not overload the first experiment with every concept and exception.

Approach adopted: Use the learning route for tutorials, the source map and glossary for reference, lab pages for procedures, and chapter text to explain design.

## Google Technical Writing

[Project](https://developers.google.com/tech-writing) · [Documentation](https://developers.google.com/tech-writing/two/large-docs)

Fit: Define the audience and prerequisites, organize long documents, and use concrete examples, counterexamples, and captions to reduce the effort of understanding.

Limits: Primarily technical writing courses and guidelines, not a directly installable skill or a source-code tutorial for a particular project.

Approach adopted: List prerequisites, outcomes, expected lab results, and common misconceptions in each chapter. Give every diagram a readable written conclusion.

## Starlight

[Project](https://github.com/withastro/starlight) · [Documentation](https://starlight.astro.build/getting-started/)

Fit: For a long-lived, content-focused documentation site. Existing navigation, search, internationalization, code blocks, and documentation components reduce basic layout work.

Limits: Complex labs require custom interactive components. The framework supplies documentation structure, not a learning progression.

Approach adopted: Use its sidebar, current-chapter navigation, and reader-focused information hierarchy as references.

## VitePress

[Project](https://github.com/vuejs/vitepress) · [Documentation](https://vitepress.dev/guide/using-vue)

Fit: Suits Vue teams. Vue components can be composed inside Markdown, making it easy to embed rule matchers, context diagrams, and similar teaching tools.

Limits: Vue components and build tools need maintenance. Components running inside Markdown must satisfy SSR constraints.

Approach adopted: Borrow the practice of placing explanations beside interactive components. This guide uses native JS and keeps the website free of dependencies.

## Docusaurus

[Project](https://github.com/facebook/docusaurus) · [Documentation](https://docusaurus.io/docs)

Fit: Suits React teams and documentation with multiple languages and versions. MDX lets explanations include React lab components.

Limits: Versioning and plugin systems increase maintenance. The first edition of a personal learning guide need not adopt a whole platform.

Approach adopted: Borrow version pinning and lesson structure without copying framework or theme code.

## GitHub Skills / Learn

[Project](https://learn.github.com/) · [Documentation](https://github.com/skills)

Fit: Break learning into small tasks and use actions and feedback to drive progress. Suits learning GitHub workflows and repository collaboration.

Limits: Not a dedicated skill for writing source-code teaching material, and it cannot directly generate a course on LoongSuite internals.

Approach adopted: Give each step a tangible output, check questions, and a capability checklist. Completion combines reader self-assessment with quiz results.
