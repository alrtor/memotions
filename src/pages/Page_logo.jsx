import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_logo } from '../parity/htmlImports';

export default function Page_logo() {
  return <RawHtmlPage htmlSource={html_logo} />;
}
