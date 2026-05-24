import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_comments } from '../parity/htmlImports';

export default function Page_comments() {
  return <RawHtmlPage htmlSource={html_comments} />;
}
