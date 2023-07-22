const fs = require("fs");
const path = require("path");
const CSSInliner = require("css-inliner");

const srcPath = path.join(__dirname, "src");
const distPath = path.join(__dirname, "dist");

const inliner = new CSSInliner({ directory: srcPath });

const files = fs.readdirSync(srcPath, { withFileTypes: true }).filter((file) =>
{
	return file.isDirectory() === false && path.extname(file.name) === ".html";
});

for (let i = 0; i < files.length; i++)
{
	try
	{
		let fileText = fs.readFileSync(path.join(srcPath, files[ i ].name), { encoding: "utf8" });
		fileText = fileText.replaceAll('src="/images/', 'src="https://test.mylifequest.io/images/');

		inliner.inlineCSSAsync(fileText)
			.then((html) =>
			{
				try
				{
					fs.writeFileSync(path.join(distPath, files[ i ].name), html, { encoding: "utf8" });
				}
				catch (error)
				{
					console.error("[writeFileSync]", error);
				}
			})
			.catch((error) => console.error("[inlineCss]", error));
	}
	catch (error)
	{
		console.warn("[readFileSync]", error);
	}
}

console.info(`Complete ${ files.length } files`);
