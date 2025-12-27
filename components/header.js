class CustomHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="bg-white border-b border-gray-100">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary font-bold">AR</div>
            <div>
              <div class="font-bold text-gray-900">Anas Rashed</div>
              <div class="text-xs text-gray-500">آراء العملاء</div>
            </div>
          </div>

          <nav class="flex items-center gap-4 text-sm">
            <a class="text-gray-600 hover:text-primary" href="https://anasrashed.com" rel="noopener">الرئيسية</a>
            <a class="text-gray-600 hover:text-primary" href="#review-form">أضف رأيك</a>
            <a class="text-gray-600 hover:text-primary" href="#all-reviews">كل الآراء</a>
            <a class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
               href="https://anasrashed.com#contact" rel="noopener">
              تواصل معي
            </a>
          </nav>
        </div>
      </header>
    `;
  }
}
customElements.define('custom-header', CustomHeader);
