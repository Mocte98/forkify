// Alternativa a Parcel para entornos que bloquean sus extensiones nativas.
// Conserva módulos ES en el navegador y compila el mismo Sass del proyecto.
const fs = require('node:fs');
const path = require('node:path');
const sass = require('sass');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const copyModules = function (directory, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    const target = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      copyModules(source, target);
      continue;
    }
    const code = fs.readFileSync(source, 'utf8')
      .replace(/import icons from 'url:(.*?)';/g,
        (_, url) => `const icons = new URL('${url}', import.meta.url).href;`)
      .replace("from 'fractional'", "from '../../vendor/fractional.js'");
    fs.writeFileSync(target, code);
  }
};

copyModules(path.join(root, 'src/js'), path.join(output, 'js'));
fs.cpSync(path.join(root, 'src/img'), path.join(output, 'img'), { recursive: true });
fs.copyFileSync(path.join(root, 'index_files/fonts.css'), path.join(output, 'fonts.css'));
fs.mkdirSync(path.join(output, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(output, 'vendor/fractional.js'),
  fs.readFileSync(path.join(root, 'vendor/fractional/index.js'), 'utf8') + '\nexport { Fraction };\n');

const css = sass.compile(path.join(root, 'src/sass/main.scss'), {
  style: 'compressed',
  silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
}).css;
fs.writeFileSync(path.join(output, 'styles.css'), css);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('./index_files/fonts.css', './fonts.css')
  .replace('./src/sass/main.scss', './styles.css')
  .replace('./src/js/controller.js', './js/controller.js')
  .replaceAll('./src/img/', './img/')
  .replaceAll('src/img/', 'img/');
fs.writeFileSync(path.join(output, 'index.html'), html);
console.log('Portable build ready in dist/.');
