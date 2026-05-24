import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_own_profile } from '../parity/htmlImports';

export default function Page_own_profile() {
  return <RawHtmlPage htmlSource={html_own_profile} />;
}
