import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_about } from '../parity/htmlImports';

export default function Page_about() {
  return <RawHtmlPage htmlSource={html_about} />;
}
