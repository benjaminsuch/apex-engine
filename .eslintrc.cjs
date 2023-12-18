const indent = 2;
const quotes = 'single';
const semi = true;

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: ["./tsconfig.eslint.json", "./packages/*/tsconfig.json", "./sandbox/tsconfig.json"]
  },
  plugins: ['@stylistic', '@typescript-eslint', 'simple-import-sort'],
  rules: {
    '@stylistic/array-bracket-spacing': ['error', 'never'],
    '@stylistic/arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    '@stylistic/arrow-spacing': ['error', { after: true, before: true }],
    '@stylistic/block-spacing': ['error', 'always'],
    '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/comma-spacing': ['error', { after: true, before: false }],
    '@stylistic/comma-style': ['error', 'last'],
    '@stylistic/computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],
    '@stylistic/dot-location': ['error', 'property'],
    '@stylistic/eol-last': 'error',
    '@stylistic/function-call-argument-newline': ['error', 'consistent'],
    '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
    '@stylistic/indent': ['error', indent, {
      ArrayExpression: 1,
      CallExpression: { arguments: 1 },
      flatTernaryExpressions: false,
      FunctionDeclaration: { body: 1, parameters: 1 },
      FunctionExpression: { body: 1, parameters: 1 },
      ignoreComments: false,
      ignoredNodes: [
        'TemplateLiteral *',
        'JSXElement',
        'JSXElement > *',
        'JSXAttribute',
        'JSXIdentifier',
        'JSXNamespacedName',
        'JSXMemberExpression',
        'JSXSpreadAttribute',
        'JSXExpressionContainer',
        'JSXOpeningElement',
        'JSXClosingElement',
        'JSXFragment',
        'JSXOpeningFragment',
        'JSXClosingFragment',
        'JSXText',
        'JSXEmptyExpression',
        'JSXSpreadChild',
        'TSUnionType',
        'TSIntersectionType',
        'TSTypeParameterInstantiation',
        'FunctionExpression > .params[decorators.length > 0]',
        'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
        'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',
      ],
      ImportDeclaration: 1,
      MemberExpression: 1,
      ObjectExpression: 1,
      offsetTernaryExpressions: true,
      outerIIFEBody: 1,
      SwitchCase: 1,
      VariableDeclarator: 1,
    }],
    '@stylistic/indent-binary-ops': ['error', indent],
    '@stylistic/key-spacing': ['error', { afterColon: true, beforeColon: false }],
    '@stylistic/keyword-spacing': ['error', { after: true, before: true }],
    '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    '@stylistic/max-statements-per-line': ['error', { max: 1 }],
    '@stylistic/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'semi',
      },
      multilineDetection: 'brackets',
      overrides: {
        interface: {
          multiline: {
            delimiter: 'semi',
          },
        },
      },
      singleline: {
        delimiter: 'comma',
      },
    }],
    '@stylistic/multiline-ternary': ['error', 'always-multiline'],
    '@stylistic/new-parens': 'error',
    '@stylistic/no-extra-parens': ['error', 'functions'],
    '@stylistic/no-floating-decimal': 'error',
    '@stylistic/no-mixed-operators': ['error', {
      allowSamePrecedence: true,
      groups: [
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof'],
      ],
    }],
    '@stylistic/no-mixed-spaces-and-tabs': 'error',
    '@stylistic/no-multi-spaces': 'error',
    '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
    '@stylistic/no-tabs': indent === 'tab' ? 'off' : 'error',
    '@stylistic/no-trailing-spaces': 'error',
    '@stylistic/no-whitespace-before-property': 'error',
    '@stylistic/object-curly-newline': [
      'error',
      {
        ImportDeclaration: 'never',
      },
    ],
    '@stylistic/object-curly-spacing': ['error', 'always'],
    '@stylistic/operator-linebreak': ['error', 'before'],
    '@stylistic/padded-blocks': ['error', { blocks: 'never', classes: 'never', switches: 'never' }],
    '@stylistic/quote-props': ['error', 'consistent-as-needed'],
    '@stylistic/quotes': ['error', quotes, { allowTemplateLiterals: true, avoidEscape: false }],
    '@stylistic/rest-spread-spacing': ['error', 'never'],
    '@stylistic/semi': ['error', semi ? 'always' : 'never'],
    '@stylistic/semi-spacing': ['error', { after: true, before: false }],
    '@stylistic/space-before-blocks': ['error', 'always'],
    '@stylistic/space-before-function-paren': ['error', { anonymous: 'always', asyncArrow: 'always', named: 'never' }],
    '@stylistic/space-in-parens': ['error', 'never'],
    '@stylistic/space-infix-ops': 'error',
    '@stylistic/space-unary-ops': ['error', { nonwords: false, words: true }],
    '@stylistic/spaced-comment': ['error', 'always', {
      block: {
        balanced: true,
        exceptions: ['*'],
        markers: ['!'],
      },
      line: {
        exceptions: ['/', '#'],
        markers: ['/'],
      },
    }],
    '@stylistic/template-curly-spacing': 'error',
    '@stylistic/template-tag-spacing': ['error', 'never'],
    '@stylistic/type-annotation-spacing': ['error', {}],
    '@stylistic/type-generic-spacing': 'error',
    '@stylistic/type-named-tuple-spacing': 'error',
    '@stylistic/wrap-iife': ['error', 'any', { functionPrototypeMethods: true }],
    '@stylistic/yield-star-spacing': ['error', 'both'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        fixStyle: 'inline-type-imports',
      },
    ],
    'simple-import-sort/imports': 'error',
  },
};
