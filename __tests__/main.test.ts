/* eslint @typescript-eslint/no-var-requires: "off" */
const preprocess = require('../src/main');
import { DEFAULT_ATTRIBUTES } from '../src/defaults';
import { Processed } from 'svelte/types/compiler/preprocess/types';

const TEST_ASSET = __dirname + '/assets/asset1.png';
const isVoid = (tag): boolean => /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag);

interface TestParams {
  input: string;
  output: string;
}

describe('sanity', () => {
  const fixture = preprocess();

  it('noop', () => {
    const input = `
      <script>
        const test = 'test string';
      </script>

      <p>This is a {test}</p>
    `
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(input);
  });

  it('noop empty tag', () => {
    const input = `
      <script>
      </script>

      <p></p>
    `
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(input);
  });
});

describe('exclude', () => {
  const fixture = preprocess();

  it.each([
    [ 'http', 'http://example.com' ],
    [ 'https', 'https://example.com' ],
    [ 'code', '{img}' ]
  ])('%s gets excluded', (_desc, value) => {
    const input = `
      <script>
        const test = 'test string';
      </script>

      <img src="${value}">
    `
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(input);
  });

  it.each([
    [ 'http' ],
    [ 'https' ],
  ])('%s should not be excluded if not start of string', (value) => {
    const input = `
      <script>
        const test = 'test string';
      </script>

      <img src="/assets/${value}/asset.png">
    `
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).not.toBe(input);
  });

  it.each([
    [ 'http', 'http://example.com' ],
    [ 'https', 'https://example.com' ]
  ])('%s does not get excluded when enabled in options', (_desc, value) => {
    const p = preprocess({ http: true });
    const input = `
      <script>
        const test = 'test string';
      </script>

      <img src="${value}">
    `;
    expect((p.markup({ content: input, filename: 'dummy' }) as Processed).code).not.toBe(input);
  });
});

describe('Pages with script tags', () => {
  const fixture = preprocess();
  const makeTestWithScript = (tag, attr, value): TestParams => {
    const closingTag = isVoid(tag) ? '' : `</${tag}>`;
    return {
      input: `
        <script>
        </script>

        <${tag} ${attr}="${value}">${closingTag}`,
      output: `
        <script>import ___ASSET___1 from '${value}';
        </script>

        <${tag} ${attr}="{___ASSET___1}">${closingTag}`
    }
  };

  it.each(
    DEFAULT_ATTRIBUTES
      .filter(({filter, type}) => !filter && type === 'src')
      .map(({tag, attribute}) => {
        return [tag, attribute];
      })
  )('%s %s', (tag, attr) => {
    const {input, output} = makeTestWithScript(tag, attr, TEST_ASSET);
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });
});

describe('Pages without script tags', () => {
  const fixture = preprocess();
  const makeTestWithoutScript = (tag, attr, value, extra = ''): TestParams => {
    const closingTag = isVoid(tag) ? '' : `</${tag}>`;
    return {
      input: `<${tag} ${extra}${attr}="${value}">${closingTag}`,
      output: `<script>import ___ASSET___1 from '${value}';</script>`
        + `<${tag} ${extra}${attr}="{___ASSET___1}">${closingTag}`
    }
  };

  it.each(
    DEFAULT_ATTRIBUTES
      .filter(({filter, type}) => !filter && type === 'src')
      .map(({tag, attribute}) => {
        return [tag, attribute];
      })
  )('%s %s', (tag, attr) => {
    const {input, output} = makeTestWithoutScript(tag, attr, TEST_ASSET);
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });

  it('link href css', () => {
    const input = `<link rel="stylesheet" type="text/css" href="/assets/style.css">`;
    const output = `<script>import ___ASSET___1 from '/assets/style.css';</script>`
      + `<link rel="stylesheet" type="text/css" href="{___ASSET___1}">`;
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });

  it('link href non-css noop', () => {
    const input = `<link href="/assets/style.css">`;
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(input);
  });

  it('link href non-css unsupported type', () => {
    const input = `<link rel="stylesheet" type="text/json" href="/assets/style.css">`;
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(input);
  });
});

describe('Multiple Assets', () => {
  const fixture = preprocess();

  it('Repeated asset', () => {
    const input = `<img src="/assets/image.png"><img src="/assets/image.png">`;
    const output = `<script>import ___ASSET___1 from '/assets/image.png';</script>`
      + `<img src="{___ASSET___1}"><img src="{___ASSET___1}">`;
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });

  it('Different assets', () => {
    const input = `<img src="/assets/image.png"><img src="/assets/image2.png">`;
    const output = `<script>import ___ASSET___1 from '/assets/image.png';`
      + `import ___ASSET___2 from '/assets/image2.png';</script>`
      + `<img src="{___ASSET___1}"><img src="{___ASSET___2}">`;
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });
});

describe.each([
  [ 1, ['/assets/image.png'] ],
  [ 2, ['/assets/image.png', '/assets/image2.png'] ],
  [ 3, ['/assets/image.png', '/assets/image2.png' , '/assets/image3.png'] ]
])('srcset %i', (_count, srcset) => {
  const fixture = preprocess();
  const srcsets = DEFAULT_ATTRIBUTES.filter(({type}) => type === 'srcset');
  const makeTestWithoutScript = (tag, attr, values: string[]): TestParams => {
    const closingTag = isVoid(tag) ? '' : `</${tag}>`;
    const sizes = ['', ' x2', ' x3'];
    const value = values.map((v, i) => v + sizes[i]).join(',');
    const imports = values.map((v, i) => `import ___ASSET___${i+1} from '${v}';`).join('');
    const srcs = values.map((_v, i) => `$\{___ASSET___${i+1}}${sizes[i]}`).join(',');
    return {
      input: `<${tag} ${attr}="${value}">${closingTag}`,
      output: `<script>${imports}</script>`
        + `<${tag} ${attr}="{\`${srcs}\`}">${closingTag}`
    }
  };

  it.each(
    srcsets.map(({tag, attribute}) => {
        return [tag, attribute];
      })
  )('%s %s', (tag, attr) => {
    const {input, output} = makeTestWithoutScript(tag, attr, srcset);
    expect((fixture.markup({ content: input, filename: 'dummy' }) as Processed).code).toBe(output);
  });
});
