import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_settings } from '../parity/htmlImports';

export default function Page_settings() {
  return <RawHtmlPage htmlSource={html_settings} />;
}
