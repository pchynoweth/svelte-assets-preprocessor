type AttributeType = 'src' | 'srcset';
type FilterFunction = (tag: string, attribute: string, attributes) => boolean;
type ExcludeFunction = (attribute: string) => boolean;

interface AttributeConfig {
  tag: string;
  attribute: string;
  type: AttributeType;
  filter?: FilterFunction;
};

type AttributesConfig = AttributeConfig[];

export interface Options {
  attributes?: AttributesConfig;
  prefix?: string;
  exclude?: ExcludeFunction[];
};

export const DEFAULT_ATTRIBUTES: AttributesConfig = [
  {
    tag: 'audio',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'embed',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'img',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'input',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'link',
    attribute: 'href',
    type: 'src',
    filter: (_tag: string, _attribute: string, attributes): boolean => {
      if (!attributes.rel || !/stylesheet/i.test(attributes.rel)) {
        return false;
      }

      if (
        attributes.type &&
        attributes.type.trim().toLowerCase() !== 'text/css'
      ) {
        return false;
      }

      return true;
    },
  },
  {
    tag: 'object',
    attribute: 'data',
    type: 'src',
  },
  {
    tag: 'script',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'source',
    attribute: 'srcset',
    type: 'srcset',
  },
  {
    tag: 'track',
    attribute: 'src',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'poster',
    type: 'src',
  },
  {
    tag: 'video',
    attribute: 'src',
    type: 'src',
  },
];

export const DEFAULT_OPTIONS: Options = {
  attributes: DEFAULT_ATTRIBUTES,
  prefix: '___ASSET___',
  exclude: [
    (attr): boolean => /^https?:/.test(attr)
  ]
};
