import chalk from 'chalk';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const IF_DEFS = [];

const ENDIF = '//#endif';
const IFDEF = '//#ifdef';
let filterList;
let baseDir;

function configureStringsToSearch(vars) {
  for (let _key in vars) {
    const key = _key.replace('process.env.', '');

    let keytype = typeof vars[_key];
    let isDefined = (keytype === 'boolean' && vars[_key]) || keytype !== 'undefined';

    if (
      keytype === 'string' &&
      isDefined &&
      (vars[_key] === 'false' || vars[_key] === 'undefined')
    ) {
      isDefined = false;
    }

    if (isDefined) {
      IF_DEFS.push(key);
    }
  }
}

const MODE = {
  find_opening: 0,
  find_closing: 1
};

const LINE_TYPE = {
  plain: 0,
  ifdef: 1,
  closing: 2
};

async function onLoadPlugin(args) {
  let dirPath = path.relative(baseDir, args.path);
  let hasMatch = false;

  for (let filter of filterList) {
    if (dirPath.startsWith(filter)) {
      hasMatch = true;
      break;
    }
  }

  if (!hasMatch) {
    return null;
  }

  let text = await readFile(args.path, 'utf8');

  if (text.includes(IFDEF)) {
    console.log(chalk.blue('i'), 'File:', chalk.gray(dirPath));
    let lines = text.split('\n');
    let ifdefStart = -1;
    let depth = 0;

    let line = '';
    let expression = '';
    let step = MODE.find_opening;
    let shouldRemove = false;
    let lineType = LINE_TYPE.plain;
    let hitCounter = 0;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      line = lines[lineNumber];

      if (line.includes(IFDEF)) {
        lineType = LINE_TYPE.ifdef;
      } else if (line.includes(ENDIF)) {
        lineType = LINE_TYPE.closing;
      } else {
        lineType = LINE_TYPE.plain;
      }

      if (lineType === LINE_TYPE.ifdef && step === MODE.find_opening) {
        depth = 0;
        ifdefStart = lineNumber;
        step = MODE.find_closing;
        expression = line.trim().substring(IFDEF.length).trim();
        shouldRemove = !IF_DEFS.includes(expression);
        if (!shouldRemove && expression.startsWith('!')) {
          shouldRemove = false;
        }
        if (shouldRemove) {
          hitCounter++;
          console.log(`Expression (${expression}) found on line ${chalk.yellow(lineNumber)}`);
        }
      } else if (lineType === LINE_TYPE.ifdef && step === MODE.find_closing) {
        depth++;
      } else if (lineType === LINE_TYPE.closing && step === MODE.find_closing && depth > 0) {
        depth--;
      } else if (lineType === LINE_TYPE.closing && step === MODE.find_closing && depth === 0) {
        if (shouldRemove) {
          lines = [...lines.slice(0, ifdefStart), ...lines.slice(lineNumber + 1)];
        } else {
          lines = [
            ...lines.slice(0, ifdefStart),
            ...lines.slice(ifdefStart + 1, lineNumber),
            ...lines.slice(lineNumber + 1)
          ];
        }

        step = MODE.find_opening;
        ifdefStart = -1;
        shouldRemove = false;
        lineNumber = 0;
      }

      if (lines.length - 1 === lineNumber) {
        if (hitCounter) {
          console.log('');
        }
      }
    }

    if (!hitCounter) {
      console.log('Nothing to remove.', '\n');
    }

    return {
      contents: lines.join('\n'),
      loader: path.extname(args.path).substring(1)
    };
  } else {
    return null;
  }
}

const DEFAULT_EXCLUDE_LIST = ['dist', 'vendor', 'node_modules', '.git'];

export default (env = process.env, _baseDir = process.cwd(), exclude = DEFAULT_EXCLUDE_LIST) => {
  configureStringsToSearch(env);

  baseDir = _baseDir;
  filterList = fs.readdirSync(baseDir).filter(dir => {
    if (dir.includes('.')) {
      return false;
    }

    for (let excludeDir of exclude) {
      if (excludeDir.includes(dir)) {
        return false;
      }
    }

    return true;
  });

  const filter = {
    filter: new RegExp(
      `(${filterList
        .map(dir => path.join(_baseDir, dir))
        .join('|')
        .replace(/\\/g, '\\\\')}).*\\.ts$`
    )
  };

  return {
    name: '#ifdef',
    setup(build) {
      build.onLoad(filter, onLoadPlugin);
    }
  };
};
