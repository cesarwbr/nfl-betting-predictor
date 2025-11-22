import { Sandbox } from "@e2b/code-interpreter";

const sandbox = await Sandbox.create();

const execution = await sandbox.runCode("print('hey!')");
console.log(execution);
