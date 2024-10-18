import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { mdxjs } from 'micromark-extension-mdxjs';
import { SKIP, visit } from 'unist-util-visit';

const remarkHTMLToJSX = () => ast => {
  // This is a horror show, but it's the only way I could get the raw HTML into MDX.
  visit(ast, 'html', node => {
    Object.assign(
      node,
      fromMarkdown(
        `<div dangerouslySetInnerHTML={{__html: ${JSON.stringify(node.value)} }}/>`,
        {
          extensions: [mdxjs()],
          mdastExtensions: [mdxFromMarkdown()],
        },
      ).children[0],
    );
    return SKIP;
  });
};
export default remarkHTMLToJSX;
