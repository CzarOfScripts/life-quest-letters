const fs = require("fs");
const path = require("path");
const inlineCss = require("inline-css");

const getHrefContent = require("href-content");
const getStylesheetList = require("list-stylesheets");
const mediaQueryText = require("mediaquery-text");
const { promisify } = require("util");
const getHrefContentAsync = promisify(getHrefContent);

const srcPath = path.join(__dirname, "src");
const distPath = path.join(__dirname, "dist");

const files = fs.readdirSync(srcPath, { withFileTypes: true }).filter((file) =>
{
	return file.isDirectory() === false && path.extname(file.name) === ".html";
});

const inlineCssOptions =
{
	url: `file://${ srcPath }/`,
	applyTableAttributes: true,
	applyWidthAttributes: true,
	removeHtmlSelectors: false,
	preserveMediaQueries: true,
	applyLinkTags: true
};

main();

async function main()
{
	let errors = 0;
	const startDate = new Date();

	for (let i = 0; i < files.length; i++)
	{
		const fileName = files[ i ].name;

		try
		{
			let fileText = fs.readFileSync(path.join(srcPath, fileName), { encoding: "utf8" });
			const extraCss = await extractMediaQueriesCss(fileText, inlineCssOptions);

			fileText = fileText.replace("</head>", `\t<style type="text/css">${ extraCss }</style>\n</head>`);

			try
			{
				let html = await inlineCss(fileText, inlineCssOptions);

				try
				{
					html = html.replaceAll('src="/images/', 'src="https://test.mylifequest.io/images/');
					html = html.replaceAll("url('/images/", "url('https://test.mylifequest.io/images/");

					fs.writeFileSync(path.join(distPath, fileName), html, { encoding: "utf8" });
				}
				catch (error)
				{
					error += 1;
					console.error("[writeFileSync] [" + fileName + "]", error);
				}
			}
			catch (error)
			{
				error += 1;
				console.error("[inlineCss] [" + fileName + "]", error);
			}
		}
		catch (error)
		{
			error += 1;
			console.warn("[readFileSync] [" + fileName + "]", error);
		}
	}

	console.info(`Complete ${ files.length - errors }/${ files.length } file, ${ errors } errors, time: ${ (new Date().getTime()) - startDate.getTime() }ms.`);
}

async function extractMediaQueriesCss(html, options)
{
	const data = getStylesheetList(html, options);
	const mediaCss = [];

	for (const href of data.hrefs)
	{
		// @ts-ignore
		const linkedStyle = await getHrefContentAsync(href, options.url);

		mediaCss.push(mediaQueryText(linkedStyle).replaceAll(";", " !important;"));
	}

	return mediaCss.join(" ");
}
