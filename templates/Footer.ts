export type FooterProps = {
  copyright: string;
}
export default function Footer(data : FooterProps) {
  return `
<footer>
  ${data.copyright}
</footer>
  `;
}
