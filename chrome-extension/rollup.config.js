import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/content.ts",
    output: {
      file: "dist/content.js",
      format: "iife", // Immediately Invoked Function Expression for browser compatibility
      name: "ExtensionContent",
    },
    plugins: [
      typescript({
        target: "es2022", // Compile to ES2022
        declaration: false,
        sourceMap: false,
      }),
    ],
  },
  {
    input: "src/popup.ts",
    output: {
      file: "dist/popup.js",
      format: "iife", // Immediately Invoked Function Expression for browser compatibility
      name: "ExtensionPopup",
    },
    plugins: [
      typescript({
        target: "es2022", // Compile to ES2022
        declaration: false,
        sourceMap: false,
      }),
    ],
  },
];
