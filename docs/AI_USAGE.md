# AI Usage Documentation

AI tools were utilized during the development of this project to accelerate boilerplate creation and refine architectural concepts. 

## Areas of AI Assistance

1. **Architecture Brainstorming and Validation:** AI was used to discuss trade-offs between different NestJS module structures and validate the use of the Event-Driven pattern for WebSockets.
2. **Boilerplate Generation:** Scaffolding basic NestJS controllers, DTOs, and Prisma schemas.
3. **Test Case Suggestions:** Generating edge cases for unit testing the state machine (`OrderStatusPolicy`).
4. **Code Review Assistance:** Linting and identifying potential type safety issues with Prisma's Decimal types.
5. **Documentation Assistance:** Formatting markdown files and generating Mermaid diagrams based on provided logic.
6. **Debugging Support:** Tracing asynchronous timer execution context issues in NestJS services.

## Validation & Ownership Statement

- **Architecture decisions were reviewed and validated by the developer.** No architectural pattern was implemented without explicit developer intent and understanding.
- **All generated code was understood and reviewed.** AI-generated code was treated as a draft and heavily refactored to meet clean code standards.
- **Business rules were manually validated.** The core domain logic (price calculation, status transitions) was verified manually.
- **Tests were executed and corrected where necessary.** AI-generated tests were audited for correctness.
- **The developer can explain every design decision.** I take full ownership of the codebase and can articulate the rationale behind every technical choice.
