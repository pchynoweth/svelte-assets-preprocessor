import { HTMLElement, Node, NodeType, parse } from 'node-html-parser';
import { PreprocessorGroup, Processed } from 'svelte/types/compiler/preprocess/types';
import { DEFAULT_OPTIONS, Options } from './defaults';
import * as _ from 'lodash';

interface Output {
  n: number;
  assets: Map<string, string>;
  script?: HTMLElement;
};

function preprocess(options?: Options): PreprocessorGroup {
  options = _.cloneDeep(Object.assign({}, DEFAULT_OPTIONS, options));
  if (!options.http) {
    options.exclude.push((attr) => /^https?:/.test(attr));
  }
  options.exclude.push((attr) => /\{.*\}/.test(attr));

  function addAsset(asset: string, out: Output): string {
    const existing = out.assets.get(asset);
    if (existing) return existing;

    const name = options.prefix + out.n++;
    out.assets.set(asset, name);
    return name;
  }

  function traverse(node: Node, out: Output): void {
    node.childNodes.forEach((child) => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        const html = child as HTMLElement;
        const cfgs = options.attributes.filter((ac) => ac.tag === html.rawTagName);
        if (cfgs.length) {
          cfgs.forEach((cfg) => {
            const attr = html.attributes[cfg.attribute];
            if (attr &&
              (!cfg.filter || cfg.filter(cfg.tag, cfg.attribute, html.attributes)) &&
              options.exclude.every((exclude) => !exclude(attr))) {
              if (cfg.type === 'src') {
                html.setAttribute(cfg.attribute, '{' + addAsset(attr, out) + '}');
              }
              else {
                const srcs = attr.split(',').map((src) => {
                  const vals = src.split(' ');
                  vals[0] = '${' + addAsset(vals[0], out) + '}';
                  if (vals.length > 1) vals[1] = ` ${vals[1]}`;
                  return vals.join('');
                }).join(`,`);
                html.setAttribute(cfg.attribute, '{`' + srcs + '`}');
              }
            }
          });
        }

        if (html.rawTagName === 'script' && html.attributes.src === undefined && html.attributes.context === undefined) {
          out.script = html;
        }
        traverse(child, out);
      }
    });
  }

  return {
    markup({ content }): Processed {
      const root = parse(content, { blockTextElements: { script: true, noscript: true, style: true, pre: true } }) as HTMLElement;
      const out: Output = { n: 1, assets: new Map<string, string>() };
      traverse(root, out);
      if (out.assets.size) {
        let imports = '';
        out.assets.forEach((value, key) => {
          imports += `import ${value} from '${key}';`;
        });

        if (out.script) {
          out.script.set_content(imports + out.script.innerHTML.toString());
        }
        else {
          return {
            code: `<script>${imports}</script>${root.toString()}`
          };
        }
      }

      return {
        code: root.toString()
      };
    }
  };
};

export default exports = module.exports = preprocess;
