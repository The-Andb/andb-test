import { ParserService } from './andb-core/src/modules/parser/parser.service';
const svc = new ParserService();
console.log(svc.uppercaseKeywords('WHEN vSort is not null and INSTR(vSort, "-")'));
