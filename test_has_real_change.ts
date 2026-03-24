import { ParserService } from './andb-core/src/modules/parser/parser.service';
const p = new ParserService();
const src = "WHEN vSort IS NOT NULL AND INSTR(vSort, '&lt;')";
const dest = "WHEN vSort IS NOT NULL AND INSTR(vSort, '<')";
const normSrc = p.normalize(src, { ignoreDefiner: true, ignoreWhitespace: true }).toLowerCase();
const normDest = p.normalize(dest, { ignoreDefiner: true, ignoreWhitespace: true }).toLowerCase();
console.log('Equals?', normSrc === normDest);
