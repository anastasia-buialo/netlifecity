import rss from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { render } from "astro:content";
import type { APIRoute } from "astro";
import { toFeedHtml, toFeedText } from "../feed.ts";
import { getPosts } from "../posts";
import { getImage } from "astro:assets";
import maake from "../assets/maake.jpg";

const TITLE = "Anastasia";
const DESCRIPTION = "UX-designer, visual designer, concept maker, goth kid, and a bird lady";

export const GET: APIRoute = async (context) => {
  const site = context.site;
  if (!site) throw new Error("site is required for the feed");
  const container = await AstroContainer.create();
  const posts = await getPosts();
  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      const html = await container.renderToString(Content);
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: toFeedText(html),
        content: toFeedHtml(html, site),
        link: `/#${post.id}`,
      };
    }),
  );

  // the hidden "fren?" page is not a post, but it goes in the feed too
  const frenImage = await getImage({ src: maake, width: 720, format: "jpg" });
  const frenHtml = `<p>kun om du liker måker</p><img src="${frenImage.src}" alt="Svart-hvitt bilde av en person med briller som klemmer og kysser en ung måke som sprer den ene vingen" width="${frenImage.attributes.width}" height="${frenImage.attributes.height}"><p><a href="/fren">Hør låten for måkevenner</a></p>`;
  items.push({
    title: "fren?",
    pubDate: new Date("2026-11-27"),
    description: "kun om du liker måker",
    content: toFeedHtml(frenHtml, site),
    link: "/fren",
  });
  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: TITLE,
    description: DESCRIPTION,
    site,
    trailingSlash: false,
    items,
  });
};
