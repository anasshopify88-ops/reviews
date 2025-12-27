class CustomFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="bg-white border-t border-gray-100">
        <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-sm text-gray-500">© ${year} Anas Rashed. جميع الحقوق محفوظة.</div>
          <div class="flex items-center gap-3 text-sm">
            <a class="text-gray-600 hover:text-primary" href="https://anasrashed.com" rel="noopener">anasrashed.com</a>
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('custom-footer', CustomFooter);
