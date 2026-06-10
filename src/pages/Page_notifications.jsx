import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_notifications } from '../parity/htmlImports';

export default function Page_notifications() {
  return <RawHtmlPage htmlSource={html_notifications} />;
}
