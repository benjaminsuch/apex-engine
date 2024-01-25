import Heading from '@theme/Heading';
import clsx from 'clsx';

import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Written in TypeScript',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        The engine is fully written in TypeScript and has it's focus on lowering the entry barrier for web developers, who want to get into game development.
      </>
    ),
  },
  {
    title: 'Multiplatform support',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        You can build your game for the browser, desktop and NodeJS. For each platform, Apex Engine provides build-commands.
      </>
    ),
  },
  {
    title: 'Multithreading architecture',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        The architecture is designed to make heavy use of worker threads. Heavy work like 3D rendering or physics, are offloaded which greatly improves performance.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem): JSX.Element {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
