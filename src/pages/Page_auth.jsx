import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_auth } from '../parity/htmlImports';

export default function Page_auth() {
  return <RawHtmlPage htmlSource={html_auth} />;
}
