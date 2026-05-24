import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_profile } from '../parity/htmlImports';

export default function Page_profile() {
  return <RawHtmlPage htmlSource={html_profile} />;
}
