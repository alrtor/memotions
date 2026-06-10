import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_trending } from '../parity/htmlImports';

export default function Page_trending() {
  return <RawHtmlPage htmlSource={html_trending} />;
}
