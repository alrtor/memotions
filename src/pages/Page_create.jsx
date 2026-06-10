import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_create } from '../parity/htmlImports';

export default function Page_create() {
  return <RawHtmlPage htmlSource={html_create} />;
}
