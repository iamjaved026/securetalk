# Firebase Studio

This is a NextJS messenger app built with Firebase Studio.

## Repository
GitHub: [https://github.com/iamjaved026/securetalk](https://github.com/iamjaved026/securetalk)

## Adding New AI Flows (Genkit)

The AI functionality is organized in the `src/ai/` directory. To add a new flow (e.g., for summarizing text), follow these steps:

1.  **Create a New Flow File:** Inside the `src/ai/flows/` directory, create a new TypeScript file for your flow. For example: `src/ai/flows/summarize-text-flow.ts`.

2.  **Define Your Flow:** In the new file, use `ai.defineFlow` to create your logic. You can look at existing files like `src/ai/flows/translate-message-flow.ts` for a complete example.

3.  **Register Your Flow:** Open `src/ai/dev.ts` and add an import statement for your new flow file at the top. This makes the flow available to your application in the development environment.

    ```typescript
    // src/ai/dev.ts
    import '@/ai/flows/translate-message-flow.ts';
    import '@/ai/flows/my-new-summarize-flow.ts'; // Add this line
    ```

The `.gitignore` file in this project has been configured to correctly include these new flow files when you commit your code to a repository.
