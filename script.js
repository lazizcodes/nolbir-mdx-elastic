const readdir = require('recursive-readdir');
const grayMatter = require('gray-matter');
const { readFile, writeFile } = require('fs/promises');
const { nanoid } = require('nanoid');
const { stringify } = require('yaml');
const path = require('path');
const { updateIndex } = require('./elastic');

const BLOGS_PATH = path.join(__dirname, 'blog');
console.log('Here it is:', BLOGS_PATH)
function stringToSlug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  var to = 'aaaaeeeeiiiioooouuuunc------';
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

async function getFiles(path, extension) {
  const files = await readdir(path);

  return files.filter((file) => new RegExp(`${extension}$`).test(file));
}

async function updateSingleMeta(file) {
  const { data: frontMatter, content } = grayMatter(await readFile(file));
  console.log(frontMatter);
  if (!frontMatter.id) {
    frontMatter.id = nanoid(12);
  }
  frontMatter.slug = stringToSlug(frontMatter.title);

  const newContent = `---\n${stringify(frontMatter)}---\n${content}`;
  await writeFile(file, newContent);
}

async function indexElastic(file) {
  const { data: frontMatter, content } = grayMatter(await readFile(file));
  const blog = {
    ...frontMatter,
    text: content,
  };
  await updateIndex(blog);
}

async function processFile(file) {
  await updateSingleMeta(file);
  await indexElastic(file);
}

async function main() {
  const files = await getFiles(BLOGS_PATH, '.mdx');
  const promises = files.map((file) => processFile(file));
  await Promise.all(promises);
}

main();
