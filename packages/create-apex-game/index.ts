#!/usr/bin/env node
import { Command } from 'commander';

// prettier-ignore
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import chalk from 'chalk';
import prompts from 'prompts';

const createApexPkg = JSON.parse(readFileSync('package.json', 'utf-8'));

const defaultProjectName = 'my-project';
const program = new Command();

program
  .name(createApexPkg.name)
  .description(createApexPkg.description)
  .version(createApexPkg.version);

program.argument('[name]', 'Name of your project.').action(async (initialDir: string = '') => {
  let targetDir = resolve(initialDir === '.' ? '' : initialDir);

  if (initialDir[0] === '~') {
    targetDir = join(homedir(), initialDir.substring(1));
  }

  const projectName = initialDir === '.' ? basename(resolve()) : initialDir;
  const cwd = process.cwd();

  try {
    const { packageName = projectName, overwrite } = await prompts(
      [
        {
          type: initialDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: defaultProjectName,
          onState({ value = defaultProjectName }) {
            targetDir = resolve(sanitizePath(value));
          }
        },
        {
          type: isValidDir(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: `Target directory "${targetDir}" exists already. Do you want to continue (existing files will be removed)?`
        },
        {
          type: isValidPackageName(projectName) ? null : 'text',
          name: 'packageName',
          message: 'Package name:',
          initial: toValidPackageName(projectName),
          validate(val) {
            return isValidPackageName(val) || 'Invalid package name';
          }
        }
      ],
      {
        onCancel() {
          throw new Error(chalk.red('✖') + ' Operation cancelled');
        },
        onSubmit(_, __, { overwrite }: any = {}) {
          if (overwrite === false) {
            throw new Error(chalk.red('✖') + ' Operation cancelled');
          }
        }
      }
    );

    if (overwrite) {
      rmSync(targetDir, { recursive: true, force: true });
    }

    console.log(`\nCreating project files in ${targetDir}...`);

    copyProjectFiles(targetDir, packageName);
    updatePkg(targetDir, { name: packageName });

    console.log(`\n${chalk.green('√')} Done. Continue by running:\n`);

    if (targetDir !== cwd) {
      console.log(`  cd ${relative(cwd, targetDir)}`);
    }

    const { commands } = getPkgManager();

    console.log(`  ${commands.install}`);
    console.log(`  ${commands.dev}`);
    console.log();
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
});

program.parse();

function getPkgManager() {
  const { npm_config_user_agent = '' } = process.env;
  const [manager] = npm_config_user_agent.split(' ');
  const [name, version] = manager.split('/');

  const commands: Record<string, any> = {
    yarn: {
      install: 'yarn',
      dev: 'yarn dev'
    },
    npm: {
      install: 'npm install',
      dev: 'npm run dev'
    }
  };

  return { name, version, commands: commands[name] };
}

function sanitizePath(path: string = '') {
  return path?.trim().replace(/\/+$/g, '');
}

function isValidDir(dir: string) {
  return !existsSync(dir) || readdirSync(dir).length < 1;
}

function toValidPackageName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-');
}

function isValidPackageName(name: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

function updatePkg(dir: string, content: Record<string, any>) {
  const pkg = JSON.parse(readFileSync(join(dir, `package.json`), 'utf-8'));

  writeFileSync(join(dir, `package.json`), JSON.stringify({ ...pkg, ...content }, null, 2));
}

function copyProjectFiles(dest: string, projectName: string = defaultProjectName) {
  if (!existsSync(dest)) {
    mkdirSync(dest);
  }

  copy('template', dest);
  renameSync(`${dest}/${defaultProjectName}.blend`, `${dest}/${projectName}.blend`);
}

function copy(src: string, dest: string) {
  const stat = statSync(src);

  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    copyFileSync(src, dest);
  }
}

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });

  for (const file of readdirSync(src)) {
    copy(resolve(src, file), resolve(dest, file));
  }
}
