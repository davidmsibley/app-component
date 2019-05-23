
import html from 'rollup-plugin-html';
import minify from 'rollup-plugin-minify-es';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

let fileName = 'app-component';
let objName = 'AppComponent';


let plugins = {
  full: [
    html({
      include: `modules/*.html`,
      htmlMinifierOptions: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        conservativeCollapse: true
      }
    }),
    resolve()
  ],
  min: [
    html({
      include: `modules/*.html`,
      htmlMinifierOptions: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        conservativeCollapse: true
      }
    }),
    resolve(),
    minify({
      output: {
        wrap_iife: true
      }
    })
  ]
};


export default [
  // Demo build files
  {
    input: `modules/index.js`,
    plugins: plugins.full.concat([babel({
      exclude: 'node_modules/**',
      presets: [['@babel/env', { modules: false }]]
    })]),
    output: {
      file: `demo/index.js`,
      format: 'iife'
    }
  },
  {
    input: `modules/index.js`,
    plugins: plugins.min.concat([babel({
      exclude: 'node_modules/**',
      presets: [['@babel/env', { modules: false }]]
    })]),
    output: {
      file: `demo/index.min.js`,
      format: 'iife'
    }
  },
  {
    input: `modules/index.js`,
    plugins: plugins.full,
    output: {
      file: `demo/index.mjs`,
      format: 'es'
    }
  },
  {
    input: `modules/index.js`,
    plugins: plugins.min,
    output: {
      file: `demo/index.min.mjs`,
      format: 'es'
    }
  },
  // AppComponent build files
  {
    input: `src/${fileName}.js`,
    plugins: plugins.full.concat([babel({
      exclude: 'node_modules/**',
      presets: [['@babel/env', { modules: false }]]
    })]),
    output: {
      file: `dist/${fileName}.js`,
      name: objName,
      format: 'iife'
    }
  },
  {
    input: `src/${fileName}.js`,
    plugins: plugins.min.concat([babel({
      exclude: 'node_modules/**',
      presets: [['@babel/env', { modules: false }]]
    })]),
    output: {
      file: `dist/${fileName}.min.js`,
      name: objName,
      format: 'iife'
    }
  },
  {
    input: `src/${fileName}.js`,
    plugins: plugins.full,
    output: {
      file: `dist/${fileName}.mjs`,
      name: objName,
      format: 'es'
    }
  },
  {
    input: `src/${fileName}.js`,
    plugins: plugins.min,
    output: {
      file: `dist/${fileName}.min.mjs`,
      name: objName,
      format: 'es'
    }
  },
];
