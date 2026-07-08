/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse (pdfjs-dist) webpack ile paketlenince bozuluyor;
    // Node modülü olarak dışarıda bırakılınca düzgün çalışıyor
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

module.exports = nextConfig
