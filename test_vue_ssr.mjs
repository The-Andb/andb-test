import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql.js';

const app = createSSRApp({
  data() {
    const rawSql = "IF not isnull(pvMessageUid) and pvMessageUid <> '' THEN";
    const highlighted = Prism.highlight(rawSql, Prism.languages.sql, 'sql');
    return {
      highlighted
    };
  },
  template: `<div v-html="highlighted"></div>`
});

renderToString(app).then(html => {
  console.log("VUE OUTPUT:");
  console.log(html);
});
