import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_search } from '../parity/htmlImports';

export default function Page_search() {
  return <RawHtmlPage htmlSource={html_search} />;
}
