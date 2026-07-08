/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse (pdfjs-dist) webpack ile paketlenince bozuluyor;
    // Node modülü olarak dışarıda bırakılınca düzgün çalışıyor
    serverComponentsExternalPackages: ['pdf-parse', '@libsql/client'],
  },
}

module.exports = nextConfig
