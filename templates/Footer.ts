export type FooterProps = {
  copyright: string;
}

export default function Footer(data: FooterProps) {
  return `
<footer>
  <div class="footer-content">
    <p>${data.copyright}</p>
    <p class="footer-tagline">Powered by curiosity</p>
  </div>
</footer>
`;
}
