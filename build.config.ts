import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	entries: ["./src/index", "./src/Server", "./src/Util", "./src/Client"],
	outDir: "dist",
	declaration: "compatible",
	failOnWarn: false,
});
