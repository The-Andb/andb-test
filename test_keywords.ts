import { ParserService } from './andb-core/src/modules/parser/parser.service';
const svc = new ParserService();
const ddl = 'WHEN pnModifiedLT is not null \n THEN GREATEST(ifnull(cc.last_chat, cm.updated_date))';
console.log('Original: ', ddl);
console.log('Uppercased: ', svc.uppercaseKeywords(ddl));
