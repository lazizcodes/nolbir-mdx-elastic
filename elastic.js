const { Client } = require('@elastic/elasticsearch');
const stripMarkdown = require('remove-markdown');

const client = new Client({
  node: process.env.ELASTIC_HOST,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASSWORD,
  },
});

const index = process.env.ELASTIC_INDEX_NAME;

async function updateIndex(blog) {
  const { id } = blog;

  await client?.update({
    index,
    id,
    body: {
      doc: toIndex(blog),
      doc_as_upsert: true,
    },
  });
}

const toIndex = (blog) => ({
  title: blog.title,
  text: stripMarkdown(blog.text),
  tags: blog.tags,
  createdBy: blog.createdBy,
});

module.exports = {
  updateIndex,
};
